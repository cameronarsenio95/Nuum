import { useState, useEffect } from 'react';
import { Plus, Target, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useWritePermission } from '../../hooks/useWritePermission';
import { handleSupabaseError, logOperationStart, logOperationSuccess } from '../../utils/errorHandler';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];
type AdSet = Database['public']['Tables']['ad_sets']['Row'];

interface CampaignWithMetrics extends Campaign {
  total_ad_sets: number;
  active_ad_sets: number;
  total_spend: number;
  total_revenue: number;
}

interface CampaignsViewProps {
  workspace: Workspace;
  onCampaignClick?: (campaign: Campaign) => void;
}

export function CampaignsView({ workspace, onCampaignClick }: CampaignsViewProps) {
  const { user } = useAuth();
  const { checkWritePermission } = useWritePermission();
  const [campaigns, setCampaigns] = useState<CampaignWithMetrics[]>([]);
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
    setLoading(true);
    const { data: campaignsData, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading campaigns:', error);
      setLoading(false);
      return;
    }

    if (!campaignsData || campaignsData.length === 0) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    // Load ad sets for all campaigns
    const { data: adSetsData, error: adSetsError } = await supabase
      .from('ad_sets')
      .select('campaign_id, status, spend, revenue')
      .in('campaign_id', campaignsData.map(c => c.id));

    if (adSetsError) {
      console.error('Error loading ad sets:', adSetsError);
    }

    // Calculate metrics for each campaign
    const campaignsWithMetrics: CampaignWithMetrics[] = campaignsData.map(campaign => {
      const campaignAdSets = adSetsData?.filter(ad => ad.campaign_id === campaign.id) || [];

      return {
        ...campaign,
        total_ad_sets: campaignAdSets.length,
        active_ad_sets: campaignAdSets.filter(ad => ad.status === 'active').length,
        total_spend: campaignAdSets.reduce((sum, ad) => sum + (Number(ad.spend) || 0), 0),
        total_revenue: campaignAdSets.reduce((sum, ad) => sum + (Number(ad.revenue) || 0), 0),
      };
    });

    setCampaigns(campaignsWithMetrics);
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

    if (!checkWritePermission('create campaigns')) {
      setShowCreateModal(false);
      return;
    }

    logOperationStart('CREATE_CAMPAIGN', { name: newCampaign.name, workspace_id: workspace.id });

    const { data: campaign, error } = await supabase.from('campaigns').insert({
      workspace_id: workspace.id,
      name: newCampaign.name,
      created_by: user.id,
      status: newCampaign.status,
    }).select().single();

    if (error) {
      const appError = handleSupabaseError(error, 'CREATE_CAMPAIGN');
      alert(appError.userMessage);
      return;
    }

    logOperationSuccess('CREATE_CAMPAIGN', { campaign_id: campaign.id });

    if (campaign && selectedCreators.length > 0) {
      const campaignCreators = selectedCreators.map(creatorId => ({
        campaign_id: campaign.id,
        creator_id: creatorId,
        status: 'invited' as const,
      }));

      logOperationStart('LINK_CAMPAIGN_CREATORS', { campaign_id: campaign.id, creators: selectedCreators.length });

      const { error: linkError } = await supabase
        .from('campaign_creators')
        .insert(campaignCreators);

      if (linkError) {
        const appError = handleSupabaseError(linkError, 'LINK_CAMPAIGN_CREATORS');
        console.warn('[LINK_CAMPAIGN_CREATORS] Non-fatal error:', appError.userMessage);
      } else {
        logOperationSuccess('LINK_CAMPAIGN_CREATORS');
      }
    }

    setShowCreateModal(false);
    resetForm();
    loadCampaigns();
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    if (!checkWritePermission('update campaigns')) {
      setShowEditModal(false);
      return;
    }

    logOperationStart('UPDATE_CAMPAIGN', { campaign_id: selectedCampaign.id, workspace_id: workspace.id });

    const { error } = await supabase
      .from('campaigns')
      .update({
        name: newCampaign.name,
        status: newCampaign.status,
      })
      .eq('id', selectedCampaign.id)
      .eq('workspace_id', workspace.id);

    if (error) {
      const appError = handleSupabaseError(error, 'UPDATE_CAMPAIGN');
      alert(appError.userMessage);
      return;
    }

    logOperationSuccess('UPDATE_CAMPAIGN', { campaign_id: selectedCampaign.id });

    setCampaigns(prev =>
      prev.map(c =>
        c.id === selectedCampaign.id
          ? { ...c, name: newCampaign.name, status: newCampaign.status }
          : c
      )
    );

    setShowEditModal(false);
    setSelectedCampaign(null);
    resetForm();
  };

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;

    if (!checkWritePermission('delete campaigns')) {
      setShowDeleteConfirm(false);
      setCampaignToDelete(null);
      return;
    }

    logOperationStart('DELETE_CAMPAIGN', { campaign_id: campaignToDelete.id, workspace_id: workspace.id });

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignToDelete.id)
      .eq('workspace_id', workspace.id);

    if (error) {
      const appError = handleSupabaseError(error, 'DELETE_CAMPAIGN');
      alert(appError.userMessage);
      return;
    }

    logOperationSuccess('DELETE_CAMPAIGN', { campaign_id: campaignToDelete.id });

    setCampaigns(prev => prev.filter(c => c.id !== campaignToDelete.id));

    setShowDeleteConfirm(false);
    setCampaignToDelete(null);
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
        return 'text-[#66a56b] bg-[#1e2921] border-[#66a56b]/20';
      case 'completed':
        return 'text-[#3e559e] bg-[#141623] border-[#3e559e]/20';
      case 'archived':
        return 'text-[#cecece] bg-[#2e2f30] border-[#e2e2e1]/10';
      default:
        return 'text-[#e3a36e] bg-[#2e2720] border-[#e3a36e]/20';
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
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#3e559e] hover:bg-[#324885] text-white rounded-[10px] transition-all duration-200 whitespace-nowrap shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12 md:py-20 bg-[#161616] border border-[rgba(226,226,225,0.1)] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
          <Target className="w-10 h-10 md:w-12 md:h-12 text-[#cecece] mx-auto mb-4" />
          <h3 className="text-base md:text-lg font-semibold mb-2 text-white">No campaigns yet</h3>
          <p className="text-sm md:text-base text-[#cecece] mb-6 px-4">Create your first campaign to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#3e559e] hover:bg-[#324885] text-white rounded-[10px] transition-all duration-200"
          >
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-[#161616] border border-[rgba(226,226,225,0.1)] rounded-[14px] p-4 md:p-6 hover:bg-[#1b1b1b] hover:border-[rgba(226,226,225,0.15)] transition-all duration-200 cursor-pointer group flex flex-col shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
              onClick={() => onCampaignClick?.(campaign)}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-base md:text-lg text-white">{campaign.name}</h3>
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

              {campaign.total_ad_sets > 0 && (
                <div className="mb-4 pb-4 border-b border-[rgba(226,226,225,0.1)]">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[#cecece] block mb-1">Ad Sets</span>
                      <span className="font-semibold text-white">{campaign.total_ad_sets}</span>
                    </div>
                    <div>
                      <span className="text-[#cecece] block mb-1">Active</span>
                      <span className="font-semibold text-[#66a56b]">{campaign.active_ad_sets}</span>
                    </div>
                    <div>
                      <span className="text-[#cecece] block mb-1">Costs</span>
                      <span className="font-semibold text-white">€{campaign.total_spend.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[#cecece] block mb-1">Revenue</span>
                      <span className="font-semibold text-[#66a56b]">€{campaign.total_revenue.toLocaleString()}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[#cecece] block mb-1">ROI</span>
                      <span className={`font-semibold ${
                        campaign.total_spend > 0
                          ? ((campaign.total_revenue - campaign.total_spend) / campaign.total_spend) * 100 >= 0
                            ? 'text-[#66a56b]'
                            : 'text-[#9c3e3f]'
                          : 'text-[#cecece]'
                      }`}>
                        {campaign.total_spend > 0
                          ? `${Math.round(((campaign.total_revenue - campaign.total_spend) / campaign.total_spend * 100))}%`
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
          <div className="bg-[#161616] border border-[rgba(226,226,225,0.15)] rounded-[14px] p-4 md:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.4)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Create New Campaign</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-[#1b1b1b] rounded-[8px] transition-all duration-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-[#cecece]">Campaign Name</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0e0e0e] border border-[rgba(226,226,225,0.15)] rounded-[10px] focus:outline-none focus:border-[#3e559e] text-white transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[#cecece]">Status</label>
                <select
                  value={newCampaign.status}
                  onChange={(e) => setNewCampaign({ ...newCampaign, status: e.target.value as any })}
                  className="w-full px-4 py-2 bg-[#0e0e0e] border border-[rgba(226,226,225,0.15)] rounded-[10px] focus:outline-none focus:border-[#3e559e] text-white transition-all duration-200"
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
                  className="flex-1 px-4 py-2 bg-[#2e2f30] hover:bg-[#3a3b3c] text-white rounded-[10px] transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#3e559e] hover:bg-[#324885] text-white rounded-[10px] transition-all duration-200"
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
          <div className="bg-[#161616] border border-[rgba(226,226,225,0.15)] rounded-[14px] p-4 md:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.4)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Edit Campaign</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-[#1b1b1b] rounded-[8px] transition-all duration-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-[#cecece]">Campaign Name</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0e0e0e] border border-[rgba(226,226,225,0.15)] rounded-[10px] focus:outline-none focus:border-[#3e559e] text-white transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[#cecece]">Status</label>
                <select
                  value={newCampaign.status}
                  onChange={(e) => setNewCampaign({ ...newCampaign, status: e.target.value as any })}
                  className="w-full px-4 py-2 bg-[#0e0e0e] border border-[rgba(226,226,225,0.15)] rounded-[10px] focus:outline-none focus:border-[#3e559e] text-white transition-all duration-200"
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
                  className="px-4 py-2 bg-[#251816] hover:bg-[#9c3e3f]/20 text-[#9c3e3f] border border-[#9c3e3f]/20 rounded-[10px] transition-all duration-200"
                >
                  Delete
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); resetForm(); }}
                  className="px-4 py-2 bg-[#2e2f30] hover:bg-[#3a3b3c] text-white rounded-[10px] transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3e559e] hover:bg-[#324885] text-white rounded-[10px] transition-all duration-200"
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
          <div className="bg-[#161616] border border-[rgba(226,226,225,0.15)] rounded-[14px] p-4 md:p-6 w-full max-w-md shadow-[0_8px_32px_rgba(0,0,0,0.4)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4 text-white">Delete Campaign</h3>
            <p className="text-[#cecece] mb-6">
              Are you sure you want to delete <span className="font-semibold text-white">{campaignToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-[#2e2f30] hover:bg-[#3a3b3c] text-white rounded-[10px] transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCampaign}
                className="flex-1 px-4 py-2 bg-[#9c3e3f] hover:bg-[#8a3738] text-white rounded-[10px] transition-all duration-200"
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
