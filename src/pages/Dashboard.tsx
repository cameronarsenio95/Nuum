import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PlanLimitsProvider, usePlanLimits } from '../contexts/PlanLimitsContext';
import { OnboardingProvider, useOnboarding } from '../contexts/OnboardingContext';
import { supabase } from '../lib/supabase';
import { TRIAL_DURATION_DAYS } from '../utils/constants';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { OverviewView } from '../components/dashboard/OverviewView';
import { CampaignsView } from '../components/dashboard/CampaignsView';
import { CreatorsView } from '../components/dashboard/CreatorsView';
import { TasksView } from '../components/dashboard/TasksView';
import { TeamView } from '../components/dashboard/TeamView';
import { ContentView } from '../components/dashboard/ContentView';
import { SettingsView } from '../components/dashboard/SettingsView';
import { NotionsView } from '../components/dashboard/NotionsView';
import { AdSetsView } from '../components/dashboard/AdSetsView';
import { BillingView } from '../components/dashboard/BillingView';
import { ContactView } from '../components/dashboard/ContactView';
import AnalyticsView from '../components/dashboard/AnalyticsView';
import { ShopifyIntegrationView } from '../components/dashboard/ShopifyIntegrationView';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import { FrozenAccountModal } from '../components/modals/FrozenAccountModal';
import type { Database } from '../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];

function DashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [currentView, setCurrentView] = useState<'overview' | 'campaigns' | 'creators' | 'tasks' | 'team' | 'content' | 'notions' | 'contact' | 'settings' | 'billing' | 'ad-sets' | 'analytics' | 'shopify'>('overview');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFrozenModal, setShowFrozenModal] = useState(false);
  const [isFrozenAccount, setIsFrozenAccount] = useState(false);

  useEffect(() => {
    console.log('[DASHBOARD] Auth state:', { user: user?.id, authLoading });

    if (!authLoading && !user) {
      console.log('[DASHBOARD] No user session, redirecting to login...');
      window.location.href = '/login';
      return;
    }

    if (user) {
      loadWorkspace();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (workspace) {
      const isFreePlan = workspace.plan === 'free';
      const isFrozen = isFreePlan && workspace.subscription_status === 'frozen';
      setIsFrozenAccount(isFrozen);

      if (isFrozen && !['billing', 'settings', 'contact'].includes(currentView)) {
        setCurrentView('billing');
      }
    }
  }, [workspace]);

  useEffect(() => {
    if (isFrozenAccount && !['billing', 'settings', 'contact'].includes(currentView)) {
      setCurrentView('billing');
    }
  }, [currentView, isFrozenAccount]);

  useEffect(() => {
    handleShopifyCallback();
  }, []);

  const handleShopifyCallback = async () => {
    const params = new URLSearchParams(window.location.search);
    const shopifySuccess = params.get('shopify');

    if (shopifySuccess === 'connected') {
      window.history.replaceState({}, document.title, '/dashboard');
      setCurrentView('shopify');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const loadWorkspace = async () => {
    if (!user) return;

    console.log('[DASHBOARD] Loading workspace via membership for user:', user.id);

    // Load ALL workspaces where user is a member (owner, admin, member, or viewer)
    const { data: workspacesData, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*, workspace_members!inner(role, user_id)')
      .eq('workspace_members.user_id', user.id)
      .order('created_at', { ascending: true });

    console.log('[DASHBOARD] Memberships result:', { data: workspacesData, error: workspaceError });

    if (workspaceError) {
      console.error('[DASHBOARD] Error loading workspace:', workspaceError);
      setLoading(false);
      return;
    }

    console.log('[DASHBOARD] Found workspaces:', workspacesData?.length);

    if (!workspacesData || workspacesData.length === 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      const displayName = profileData?.full_name || user.email;
      const slug = user.email?.split('@')[0] || 'workspace';

      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DURATION_DAYS);

      const { data: newWorkspace, error: createError } = await supabase
        .from('workspaces')
        .insert({
          name: `${displayName}'s Workspace`,
          slug: slug,
          plan: 'free',
          max_team_members: 3,
          max_creators: 25,
          max_storage_gb: 5,
          subscription_status: 'trialing',
          trial_started_at: trialStartDate.toISOString(),
          trial_ends_at: trialEndDate.toISOString(),
          features: {
            revenue_tracking: false,
            advanced_analytics: false,
            team_collaboration: true,
            priority_support: false,
            task_assignment: false,
          },
          owner_id: user.id,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating workspace:', createError);
        setLoading(false);
        return;
      }

      // Add user as owner in workspace_members
      if (newWorkspace) {
        const { error: memberError } = await supabase
          .from('workspace_members')
          .insert({
            workspace_id: newWorkspace.id,
            user_id: user.id,
            role: 'owner'
          });

        if (memberError) {
          console.error('[DASHBOARD] Error adding workspace member:', memberError);
        }

        setWorkspace(newWorkspace);
      }
    } else {
      // User has existing workspace(s), use the first one
      const firstWorkspace = workspacesData[0];

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData?.full_name && firstWorkspace.owner_id === user.id) {
        const displayName = profileData.full_name;
        const expectedWorkspaceName = `${displayName}'s Workspace`;

        if (firstWorkspace.name !== expectedWorkspaceName && firstWorkspace.name.includes('@')) {
          const { data: updatedWorkspace } = await supabase
            .from('workspaces')
            .update({ name: expectedWorkspaceName })
            .eq('id', firstWorkspace.id)
            .select()
            .single();

          if (updatedWorkspace) {
            setWorkspace(updatedWorkspace);
          } else {
            setWorkspace(firstWorkspace);
          }
        } else {
          setWorkspace(firstWorkspace);
        }
      } else {
        setWorkspace(firstWorkspace);
      }
    }

    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen dark:bg-linear-bg light:bg-linear-light-bg flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-linear-border border-t-linear-accent rounded-full animate-spin"></div>
        <div className="dark:text-text-secondary light:text-text-light-secondary">
          {authLoading ? 'Checking authentication...' : 'Loading workspace...'}
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen dark:bg-linear-bg light:bg-linear-light-bg flex flex-col items-center justify-center gap-4">
        <div className="dark:text-text-secondary light:text-text-light-secondary">No workspace found</div>
        <button
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-linear-accent text-white rounded-linear hover:opacity-90 linear-transition"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const handleCampaignClick = (campaign: Campaign) => {
    if (isFrozenAccount) {
      setCurrentView('billing');
      return;
    }
    setSelectedCampaign(campaign);
    setCurrentView('ad-sets');
  };

  const handleBackToCampaigns = () => {
    setSelectedCampaign(null);
    setCurrentView('campaigns');
  };

  return (
    <PlanLimitsProvider workspace={workspace}>
      <FrozenAccountChecker
        workspace={workspace}
        showModal={showFrozenModal}
        onShowModal={setShowFrozenModal}
        onUpgrade={() => {
          setShowFrozenModal(false);
          setCurrentView('billing');
        }}
      />
      {showOnboarding && (
        <OnboardingWizard
          onComplete={completeOnboarding}
          onSkip={skipOnboarding}
        />
      )}
      <DashboardLayout
        workspace={workspace}
        currentView={currentView === 'ad-sets' ? 'campaigns' : currentView === 'shopify' ? 'shopify' : currentView}
        onViewChange={setCurrentView}
      >
        {currentView === 'overview' && <OverviewView workspace={workspace} onViewChange={setCurrentView} />}
        {currentView === 'analytics' && <AnalyticsView workspaceId={workspace.id} />}
        {currentView === 'campaigns' && <CampaignsView workspace={workspace} onCampaignClick={handleCampaignClick} />}
        {currentView === 'ad-sets' && selectedCampaign && <AdSetsView campaign={selectedCampaign} onBack={handleBackToCampaigns} />}
        {currentView === 'creators' && <CreatorsView workspace={workspace} />}
        {currentView === 'tasks' && <TasksView workspace={workspace} />}
        {currentView === 'team' && <TeamView workspace={workspace} />}
        {currentView === 'content' && <ContentView workspace={workspace} />}
        {currentView === 'notions' && <NotionsView workspace={workspace} />}
        {currentView === 'contact' && <ContactView />}
        {currentView === 'settings' && <SettingsView workspace={workspace} />}
        {currentView === 'billing' && <BillingView workspace={workspace} onWorkspaceUpdate={loadWorkspace} />}
        {currentView === 'shopify' && <ShopifyIntegrationView workspace={workspace} />}
      </DashboardLayout>
    </PlanLimitsProvider>
  );
}

function FrozenAccountChecker({
  workspace,
  showModal,
  onShowModal,
  onUpgrade
}: {
  workspace: Workspace;
  showModal: boolean;
  onShowModal: (show: boolean) => void;
  onUpgrade: () => void;
}) {
  const { freeAccountInfo } = usePlanLimits();

  useEffect(() => {
    if (freeAccountInfo.isFrozen && !showModal) {
      onShowModal(true);
    }
  }, [freeAccountInfo.isFrozen]);

  if (!freeAccountInfo.isFrozen || !showModal) {
    return null;
  }

  return (
    <FrozenAccountModal
      onUpgrade={onUpgrade}
    />
  );
}

export function Dashboard() {
  return (
    <OnboardingProvider>
      <DashboardContent />
    </OnboardingProvider>
  );
}
