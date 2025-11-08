import { useState, useEffect } from 'react';
import { X, Download, Edit2, Users, DollarSign, TrendingUp, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../Card';
import { Button } from '../Button';
import { NUUM_COLORS, TYPOGRAPHY, getStatusColorClass } from '../../utils/designSystem';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AdSetsCard } from '../campaigns/AdSetsCard';
import { AdSetFormModal } from '../campaigns/AdSetFormModal';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];
type Content = Database['public']['Tables']['content_media']['Row'];
type AdSet = Database['public']['Tables']['ad_sets']['Row'];

interface CampaignWithMetrics extends Campaign {
  total_spend: number;
  total_revenue: number;
  roi: number;
  creators_count: number;
  content_count: number;
}

interface CampaignDetailModalProps {
  campaign: CampaignWithMetrics;
  workspace: Workspace;
  onClose: () => void;
  onUpdate: () => void;
}

interface CreatorPerformance {
  creator: Creator;
  total_revenue: number;
  total_spend: number;
  roi: number;
  ad_sets_count: number;
}

export function CampaignDetailModal({ campaign, workspace, onClose, onUpdate }: CampaignDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<CreatorPerformance[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showAdSetModal, setShowAdSetModal] = useState(false);
  const [selectedAdSet, setSelectedAdSet] = useState<AdSet | null>(null);

  useEffect(() => {
    loadCampaignDetails();
  }, [campaign.id]);

  const loadCampaignDetails = async () => {
    setLoading(true);

    const { data: adSetsData } = await supabase
      .from('ad_sets')
      .select('*, creators(*)')
      .eq('campaign_id', campaign.id)
      .order('created_at', { ascending: true });

    const { data: contentData } = await supabase
      .from('content_media')
      .select('*, creators(name)')
      .eq('campaign_id', campaign.id)
      .order('uploaded_at', { ascending: false });

    if (adSetsData) {
      setAdSets(adSetsData);

      const creatorMap = new Map<string, CreatorPerformance>();

      adSetsData.forEach(ad => {
        if (!ad.creator_id || !ad.creators) return;

        const existing = creatorMap.get(ad.creator_id);
        const spend = Number(ad.spend) || 0;
        const revenue = Number(ad.revenue) || 0;

        if (existing) {
          existing.total_spend += spend;
          existing.total_revenue += revenue;
          existing.ad_sets_count += 1;
        } else {
          creatorMap.set(ad.creator_id, {
            creator: ad.creators as Creator,
            total_spend: spend,
            total_revenue: revenue,
            roi: 0,
            ad_sets_count: 1,
          });
        }
      });

      const performanceList = Array.from(creatorMap.values()).map(perf => ({
        ...perf,
        roi: perf.total_spend > 0 ? ((perf.total_revenue - perf.total_spend) / perf.total_spend) * 100 : 0,
      })).sort((a, b) => b.total_revenue - a.total_revenue);

      setCreators(performanceList);

      const groupedByDate = adSetsData.reduce((acc, ad) => {
        const date = new Date(ad.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!acc[date]) {
          acc[date] = { date, spend: 0, revenue: 0 };
        }
        acc[date].spend += Number(ad.spend) || 0;
        acc[date].revenue += Number(ad.revenue) || 0;
        return acc;
      }, {} as Record<string, any>);

      setChartData(Object.values(groupedByDate).slice(-10));
    }

    if (contentData) {
      setContent(contentData);
    }

    setLoading(false);
  };

  const activeCreators = creators.filter(c => c.ad_sets_count > 0).length;

  const handleAddAdSet = () => {
    setSelectedAdSet(null);
    setShowAdSetModal(true);
  };

  const handleEditAdSet = (adSet: AdSet) => {
    setSelectedAdSet(adSet);
    setShowAdSetModal(true);
  };

  const handleCloseAdSetModal = () => {
    setShowAdSetModal(false);
    setSelectedAdSet(null);
  };

  const handleSaveAdSet = () => {
    loadCampaignDetails();
  };

  return (
    <>
      {showAdSetModal && (
        <AdSetFormModal
          campaignId={campaign.id}
          workspaceId={workspace.id}
          adSet={selectedAdSet}
          onClose={handleCloseAdSetModal}
          onSave={handleSaveAdSet}
        />
      )}
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl rounded-xl border p-6 my-8 animate-fade-in-up"
        style={{
          backgroundColor: NUUM_COLORS.surface,
          borderColor: NUUM_COLORS.border,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-semibold" style={{ color: NUUM_COLORS.textPrimary }}>
                {campaign.name}
              </h2>
              <span className={getStatusColorClass(campaign.status)}>
                {campaign.status}
              </span>
            </div>
            <p className={TYPOGRAPHY.bodyText} style={{ color: NUUM_COLORS.textSecondary }}>
              Created {new Date(campaign.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="secondary" size="sm">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-all duration-150"
              style={{ color: NUUM_COLORS.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = NUUM_COLORS.surfaceHover;
                e.currentTarget.style.color = NUUM_COLORS.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = NUUM_COLORS.textSecondary;
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center" style={{ color: NUUM_COLORS.textSecondary }}>
            Loading campaign details...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-6">
              <Card>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(231, 76, 60, 0.1)' }}>
                    <DollarSign className="w-5 h-5" style={{ color: 'rgba(231, 76, 60, 0.8)' }} />
                  </div>
                  <span className={TYPOGRAPHY.sectionHeader} style={{ color: NUUM_COLORS.textSecondary }}>Total Spend</span>
                </div>
                <div className="text-2xl font-semibold" style={{ color: NUUM_COLORS.textPrimary }}>
                  €{campaign.total_spend.toLocaleString()}
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(56, 226, 159, 0.1)' }}>
                    <TrendingUp className="w-5 h-5" style={{ color: 'rgba(56, 226, 159, 0.8)' }} />
                  </div>
                  <span className={TYPOGRAPHY.sectionHeader} style={{ color: NUUM_COLORS.textSecondary }}>Total Revenue</span>
                </div>
                <div className="text-2xl font-semibold" style={{ color: NUUM_COLORS.textPrimary }}>
                  €{campaign.total_revenue.toLocaleString()}
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(42, 83, 208, 0.1)' }}>
                    <TrendingUp className="w-5 h-5" style={{ color: NUUM_COLORS.accent }} />
                  </div>
                  <span className={TYPOGRAPHY.sectionHeader} style={{ color: NUUM_COLORS.textSecondary }}>ROI</span>
                </div>
                <div className="text-2xl font-semibold" style={{ color: campaign.roi >= 0 ? 'rgba(56, 226, 159, 0.9)' : 'rgba(231, 76, 60, 0.9)' }}>
                  {campaign.roi.toFixed(1)}%
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(42, 83, 208, 0.1)' }}>
                    <Users className="w-5 h-5" style={{ color: NUUM_COLORS.accent }} />
                  </div>
                  <span className={TYPOGRAPHY.sectionHeader} style={{ color: NUUM_COLORS.textSecondary }}>Active Creators</span>
                </div>
                <div className="text-2xl font-semibold" style={{ color: NUUM_COLORS.textPrimary }}>
                  {activeCreators}
                </div>
              </Card>
            </div>

            {chartData.length > 0 && (
              <Card>
                <h3 className={`${TYPOGRAPHY.sectionHeader} mb-4`} style={{ color: NUUM_COLORS.textSecondary }}>
                  Spend vs Revenue
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#666" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#666" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: NUUM_COLORS.surface,
                        border: `1px solid ${NUUM_COLORS.border}`,
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="rgba(56, 226, 159, 0.7)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="spend"
                      name="Spend"
                      stroke="rgba(231, 76, 60, 0.6)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className={`${TYPOGRAPHY.sectionHeader} mb-4`} style={{ color: NUUM_COLORS.textSecondary }}>
                  Creator Performance
                </h3>
                {creators.length === 0 ? (
                  <p className={TYPOGRAPHY.bodyText} style={{ color: NUUM_COLORS.textMuted }}>
                    No creators linked to this campaign yet
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {creators.map(({ creator, total_revenue, roi, ad_sets_count }) => (
                      <div
                        key={creator.id}
                        className="flex items-center justify-between p-3 rounded-lg transition-all duration-150"
                        style={{ backgroundColor: NUUM_COLORS.background }}
                      >
                        <div className="flex-1">
                          <div className="font-medium" style={{ color: NUUM_COLORS.textPrimary }}>
                            {creator.name}
                          </div>
                          <div className={TYPOGRAPHY.metadata} style={{ color: NUUM_COLORS.textMuted }}>
                            {ad_sets_count} ad {ad_sets_count === 1 ? 'set' : 'sets'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium" style={{ color: 'rgba(56, 226, 159, 0.9)' }}>
                            €{total_revenue.toLocaleString()}
                          </div>
                          <div className={TYPOGRAPHY.metadata} style={{ color: roi >= 0 ? 'rgba(56, 226, 159, 0.7)' : 'rgba(231, 76, 60, 0.7)' }}>
                            {roi.toFixed(1)}% ROI
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <AdSetsCard
                adSets={adSets}
                onAddAdSet={handleAddAdSet}
                onEditAdSet={handleEditAdSet}
              />
            </div>

            <Card>
              <h3 className={`${TYPOGRAPHY.sectionHeader} mb-4`} style={{ color: NUUM_COLORS.textSecondary }}>
                Content Overview
              </h3>
              {content.length === 0 ? (
                <p className={TYPOGRAPHY.bodyText} style={{ color: NUUM_COLORS.textMuted }}>
                  No content uploaded yet
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {content.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all duration-150"
                        style={{ backgroundColor: NUUM_COLORS.background, borderColor: '#1C1C1C' }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.accent}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1C1C1C'}
                      >
                        {item.media_url ? (
                          <img src={item.media_url} alt={item.title || 'Content'} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-8 h-8" style={{ color: NUUM_COLORS.textMuted }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {content.length > 6 && (
                    <div className="text-center">
                      <span className={TYPOGRAPHY.metadata} style={{ color: NUUM_COLORS.textMuted }}>
                        +{content.length - 6} more items
                      </span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
