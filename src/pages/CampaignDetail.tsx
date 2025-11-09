import { useState, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { AdSetFormModal } from '../components/campaigns/AdSetFormModal';
import type { Database } from '../lib/database.types';

type Campaign = Database['public']['Tables']['campaigns']['Row'];
type AdSet = Database['public']['Tables']['ad_sets']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];
type Content = Database['public']['Tables']['content_media']['Row'];

interface CampaignDetailProps {
  campaignId: string;
  workspaceId: string;
  onBack: () => void;
}

interface CreatorWithRevenue extends Creator {
  total_revenue: number;
  ad_sets_count: number;
}

export function CampaignDetail({ campaignId, workspaceId, onBack }: CampaignDetailProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [creators, setCreators] = useState<CreatorWithRevenue[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [showAdSetModal, setShowAdSetModal] = useState(false);
  const [selectedAdSet, setSelectedAdSet] = useState<AdSet | null>(null);

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
      .single();

    if (campaignError) {
      console.error('Error loading campaign:', campaignError);
      setLoading(false);
      return;
    }

    setCampaign(campaignData);

    const { data: adSetsData, error: adSetsError } = await supabase
      .from('ad_sets')
      .select('*, creators(*)')
      .eq('campaign_id', campaignId)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (adSetsError) {
      console.error('Error loading ad sets:', adSetsError);
    } else if (adSetsData) {
      setAdSets(adSetsData);

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

    const { data: contentData, error: contentError } = await supabase
      .from('content_media')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('uploaded_at', { ascending: false })
      .limit(6);

    if (contentError) {
      console.error('Error loading content:', contentError);
    } else {
      setContent(contentData || []);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-linear-success bg-linear-success/10 border-linear-success-border/20';
      case 'completed':
        return 'text-linear-info bg-linear-info/10 border-linear-info-border/20';
      case 'paused':
        return 'text-linear-warning bg-linear-warning/10 border-linear-warning-border/20';
      default:
        return 'text-text-tertiary bg-text-tertiary/10 border-linear-border/20';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-text-secondary">Loading campaign...</div>
      </DashboardLayout>
    );
  }

  if (!campaign) {
    return (
      <DashboardLayout>
        <div className="text-text-secondary">Campaign not found</div>
      </DashboardLayout>
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

      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary linear-transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Campaigns
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-semibold">{campaign.name}</h1>
                <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>
              <p className="text-sm text-text-secondary">
                Created on {new Date(campaign.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-linear-bg-secondary border border-linear-border-subtle rounded-xl p-6">
                <h2 className="text-sm font-semibold text-text-primary mb-4">Campaign Overview</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-text-tertiary block mb-1">Spend</span>
                    <span className="text-base font-medium">€{metrics.totalSpend.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-sm text-text-tertiary block mb-1">Revenue</span>
                    <span className="text-base font-medium text-linear-success">€{metrics.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-sm text-text-tertiary block mb-1">ROI</span>
                    <span className={`text-base font-medium ${metrics.roi >= 0 ? 'text-linear-success' : 'text-linear-error'}`}>
                      {metrics.roi > 0 ? '+' : ''}{Math.round(metrics.roi)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-text-tertiary block mb-1">Total Creators</span>
                    <span className="text-base font-medium">{metrics.totalCreators}</span>
                  </div>
                </div>
              </div>

              <div className="bg-linear-bg-secondary border border-linear-border-subtle rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-text-primary">Ad Sets (Meta)</h2>
                  <button
                    onClick={handleAddAdSet}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white hover:bg-gray-100 text-black rounded-lg linear-transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add Ad Set
                  </button>
                </div>

                {adSets.length === 0 ? (
                  <p className="text-sm text-text-tertiary">No ad sets yet. Click "Add Ad Set" to get started.</p>
                ) : (
                  <div className="space-y-3">
                    {adSets.map((adSet) => {
                      const spend = Number(adSet.spend) || 0;
                      const revenue = Number(adSet.revenue) || 0;
                      const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;

                      return (
                        <div
                          key={adSet.id}
                          className="bg-linear-bg-subtle border border-linear-border-subtle rounded-lg p-4 hover:border-linear-border linear-transition"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-medium text-sm mb-1">{adSet.name}</h3>
                              <span className="text-xs text-text-tertiary">Platform: Meta</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(adSet.status)}`}>
                              {adSet.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                            <div>
                              <span className="text-text-tertiary block mb-1">Spend</span>
                              <span className="font-medium">€{spend.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-text-tertiary block mb-1">Revenue</span>
                              <span className="font-medium text-linear-success">€{revenue.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-text-tertiary block mb-1">ROI</span>
                              <span className={`font-medium ${roi >= 0 ? 'text-linear-success' : 'text-linear-error'}`}>
                                {roi > 0 ? '+' : ''}{Math.round(roi)}%
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-3 border-t border-linear-border-subtle">
                            <button
                              onClick={() => handleEditAdSet(adSet)}
                              className="flex-1 px-3 py-1.5 text-xs bg-linear-bg hover:bg-linear-bg-subtle rounded-lg linear-transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAdSet(adSet.id)}
                              className="px-3 py-1.5 text-xs text-linear-error hover:bg-linear-error/10 rounded-lg linear-transition"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-linear-bg-secondary border border-linear-border-subtle rounded-xl p-6">
                <h2 className="text-sm font-semibold text-text-primary mb-4">Linked Creators</h2>
                {creators.length === 0 ? (
                  <p className="text-sm text-text-tertiary">No creators linked yet</p>
                ) : (
                  <div className="space-y-3">
                    {creators.slice(0, 5).map((creator) => (
                      <div key={creator.id} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{creator.name}</div>
                          <div className="text-xs text-text-tertiary">
                            {creator.ad_sets_count} ad {creator.ad_sets_count === 1 ? 'set' : 'sets'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-linear-success">
                            €{creator.total_revenue.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-linear-bg-secondary border border-linear-border-subtle rounded-xl p-6">
                <h2 className="text-sm font-semibold text-text-primary mb-4">Recent Content</h2>
                {content.length === 0 ? (
                  <p className="text-sm text-text-tertiary">No content uploaded yet</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {content.map((item) => (
                      <div
                        key={item.id}
                        className="aspect-square rounded-lg overflow-hidden bg-linear-bg-subtle border border-linear-border-subtle"
                      >
                        {item.media_url && (
                          <img
                            src={item.media_url}
                            alt={item.title || 'Content'}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
