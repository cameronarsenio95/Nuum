import { useState, useEffect } from 'react';
import {
  Plus,
  ArrowLeft,
  Euro,
  TrendingUp,
  MousePointer,
  Target,
  Edit2,
  Trash2,
  X,
  ExternalLink,
  Users
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { handleSupabaseError, logOperationStart, logOperationSuccess } from '../../utils/errorHandler';
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
    other: 0
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
    duration_days: null as number | null
  });

  useEffect(() => {
    loadAdSets();
    loadCreators();
    loadCampaign();
  }, [campaign.id]);

  const loadCampaign = async () => {
    const { data, error } = await supabase.from('campaigns').select('*').eq('id', campaign.id).single();
    if (!error && data) setCurrentCampaign(data);
  };

  const loadAdSets = async () => {
    const { data, error } = await supabase
      .from('ad_sets')
      .select('*, creator:creators(*)')
      .eq('campaign_id', campaign.id)
      .order('created_at', { ascending: false });

    if (!error && data) setAdSets((data as any) || []);
    setLoading(false);
  };

  const loadCreators = async () => {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .eq('workspace_id', campaign.workspace_id)
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (!error && data) setCreators(data);
  };

  const campaignMetrics = {
    total_ad_sets: adSets.length,
    total_spend: adSets.reduce((sum, adSet) => sum + (Number(adSet.spend) || 0), 0),
    total_revenue: adSets.reduce((sum, adSet) => sum + (Number(adSet.revenue) || 0), 0)
  };

  const handleDeleteAdSet = async () => {
    if (!adSetToDelete) return;

    try {
      const { error } = await supabase.from('ad_sets').delete().eq('id', adSetToDelete.id);
      if (error) {
        console.error('Error deleting ad set:', error.message);
        toast?.showToast('Failed to delete ad set. Please try again.', 'error');
        return;
      }

      // ✅ Update UI direct
      setAdSets((prev) => prev.filter((a) => a.id !== adSetToDelete.id));
      setShowDeleteConfirm(false);
      setAdSetToDelete(null);
      await loadCampaign();

      toast?.showToast('Ad set deleted successfully', 'success');
    } catch (err) {
      console.error('Unexpected error deleting ad set:', err);
      toast?.showToast('Unexpected error while deleting. Try again.', 'error');
    }
  };

  const openEditModal = (adSet: AdSet) => {
    setSelectedAdSet(adSet);
    const metrics = adSet.performance_metrics as any;
    const savedBreakdown = metrics?.costBreakdown || {
      fee: 0,
      items: 0,
      advertisement: 0,
      shipping: 0,
      production: 0,
      other: 0
    };

    setCostBreakdown(savedBreakdown);
    setNewAdSet({
      name: adSet.name,
      creator_id: adSet.creator_id,
      platform: adSet.platform,
      status: adSet.status,
      revenue: adSet.revenue?.toString() || '',
      costs: adSet.spend?.toString() || '',
      ad_creative_url: adSet.ad_creative_url || '',
      spark_code: adSet.spark_code || '',
      duration_days: adSet.duration_days || null
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (adSet: AdSet) => {
    setAdSetToDelete(adSet);
    setShowDeleteConfirm(true);
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

  const getPeriodBadge = (durationDays: number | null) =>
    durationDays === null ? 'Unlimited' : `${durationDays}d`;

  const filteredAdSets = adSets.filter((adSet) => {
    const matchesPlatform = filterPlatform === 'all' || adSet.platform === filterPlatform;
    const matchesStatus = filterStatus === 'all' || adSet.status === filterStatus;
    const matchesSearch =
      adSet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adSet.creator.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesStatus && matchesSearch;
  });

  if (loading) return <div className="dark:text-text-secondary">Loading ad sets...</div>;

  return (
    <div>
      {/* ⬅️ Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-6 dark:text-text-secondary hover:dark:text-text-primary linear-transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Campaigns
      </button>

      {/* Campaign Summary */}
      <div className="dark:bg-linear-bg-secondary border dark:border-linear-border rounded-linear-lg p-6 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-medium mb-2">{currentCampaign.name}</h2>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(currentCampaign.status)}`}>
                {currentCampaign.status}
              </span>
              {currentCampaign.start_date && (
                <span className="text-sm dark:text-text-secondary">
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

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="dark:bg-linear-bg border dark:border-linear-border-subtle rounded-linear p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 dark:text-text-tertiary" />
              <span className="text-xs dark:text-text-tertiary">Total Ad Sets</span>
            </div>
            <p className="text-2xl font-medium">{campaignMetrics.total_ad_sets}</p>
          </div>

          <div className="dark:bg-linear-bg border dark:border-linear-border-subtle rounded-linear p-4">
            <div className="flex items-center gap-2 mb-2">
              <Euro className="w-4 h-4 dark:text-text-tertiary" />
              <span className="text-xs dark:text-text-tertiary">Total Costs</span>
            </div>
            <p className="text-2xl font-medium">€{campaignMetrics.total_spend.toLocaleString()}</p>
          </div>

          <div className="dark:bg-linear-bg border dark:border-linear-border-subtle rounded-linear p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 dark:text-text-tertiary" />
              <span className="text-xs dark:text-text-tertiary">Revenue</span>
            </div>
            <p className="text-2xl font-medium">€{campaignMetrics.total_revenue.toLocaleString()}</p>
          </div>

          <div className="dark:bg-linear-bg border dark:border-linear-border-subtle rounded-linear p-4">
            <div className="flex items-center gap-2 mb-2">
              <MousePointer className="w-4 h-4 dark:text-text-tertiary" />
              <span className="text-xs dark:text-text-tertiary">ROI</span>
            </div>
            <p className="text-2xl font-medium">
              {campaignMetrics.total_spend > 0
                ? `${Math.round(
                    ((campaignMetrics.total_revenue - campaignMetrics.total_spend) /
                      campaignMetrics.total_spend) *
                      100
                  )}%`
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* List of Ad Sets */}
      {filteredAdSets.length === 0 ? (
        <div className="text-center py-20 dark:bg-linear-bg-secondary border dark:border-linear-border-subtle rounded-linear-lg">
          <Target className="w-12 h-12 dark:text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No ad sets yet</h3>
          <p className="dark:text-text-secondary mb-6">Create your first ad set to get started</p>
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
              className="dark:bg-linear-bg-secondary border dark:border-linear-border-subtle rounded-linear-lg p-6 hover:dark:border-linear-border linear-transition group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-medium text-lg mb-2">{adSet.name}</h3>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded-full border ${getPlatformColor(adSet.platform)}`}>
                      {adSet.platform}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(adSet.status)}`}>
                      {adSet.status}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full border bg-linear-accent/10 text-linear-accent border-linear-accent/20">
                      {getPeriodBadge(adSet.duration_days)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm dark:text-text-secondary">
                    <Users className="w-4 h-4" />
                    <span>{adSet.creator.name}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 linear-transition">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(adSet);
                    }}
                    className="p-1 hover:dark:bg-linear-bg-subtle rounded-linear"
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
                  <span className="dark:text-text-tertiary">Costs</span>
                  <span className="font-medium">€{adSet.spend.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="dark:text-text-tertiary">Revenue</span>
                  <span className="font-medium text-linear-success">€{adSet.revenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {showDeleteConfirm && adSetToDelete && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="dark:bg-linear-bg-secondary border dark:border-linear-border rounded-linear-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-medium mb-4">Delete Ad Set</h3>
            <p className="dark:text-text-secondary mb-6">
              Are you sure you want to delete{' '}
              <span className="font-medium dark:text-text-primary">{adSetToDelete.name}</span>? This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 dark:bg-linear-bg-subtle hover:bg-linear-border-subtle rounded-linear"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAdSet}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-linear"
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
