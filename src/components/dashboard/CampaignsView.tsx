import { useState, useEffect } from 'react';
import { Plus, ChevronRight, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PageLayout } from '../PageLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useWritePermission } from '../../hooks/useWritePermission';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];

interface CampaignWithMetrics extends Campaign {
  total_spend: number;
  total_revenue: number;
  roi: number;
  creators_count: number;
  content_count: number;
}

interface CampaignsViewProps {
  workspace: Workspace;
  onCampaignClick?: (campaign: Campaign) => void;
}

const getStatusBadgeClasses = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-nuum-dark-green text-nuum-accent-green';
    case 'draft':
      return 'bg-gray-700 text-gray-300';
    case 'completed':
      return 'bg-nuum-dark-blue text-nuum-accent-blue';
    case 'archived':
      return 'bg-gray-800 text-gray-400';
    default:
      return 'bg-gray-700 text-gray-300';
  }
};

const getROIColorClass = (roi: number) => {
  if (roi >= 100) return 'text-nuum-accent-green';
  if (roi >= 0) return 'text-nuum-accent-blue';
  return 'text-nuum-accent-red';
};

export function CampaignsView({ workspace, onCampaignClick }: CampaignsViewProps) {
  const { user } = useAuth();
  const { checkWritePermission } = useWritePermission();
  const [campaigns, setCampaigns] = useState<CampaignWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    status: 'draft' as 'draft' | 'active' | 'completed' | 'archived',
  });

  useEffect(() => {
    loadCampaigns();
  }, [workspace.id]);

  const loadCampaigns = async () => {
    setLoading(true);

    const { data: campaignsData, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('updated_at', { ascending: false });

    if (error || !campaignsData) {
      console.error('Error loading campaigns:', error);
      setLoading(false);
      return;
    }

    const { data: adSetsData } = await supabase
      .from('ad_sets')
      .select('campaign_id, status, spend, revenue, creator_id')
      .in('campaign_id', campaignsData.map(c => c.id));

    const { data: contentData } = await supabase
      .from('content_media')
      .select('campaign_id')
      .in('campaign_id', campaignsData.map(c => c.id));

    const campaignsWithMetrics: CampaignWithMetrics[] = campaignsData.map(campaign => {
      const campaignAdSets = adSetsData?.filter(ad => ad.campaign_id === campaign.id) || [];
      const total_spend = campaignAdSets.reduce((sum, ad) => sum + (Number(ad.spend) || 0), 0);
      const total_revenue = campaignAdSets.reduce((sum, ad) => sum + (Number(ad.revenue) || 0), 0);
      const roi = total_spend > 0 ? ((total_revenue - total_spend) / total_spend) * 100 : 0;

      const uniqueCreators = new Set(campaignAdSets.map(ad => ad.creator_id).filter(Boolean));
      const campaignContent = contentData?.filter(c => c.campaign_id === campaign.id) || [];

      return {
        ...campaign,
        total_spend,
        total_revenue,
        roi,
        creators_count: uniqueCreators.size,
        content_count: campaignContent.length,
      };
    });

    setCampaigns(campaignsWithMetrics);
    setLoading(false);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!checkWritePermission('create campaigns')) {
      setShowCreateModal(false);
      return;
    }

    const { error } = await supabase.from('campaigns').insert({
      workspace_id: workspace.id,
      name: newCampaign.name,
      created_by: user.id,
      status: newCampaign.status,
    });

    if (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
      return;
    }

    setShowCreateModal(false);
    setNewCampaign({ name: '', status: 'draft' });
    loadCampaigns();
  };

  if (loading) {
    return (
      <PageLayout title="Campaigns" subtitle="Manage your campaigns">
        <div className="text-nuum-text-secondary">Loading campaigns...</div>
      </PageLayout>
    );
  }

  return (
    <>
      <PageLayout
        title="Campaigns"
        subtitle="Manage your campaigns"
        action={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-nuum-accent-blue hover:bg-nuum-accent-blue/90 text-white transition-all duration-200 rounded-lg shadow-lg whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        }
      >
        {campaigns.length === 0 ? (
          <div className="bg-nuum-surface border border-nuum-border rounded-xl p-8">
            <div className="text-center py-12">
              <p className="text-nuum-text-secondary">
                No campaigns found. Create your first campaign to get started.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-nuum-accent-blue hover:bg-nuum-accent-blue/90 text-white transition-all duration-200 rounded-lg"
              >
                Create Campaign
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map(campaign => (
              <button
                key={campaign.id}
                onClick={() => onCampaignClick?.(campaign)}
                className="bg-nuum-surface border border-nuum-border rounded-xl p-6 cursor-pointer text-left w-full transition-all duration-150 hover:shadow-lg group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold tracking-tight text-nuum-text-primary">
                    {campaign.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClasses(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 text-[13px]">
                  <span className="text-nuum-text-secondary">Spend:</span>
                  <span className="text-nuum-text-primary font-semibold">€{campaign.total_spend.toLocaleString()}</span>

                  <span className="text-nuum-text-secondary">Revenue:</span>
                  <span className="text-nuum-accent-green font-semibold">€{campaign.total_revenue.toLocaleString()}</span>

                  <span className="text-nuum-text-secondary">ROI:</span>
                  <span className={`font-semibold ${getROIColorClass(campaign.roi)}`}>
                    {campaign.roi.toFixed(1)}%
                  </span>

                  <span className="text-nuum-text-secondary">Creators:</span>
                  <span className="text-nuum-text-primary font-semibold">{campaign.creators_count}</span>
                </div>

                <div className="pt-3 border-t border-nuum-border flex items-center justify-between">
                  <span className="text-xs text-nuum-text-secondary">
                    {campaign.content_count} content items
                  </span>
                  <div className="flex items-center gap-1 text-nuum-text-secondary group-hover:text-nuum-accent-blue transition-colors">
                    <span className="text-xs">View details</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </PageLayout>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 z-50" onClick={() => setShowCreateModal(false)}>
          <div
            className="bg-nuum-surface border border-nuum-border rounded-xl w-full max-w-lg p-4 md:p-6 max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-nuum-text-primary">
                Create New Campaign
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-nuum-text-secondary hover:bg-nuum-border rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-nuum-text-secondary">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full px-4 py-2 bg-nuum-background border border-nuum-border text-nuum-text-primary rounded-lg transition-all duration-200 focus:outline-none focus:border-nuum-accent-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-nuum-text-secondary">
                  Status
                </label>
                <select
                  value={newCampaign.status}
                  onChange={(e) => setNewCampaign({ ...newCampaign, status: e.target.value as any })}
                  className="w-full px-4 py-2 bg-nuum-background border border-nuum-border text-nuum-text-primary rounded-lg transition-all duration-200 focus:outline-none focus:border-nuum-accent-blue"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setNewCampaign({ name: '', status: 'draft' }); }}
                  className="flex-1 px-4 py-2 bg-nuum-border hover:bg-nuum-border/80 text-nuum-text-primary rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-nuum-accent-blue hover:bg-nuum-accent-blue/90 text-white rounded-lg transition-all duration-200"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
