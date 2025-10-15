import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PlanLimitsProvider } from '../contexts/PlanLimitsContext';
import { OnboardingProvider, useOnboarding } from '../contexts/OnboardingContext';
import { supabase } from '../lib/supabase';
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
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import type { Database } from '../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];

function DashboardContent() {
  const { user } = useAuth();
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [currentView, setCurrentView] = useState<'overview' | 'campaigns' | 'creators' | 'tasks' | 'team' | 'content' | 'notions' | 'contact' | 'settings' | 'billing' | 'ad-sets'>('overview');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWorkspace();
    }
  }, [user]);

  const loadWorkspace = async () => {
    if (!user) return;

    const { data: workspaceData, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (workspaceError) {
      console.error('Error loading workspace:', workspaceError);
      setLoading(false);
      return;
    }

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
      trialEndDate.setDate(trialEndDate.getDate() + 7);

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
      } else {
        setWorkspace(newWorkspace);
      }
    } else {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData?.full_name) {
        const displayName = profileData.full_name;
        const expectedWorkspaceName = `${displayName}'s Workspace`;

        if (workspaceData.name !== expectedWorkspaceName && workspaceData.name.includes('@')) {
          const { data: updatedWorkspace } = await supabase
            .from('workspaces')
            .update({ name: expectedWorkspaceName })
            .eq('id', workspaceData.id)
            .select()
            .single();

          if (updatedWorkspace) {
            setWorkspace(updatedWorkspace);
          } else {
            setWorkspace(workspaceData);
          }
        } else {
          setWorkspace(workspaceData);
        }
      } else {
        setWorkspace(workspaceData);
      }
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-linear-bg light:bg-linear-light-bg flex items-center justify-center">
        <div className="dark:text-text-secondary light:text-text-light-secondary">Loading workspace...</div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen dark:bg-linear-bg light:bg-linear-light-bg flex items-center justify-center">
        <div className="dark:text-text-secondary light:text-text-light-secondary">No workspace found</div>
      </div>
    );
  }

  const handleCampaignClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setCurrentView('ad-sets');
  };

  const handleBackToCampaigns = () => {
    setSelectedCampaign(null);
    setCurrentView('campaigns');
  };

  return (
    <PlanLimitsProvider workspace={workspace}>
      {showOnboarding && (
        <OnboardingWizard
          onComplete={completeOnboarding}
          onSkip={skipOnboarding}
        />
      )}
      <DashboardLayout
        workspace={workspace}
        currentView={currentView === 'ad-sets' ? 'campaigns' : currentView}
        onViewChange={setCurrentView}
      >
        {currentView === 'overview' && <OverviewView workspace={workspace} />}
        {currentView === 'campaigns' && <CampaignsView workspace={workspace} onCampaignClick={handleCampaignClick} />}
        {currentView === 'ad-sets' && selectedCampaign && <AdSetsView campaign={selectedCampaign} onBack={handleBackToCampaigns} />}
        {currentView === 'creators' && <CreatorsView workspace={workspace} />}
        {currentView === 'tasks' && <TasksView workspace={workspace} />}
        {currentView === 'team' && <TeamView workspace={workspace} />}
        {currentView === 'content' && <ContentView workspace={workspace} />}
        {currentView === 'notions' && <NotionsView workspace={workspace} />}
        {currentView === 'contact' && <ContactView />}
        {currentView === 'settings' && <SettingsView workspace={workspace} />}
        {currentView === 'billing' && <BillingView workspace={workspace} />}
      </DashboardLayout>
    </PlanLimitsProvider>
  );
}

export function Dashboard() {
  return (
    <OnboardingProvider>
      <DashboardContent />
    </OnboardingProvider>
  );
}
