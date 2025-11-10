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
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import { FrozenAccountModal } from '../components/modals/FrozenAccountModal';
import { AgendaView } from '../components/dashboard/AgendaView';

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
    | 'contact'
    | 'settings'
    | 'billing'
    | 'ad-sets'
    | 'analytics'
    | 'shopify'
    | 'agenda'
  >('overview');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    try {
      setLoading(true);
      console.log('[DASHBOARD] Loading workspace for user:', user.id);

      const {
        data: membershipData,
        error: membershipError,
      } = await supabase
        .from('workspace_members')
        .select('role, workspaces(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (membershipError) {
        console.error(
          '[DASHBOARD] Error loading memberships (will fallback to owner):',
          membershipError
        );
      }

      let resolvedWorkspace: Workspace | null = null;
      const memberships = (membershipData || []) as any[];

      if (memberships.length > 0) {
        const invitedMembership = memberships.find((m) => {
          const ws = m.workspaces as Workspace | null;
          if (!ws) return false;
          return ws.owner_id !== user.id;
        });

        if (invitedMembership?.workspaces) {
          resolvedWorkspace = invitedMembership.workspaces as Workspace;
          console.log(
            '[DASHBOARD] Workspace resolved via invited membership:',
            resolvedWorkspace.id
          );
        } else {
          const firstMembershipWithWorkspace = memberships.find((m) => m.workspaces);
          if (firstMembershipWithWorkspace?.workspaces) {
            resolvedWorkspace = firstMembershipWithWorkspace.workspaces as Workspace;
            console.log(
              '[DASHBOARD] Workspace resolved via first membership:',
              resolvedWorkspace.id
            );
          }
        }
      }

      if (!resolvedWorkspace) {
        const {
          data: workspaceData,
          error: workspaceError,
        } = await supabase
          .from('workspaces')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (workspaceError) {
          console.error(
            '[DASHBOARD] Error loading workspace by owner_id:',
            workspaceError
          );
          setWorkspace(null);
          setLoading(false);
          return;
        }

        console.log('[DASHBOARD] Workspace loaded via owner_id:', workspaceData?.id);

        if (!workspaceData) {
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
            console.error('[DASHBOARD] Error creating workspace:', createError);
            setWorkspace(null);
            setLoading(false);
            return;
          }

          console.log('[DASHBOARD] New workspace created:', newWorkspace.id);
          resolvedWorkspace = newWorkspace as Workspace;
        } else {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle();

          if (profileData?.full_name) {
            const displayName = profileData.full_name;
            const expectedWorkspaceName = `${displayName}'s Workspace`;

            if (
              workspaceData.name !== expectedWorkspaceName &&
              workspaceData.name.includes('@')
            ) {
              const { data: updatedWorkspace } = await supabase
                .from('workspaces')
                .update({ name: expectedWorkspaceName })
                .eq('id', workspaceData.id)
                .select()
                .single();

              resolvedWorkspace = (updatedWorkspace || workspaceData) as Workspace;
            } else {
              resolvedWorkspace = workspaceData as Workspace;
            }
          } else {
            resolvedWorkspace = workspaceData as Workspace;
          }
        }
      }

      setWorkspace(resolvedWorkspace);
    } catch (err) {
      console.error('[DASHBOARD] Unexpected error in loadWorkspace:', err);
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen dark:bg-linear-bg light:bg-linear-light-bg flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-linear-border border-t-linear-accent rounded-full animate-spin" />
        <div className="dark:text-text-secondary light:text-text-light-secondary">
          {authLoading ? 'Checking authentication...' : 'Loading workspace...'}
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen dark:bg-linear-bg light:bg-linear-light-bg flex flex-col items-center justify-center gap-4">
        <div className="dark:text-text-secondary light:text-text-light-secondary">
          No workspace found
        </div>
        <button
          onClick={() => (window.location.href = '/')}
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

        {currentView === 'agenda' && <AgendaView workspace={workspace} />}

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
    if (freeAccountInfo.isFrozen && !showModal) {
      onShowModal(true);
    }
  }, [freeAccountInfo.isFrozen, showModal, onShowModal]);

  if (!freeAccountInfo.isFrozen || !showModal) {
    return null;
  }

  return <FrozenAccountModal onUpgrade={onUpgrade} />;
}

export function Dashboard() {
  return (
    <OnboardingProvider>
      <DashboardContent />
    </OnboardingProvider>
  );
}
