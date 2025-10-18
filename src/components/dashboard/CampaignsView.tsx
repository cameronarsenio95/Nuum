import { useState, useEffect } from 'react';
import { Plus, Target, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];

interface CampaignsViewProps {
  workspace: Workspace;
  onCampaignClick?: (campaign: Campaign) => void;
}

export function CampaignsView({ workspace, onCampaignClick }: CampaignsViewProps) {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    status: 'draft' as 'draft' | 'active' | 'completed' | 'archived',
  });

  useEffect(() => {
    loadCampaigns();
    loadCreators();
  }, [workspace.id]);

  const loadCampaigns = async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading campaigns:', error);
    } else {
      setCampaigns(data || []);
    }
    setLoading(false);
  };

  const loadCreators = async () => {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .eq('workspace_id', workspace.id)
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading creators:', error);
    } else {
      setCreators(data || []);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { data: campaign, error } = await supabase.from('campaigns').insert({
      workspace_id: workspace.id,
      name: newCampaign.name,
      created_by: user.id,
      status: newCampaign.status,
    }).select().single();

    if (error) {
      console.error('Error creating campaign:', error);
      return;
    }

    if (campaign && selectedCreators.length > 0) {
      const campaignCreators = selectedCreators.map(creatorId => ({
        campaign_id: campaign.id,
        creator_id: creatorId,
        status: 'invited' as const,
      }));

      const { error: linkError } = await supabase
        .from('campaign_creators')
        .insert(campaignCreators);

      if (linkError) {
        console.error('Error linking creators to campaign:', linkError);
      }
    }

    setShowCreateModal(false);
    resetForm();
    loadCampaigns();
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    const { error } = await supabase
      .from('campaigns')
      .update({
        name: newCampaign.name,
        status: newCampaign.status,
      })
      .eq('id', selectedCampaign.id);

    if (error) {
      console.error('Error updating campaign:', error);
    } else {
      setShowEditModal(false);
      setSelectedCampaign(null);
      resetForm();
      loadCampaigns();
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignToDelete.id);

    if (error) {
      console.error('Error deleting campaign:', error);
    } else {
      setShowDeleteConfirm(false);
      setCampaignToDelete(null);
      loadCampaigns();
    }
  };

  const openEditModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setNewCampaign({
      name: campaign.name,
      status: campaign.status as 'draft' | 'active' | 'completed' | 'archived',
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setShowDeleteConfirm(true);
  };

  const resetForm = () => {
    setNewCampaign({ name: '', status: 'draft' });
    setSelectedCreators([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-linear-success bg-linear-success/10 border-linear-success-border/20';
      case 'completed':
        return 'text-linear-info bg-linear-info/10 border-linear-info-border/20';
      case 'archived':
        return 'text-text-tertiary bg-text-tertiary/10 border-linear-border/20';
      default:
        return 'text-linear-warning bg-linear-warning/10 border-linear-warning-border/20';
    }
  };

  if (loading) {
    return <div className="dark:text-text-secondary light:text-text-light-secondary">Loading campaigns...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-medium mb-2">Campaigns</h2>
          <p className="text-sm md:text-base dark:text-text-secondary light:text-text-light-secondary">Manage your influencer marketing campaigns</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12 md:py-20 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg">
          <Target className="w-10 h-10 md:w-12 md:h-12 dark:text-text-tertiary light:text-text-light-tertiary mx-auto mb-4" />
          <h3 className="text-base md:text-lg font-medium mb-2">No campaigns yet</h3>
          <p className="text-sm md:text-base dark:text-text-secondary light:text-text-light-secondary mb-6 px-4">Create your first campaign to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
          >
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6 hover:dark:border-linear-border light:border-linear-light-border linear-transition cursor-pointer group flex flex-col"
              onClick={() => onCampaignClick?.(campaign)}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-medium text-base md:text-lg">{campaign.name}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 linear-transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(campaign);
                      }}
                      className="p-1 hover:dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {(campaign as any).total_ad_sets > 0 && (
                <div className="mb-4 pb-4 border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="dark:text-text-tertiary light:text-text-light-tertiary block mb-1">Ad Sets</span>
                      <span className="font-medium">{(campaign as any).total_ad_sets}</span>
                    </div>
                    <div>
                      <span className="dark:text-text-tertiary light:text-text-light-tertiary block mb-1">Active</span>
                      <span className="font-medium text-linear-success">{(campaign as any).active_ad_sets || 0}</span>
                    </div>
                    <div>
                      <span className="dark:text-text-tertiary light:text-text-light-tertiary block mb-1">Costs</span>
                      <span className="font-medium">${((campaign as any).total_spend || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="dark:text-text-tertiary light:text-text-light-tertiary block mb-1">Revenue</span>
                      <span className="font-medium text-linear-success">${((campaign as any).total_revenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="dark:text-text-tertiary light:text-text-light-tertiary block mb-1">ROI</span>
                      <span className={`font-medium ${
                        (campaign as any).total_spend > 0
                          ? ((((campaign as any).total_revenue || 0) - (campaign as any).total_spend) / (campaign as any).total_spend) * 100 >= 0
                            ? 'text-linear-success'
                            : 'text-linear-error'
                          : 'dark:text-text-secondary light:text-text-light-secondary'
                      }`}>
                        {(campaign as any).total_spend > 0
                          ? `${((((campaign as any).total_revenue || 0) - (campaign as any).total_spend) / (campaign as any).total_spend * 100).toFixed(1)}%`
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 md:p-6 z-50" onClick={() => setShowCreateModal(false)}>
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-4 md:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium">Create New Campaign</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={newCampaign.status}
                  onChange={(e) => setNewCampaign({ ...newCampaign, status: e.target.value as any })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
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
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 md:p-6 z-50" onClick={() => setShowEditModal(false)}>
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-4 md:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium">Edit Campaign</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={newCampaign.status}
                  onChange={(e) => setNewCampaign({ ...newCampaign, status: e.target.value as any })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
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
                  onClick={() => openDeleteConfirm(selectedCampaign)}
                  className="px-4 py-2 bg-linear-error-subtle hover:bg-red-500/20 text-linear-error border border-linear-error-border/20 rounded-linear linear-transition"
                >
                  Delete
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); resetForm(); }}
                  className="px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && campaignToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 md:p-6 z-50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-4 md:p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-medium mb-4">Delete Campaign</h3>
            <p className="dark:text-text-secondary light:text-text-light-secondary mb-6">
              Are you sure you want to delete <span className="font-medium dark:text-text-primary light:text-text-light-primary">{campaignToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCampaign}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-linear linear-transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
