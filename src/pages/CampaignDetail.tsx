import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, DollarSign, TrendingUp, Users, Target, Edit2, Trash2, FileText, X, Link2 } from 'lucide-react';
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

          return {
            ...adSet,
            content_count: count,
          };
        })
      );

      setAdSets(adSetsWithContent);

      let totalSpend = 0;
      let totalRevenue = 0;
      const creatorMap = new Map<string, CreatorWithRevenue>();

      adSetsData.forEach(adSet => {
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

  const handleDeleteAdSet = async (adSetId: string) => {
    if (!confirm('Are you sure you want to remove this ad set?')) return;

    const { error } = await supabase
      .from('ad_sets')
      .delete()
      .eq('id', adSetId)
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('Error deleting ad set:', error);
      alert('Failed to delete ad set');
      return;
    }

    loadCampaignData();
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

    const { data: directData, error: directError } = await supabase
      .from('content_media')
      .select('*')
      .eq('ad_set_id', adSetId)
      .order('created_at', { ascending: false });

    if (directError) {
      console.error('Error loading direct content:', directError);
    }

    if (directData && directData.length > 0) {
      setSelectedContent(directData);
      setLoadingContent(false);
      return;
    }

    const { data: fallbackData, error: fallbackError } = await supabase
      .from('content_media')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (fallbackError) {
      console.error('Error loading fallback content:', fallbackError);
    } else {
      setSelectedContent(fallbackData || []);
    }

    setLoadingContent(false);
  };


  if (loading) {
    return (
      <div className="text-nuum-text-secondary">Loading campaign...</div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-nuum-text-secondary">Campaign not found</div>
    );
  }

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
          onLinked={() => {
            loadCampaignData();
          }}
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
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-nuum-text-primary">Content</h2>
              <button
                onClick={() => setShowContentModal(false)}
                className="p-2 rounded-lg transition-all duration-150 text-nuum-text-secondary hover:bg-nuum-border hover:text-nuum-text-primary"
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
                  <div key={content.id} className="bg-nuum-background rounded-lg p-3 border border-nuum-border hover:border-nuum-accent-blue/50 transition-all">
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
          className="flex items-center gap-2 text-sm text-nuum-text-secondary hover:text-nuum-text-primary transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </button>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-semibold text-nuum-text-primary">{campaign.name}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full ${getStatusBadgeClasses(campaign.status)}`}>
                {campaign.status}
              </span>
            </div>
            <p className="text-sm text-nuum-text-secondary">
              Created on {new Date(campaign.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-nuum-surface border border-nuum-border rounded-xl p-6 hover:border-nuum-accent-red/40 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-nuum-dark-red rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-nuum-accent-red" />
              </div>
            </div>
            <div className="text-xs text-nuum-text-secondary mb-1">Total Spend</div>
            <div className="text-2xl font-semibold text-nuum-text-primary">€{metrics.totalSpend.toLocaleString()}</div>
          </div>

          <div className="bg-nuum-surface border border-nuum-border rounded-xl p-6 hover:border-nuum-accent-green/40 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-nuum-dark-green rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-nuum-accent-green" />
              </div>
            </div>
            <div className="text-xs text-nuum-text-secondary mb-1">Total Revenue</div>
            <div className="text-2xl font-semibold text-nuum-accent-green">€{metrics.totalRevenue.toLocaleString()}</div>
          </div>

          <div className="bg-nuum-surface border border-nuum-border rounded-xl p-6 hover:border-nuum-accent-blue/40 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-nuum-dark-blue rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-nuum-accent-blue" />
              </div>
            </div>
            <div className="text-xs text-nuum-text-secondary mb-1">ROI</div>
            <div className={`text-2xl font-semibold ${metrics.roi >= 0 ? 'text-nuum-accent-green' : 'text-nuum-accent-red'}`}>
              {Math.round(metrics.roi)}%
            </div>
          </div>

          <div className="bg-nuum-surface border border-nuum-border rounded-xl p-6 hover:border-nuum-accent-orange/40 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-nuum-accent-brown rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-nuum-accent-orange" />
              </div>
            </div>
            <div className="text-xs text-nuum-text-secondary mb-1">Creators</div>
            <div className="text-2xl font-semibold text-nuum-text-primary">{metrics.totalCreators}</div>
          </div>
        </div>

        <div className="bg-nuum-surface border border-nuum-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-nuum-accent-blue" />
              <h2 className="text-lg font-semibold text-nuum-text-primary">Ad Sets (Meta)</h2>
            </div>
            <button
              onClick={handleAddAdSet}
              className="flex items-center gap-2 px-4 py-2 bg-nuum-accent-blue hover:bg-nuum-accent-blue/90 text-white rounded-lg transition-all duration-200 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Ad Set
            </button>
          </div>

          {adSets.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-nuum-text-secondary mx-auto mb-3 opacity-50" />
              <p className="text-nuum-text-secondary mb-4">No ad sets yet</p>
              <button
                onClick={handleAddAdSet}
                className="px-4 py-2 bg-nuum-accent-blue hover:bg-nuum-accent-blue/90 text-white rounded-lg transition-all duration-200 text-sm"
              >
                Create your first ad set
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-nuum-border">
                    <th className="text-left py-3 px-3 text-xs font-medium text-nuum-text-secondary">Name</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-nuum-text-secondary">Status</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-nuum-text-secondary">Platform</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-nuum-text-secondary">Creator</th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-nuum-text-secondary">Spend</th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-nuum-text-secondary">Revenue</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-nuum-text-secondary">Duration</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-nuum-text-secondary">Deal Type</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-nuum-text-secondary">Content</th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-nuum-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adSets.map((adSet) => {
                    const spend = Number(adSet.spend) || 0;
                    const revenue = Number(adSet.revenue) || 0;
                    const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
                    const creator = adSet.creators as Creator | null;
                    const contentCount = adSet.content_count || 0;

                    return (
                      <tr key={adSet.id} className="border-b border-nuum-border hover:bg-nuum-background transition-all duration-200">
                        <td className="py-3 px-3 text-sm text-nuum-text-primary">{adSet.name}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClasses(adSet.status)}`}>
                            {adSet.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-sm text-nuum-text-secondary capitalize">{adSet.platform}</td>
                        <td className="py-3 px-3 text-sm text-nuum-text-secondary">
                          {creator ? creator.name : '—'}
                        </td>
                        <td className="py-3 px-3 text-sm text-right text-nuum-text-primary">€{spend.toLocaleString()}</td>
                        <td className="py-3 px-3 text-sm text-right text-nuum-accent-green">€{revenue.toLocaleString()}</td>
                        <td className="py-3 px-3 text-xs text-nuum-text-secondary whitespace-nowrap">
                          {formatDuration(adSet.ad_duration_days)}
                        </td>
                        <td className="py-3 px-3">
                          {adSet.deal_type && (
                            <span className={`inline-block text-xs px-2 py-0.5 rounded-full capitalize ${getDealTypeBadge(adSet.deal_type)}`}>
                              {adSet.deal_type}
                            </span>
                          )}
                          {!adSet.deal_type && <span className="text-nuum-text-secondary text-xs">—</span>}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => {
                              console.log('[CampaignDetail] Opening LinkContentModal with:', {
                                adSetId: adSet.id,
                                adSetName: adSet.name,
                                creatorId: adSet.creator_id,
                                creatorName: creator?.name,
                                campaignId: adSet.campaign_id,
                                platform: adSet.platform,
                                workspaceId: workspaceId
                              });
                              setLinkContentAdSet(adSet);
                              setShowLinkContentModal(true);
                            }}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-nuum-dark-blue text-nuum-accent-blue rounded-lg hover:bg-nuum-accent-blue/20 transition-all"
                          >
                            {contentCount > 0 ? (
                              <>
                                <FileText className="w-3 h-3" />
                                {contentCount} {contentCount === 1 ? 'item' : 'items'}
                              </>
                            ) : (
                              <>
                                <Link2 className="w-3 h-3" />
                                Link Content
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditAdSet(adSet)}
                              className="p-1.5 hover:bg-nuum-accent-brown rounded-lg transition-all duration-200 text-nuum-text-secondary hover:text-nuum-accent-orange"
                              title="Edit ad set"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAdSet(adSet.id)}
                              className="p-1.5 hover:bg-nuum-dark-red rounded-lg transition-all duration-200 text-nuum-text-secondary hover:text-nuum-accent-red"
                              title="Delete ad set"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {creators.length > 0 && (
          <div className="bg-nuum-surface border border-nuum-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-nuum-accent-blue" />
              <h2 className="text-lg font-semibold text-nuum-text-primary">Linked Creators</h2>
            </div>
            <div className="space-y-3">
              {creators.slice(0, 5).map((creator) => (
                <div key={creator.id} className="flex items-center justify-between py-2 hover:bg-nuum-background rounded-lg px-3 -mx-3 transition-all duration-200">
                  <div>
                    <div className="text-sm font-medium text-nuum-text-primary">{creator.name}</div>
                    <div className="text-xs text-nuum-text-secondary">{creator.ad_sets_count} ad set{creator.ad_sets_count !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="text-sm font-semibold text-nuum-accent-green">
                    €{creator.total_revenue.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
