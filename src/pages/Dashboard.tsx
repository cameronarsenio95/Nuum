import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PlanLimitsProvider, usePlanLimits } from '../contexts/PlanLimitsContext';
import { OnboardingProvider, useOnboarding } from '../contexts/OnboardingContext';
import { supabase } from '../lib/supabase';
import { TRIAL_DURATION_DAYS } from '../utils/constants';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { OverviewView } from '../components/dashboard/OverviewView';
import { CampaignsView } from '../components/dashboard/CampaignsView';
import { CampaignDetail } from './CampaignDetail';
import { CreatorsView } from '../components/dashboard/CreatorsView';
import { TasksView } from '../components/dashboard/TasksView';
import { TeamView } from '../components/dashboard/TeamView';
import { ContentLibraryView as ContentView } from '../components/dashboard/ContentLibraryView';
import { SettingsView } from '../components/dashboard/SettingsView';
import { NotionsView } from '../components/dashboard/NotionsView';
import { AdSetsView } from '../components/dashboard/AdSetsView';
import { BillingView } from '../components/dashboard/BillingView';
import { ContactView } from '../components/dashboard/ContactView';
import AnalyticsView from '../components/dashboard/AnalyticsView';
import { ShopifyIntegrationView } from '../components/dashboard/ShopifyIntegrationView';
import { AgendaView } from '../components/dashboard/AgendaView'; // 👈 nieuw toegevoegd
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import { FrozenAccountModal } from '../components/modals/FrozenAccountModal';
import type { Database } from '../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];

function DashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [currentView, setCurrentView] = useState<
    | 'overview'
    | 'campaigns'
    | 'campaign-detail'
    | 'creators'
    | 'tasks'
    | 'team'
    | 'content'
    | 'notions'
    | 'agenda' // 👈 toegevoegd
    | 'contact'
    | 'settings'
    | 'billing'
    | 'ad-sets'
    | 'analytics'
    | 'shopify'
  >('overview');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFrozenModal, setShowFrozenModal] = useState(false);
  const [isFrozenAccount, setIsFrozenAccount] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
      return;
    }
    if (user) loadWorkspace();
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
      setTimeout(() => window.location.reload(), 500);
    }
  };

  const loadWorkspace = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data: membershipData } = await supabase
        .from('workspace_members')
        .select('role, workspaces(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      let resolvedWorkspace: Workspace | null = null;
      const memberships = (membershipData || []) as any[];
      if (memberships.length > 0) {
        const invited = memberships.find(
          (m) => (m.workspaces as Workspace)?.owner_id !== user.id
        );
        resolvedWorkspace = invited?.workspaces || memberships[0].workspaces;
      }

      if (!resolvedWorkspace) {
        const { data: workspaceData } = await supabase
          .from('workspaces')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();
        if (!workspaceData) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle();
          const displayName = profileData?.full_name || user.email;
          const slug = user.email?.split('@')[0] || 'workspace';
          const trialStart = new Date();
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);
          const { data: newWs } = await supabase
            .from('workspaces')
            .insert({
              name: `${displayName}'s Workspace`,
              slug,
              plan: 'free',
              subscription_status: 'trialing',
              trial_started_at: trialStart.toISOString(),
              trial_ends_at: trialEnd.toISOString(),
              owner_id: user.id,
            })
            .select()
            .single();
          resolvedWorkspace = newWs as Workspace;
        } else resolvedWorkspace = workspaceData as Workspace;
      }

      setWorkspace(resolvedWorkspace);
    } catch (err) {
      console.error('Error loading workspace:', err);
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading)
    return (
      <div className="min-h-screen dark:bg-linear-bg flex items-center justify-center text-white">
        Loading dashboard...
      </div>
    );

  if (!workspace)
    return (
      <div className="min-h-screen dark:bg-linear-bg flex items-center justify-center text-white">
        No workspace found.
      </div>
    );

  const handleCampaignClick = (campaign: Campaign) => {
    if (isFrozenAccount) {
      setCurrentView('billing');
      return;
    }
    setSelectedCampaign(campaign);
    setCurrentView('campaign-detail');
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
        <OnboardingWizard onComplete={completeOnboarding} onSkip={skipOnboarding} />
      )}
      <DashboardLayout
        workspace={workspace}
        currentView={
          currentView === 'campaign-detail'
            ? 'campaigns'
            : currentView === 'ad-sets'
            ? 'campaigns'
            : currentView === 'shopify'
            ? 'shopify'
            : currentView
        }
        onViewChange={setCurrentView}
      >
        {currentView === 'overview' && (
          <OverviewView workspace={workspace} onViewChange={setCurrentView} />
        )}
        {currentView === 'analytics' && <AnalyticsView workspace={workspace} />}
        {currentView === 'campaigns' && (
          <CampaignsView workspace={workspace} onCampaignClick={handleCampaignClick} />
        )}
        {currentView === 'campaign-detail' && selectedCampaign && (
          <CampaignDetail
            campaignId={selectedCampaign.id}
            workspaceId={workspace.id}
            onBack={handleBackToCampaigns}
          />
        )}
        {currentView === 'ad-sets' && selectedCampaign && (
          <AdSetsView campaign={selectedCampaign} onBack={handleBackToCampaigns} />
        )}
        {currentView === 'creators' && <CreatorsView workspace={workspace} />}
        {currentView === 'tasks' && <TasksView workspace={workspace} />}
        {currentView === 'team' && <TeamView workspace={workspace} />}
        {currentView === 'content' && <ContentView workspace={workspace} />}
        {currentView === 'notions' && <NotionsView workspace={workspace} />}
        {currentView === 'agenda' && <AgendaView workspace={workspace} />} {/* 👈 toegevoegd */}
        {currentView === 'contact' && <ContactView />}
        {currentView === 'settings' && <SettingsView workspace={workspace} />}
        {currentView === 'billing' && (
          <BillingView workspace={workspace} onWorkspaceUpdate={loadWorkspace} />
        )}
        {currentView === 'shopify' && <ShopifyIntegrationView workspace={workspace} />}
      </DashboardLayout>
    </PlanLimitsProvider>
  );
}

function FrozenAccountChecker({
  workspace,
  showModal,
  onShowModal,
  onUpgrade,
}: {
  workspace: Workspace;
  showModal: boolean;
  onShowModal: (show: boolean) => void;
  onUpgrade: () => void;
}) {
  const { freeAccountInfo } = usePlanLimits();
  useEffect(() => {
    if (freeAccountInfo.isFrozen && !showModal) onShowModal(true);
  }, [freeAccountInfo.isFrozen, showModal, onShowModal]);
  if (!freeAccountInfo.isFrozen || !showModal) return null;
  return <FrozenAccountModal onUpgrade={onUpgrade} />;
}

export function Dashboard() {
  return (
    <OnboardingProvider>
      <DashboardContent />
    </OnboardingProvider>
  );
}
