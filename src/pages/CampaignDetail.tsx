import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Edit2,
  Trash2,
  FileText,
  X,
  Link2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AdSetFormModal } from '../components/campaigns/AdSetFormModal';
import { LinkContentModal } from '../components/modals/LinkContentModal';
import type { Database } from '../lib/database.types';

type Campaign = Database['public']['Tables']['campaigns']['Row'];
type AdSet = Database['public']['Tables']['ad_sets']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];
type ContentMedia = Database['public']['Tables']['content_media']['Row'];

interface CampaignDetailProps {
  campaignId: string;
  workspaceId: string;
  onBack: () => void;
}

interface CreatorWithRevenue extends Creator {
  total_revenue: number;
  ad_sets_count: number;
}

interface AdSetWithContent extends AdSet {
  creators: Creator | null;
  content_count?: number;
}

const getStatusBadgeClasses = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-nuum-dark-green text-nuum-accent-green';
    case 'draft':
      return 'bg-gray-700 text-gray-300';
    case 'completed':
      return 'bg-nuum-dark-blue text-nuum-accent-blue';
    case 'paused':
      return 'bg-yellow-900/30 text-yellow-500';
    case 'archived':
      return 'bg-gray-800 text-gray-400';
    default:
      return 'bg-gray-700 text-gray-300';
  }
};

const getDealTypeBadge = (dealType: string | null) => {
  if (!dealType) return null;
  const badges = {
    spark: 'bg-nuum-dark-blue text-nuum-accent-blue',
    barter: 'bg-nuum-dark-green text-nuum-accent-green',
    gifting: 'bg-nuum-accent-brown text-nuum-accent-orange',
  };
  return badges[dealType as keyof typeof badges] || 'bg-gray-700 text-gray-300';
};

const formatDuration = (durationDays: number | null) => {
  if (!durationDays) return '—';
  return `${durationDays} days`;
};

export function CampaignDetail({ campaignId, workspaceId, onBack }: CampaignDetailProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [adSets, setAdSets] = useState<AdSetWithContent[]>([]);
  const [creators, setCreators] = useState<CreatorWithRevenue[]>([]);
  const [showAdSetModal, setShowAdSetModal] = useState(false);
  const [selectedAdSet, setSelectedAdSet] = useState<AdSet | null>(null);
  const [showLinkContentModal, setShowLinkContentModal] = useState(false);
  const [linkContentAdSet, setLinkContentAdSet] = useState<AdSetWithContent | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentMedia[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [adSetToDelete, setAdSetToDelete] = useState<AdSet | null>(null);

  const [metrics, setMetrics] = useState({
    totalSpend: 0,
    totalRevenue: 0,
    roi: 0,
    totalCreators: 0,
  });

  useEffect(() => {
    loadCampaignData();
  }, [campaignId, workspaceId]);

  const loadCampaignData = async () => {
    setLoading(true);

    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (campaignError) {
      console.error('Error loading campaign:', campaignError);
      setLoading(false);
      return;
    }

    if (!campaignData) {
      console.error('Campaign not found');
      setLoading(false);
      return;
    }

    setCampaign(campaignData);

    const { data: adSetsData, error: adSetsError } = await supabase
      .from('ad_sets')
      .select('*, creators(*)')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (adSetsError) {
      console.error('Error loading ad sets:', adSetsError);
    } else if (adSetsData) {
      const adSetsWithContent = await Promise.all(
        adSetsData.map(async (adSet) => {
          const { count: directCount } = await supabase
            .from('content_media')
            .select('*', { count: 'exact', head: true })
            .eq('ad_set_id', adSet.id);

          let count = directCount || 0;

          if (count === 0) {
            const { count: fallbackCount } = await supabase
              .from('content_media')
              .select('*', { count: 'exact', head: true })
              .eq('creator_id', adSet.creator_id)
              .eq('campaign_id', campaignId);

            count = fallbackCount || 0;
          }

          return { ...adSet, content_count: count };
        })
      );

      setAdSets(adSetsWithContent);

      let totalSpend = 0;
      let totalRevenue = 0;
      const creatorMap = new Map<string, CreatorWithRevenue>();

      adSetsData.forEach((adSet) => {
        const spend = Number(adSet.spend) || 0;
        const revenue = Number(adSet.revenue) || 0;
        totalSpend += spend;
        totalRevenue += revenue;

        if (adSet.creator_id && adSet.creators) {
          const existing = creatorMap.get(adSet.creator_id);
          if (existing) {
            existing.total_revenue += revenue;
            existing.ad_sets_count += 1;
          } else {
            creatorMap.set(adSet.creator_id, {
              ...(adSet.creators as Creator),
              total_revenue: revenue,
              ad_sets_count: 1,
            });
          }
        }
      });

      const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
      setMetrics({
        totalSpend,
        totalRevenue,
        roi,
        totalCreators: creatorMap.size,
      });

      setCreators(Array.from(creatorMap.values()).sort((a, b) => b.total_revenue - a.total_revenue));
    }

    setLoading(false);
  };

  const handleAddAdSet = () => {
    setSelectedAdSet(null);
    setShowAdSetModal(true);
  };

  const handleEditAdSet = (adSet: AdSet) => {
    setSelectedAdSet(adSet);
    setShowAdSetModal(true);
  };

  // ✅ Vereenvoudigd: delete alleen op ID, daarna reload
  const handleDeleteAdSet = async () => {
    if (!adSetToDelete) return;
    try {
      const { error } = await supabase.from('ad_sets').delete().eq('id', adSetToDelete.id);
      if (error) {
        console.error('Delete error:', error);
        alert('Failed to delete ad set.');
        return;
      }
      setShowDeleteConfirm(false);
      setAdSetToDelete(null);
      await loadCampaignData(); // vernieuw lijst
    } catch (err) {
      console.error('Unexpected delete error:', err);
      alert('Unexpected error while deleting ad set.');
    }
  };

  const handleCloseAdSetModal = () => {
    setShowAdSetModal(false);
    setSelectedAdSet(null);
  };

  const handleSaveAdSet = () => {
    loadCampaignData();
  };

  const handleViewContent = async (adSetId: string, creatorId: string) => {
    setLoadingContent(true);
    setShowContentModal(true);

    const { data: directData } = await supabase
      .from('content_media')
      .select('*')
      .eq('ad_set_id', adSetId)
      .order('created_at', { ascending: false });

    if (directData && directData.length > 0) {
      setSelectedContent(directData);
      setLoadingContent(false);
      return;
    }

    const { data: fallbackData } = await supabase
      .from('content_media')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    setSelectedContent(fallbackData || []);
    setLoadingContent(false);
  };

  if (loading) return <div className="text-nuum-text-secondary">Loading campaign...</div>;
  if (!campaign) return <div className="text-nuum-text-secondary">Campaign not found</div>;

  return (
    <>
      {showAdSetModal && (
        <AdSetFormModal
          campaignId={campaignId}
          workspaceId={workspaceId}
          adSet={selectedAdSet}
          onClose={handleCloseAdSetModal}
          onSave={handleSaveAdSet}
        />
      )}

      {showLinkContentModal && linkContentAdSet && (
        <LinkContentModal
          isOpen={showLinkContentModal}
          onClose={() => {
            setShowLinkContentModal(false);
            setLinkContentAdSet(null);
          }}
          adSetId={linkContentAdSet.id}
          adSetName={linkContentAdSet.name}
          campaignId={linkContentAdSet.campaign_id}
          creatorId={linkContentAdSet.creator_id}
          platform={linkContentAdSet.platform}
          workspaceId={workspaceId}
          onLinked={() => loadCampaignData()}
        />
      )}

      {showContentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)' }}
          onClick={() => setShowContentModal(false)}
        >
          <div
            className="w-full max-w-4xl bg-nuum-surface border border-nuum-border rounded-xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-nuum-text-primary">Content</h2>
              <button
                onClick={() => setShowContentModal(false)}
                className="p-2 rounded-lg text-nuum-text-secondary hover:bg-nuum-border hover:text-nuum-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingContent ? (
              <div className="text-center py-12 text-nuum-text-secondary">Loading content...</div>
            ) : selectedContent.length === 0 ? (
              <div className="text-center py-12 text-nuum-text-secondary">No content found</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedContent.map((content) => (
                  <div
                    key={content.id}
                    className="bg-nuum-background rounded-lg p-3 border border-nuum-border hover:border-nuum-accent-blue/50 transition-all"
                  >
                    {content.thumbnail_url && (
                      <img
                        src={content.thumbnail_url}
                        alt={content.title || content.file_name}
                        className="w-full h-32 object-cover rounded-lg mb-2"
                      />
                    )}
                    <div className="text-sm text-nuum-text-primary font-medium truncate">
                      {content.title || content.file_name}
                    </div>
                    <div className="text-xs text-nuum-text-secondary mt-1">
                      {content.platform && <span className="capitalize">{content.platform}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-nuum-text-secondary hover:text-nuum-text-primary transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </button>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-semibold text-nuum-text-primary">{campaign.name}</h1>
              <span
                className={`text-xs px-2.5 py-1 rounded-full ${getStatusBadgeClasses(campaign.status)}`}
              >
                {campaign.status}
              </span>
            </div>
            <p className="text-sm text-nuum-text-secondary">
              Created on{' '}
              {new Date(campaign.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* ✅ Ad Sets Table */}
        <div className="bg-nuum-surface border border-nuum-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-nuum-accent-blue" />
              <h2 className="text-lg font-semibold text-nuum-text-primary">Ad Sets</h2>
            </div>
            <button
              onClick={handleAddAdSet}
              className="flex items-center gap-2 px-4 py-2 bg-nuum-accent-blue hover:bg-nuum-accent-blue/90 text-white rounded-lg text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Ad Set
            </button>
          </div>

          {adSets.length === 0 ? (
            <div className="text-center py-12 text-nuum-text-secondary">No ad sets yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-nuum-border">
                    <th className="py-3 px-3 text-left text-xs text-nuum-text-secondary">Name</th>
                    <th className="py-3 px-3 text-left text-xs text-nuum-text-secondary">Status</th>
                    <th className="py-3 px-3 text-left text-xs text-nuum-text-secondary">Platform</th>
                    <th className="py-3 px-3 text-left text-xs text-nuum-text-secondary">Creator</th>
                    <th className="py-3 px-3 text-right text-xs text-nuum-text-secondary">Spend</th>
                    <th className="py-3 px-3 text-right text-xs text-nuum-text-secondary">Revenue</th>
                    <th className="py-3 px-3 text-right text-xs text-nuum-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adSets.map((adSet) => (
                    <tr key={adSet.id} className="border-b border-nuum-border hover:bg-nuum-background">
                      <td className="py-3 px-3 text-sm text-nuum-text-primary">{adSet.name}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClasses(
                            adSet.status
                          )}`}
                        >
                          {adSet.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm text-nuum-text-secondary capitalize">
                        {adSet.platform}
                      </td>
                      <td className="py-3 px-3 text-sm text-nuum-text-secondary">
                        {adSet.creators ? adSet.creators.name : '—'}
                      </td>
                      <td className="py-3 px-3 text-sm text-right text-nuum-text-primary">
                        €{(adSet.spend || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-sm text-right text-nuum-accent-green">
                        €{(adSet.revenue || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditAdSet(adSet)}
                            className="p-1.5 hover:bg-nuum-accent-brown rounded-lg text-nuum-text-secondary hover:text-nuum-accent-orange transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setAdSetToDelete(adSet);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-1.5 hover:bg-nuum-dark-red rounded-lg text-nuum-text-secondary hover:text-nuum-accent-red transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Delete confirm modal */}
      {showDeleteConfirm && adSetToDelete && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-nuum-surface border border-nuum-border rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-nuum-text-primary mb-4">Delete Ad Set</h3>
            <p className="text-nuum-text-secondary mb-6">
              Are you sure you want to delete{' '}
              <span className="font-medium text-nuum-text-primary">{adSetToDelete.name}</span>? This
              action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-nuum-border rounded-lg text-nuum-text-secondary hover:bg-nuum-border/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAdSet}
                className="flex-1 px-4 py-2 bg-nuum-accent-red hover:bg-nuum-accent-red/90 text-white rounded-lg transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
