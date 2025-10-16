import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Target, BarChart3, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AnalyticsSummary {
  total_campaigns: number;
  active_campaigns: number;
  total_creators: number;
  total_ad_sets: number;
  total_revenue: number;
  total_spend: number;
  total_profit: number;
  overall_roi: number;
  total_conversions: number;
  total_clicks: number;
  total_impressions: number;
  avg_ctr: number;
}

interface CampaignPerformance {
  id: string;
  name: string;
  status: string;
  total_revenue: number;
  total_spend: number;
  profit: number;
  roi_percentage: number;
  total_conversions: number;
  avg_ctr: number;
}

interface CreatorPerformance {
  creator_id: string;
  creator_name: string;
  total_revenue: number;
  total_spend: number;
  profit: number;
  roi_percentage: number;
  conversions: number;
  campaigns_count: number;
}

interface PlatformPerformance {
  platform: string;
  total_revenue: number;
  total_spend: number;
  profit: number;
  roi_percentage: number;
  total_conversions: number;
}

interface AnalyticsViewProps {
  workspaceId: string;
}

type DateRange = '7d' | '30d' | '90d' | 'all';

export default function AnalyticsView({ workspaceId }: AnalyticsViewProps) {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignPerformance[]>([]);
  const [topCreators, setTopCreators] = useState<CreatorPerformance[]>([]);
  const [platformData, setPlatformData] = useState<PlatformPerformance[]>([]);

  const getDateRangeFilter = (range: DateRange) => {
    if (range === 'all') return { start: null, end: null };

    const end = new Date();
    const start = new Date();

    switch (range) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
    }

    return { start: start.toISOString(), end: end.toISOString() };
  };

  useEffect(() => {
    loadAnalytics();
  }, [workspaceId, dateRange]);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const { start, end } = getDateRangeFilter(dateRange);

      const { data: analyticsData, error: analyticsError } = await supabase
        .rpc('get_workspace_analytics', {
          p_workspace_id: workspaceId,
          p_start_date: start,
          p_end_date: end
        });

      if (analyticsError) throw analyticsError;
      if (analyticsData?.summary) {
        setSummary(analyticsData.summary);
      }

      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaign_performance_summary')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('total_revenue', { ascending: false })
        .limit(10);

      if (campaignsError) throw campaignsError;
      setCampaigns(campaignsData || []);

      const { data: creatorsData, error: creatorsError } = await supabase
        .rpc('get_top_performing_creators', {
          p_workspace_id: workspaceId,
          p_limit: 10,
          p_order_by: 'revenue'
        });

      if (creatorsError) {
        console.error('Error loading top creators via RPC:', creatorsError);

        const { data: fallbackCreators, error: fallbackError } = await supabase
          .from('creators')
          .select('id, name')
          .eq('workspace_id', workspaceId);

        if (fallbackError) {
          console.error('Error loading creators fallback:', fallbackError);
          setTopCreators([]);
        } else {
          const creatorsWithMetrics = await Promise.all(
            (fallbackCreators || []).map(async (creator) => {
              const { data: adSetsData } = await supabase
                .from('ad_sets')
                .select('revenue, spend, conversions, campaign_id')
                .eq('creator_id', creator.id);

              const totalRevenue = adSetsData?.reduce((sum, ad) => sum + (Number(ad.revenue) || 0), 0) || 0;
              const totalSpend = adSetsData?.reduce((sum, ad) => sum + (Number(ad.spend) || 0), 0) || 0;
              const totalConversions = adSetsData?.reduce((sum, ad) => sum + (Number(ad.conversions) || 0), 0) || 0;
              const profit = totalRevenue - totalSpend;
              const roiPercentage = totalSpend > 0 ? Number(((profit / totalSpend) * 100).toFixed(2)) : 0;

              const uniqueCampaigns = new Set(adSetsData?.map(ad => ad.campaign_id) || []);

              return {
                creator_id: creator.id,
                creator_name: creator.name,
                total_revenue: totalRevenue,
                total_spend: totalSpend,
                profit,
                roi_percentage: roiPercentage,
                conversions: totalConversions,
                campaigns_count: uniqueCampaigns.size,
                ad_sets_count: adSetsData?.length || 0
              };
            })
          );

          const sortedCreators = creatorsWithMetrics
            .filter(c => c.total_revenue > 0 || c.campaigns_count > 0)
            .sort((a, b) => b.total_revenue - a.total_revenue)
            .slice(0, 10);

          console.log('Fallback creators data:', sortedCreators);
          setTopCreators(sortedCreators);
        }
      } else {
        console.log('Top creators data:', creatorsData);
        setTopCreators(creatorsData || []);
      }

      const { data: platformsData, error: platformsError } = await supabase
        .from('platform_performance_summary')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (platformsError) throw platformsError;

      const aggregated = (platformsData || []).reduce((acc: any[], curr: any) => {
        const existing = acc.find(p => p.platform === curr.platform);
        if (existing) {
          existing.total_revenue += curr.total_revenue;
          existing.total_spend += curr.total_spend;
          existing.profit += curr.profit;
          existing.total_conversions += curr.total_conversions;
        } else {
          acc.push({ ...curr });
        }
        return acc;
      }, []);

      aggregated.forEach(p => {
        p.roi_percentage = p.total_spend > 0
          ? ((p.profit / p.total_spend) * 100).toFixed(2)
          : 0;
      });

      setPlatformData(aggregated);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  const exportToCSV = () => {
    if (!campaigns.length) return;

    const headers = ['Campaign', 'Status', 'Revenue', 'Spend', 'Profit', 'ROI %', 'Conversions', 'CTR %'];
    const rows = campaigns.map(c => [
      c.name,
      c.status,
      c.total_revenue,
      c.total_spend,
      c.profit,
      c.roi_percentage,
      c.total_conversions,
      c.avg_ctr
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('nl-NL').format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-linear-success bg-linear-success-subtle border-linear-success-border';
      case 'completed':
        return 'text-linear-info bg-linear-info-subtle border-linear-info-border';
      case 'draft':
        return 'text-text-tertiary bg-linear-bg-hover border-linear-border';
      default:
        return 'text-text-tertiary bg-linear-bg-hover border-linear-border';
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-medium mb-2">Analytics Dashboard</h2>
          <p className="text-sm md:text-base dark:text-text-secondary light:text-text-light-secondary">
            Comprehensive performance insights
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary rounded-linear border dark:border-linear-border-subtle light:border-linear-light-border-subtle p-1">
            <button
              onClick={() => setDateRange('7d')}
              className={`px-3 py-1.5 rounded-linear text-xs md:text-sm font-medium linear-transition ${
                dateRange === '7d'
                  ? 'dark:bg-linear-accent light:bg-linear-light-accent dark:text-linear-bg light:text-linear-light-bg'
                  : 'dark:text-text-secondary light:text-text-light-secondary hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1.5 rounded-linear text-xs md:text-sm font-medium linear-transition ${
                dateRange === '30d'
                  ? 'dark:bg-linear-accent light:bg-linear-light-accent dark:text-linear-bg light:text-linear-light-bg'
                  : 'dark:text-text-secondary light:text-text-light-secondary hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setDateRange('90d')}
              className={`px-3 py-1.5 rounded-linear text-xs md:text-sm font-medium linear-transition ${
                dateRange === '90d'
                  ? 'dark:bg-linear-accent light:bg-linear-light-accent dark:text-linear-bg light:text-linear-light-bg'
                  : 'dark:text-text-secondary light:text-text-light-secondary hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover'
              }`}
            >
              90 Days
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-linear text-xs md:text-sm font-medium linear-transition ${
                dateRange === 'all'
                  ? 'dark:bg-linear-accent light:bg-linear-light-accent dark:text-linear-bg light:text-linear-light-bg'
                  : 'dark:text-text-secondary light:text-text-light-secondary hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover'
              }`}
            >
              All Time
            </button>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover linear-transition text-xs md:text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-linear-success-subtle rounded-linear flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-linear-success" />
              </div>
              <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Revenue</span>
            </div>
            <div className="space-y-1">
              <div className="text-xl md:text-2xl font-medium">{formatCurrency(summary.total_revenue)}</div>
              <div className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-linear-success" />
                Profit: {formatCurrency(summary.total_profit)}
              </div>
            </div>
          </div>

          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-linear-info-subtle rounded-linear flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-linear-info" />
              </div>
              <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">ROI</span>
            </div>
            <div className="space-y-1">
              <div className="text-xl md:text-2xl font-medium">{summary.overall_roi}%</div>
              <div className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary">
                Spend: {formatCurrency(summary.total_spend)}
              </div>
            </div>
          </div>

          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-linear-warning-subtle rounded-linear flex items-center justify-center">
                <Target className="w-5 h-5 text-linear-warning" />
              </div>
              <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Conversions</span>
            </div>
            <div className="space-y-1">
              <div className="text-xl md:text-2xl font-medium">{formatNumber(summary.total_conversions)}</div>
              <div className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary">
                CTR: {summary.avg_ctr}%
              </div>
            </div>
          </div>

          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-linear-accent-subtle rounded-linear flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-linear-accent" />
              </div>
              <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Campaigns</span>
            </div>
            <div className="space-y-1">
              <div className="text-xl md:text-2xl font-medium">{summary.active_campaigns}</div>
              <div className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary">
                {summary.total_creators} Creators
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
          <h3 className="text-sm md:text-base font-medium mb-4 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Top Campaigns
          </h3>
          {campaigns.length === 0 ? (
            <p className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary py-8 text-center">
              No campaign data available
            </p>
          ) : (
            <div className="space-y-3">
              {campaigns.slice(0, 5).map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-3 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear hover:dark:bg-linear-bg-subtle light:hover:bg-linear-light-bg-subtle linear-transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{campaign.name}</div>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full border mt-1 ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>
                    <div className="text-right ml-3">
                      <div className="font-medium text-sm">{formatCurrency(campaign.total_revenue)}</div>
                      <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                        {formatCurrency(campaign.profit)} profit
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs dark:text-text-secondary light:text-text-light-secondary pt-2 border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle">
                    <span className={campaign.roi_percentage > 0 ? 'text-linear-success font-medium' : 'text-linear-error font-medium'}>
                      {campaign.roi_percentage > 0 ? '+' : ''}{campaign.roi_percentage}% ROI
                    </span>
                    <span>{formatNumber(campaign.total_conversions)} conversions</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
          <h3 className="text-sm md:text-base font-medium mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Top Creators
          </h3>
          {topCreators.length === 0 ? (
            <p className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary py-8 text-center">
              No creator data available
            </p>
          ) : (
            <div className="space-y-3">
              {topCreators.slice(0, 5).map((creator, index) => (
                <div
                  key={creator.creator_id}
                  className="p-3 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear hover:dark:bg-linear-bg-subtle light:hover:bg-linear-light-bg-subtle linear-transition relative"
                >
                  <div className="absolute top-3 right-3 w-6 h-6 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary rounded-full flex items-center justify-center text-xs font-medium text-linear-warning border border-linear-warning-border">
                    #{index + 1}
                  </div>
                  <div className="pr-8">
                    <div className="font-medium text-sm mb-2">{creator.creator_name}</div>
                    <div className="flex items-center justify-between text-xs dark:text-text-secondary light:text-text-light-secondary mb-1">
                      <span>Revenue:</span>
                      <span className="font-medium">{formatCurrency(creator.total_revenue)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle">
                      <span className={creator.roi_percentage > 0 ? 'text-linear-success font-medium' : 'text-linear-error font-medium'}>
                        {creator.roi_percentage > 0 ? '+' : ''}{creator.roi_percentage}% ROI
                      </span>
                      <span className="dark:text-text-tertiary light:text-text-light-tertiary">
                        {creator.campaigns_count} campaigns
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {platformData.length > 0 && (
        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
          <h3 className="text-sm md:text-base font-medium mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Platform Performance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformData.map((platform) => (
              <div
                key={platform.platform}
                className="p-4 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear hover:dark:bg-linear-bg-subtle light:hover:bg-linear-light-bg-subtle linear-transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm">{platform.platform}</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    Number(platform.roi_percentage) > 0
                      ? 'bg-linear-success-subtle text-linear-success border border-linear-success-border'
                      : 'bg-linear-error-subtle text-linear-error border border-linear-error-border'
                  }`}>
                    {Number(platform.roi_percentage) > 0 ? '+' : ''}{platform.roi_percentage}% ROI
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="dark:text-text-secondary light:text-text-light-secondary">Revenue</span>
                    <span className="font-medium">{formatCurrency(platform.total_revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="dark:text-text-secondary light:text-text-light-secondary">Spend</span>
                    <span className="font-medium">{formatCurrency(platform.total_spend)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle">
                    <span className="dark:text-text-secondary light:text-text-light-secondary">Conversions</span>
                    <span className="font-medium">{formatNumber(platform.total_conversions)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
