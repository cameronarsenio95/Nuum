import { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Euro, TrendingUp, MousePointer, Target, Edit2, Trash2, X, ExternalLink, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import type { Database } from '../../lib/database.types';
import { CostBreakdownModal, type CostBreakdown } from './CostBreakdownModal';

type Campaign = Database['public']['Tables']['campaigns']['Row'];
type AdSet = Database['public']['Tables']['ad_sets']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];

interface AdSetsViewProps {
  campaign: Campaign;
  onBack: () => void;
}

interface AdSetWithCreator extends AdSet {
  creator: Creator;
}

export function AdSetsView({ campaign, onBack }: AdSetsViewProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [adSets, setAdSets] = useState<AdSetWithCreator[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [currentCampaign, setCurrentCampaign] = useState<Campaign>(campaign);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdSet, setSelectedAdSet] = useState<AdSet | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [adSetToDelete, setAdSetToDelete] = useState<AdSet | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCostBreakdownModal, setShowCostBreakdownModal] = useState(false);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown>({
    fee: 0,
    items: 0,
    advertisement: 0,
    shipping: 0,
    production: 0,
    other: 0,
  });
  const [newAdSet, setNewAdSet] = useState({
    name: '',
    creator_id: '',
    platform: 'META' as 'META' | 'TikTok' | 'Google' | 'Snapchat' | 'Other',
    status: 'draft' as 'active' | 'paused' | 'completed' | 'draft',
    revenue: '',
    costs: '',
    ad_creative_url: '',
    spark_code: '',
  });

  useEffect(() => {
    loadAdSets();
    loadCreators();
    loadCampaign();
  }, [campaign.id]);

  const loadCampaign = async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign.id)
      .single();

    if (error) {
      console.error('Error loading campaign:', error);
    } else if (data) {
      setCurrentCampaign(data);
    }
  };

  const loadAdSets = async () => {
    const { data, error } = await supabase
      .from('ad_sets')
      .select('*, creator:creators(*)')
      .eq('campaign_id', campaign.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading ad sets:', error);
    } else {
      setAdSets((data as any) || []);
    }
    setLoading(false);
  };

  const loadCreators = async () => {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .eq('workspace_id', campaign.workspace_id)
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading creators:', error);
    } else {
      setCreators(data || []);
    }
  };

  const handleCreateAdSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;

    if (!newAdSet.creator_id) {
      toast?.showToast('Please select a creator', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const totalCosts = parseFloat(newAdSet.costs) || 0;
      const performanceMetrics = {
        costBreakdown: costBreakdown,
      };

      const { error } = await supabase.from('ad_sets').insert({
        campaign_id: campaign.id,
        creator_id: newAdSet.creator_id,
        name: newAdSet.name,
        platform: newAdSet.platform,
        status: newAdSet.status,
        revenue: newAdSet.revenue ? parseFloat(newAdSet.revenue) : 0,
        spend: totalCosts,
        ad_creative_url: newAdSet.ad_creative_url || null,
        spark_code: newAdSet.spark_code || null,
        performance_metrics: performanceMetrics,
      });

      if (error) {
        console.error('Error creating ad set:', error);
        toast?.showToast(`Error creating ad set: ${error.message}`, 'error');
        return;
      }

      toast?.showToast('Ad set created successfully', 'success');
      setShowCreateModal(false);
      resetForm();
      loadAdSets();
      loadCampaign();
    } catch (error) {
      console.error('Unexpected error creating ad set:', error);
      toast?.showToast('An unexpected error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAdSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdSet) return;

    const totalCosts = parseFloat(newAdSet.costs) || 0;
    const performanceMetrics = {
      ...(selectedAdSet.performance_metrics as any || {}),
      costBreakdown: costBreakdown,
    };

    const { error } = await supabase
      .from('ad_sets')
      .update({
        name: newAdSet.name,
        creator_id: newAdSet.creator_id,
        platform: newAdSet.platform,
        status: newAdSet.status,
        revenue: newAdSet.revenue ? parseFloat(newAdSet.revenue) : 0,
        spend: totalCosts,
        ad_creative_url: newAdSet.ad_creative_url || null,
        spark_code: newAdSet.spark_code || null,
        performance_metrics: performanceMetrics,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedAdSet.id);

    if (error) {
      console.error('Error updating ad set:', error);
    } else {
      setShowEditModal(false);
      setSelectedAdSet(null);
      resetForm();
      loadAdSets();
      loadCampaign();
    }
  };

  const handleDeleteAdSet = async () => {
    if (!adSetToDelete) return;

    const { error } = await supabase
      .from('ad_sets')
      .delete()
      .eq('id', adSetToDelete.id);

    if (error) {
      console.error('Error deleting ad set:', error);
    } else {
      setShowDeleteConfirm(false);
      setAdSetToDelete(null);
      loadAdSets();
      loadCampaign();
    }
  };

  const openEditModal = (adSet: AdSet) => {
    setSelectedAdSet(adSet);

    const metrics = adSet.performance_metrics as any;
    const savedBreakdown = metrics?.costBreakdown;

    if (savedBreakdown) {
      setCostBreakdown(savedBreakdown);
    } else {
      setCostBreakdown({
        fee: 0,
        items: 0,
        advertisement: 0,
        shipping: 0,
        production: 0,
        other: 0,
      });
    }

    setNewAdSet({
      name: adSet.name,
      creator_id: adSet.creator_id,
      platform: adSet.platform,
      status: adSet.status,
      revenue: adSet.revenue?.toString() || '',
      costs: adSet.spend?.toString() || '',
      ad_creative_url: adSet.ad_creative_url || '',
      spark_code: adSet.spark_code || '',
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (adSet: AdSet) => {
    setAdSetToDelete(adSet);
    setShowDeleteConfirm(true);
  };

  const resetForm = () => {
    setNewAdSet({
      name: '',
      creator_id: '',
      platform: 'META',
      status: 'draft',
      revenue: '',
      costs: '',
      ad_creative_url: '',
      spark_code: '',
    });
    setCostBreakdown({
      fee: 0,
      items: 0,
      advertisement: 0,
      shipping: 0,
      production: 0,
      other: 0,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-linear-success bg-linear-success/10 border-linear-success-border/20';
      case 'paused':
        return 'text-linear-warning bg-linear-warning/10 border-linear-warning-border/20';
      case 'completed':
        return 'text-linear-info bg-linear-info/10 border-linear-info-border/20';
      default:
        return 'text-text-tertiary bg-text-tertiary/10 border-linear-border/20';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'META':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'TikTok':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'Google':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Snapchat':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const filteredAdSets = adSets.filter(adSet => {
    const matchesPlatform = filterPlatform === 'all' || adSet.platform === filterPlatform;
    const matchesStatus = filterStatus === 'all' || adSet.status === filterStatus;
    const matchesSearch = adSet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         adSet.creator.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesStatus && matchesSearch;
  });

  if (loading) {
    return <div className="dark:text-text-secondary light:text-text-light-secondary">Loading ad sets...</div>;
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-6 dark:text-text-secondary light:text-text-light-secondary hover:dark:text-text-primary hover:light:text-text-light-primary linear-transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Campaigns
      </button>

      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-6 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-medium mb-2">{currentCampaign.name}</h2>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(currentCampaign.status)}`}>
                {currentCampaign.status}
              </span>
              {currentCampaign.start_date && (
                <span className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                  {new Date(currentCampaign.start_date).toLocaleDateString()}
                  {currentCampaign.end_date && ` - ${new Date(currentCampaign.end_date).toLocaleDateString()}`}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
          >
            <Plus className="w-4 h-4" />
            New Ad Set
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
              <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Total Ad Sets</span>
            </div>
            <p className="text-2xl font-medium">{currentCampaign.total_ad_sets || 0}</p>
          </div>

          <div className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4">
            <div className="flex items-center gap-2 mb-2">
              <Euro className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
              <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Total Costs</span>
            </div>
            <p className="text-2xl font-medium">€{(currentCampaign.total_spend || 0).toLocaleString()}</p>
          </div>

          <div className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
              <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Revenue</span>
            </div>
            <p className="text-2xl font-medium">€{(currentCampaign.total_revenue || 0).toLocaleString()}</p>
          </div>

          <div className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4">
            <div className="flex items-center gap-2 mb-2">
              <MousePointer className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
              <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">ROI</span>
            </div>
            <p className="text-2xl font-medium">{Math.round((currentCampaign.total_revenue || 0) / (currentCampaign.total_spend || 1) * 100)}%</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search ad sets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
          />
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="px-4 py-2 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
          >
            <option value="all">All Platforms</option>
            <option value="META">META</option>
            <option value="TikTok">TikTok</option>
            <option value="Google">Google</option>
            <option value="Snapchat">Snapchat</option>
            <option value="Other">Other</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">
          {filteredAdSets.length} ad set{filteredAdSets.length !== 1 ? 's' : ''}
        </p>
      </div>

      {filteredAdSets.length === 0 ? (
        <div className="text-center py-20 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg">
          <Target className="w-12 h-12 dark:text-text-tertiary light:text-text-light-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No ad sets yet</h3>
          <p className="dark:text-text-secondary light:text-text-light-secondary mb-6">Create your first ad set to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
          >
            Create Ad Set
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAdSets.map((adSet) => (
            <div
              key={adSet.id}
              className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-6 hover:dark:border-linear-border hover:light:border-linear-light-border linear-transition group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-medium text-lg mb-2">{adSet.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${getPlatformColor(adSet.platform)}`}>
                      {adSet.platform}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(adSet.status)}`}>
                      {adSet.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm dark:text-text-secondary light:text-text-light-secondary">
                    <Users className="w-4 h-4" />
                    <span>{adSet.creator.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 linear-transition">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(adSet);
                    }}
                    className="p-1 hover:dark:bg-linear-bg-subtle hover:light:bg-linear-light-bg-subtle rounded-linear"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteConfirm(adSet);
                    }}
                    className="p-1 hover:bg-red-500/20 text-linear-error rounded-linear"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="dark:text-text-tertiary light:text-text-light-tertiary">Costs</span>
                  <span className="font-medium">€{adSet.spend.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="dark:text-text-tertiary light:text-text-light-tertiary">Revenue</span>
                  <span className="font-medium text-linear-success">€{adSet.revenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="dark:text-text-tertiary light:text-text-light-tertiary">ROI</span>
                  <span className={`font-medium ${
                    adSet.spend > 0
                      ? ((adSet.revenue - adSet.spend) / adSet.spend) * 100 >= 0
                        ? 'text-linear-success'
                        : 'text-linear-error'
                      : 'dark:text-text-secondary light:text-text-light-secondary'
                  }`}>
                    {adSet.spend > 0
                      ? `${Math.round(((adSet.revenue - adSet.spend) / adSet.spend) * 100)}%`
                      : '-'}
                  </span>
                </div>
              </div>

              {(adSet.ad_creative_url || adSet.spark_code) && (
                <div className="mt-4">
                  <div className="flex items-center gap-3">
                    {adSet.ad_creative_url && (
                      <a
                        href={adSet.ad_creative_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-linear-info hover:text-blue-300 linear-transition"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Creative
                      </a>
                    )}
                    {adSet.spark_code && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(adSet.spark_code!);
                          toast.success('Spark Code copied to clipboard');
                        }}
                        className="text-sm text-linear-accent hover:text-linear-accent/80 linear-transition"
                        title="Copy Spark Code"
                      >
                        Spark Code
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50 overflow-y-auto" onClick={() => setShowCreateModal(false)}>
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-6 w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium">Create New Ad Set</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:dark:bg-linear-bg-subtle hover:light:bg-linear-light-bg-subtle rounded-linear">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAdSet} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ad Set Name</label>
                <input
                  type="text"
                  value={newAdSet.name}
                  onChange={(e) => setNewAdSet({ ...newAdSet, name: e.target.value })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Creator</label>
                  <select
                    value={newAdSet.creator_id}
                    onChange={(e) => setNewAdSet({ ...newAdSet, creator_id: e.target.value })}
                    className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                    required
                  >
                    <option value="">Select Creator</option>
                    {creators.map((creator) => (
                      <option key={creator.id} value={creator.id}>
                        {creator.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Platform</label>
                  <select
                    value={newAdSet.platform}
                    onChange={(e) => setNewAdSet({ ...newAdSet, platform: e.target.value as any })}
                    className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                  >
                    <option value="META">META</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Google">Google</option>
                    <option value="Snapchat">Snapchat</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={newAdSet.status}
                  onChange={(e) => setNewAdSet({ ...newAdSet, status: e.target.value as any })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Creative URL</label>
                <input
                  type="url"
                  value={newAdSet.ad_creative_url}
                  onChange={(e) => setNewAdSet({ ...newAdSet, ad_creative_url: e.target.value })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Spark Code</label>
                <input
                  type="text"
                  value={newAdSet.spark_code}
                  onChange={(e) => setNewAdSet({ ...newAdSet, spark_code: e.target.value })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                  placeholder="Enter Spark Code"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Costs</label>
                  <button
                    type="button"
                    onClick={() => setShowCostBreakdownModal(true)}
                    className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear hover:border-linear-accent focus:outline-none focus:border-linear-accent linear-transition text-left flex items-center justify-between group"
                  >
                    <span className={newAdSet.costs ? 'dark:text-text-primary light:text-text-light-primary' : 'dark:text-text-tertiary light:text-text-light-tertiary'}>
                      {newAdSet.costs ? `€${parseFloat(newAdSet.costs).toFixed(2)}` : 'Enter costs breakdown'}
                    </span>
                    <Euro className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary group-hover:text-linear-accent linear-transition" />
                  </button>
                  <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mt-1">Click to add detailed costs</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Revenue</label>
                  <input
                    type="number"
                    value={newAdSet.revenue}
                    onChange={(e) => setNewAdSet({ ...newAdSet, revenue: e.target.value })}
                    className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
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
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedAdSet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50 overflow-y-auto" onClick={() => setShowEditModal(false)}>
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-6 w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium">Edit Ad Set</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:dark:bg-linear-bg-subtle hover:light:bg-linear-light-bg-subtle rounded-linear">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateAdSet} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ad Set Name</label>
                <input
                  type="text"
                  value={newAdSet.name}
                  onChange={(e) => setNewAdSet({ ...newAdSet, name: e.target.value })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Creator</label>
                  <select
                    value={newAdSet.creator_id}
                    onChange={(e) => setNewAdSet({ ...newAdSet, creator_id: e.target.value })}
                    className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                    required
                  >
                    <option value="">Select Creator</option>
                    {creators.map((creator) => (
                      <option key={creator.id} value={creator.id}>
                        {creator.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Platform</label>
                  <select
                    value={newAdSet.platform}
                    onChange={(e) => setNewAdSet({ ...newAdSet, platform: e.target.value as any })}
                    className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                  >
                    <option value="META">META</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Google">Google</option>
                    <option value="Snapchat">Snapchat</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={newAdSet.status}
                  onChange={(e) => setNewAdSet({ ...newAdSet, status: e.target.value as any })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Creative URL</label>
                <input
                  type="url"
                  value={newAdSet.ad_creative_url}
                  onChange={(e) => setNewAdSet({ ...newAdSet, ad_creative_url: e.target.value })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Spark Code</label>
                <input
                  type="text"
                  value={newAdSet.spark_code}
                  onChange={(e) => setNewAdSet({ ...newAdSet, spark_code: e.target.value })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                  placeholder="Enter Spark Code"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Costs</label>
                  <button
                    type="button"
                    onClick={() => setShowCostBreakdownModal(true)}
                    className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear hover:border-linear-accent focus:outline-none focus:border-linear-accent linear-transition text-left flex items-center justify-between group"
                  >
                    <span className={newAdSet.costs ? 'dark:text-text-primary light:text-text-light-primary' : 'dark:text-text-tertiary light:text-text-light-tertiary'}>
                      {newAdSet.costs ? `€${parseFloat(newAdSet.costs).toFixed(2)}` : 'Enter costs breakdown'}
                    </span>
                    <Euro className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary group-hover:text-linear-accent linear-transition" />
                  </button>
                  <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mt-1">Click to add detailed costs</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Revenue</label>
                  <input
                    type="number"
                    value={newAdSet.revenue}
                    onChange={(e) => setNewAdSet({ ...newAdSet, revenue: e.target.value })}
                    className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => openDeleteConfirm(selectedAdSet)}
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

      {showDeleteConfirm && adSetToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-medium mb-4">Delete Ad Set</h3>
            <p className="dark:text-text-secondary light:text-text-light-secondary mb-6">
              Are you sure you want to delete <span className="font-medium dark:text-text-primary light:text-text-light-primary">{adSetToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAdSet}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-linear linear-transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <CostBreakdownModal
        isOpen={showCostBreakdownModal}
        onClose={() => setShowCostBreakdownModal(false)}
        onSave={(breakdown, total) => {
          setCostBreakdown(breakdown);
          setNewAdSet({ ...newAdSet, costs: total.toString() });
        }}
        initialBreakdown={costBreakdown}
        initialTotal={parseFloat(newAdSet.costs) || 0}
      />
    </div>
  );
}
