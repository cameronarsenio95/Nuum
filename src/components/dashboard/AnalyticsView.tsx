import { useState, useEffect, useRef, useMemo } from 'react';
import { Target, DollarSign, TrendingUp, BarChart3, Filter, Lightbulb, GitCompare, X, Download, Eye, Table2, Users, Zap } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];
type AdSet = Database['public']['Tables']['ad_sets']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];

interface CampaignWithMetrics extends Campaign {
  total_ad_sets: number;
  active_ad_sets: number;
  total_spend: number;
  total_revenue: number;
  roi: number;
}

interface AnalyticsViewProps {
  workspace: Workspace;
}

type TimeFilter = 'all' | '30d' | '7d';
type StatusFilter = 'all' | 'active' | 'completed' | 'draft' | 'archived';
type AnalyticsViewMode = 'visual' | 'data';

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, prefix = '', suffix = '', duration = 400 }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);
  const animationRef = useRef<number>();

  useEffect(() => {
    const startValue = previousValueRef.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeOutCubic;

      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValueRef.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  const formattedValue = prefix === '€'
    ? Math.round(displayValue).toLocaleString('nl-NL')
    : Math.round(displayValue).toString();

  return <>{prefix}{formattedValue}{suffix}</>;
};

export default function AnalyticsView({ workspace }: AnalyticsViewProps) {
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaignsWithMetrics, setCampaignsWithMetrics] = useState<CampaignWithMetrics[]>([]);
  const [adSetsData, setAdSetsData] = useState<AdSet[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<AnalyticsViewMode>('visual');
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareCampaignAId, setCompareCampaignAId] = useState<string | null>(null);
  const [compareCampaignBId, setCompareCampaignBId] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [workspace.id]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setFilterLoading(true);
    const timer = setTimeout(() => setFilterLoading(false), 300);
    return () => clearTimeout(timer);
  }, [timeFilter, statusFilter, viewMode]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [campaignsResult, adSetsResult, creatorsResult] = await Promise.all([
        supabase
          .from('campaigns')
          .select('*')
          .eq('workspace_id', workspace.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('ad_sets')
          .select('campaign_id, creator_id, platform, status, spend, revenue, created_at'),

        supabase
          .from('creators')
          .select('id, name, instagram_handle, tiktok_handle, youtube_handle, follower_count, engagement_rate, status, created_at')
          .eq('workspace_id', workspace.id)
      ]);

      if (campaignsResult.error) {
        console.error('Error loading campaigns:', campaignsResult.error);
        setError('Failed to load analytics data.');
        setLoading(false);
        return;
      }

      const campaignsData = campaignsResult.data || [];

      if (campaignsData.length === 0) {
        setCampaignsWithMetrics([]);
        setCreators(creatorsResult.data || []);
        setLoading(false);
        return;
      }

      const adSetsData = adSetsResult.data?.filter(ad =>
        campaignsData.some(c => c.id === ad.campaign_id)
      ) || [];

      if (adSetsResult.error) {
        console.error('Error loading ad sets:', adSetsResult.error);
      }

      const campaignsWithMetrics: CampaignWithMetrics[] = campaignsData.map(campaign => {
        const campaignAdSets = adSetsData.filter(ad => ad.campaign_id === campaign.id);

        const total_ad_sets = campaignAdSets.length;
        const active_ad_sets = campaignAdSets.filter(ad => ad.status === 'active').length;
        const total_spend = campaignAdSets.reduce((sum, ad) => sum + (Number(ad.spend) || 0), 0);
        const total_revenue = campaignAdSets.reduce((sum, ad) => sum + (Number(ad.revenue) || 0), 0);
        const roi = total_spend > 0 ? ((total_revenue - total_spend) / total_spend) * 100 : 0;

        return {
          ...campaign,
          total_ad_sets,
          active_ad_sets,
          total_spend,
          total_revenue,
          roi,
        };
      });

      setCampaignsWithMetrics(campaignsWithMetrics);
      setAdSetsData(adSetsData);
      setCreators(creatorsResult.data || []);
    } catch (err) {
      console.error('Unexpected error loading analytics:', err);
      setError('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (campaigns: CampaignWithMetrics[]): CampaignWithMetrics[] => {
    let filtered = [...campaigns];

    if (timeFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();

      if (timeFilter === '7d') {
        cutoff.setDate(now.getDate() - 7);
      } else if (timeFilter === '30d') {
        cutoff.setDate(now.getDate() - 30);
      }

      filtered = filtered.filter(campaign => {
        if (!campaign.created_at) {
          return timeFilter === 'all';
        }
        const createdAt = new Date(campaign.created_at);
        return createdAt >= cutoff;
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(campaign =>
        campaign.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    return filtered;
  };

  const campaignsFiltered = useMemo(() => applyFilters(campaignsWithMetrics), [campaignsWithMetrics, timeFilter, statusFilter]);

  const totalSpend = campaignsFiltered.reduce((sum, c) => sum + c.total_spend, 0);
  const totalRevenue = campaignsFiltered.reduce((sum, c) => sum + c.total_revenue, 0);
  const campaignsWithSpend = campaignsFiltered.filter(c => c.total_spend > 0);
  const averageRoi = campaignsWithSpend.length > 0
    ? campaignsWithSpend.reduce((sum, c) => sum + c.roi, 0) / campaignsWithSpend.length
    : 0;
  const activeCampaigns = campaignsFiltered.filter(c => c.status === 'active').length;

  const chartData = campaignsFiltered
    .filter(c => c.total_spend > 0 || c.total_revenue > 0)
    .map(c => ({
      name: c.name,
      spend: c.total_spend,
      revenue: c.total_revenue,
      roi: c.roi,
    }));

  const topCampaignByRoi = campaignsFiltered.length > 0
    ? campaignsFiltered.reduce((prev, current) => (current.roi > prev.roi ? current : prev))
    : null;

  const topCampaignByRevenue = campaignsFiltered.length > 0
    ? campaignsFiltered.reduce((prev, current) => (current.total_revenue > prev.total_revenue ? current : prev))
    : null;

  const creatorRevenue = useMemo(() => {
    const revenueMap: Record<string, number> = {};

    const filteredCampaignIds = new Set(campaignsFiltered.map(c => c.id));

    adSetsData
      .filter(adSet => filteredCampaignIds.has(adSet.campaign_id))
      .forEach(adSet => {
        if (adSet.creator_id) {
          const creatorId = adSet.creator_id;
          const revenue = Number(adSet.revenue) || 0;
          revenueMap[creatorId] = (revenueMap[creatorId] || 0) + revenue;
        }
      });

    return revenueMap;
  }, [campaignsFiltered, adSetsData]);

  const topCreators = useMemo(() => {
    const activeCreators = creators.filter(c => c.status === 'active');

    if (activeCreators.length === 0) return [];

    return activeCreators
      .sort((a, b) => {
        const revA = creatorRevenue[a.id] || 0;
        const revB = creatorRevenue[b.id] || 0;

        if (revB !== revA) return revB - revA;

        if (a.engagement_rate && b.engagement_rate) {
          return b.engagement_rate - a.engagement_rate;
        }

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 5);
  }, [creators, creatorRevenue]);

  const getPrimaryPlatform = (creator: Creator): string | null => {
    if (creator.tiktok_handle) return 'TikTok';
    if (creator.instagram_handle) return 'Instagram';
    if (creator.youtube_handle) return 'YouTube';
    return null;
  };

  const formatFollowerCount = (followerCount: any): string | null => {
    if (!followerCount || typeof followerCount !== 'object') return null;

    const counts = followerCount as Record<string, number>;
    const total = Object.values(counts).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);

    if (total >= 1000000) {
      return `${(total / 1000000).toFixed(1)}M`;
    } else if (total >= 1000) {
      return `${(total / 1000).toFixed(1)}K`;
    }
    return total > 0 ? total.toString() : null;
  };

  const platformStats = useMemo(() => {
    const stats: Record<string, { count: number; revenue: number }> = {};

    const filteredCampaignIds = new Set(campaignsFiltered.map(c => c.id));

    const uniqueCreatorPlatforms = new Set<string>();

    adSetsData
      .filter(adSet => filteredCampaignIds.has(adSet.campaign_id))
      .forEach(adSet => {
        const platform = adSet.platform === 'META' ? 'Instagram' : adSet.platform;
        const revenue = Number(adSet.revenue) || 0;

        if (!stats[platform]) {
          stats[platform] = { count: 0, revenue: 0 };
        }

        stats[platform].revenue += revenue;

        if (adSet.creator_id) {
          const key = `${adSet.creator_id}-${platform}`;
          if (!uniqueCreatorPlatforms.has(key)) {
            uniqueCreatorPlatforms.add(key);
            stats[platform].count += 1;
          }
        }
      });

    const totalCount = Object.values(stats).reduce((sum, s) => sum + s.count, 0);

    return Object.entries(stats)
      .map(([platform, data]) => ({
        platform,
        count: data.count,
        revenue: data.revenue,
        percentage: totalCount > 0 ? Math.round((data.count / totalCount) * 100) : 0
      }))
      .sort((a, b) => b.revenue - a.revenue || b.count - a.count);
  }, [campaignsFiltered, adSetsData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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

  const getRoiColor = (roi: number) => {
    if (roi > 0) return 'text-linear-success';
    if (roi < 0) return 'text-linear-error';
    return 'dark:text-text-secondary light:text-text-light-secondary';
  };

  const handleExportCsv = () => {
    const headers = ['Campaign', 'Status', 'Ad Sets', 'Spend', 'Revenue', 'ROI', 'Last Updated'];
    const rows = campaignsFiltered.map(c => [
      c.name,
      c.status || 'draft',
      `${c.total_ad_sets} (${c.active_ad_sets} active)`,
      c.total_spend.toFixed(2),
      c.total_revenue.toFixed(2),
      `${Math.round(c.roi)}%`,
      c.updated_at ? new Date(c.updated_at).toLocaleDateString() : 'N/A'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'campaign-analytics.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const FilterButton = ({
    active,
    onClick,
    children
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-linear text-xs md:text-sm border linear-transition ${
        active
          ? 'dark:bg-linear-bg-subtle dark:border-linear-border dark:text-text-primary light:bg-linear-light-bg-subtle light:border-linear-light-border light:text-text-light-primary'
          : 'dark:bg-transparent dark:border-transparent dark:text-text-secondary dark:hover:bg-linear-bg-subtle/60 light:bg-transparent light:border-transparent light:text-text-light-secondary light:hover:bg-linear-light-bg-subtle/60'
      }`}
    >
      {children}
    </button>
  );

  const CompareModal = () => {
    const campaignA = campaignsFiltered.find(c => c.id === compareCampaignAId);
    const campaignB = campaignsFiltered.find(c => c.id === compareCampaignBId);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => {
            setIsCompareOpen(false);
            setCompareCampaignAId(null);
            setCompareCampaignBId(null);
          }}
        />

        <div className="relative z-10 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
          <div className="sticky top-0 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border-b dark:border-linear-border-subtle light:border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between">
            <h3 className="text-sm font-medium dark:text-text-primary light:text-gray-900">Compare Campaigns</h3>
            <button
              onClick={() => {
                setIsCompareOpen(false);
                setCompareCampaignAId(null);
                setCompareCampaignBId(null);
              }}
              className="dark:text-text-secondary light:text-gray-500 hover:dark:text-text-primary hover:light:text-gray-900 linear-transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 md:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs dark:text-text-secondary light:text-gray-600 mb-2">
                  Campaign A
                </label>
                <select
                  value={compareCampaignAId || ''}
                  onChange={(e) => setCompareCampaignAId(e.target.value || null)}
                  className="w-full px-3 py-2 rounded-linear border dark:border-linear-border-subtle light:border-gray-300 dark:bg-linear-bg-primary light:bg-white dark:text-text-primary light:text-gray-900 text-sm"
                >
                  <option value="">Select campaign...</option>
                  {campaignsFiltered.map(c => (
                    <option key={c.id} value={c.id} disabled={c.id === compareCampaignBId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs dark:text-text-secondary light:text-gray-600 mb-2">
                  Campaign B
                </label>
                <select
                  value={compareCampaignBId || ''}
                  onChange={(e) => setCompareCampaignBId(e.target.value || null)}
                  className="w-full px-3 py-2 rounded-linear border dark:border-linear-border-subtle light:border-gray-300 dark:bg-linear-bg-primary light:bg-white dark:text-text-primary light:text-gray-900 text-sm"
                >
                  <option value="">Select campaign...</option>
                  {campaignsFiltered.map(c => (
                    <option key={c.id} value={c.id} disabled={c.id === compareCampaignAId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {campaignA && campaignB && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="dark:bg-linear-bg-primary light:bg-gray-50 border dark:border-linear-border-subtle light:border-gray-200 rounded-linear-lg p-4">
                  <h4 className="text-sm font-medium dark:text-text-primary light:text-gray-900 mb-4 truncate" title={campaignA.name}>
                    {campaignA.name}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs dark:text-text-tertiary light:text-gray-500 mb-1">Status</div>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${getStatusColor(campaignA.status)}`}>
                        {campaignA.status}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs dark:text-text-tertiary light:text-gray-500 mb-1">Spend</div>
                      <div className="text-sm dark:text-text-primary light:text-gray-900">
                        {formatCurrency(campaignA.total_spend)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs dark:text-text-tertiary light:text-gray-500 mb-1">Revenue</div>
                      <div className="text-sm dark:text-text-primary light:text-gray-900">
                        {formatCurrency(campaignA.total_revenue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs dark:text-text-tertiary light:text-gray-500 mb-1">ROI</div>
                      <div className={`text-sm font-medium ${getRoiColor(campaignA.roi)}`}>
                        {Math.round(campaignA.roi)}%
                      </div>
                      {campaignA.roi > campaignB.roi && (
                        <div className="text-xs text-linear-success mt-1">Higher ROI</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs dark:text-text-tertiary light:text-gray-500 mb-1">Ad Sets</div>
                      <div className="text-sm dark:text-text-primary light:text-gray-900">
                        {campaignA.total_ad_sets} ({campaignA.active_ad_sets} active)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="dark:bg-linear-bg-primary light:bg-gray-50 border dark:border-linear-border-subtle light:border-gray-200 rounded-linear-lg p-4">
                  <h4 className="text-sm font-medium dark:text-text-primary light:text-gray-900 mb-4 truncate" title={campaignB.name}>
                    {campaignB.name}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs dark:text-text-tertiary light:text-gray-500 mb-1">Status</div>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${getStatusColor(campaignB.status)}`}>
                        {campaignB.status}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs dark:text-text-tertiary light:text-gray-500 mb-1">Spend</div>
                      <div className="text-sm dark:text-text-primary light:text-gray-900">
                        {formatCurrency(campaignB.total_spend)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs dark:text-text-tertiary light:text-gray-500 mb-1">Revenue</div>
                      <div className="text-sm dark:text-text-primary light:text-gray-900">
                        {formatCurrency(campaignB.total_revenue)}
                      </div>
                      {campaignB.total_revenue > campaignA.total_revenue && (
                        <div className="text-xs text-linear-success mt-1">Higher Revenue</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs dark:text-text-tertiary light:text-gray-500 mb-1">ROI</div>
                      <div className={`text-sm font-medium ${getRoiColor(campaignB.roi)}`}>
                        {Math.round(campaignB.roi)}%
                      </div>
                      {campaignB.roi > campaignA.roi && (
                        <div className="text-xs text-linear-success mt-1">Higher ROI</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs dark:text-text-tertiary light:text-gray-500 mb-1">Ad Sets</div>
                      <div className="text-sm dark:text-text-primary light:text-gray-900">
                        {campaignB.total_ad_sets} ({campaignB.active_ad_sets} active)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="dark:text-text-secondary light:text-text-light-secondary">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl mb-2">Campaign Performance</h2>
          <p className="text-sm md:text-base dark:text-text-secondary light:text-text-light-secondary">
            Comprehensive performance insights for your campaigns
          </p>
        </div>

        {campaignsFiltered.length > 0 && (
          <div className="inline-flex items-center rounded-linear border dark:border-linear-border-subtle light:border-gray-300 text-xs overflow-hidden">
            <button
              type="button"
              className={`px-3 py-1.5 linear-transition flex items-center gap-1.5 ${
                viewMode === 'visual'
                  ? 'dark:bg-linear-bg-subtle light:bg-gray-100 dark:text-text-primary light:text-gray-900'
                  : 'dark:text-text-secondary light:text-gray-600 hover:dark:bg-linear-bg-subtle/60 hover:light:bg-gray-50'
              }`}
              onClick={() => setViewMode('visual')}
            >
              <Eye className="w-3.5 h-3.5" />
              Visual
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 linear-transition flex items-center gap-1.5 ${
                viewMode === 'data'
                  ? 'dark:bg-linear-bg-subtle light:bg-gray-100 dark:text-text-primary light:text-gray-900'
                  : 'dark:text-text-secondary light:text-gray-600 hover:dark:bg-linear-bg-subtle/60 hover:light:bg-gray-50'
              }`}
              onClick={() => setViewMode('data')}
            >
              <Table2 className="w-3.5 h-3.5" />
              Data
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="dark:bg-linear-error-subtle light:bg-red-50 border dark:border-linear-error-border light:border-red-200 rounded-linear-lg p-4">
          <p className="text-sm dark:text-linear-error light:text-red-800">
            We couldn't load analytics right now. Please try again later.
          </p>
        </div>
      )}

      {campaignsWithMetrics.length > 0 && (
        <div className="w-full dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
              <span className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary">
                Filters
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary">
                Time:
              </span>
              <div className="flex gap-1">
                <FilterButton active={timeFilter === 'all'} onClick={() => setTimeFilter('all')}>
                  All time
                </FilterButton>
                <FilterButton active={timeFilter === '30d'} onClick={() => setTimeFilter('30d')}>
                  Last 30 days
                </FilterButton>
                <FilterButton active={timeFilter === '7d'} onClick={() => setTimeFilter('7d')}>
                  Last 7 days
                </FilterButton>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary">
                Status:
              </span>
              <div className="flex gap-1 flex-wrap">
                <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
                  All statuses
                </FilterButton>
                <FilterButton active={statusFilter === 'active'} onClick={() => setStatusFilter('active')}>
                  Active
                </FilterButton>
                <FilterButton active={statusFilter === 'completed'} onClick={() => setStatusFilter('completed')}>
                  Completed
                </FilterButton>
                <FilterButton active={statusFilter === 'draft'} onClick={() => setStatusFilter('draft')}>
                  Draft
                </FilterButton>
                <FilterButton active={statusFilter === 'archived'} onClick={() => setStatusFilter('archived')}>
                  Archived
                </FilterButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {filterLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="dark:bg-linear-bg-tertiary/40 light:bg-gray-200 rounded-linear-lg h-32" />
            ))}
          </div>
          <div className="dark:bg-linear-bg-tertiary/40 light:bg-gray-200 rounded-linear-lg h-48" />
          <div className="dark:bg-linear-bg-tertiary/40 light:bg-gray-200 rounded-linear-lg h-64" />
        </div>
      )}

      {!filterLoading && campaignsFiltered.length > 0 && (
        <div className="w-full dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg px-4 md:px-6 py-3 md:py-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-linear-accent/10 rounded-linear flex items-center justify-center flex-shrink-0 mt-0.5">
                <Lightbulb className="w-5 h-5 text-linear-accent" />
              </div>
              <div className="flex-1">
                <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mb-1">
                  Key Insight
                </div>
                <p className="text-sm dark:text-text-primary light:text-text-light-primary">
                  {campaignsFiltered.length > 0
                    ? `Your campaigns generated ${formatCurrency(totalRevenue)} in revenue with an average ROI of ${Math.round(averageRoi)}%. ${
                        topCampaignByRoi ? topCampaignByRoi.name : 'No campaign'
                      } is currently your best performing campaign.`
                    : 'No campaign data available for this selection. Adjust your filters or launch a campaign to see insights here.'}
                </p>
              </div>
            </div>

            {topCampaignByRoi && topCampaignByRevenue && (
              <div className="flex flex-col gap-2 md:border-l md:dark:border-linear-border-subtle md:light:border-linear-light-border-subtle md:pl-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs dark:text-text-secondary light:text-text-light-secondary">
                    Top ROI:
                  </span>
                  <span className="text-sm font-medium dark:text-text-primary light:text-text-light-primary">
                    {topCampaignByRoi.name.length > 20
                      ? topCampaignByRoi.name.substring(0, 20) + '...'
                      : topCampaignByRoi.name}
                  </span>
                  <span className={`text-sm font-medium ${getRoiColor(topCampaignByRoi.roi)}`}>
                    {Math.round(topCampaignByRoi.roi)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs dark:text-text-secondary light:text-text-light-secondary">
                    Top Revenue:
                  </span>
                  <span className="text-sm font-medium dark:text-text-primary light:text-text-light-primary">
                    {topCampaignByRevenue.name.length > 20
                      ? topCampaignByRevenue.name.substring(0, 20) + '...'
                      : topCampaignByRevenue.name}
                  </span>
                  <span className="text-sm font-medium text-linear-success">
                    {formatCurrency(topCampaignByRevenue.total_revenue)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!filterLoading && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 transition-opacity duration-300 ${hasMounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="group relative dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6" title="Sum of all ad set spend within selected filters">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-linear flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-red-500/80" />
            </div>
            <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Costs</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl md:text-3xl font-semibold">
              <AnimatedNumber value={totalSpend} prefix="€" />
            </div>
            <div className="text-xs dark:text-text-secondary light:text-text-light-secondary">
              Total investment
            </div>
          </div>
        </div>

        <div className="group relative dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6" title="Total revenue generated by campaigns within selected filters">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-linear flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500/80" />
            </div>
            <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Revenue</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl md:text-3xl font-semibold">
              <AnimatedNumber value={totalRevenue} prefix="€" />
            </div>
            <div className="text-xs dark:text-text-secondary light:text-text-light-secondary">
              Total generated
            </div>
          </div>
        </div>

        <div className="group relative dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6" title="Average return on investment = (Revenue − Costs) ÷ Costs">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-linear-accent/10 rounded-linear flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-linear-accent/80" />
            </div>
            <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">ROI</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl md:text-3xl font-semibold">
              <AnimatedNumber value={isNaN(averageRoi) ? 0 : averageRoi} suffix="%" />
            </div>
            <div className="text-xs dark:text-text-secondary light:text-text-light-secondary">
              Average return
            </div>
          </div>
        </div>

        <div className="group relative dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6" title="Number of campaigns currently active within selected filters">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-linear-warning/10 rounded-linear flex items-center justify-center">
              <Target className="w-5 h-5 text-linear-warning/80" />
            </div>
            <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Active</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl md:text-3xl font-semibold">
              <AnimatedNumber value={activeCampaigns} />
            </div>
            <div className="text-xs dark:text-text-secondary light:text-text-light-secondary">
              Active campaigns
            </div>
          </div>
        </div>
      </div>
      )}

      {!filterLoading && campaignsFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-sm dark:text-text-secondary light:text-text-light-secondary dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg">
          <div className="w-16 h-16 mb-4 rounded-full flex items-center justify-center dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle">
            <BarChart3 className="w-8 h-8 dark:text-text-tertiary light:text-text-light-tertiary" />
          </div>
          <div className="mb-2 dark:text-text-primary light:text-text-light-primary">No campaign data yet</div>
          <div className="text-xs max-w-sm text-center">
            {campaignsWithMetrics.length === 0
              ? 'Create a new campaign to see performance analytics here.'
              : 'Adjust your filters or create a new campaign to see performance analytics here.'}
          </div>
        </div>
      ) : !filterLoading && viewMode === 'data' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">
              Data view shows your current campaigns in a flat table. Filters still apply.
            </p>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-linear border dark:border-linear-border-subtle light:border-gray-300 dark:text-text-primary light:text-gray-700 dark:hover:bg-linear-bg-subtle light:hover:bg-gray-50 linear-transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>

          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
            <h3 className="text-sm md:text-base mb-4">Campaign Data</h3>
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <div className="hidden sm:grid grid-cols-7 gap-2 pb-2 border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle text-xs dark:text-text-secondary light:text-text-light-secondary">
                  <div className="col-span-2">Campaign</div>
                  <div>Status</div>
                  <div>Ad Sets</div>
                  <div className="text-right">Spend</div>
                  <div className="text-right">Revenue</div>
                  <div className="text-right">ROI</div>
                </div>
                <div className="space-y-2 mt-2">
                  {campaignsFiltered.map(campaign => (
                    <div
                      key={campaign.id}
                      className="grid grid-cols-1 sm:grid-cols-7 gap-2 py-2 text-xs hover:dark:bg-linear-bg-subtle/40 light:hover:bg-linear-light-bg-subtle/40 rounded-linear px-1 sm:px-2"
                    >
                      <div className="col-span-1 sm:col-span-2 truncate" title={campaign.name}>
                        {campaign.name}
                      </div>
                      <div className="flex items-center gap-2 sm:block">
                        <span className="sm:hidden text-text-tertiary">Status:</span>
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:block dark:text-text-secondary light:text-text-light-secondary">
                        <span className="sm:hidden text-text-tertiary">Ad Sets:</span>
                        {campaign.total_ad_sets}
                        {campaign.active_ad_sets > 0 && (
                          <span className="text-linear-success ml-1">({campaign.active_ad_sets})</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 dark:text-text-secondary light:text-text-light-secondary">
                        <span className="sm:hidden text-text-tertiary">Spend:</span>
                        {formatCurrency(campaign.total_spend)}
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 dark:text-text-secondary light:text-text-light-secondary">
                        <span className="sm:hidden text-text-tertiary">Revenue:</span>
                        {formatCurrency(campaign.total_revenue)}
                      </div>
                      <div className={`flex items-center justify-between sm:justify-end gap-2 font-medium ${getRoiColor(campaign.roi)}`}>
                        <span className="sm:hidden text-text-tertiary">ROI:</span>
                        {Math.round(campaign.roi)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
            <div className="mb-4">
              <h3 className="text-sm md:text-base font-medium mb-1">Creator Data</h3>
              <p className="text-xs dark:text-text-secondary light:text-text-light-secondary">
                Creators ranked by total revenue within the current filters
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="dark:text-text-secondary light:text-text-light-secondary">
                  <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle">
                    <th className="py-2 pr-4 font-medium">#</th>
                    <th className="py-2 pr-4 font-medium">Creator</th>
                    <th className="py-2 pr-4 font-medium">Handle</th>
                    <th className="py-2 pr-4 font-medium">Primary platform</th>
                    <th className="py-2 pr-4 text-right font-medium">Total revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topCreators.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-xs dark:text-text-secondary light:text-text-light-secondary">
                        No creator data for the selected filters
                      </td>
                    </tr>
                  ) : (
                    topCreators.map((creator, index) => {
                      const platform = getPrimaryPlatform(creator);
                      const revenue = creatorRevenue[creator.id] || 0;
                      const handle = creator.tiktok_handle || creator.instagram_handle || creator.youtube_handle || null;

                      return (
                        <tr
                          key={creator.id}
                          className="border-b last:border-b-0 dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-subtle/40 hover:light:bg-gray-50"
                        >
                          <td className="py-3 pr-4 align-middle text-xs dark:text-text-secondary light:text-text-light-secondary">
                            {index + 1}
                          </td>
                          <td className="py-3 pr-4 align-middle dark:text-text-primary light:text-gray-900">
                            {creator.name || 'Unnamed creator'}
                          </td>
                          <td className="py-3 pr-4 align-middle dark:text-text-secondary light:text-text-light-secondary">
                            {handle ? `@${handle}` : '—'}
                          </td>
                          <td className="py-3 pr-4 align-middle dark:text-text-secondary light:text-text-light-secondary">
                            {platform || '—'}
                          </td>
                          <td className="py-3 pl-4 align-middle text-right font-medium dark:text-text-primary light:text-gray-900">
                            {formatCurrency(revenue)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
            <div className="mb-4">
              <h3 className="text-sm md:text-base font-medium mb-1">Platform Data</h3>
              <p className="text-xs dark:text-text-secondary light:text-text-light-secondary">
                Creator and revenue distribution across social platforms
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="dark:text-text-secondary light:text-text-light-secondary">
                  <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle">
                    <th className="py-2 pr-4 font-medium">Platform</th>
                    <th className="py-2 pr-4 font-medium">Creators</th>
                    <th className="py-2 pr-4 text-right font-medium">Total revenue</th>
                    <th className="py-2 pr-4 text-right font-medium">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {platformStats.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-xs dark:text-text-secondary light:text-text-light-secondary">
                        No platform data for the selected filters
                      </td>
                    </tr>
                  ) : (
                    platformStats.map(({ platform, count, revenue, percentage }) => (
                      <tr
                        key={platform}
                        className="border-b last:border-b-0 dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-subtle/40 hover:light:bg-gray-50"
                      >
                        <td className="py-3 pr-4 align-middle dark:text-text-primary light:text-gray-900">
                          {platform}
                        </td>
                        <td className="py-3 pr-4 align-middle dark:text-text-secondary light:text-text-light-secondary">
                          {count} {count === 1 ? 'creator' : 'creators'}
                        </td>
                        <td className="py-3 pl-4 align-middle text-right font-medium dark:text-text-primary light:text-gray-900">
                          {formatCurrency(revenue)}
                        </td>
                        <td className="py-3 pl-4 align-middle text-right dark:text-text-secondary light:text-text-light-secondary">
                          {percentage}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : !filterLoading && (
        <div className={`transition-opacity duration-300 ${hasMounted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-between mb-4">
            <div></div>
            <button
              onClick={() => setIsCompareOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-linear border dark:border-linear-border-subtle light:border-gray-300 dark:text-text-primary light:text-gray-700 dark:hover:bg-linear-bg-subtle light:hover:bg-gray-50 linear-transition"
            >
              <GitCompare className="w-3.5 h-3.5" />
              Compare campaigns
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
              <h3 className="text-sm md:text-base mb-4">Spend vs Revenue by Campaign</h3>
              {chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 dark:text-text-secondary light:text-text-light-secondary">
                  <BarChart3 className="w-10 h-10 mb-3 dark:text-text-tertiary light:text-text-light-tertiary" />
                  <div className="text-sm">No data available</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeOpacity={0.08} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                      className="dark:fill-text-secondary light:fill-text-light-secondary"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                      className="dark:fill-text-secondary light:fill-text-light-secondary"
                    />
                    <Tooltip
                      formatter={(value: any, name: any) => [
                        typeof value === 'number' ? `€${value.toLocaleString('nl-NL')}` : value,
                        name === 'revenue' ? 'Revenue' : name === 'spend' ? 'Spend' : name,
                      ]}
                      labelFormatter={(label) => label}
                      contentStyle={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="spend"
                      name="Spend"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
              <h3 className="text-sm md:text-base mb-4">Campaign Breakdown</h3>
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  <div className="hidden sm:grid grid-cols-7 gap-2 pb-2 border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle text-xs dark:text-text-secondary light:text-text-light-secondary">
                    <div className="col-span-2">Campaign</div>
                    <div>Status</div>
                    <div>Ad Sets</div>
                    <div className="text-right">Spend</div>
                    <div className="text-right">Revenue</div>
                    <div className="text-right">ROI</div>
                  </div>
                  <div className="space-y-2 mt-2">
                    {campaignsFiltered.map(campaign => (
                      <div
                        key={campaign.id}
                        className="grid grid-cols-1 sm:grid-cols-7 gap-2 py-2 text-xs hover:dark:bg-linear-bg-subtle/40 light:hover:bg-linear-light-bg-subtle/40 rounded-linear px-1 sm:px-2 cursor-pointer transition-colors duration-150"
                        onClick={() => {
                          console.log('Navigate to campaign:', campaign.id);
                        }}
                      >
                        <div className="col-span-1 sm:col-span-2 truncate" title={campaign.name}>
                          {campaign.name}
                        </div>
                        <div className="flex items-center gap-2 sm:block">
                          <span className="sm:hidden text-text-tertiary">Status:</span>
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 sm:block dark:text-text-secondary light:text-text-light-secondary">
                          <span className="sm:hidden text-text-tertiary">Ad Sets:</span>
                          {campaign.total_ad_sets}
                          {campaign.active_ad_sets > 0 && (
                            <span className="text-linear-success ml-1">({campaign.active_ad_sets})</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 dark:text-text-secondary light:text-text-light-secondary">
                          <span className="sm:hidden text-text-tertiary">Spend:</span>
                          {formatCurrency(campaign.total_spend)}
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 dark:text-text-secondary light:text-text-light-secondary">
                          <span className="sm:hidden text-text-tertiary">Revenue:</span>
                          {formatCurrency(campaign.total_revenue)}
                        </div>
                        <div className={`flex items-center justify-between sm:justify-end gap-2 font-medium ${getRoiColor(campaign.roi)}`}>
                          <span className="sm:hidden text-text-tertiary">ROI:</span>
                          {Math.round(campaign.roi)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:col-span-2">
              <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-gray-200 rounded-linear-lg p-5 md:p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <Users className="w-5 h-5 dark:text-text-secondary light:text-gray-600" />
                  <h3 className="text-base font-medium dark:text-text-primary light:text-gray-900">Top Creators</h3>
                </div>

                {topCreators.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 dark:text-text-secondary light:text-text-light-secondary">
                    <Users className="w-10 h-10 mb-3 dark:text-text-tertiary light:text-gray-400" />
                    <div className="text-sm text-center">No creators yet</div>
                    <div className="text-xs text-center mt-1 dark:text-text-tertiary light:text-gray-500">Add creators to see them highlighted here</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topCreators.map((creator, index) => {
                      const platform = getPrimaryPlatform(creator);
                      const revenue = creatorRevenue[creator.id] || 0;
                      const handle = creator.tiktok_handle || creator.instagram_handle || creator.youtube_handle || 'unknown';

                      return (
                        <div
                          key={creator.id}
                          className="flex items-center justify-between py-3 px-4 dark:bg-[#0a0e1a] light:bg-gray-50 rounded-lg hover:dark:bg-[#0d1221] linear-transition cursor-pointer"
                          onClick={() => {
                            console.log('Navigate to creator:', creator.id);
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full dark:bg-linear-warning/10 light:bg-amber-100 flex items-center justify-center border dark:border-linear-warning/20 light:border-amber-200">
                              <span className="text-xs font-semibold dark:text-linear-warning light:text-amber-700">#{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium dark:text-text-primary light:text-gray-900">
                                {creator.name}
                              </div>
                              <div className="text-xs dark:text-text-secondary light:text-gray-500">
                                @{handle}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs dark:text-text-tertiary light:text-gray-500 mb-0.5">
                              Total Revenue
                            </div>
                            <div className="text-base font-semibold dark:text-linear-success light:text-green-600">
                              {formatCurrency(revenue)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-gray-200 rounded-linear-lg p-5 md:p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <Zap className="w-5 h-5 dark:text-text-secondary light:text-gray-600" />
                  <h3 className="text-base font-medium dark:text-text-primary light:text-gray-900">Platform Performance</h3>
                </div>

                {platformStats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 dark:text-text-secondary light:text-text-light-secondary">
                    <Zap className="w-10 h-10 mb-3 dark:text-text-tertiary light:text-gray-400" />
                    <div className="text-sm text-center">Platform data is not available yet</div>
                    <div className="text-xs text-center mt-1 dark:text-text-tertiary light:text-gray-500">
                      Connect creator platform data to unlock these insights
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {platformStats.map(({ platform, count, revenue, percentage }) => (
                      <div key={platform} className="flex items-center justify-between py-3 px-4 dark:bg-[#0a0e1a] light:bg-gray-50 rounded-lg hover:dark:bg-[#0d1221] linear-transition">
                        <div className="text-base font-medium dark:text-text-primary light:text-gray-900">
                          {platform}
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-sm dark:text-text-secondary light:text-gray-600">
                            {count} {count === 1 ? 'creator' : 'creators'}
                          </div>
                          <div className="text-base font-semibold dark:text-linear-success light:text-green-600">
                            {formatCurrency(revenue)}
                          </div>
                          <div className="text-sm dark:text-text-tertiary light:text-gray-500 min-w-[3rem] text-right">
                            {percentage}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isCompareOpen && <CompareModal />}
    </div>
  );
}
