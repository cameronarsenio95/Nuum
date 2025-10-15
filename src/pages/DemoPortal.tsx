import { useEffect, useState } from 'react';
import { ExternalLink, X, Eye } from 'lucide-react';
import { useDemo } from '../contexts/DemoContext';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { OverviewView } from '../components/dashboard/OverviewView';
import { CampaignsView } from '../components/dashboard/CampaignsView';
import { CreatorsView } from '../components/dashboard/CreatorsView';
import { TasksView } from '../components/dashboard/TasksView';
import { ContentView } from '../components/dashboard/ContentView';
import { AdSetsView } from '../components/dashboard/AdSetsView';
import { DeliverablesView } from '../components/dashboard/DeliverablesView';
import type { Database } from '../lib/database.types';

type Campaign = Database['public']['Tables']['campaigns']['Row'];

export function DemoPortal() {
  const { demoWorkspace, loading, error, exitDemoMode } = useDemo();
  const [currentView, setCurrentView] = useState<'overview' | 'campaigns' | 'creators' | 'tasks' | 'content' | 'ad-sets' | 'deliverables'>('overview');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showDemoBanner, setShowDemoBanner] = useState(true);

  useEffect(() => {
    if (error) {
      console.error('Demo error:', error);
    }
  }, [error]);

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-linear-bg light:bg-linear-light-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-linear-accent mx-auto"></div>
          <div className="dark:text-text-secondary light:text-text-light-secondary">Loading demo workspace...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen dark:bg-linear-bg light:bg-linear-light-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full dark:bg-linear-bg-secondary light:bg-white rounded-linear-lg border dark:border-linear-border light:border-gray-200 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full dark:bg-red-500/20 light:bg-red-100 flex items-center justify-center mx-auto">
            <X className="w-8 h-8 dark:text-red-400 light:text-red-600" />
          </div>
          <h2 className="text-xl font-semibold dark:text-text-primary light:text-text-light-primary">
            Demo Link Invalid
          </h2>
          <p className="dark:text-text-secondary light:text-text-light-secondary">
            {error}
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-linear-accent text-text-primary rounded-linear-md hover:bg-linear-accent-hover linear-transition"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  if (!demoWorkspace) {
    return (
      <div className="min-h-screen dark:bg-linear-bg light:bg-linear-light-bg flex items-center justify-center">
        <div className="dark:text-text-secondary light:text-text-light-secondary">No demo workspace found</div>
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
    <div className="min-h-screen dark:bg-linear-bg light:bg-linear-light-bg">
      {showDemoBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-linear-accent to-blue-600 text-white shadow-lg">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <span className="font-semibold">Demo Mode</span>
                  <span className="text-sm opacity-90">
                    You're viewing a read-only demo workspace with sample data
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="/"
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-linear-md linear-transition text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Sign Up
                </a>
                <button
                  onClick={() => setShowDemoBanner(false)}
                  className="p-1 hover:bg-white/20 rounded-linear-md linear-transition"
                  aria-label="Close banner"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={showDemoBanner ? 'pt-14' : ''}>
        <DashboardLayout
          workspace={demoWorkspace}
          currentView={currentView === 'ad-sets' ? 'campaigns' : currentView}
          onViewChange={setCurrentView}
          isDemoMode={true}
        >
          {currentView === 'overview' && <OverviewView workspace={demoWorkspace} />}
          {currentView === 'campaigns' && <CampaignsView workspace={demoWorkspace} onCampaignClick={handleCampaignClick} />}
          {currentView === 'ad-sets' && selectedCampaign && <AdSetsView campaign={selectedCampaign} onBack={handleBackToCampaigns} />}
          {currentView === 'creators' && <CreatorsView workspace={demoWorkspace} />}
          {currentView === 'deliverables' && <DeliverablesView workspace={demoWorkspace} />}
          {currentView === 'tasks' && <TasksView workspace={demoWorkspace} />}
          {currentView === 'content' && <ContentView workspace={demoWorkspace} />}
        </DashboardLayout>
      </div>
    </div>
  );
}
