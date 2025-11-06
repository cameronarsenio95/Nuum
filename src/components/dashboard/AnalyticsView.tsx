import { useState, useEffect } from 'react';
import { Target, DollarSign, TrendingUp, BarChart3, Filter } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
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

export default function AnalyticsView({ workspace }: AnalyticsViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignsWithMetrics, setCampaignsWithMetrics] = useState<CampaignWithMetrics[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    loadAnalytics();
  }, [workspace.id]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

      if (campaignsError) {
        console.error('Error loading campaigns:', campaignsError);
        setError('Failed to load analytics data.');
        setLoading(false);
        return;
      }

      if (!campaignsData || campaignsData.length === 0) {
        setCampaignsWithMetrics([]);
        setLoading(false);
        return;
      }

      const { data: adSetsData, error: adSetsError } = await supabase
        .from('ad_sets')
        .select('campaign_id, status, spend, revenue')
        .in('campaign_id', campaignsData.map(c => c.id));

      if (adSetsError) {
        console.error('Error loading ad sets:', adSetsError);
      }

      const campaignsWithMetrics: CampaignWithMetrics[] = campaignsData.map(campaign => {
        const campaignAdSets = adSetsData?.filter(ad => ad.campaign_id === campaign.id) || [];

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

  const campaignsFiltered = applyFilters(campaignsWithMetrics);

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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear p-3 shadow-lg">
          <p className="font-medium mb-2">{data.name}</p>
          <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">
            Spend: {formatCurrency(data.spend)}
          </p>
          <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">
            Revenue: {formatCurrency(data.revenue)}
          </p>
          <p className={`text-sm font-medium ${getRoiColor(data.roi)}`}>
            ROI: {Math.round(data.roi)}%
          </p>
        </div>
      );
    }
    return null;
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
      className={`px-3 py-1.5 rounded-linear text-xs md:text-sm font-medium border linear-transition ${
        active
          ? 'dark:bg-linear-bg-subtle dark:border-linear-border dark:text-text-primary light:bg-linear-light-bg-subtle light:border-linear-light-border light:text-text-light-primary'
          : 'dark:bg-transparent dark:border-transparent dark:text-text-secondary dark:hover:bg-linear-bg-subtle/60 light:bg-transparent light:border-transparent light:text-text-light-secondary light:hover:bg-linear-light-bg-subtle/60'
      }`}
    >
      {children}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="dark:text-text-secondary light:text-text-light-secondary">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h2 className="text-xl md:text-2xl font-medium mb-2">Campaign Performance</h2>
        <p className="text-sm md:text-base dark:text-text-secondary light:text-text-light-secondary">
          Comprehensive performance insights for your campaigns
        </p>
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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
              <span className="text-sm font-medium dark:text-text-secondary light:text-text-light-secondary">
                Filters
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap items-start sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium dark:text-text-secondary light:text-text-light-secondary">
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
                <span className="text-sm font-medium dark:text-text-secondary light:text-text-light-secondary">
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
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-linear flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-red-500/80" />
            </div>
            <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Costs</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl md:text-3xl font-semibold">{formatCurrency(totalSpend)}</div>
            <div className="text-xs dark:text-text-secondary light:text-text-light-secondary">
              Total investment
            </div>
          </div>
        </div>

        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-linear flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500/80" />
            </div>
            <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Revenue</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl md:text-3xl font-semibold">{formatCurrency(totalRevenue)}</div>
            <div className="text-xs dark:text-text-secondary light:text-text-light-secondary">
              Total generated
            </div>
          </div>
        </div>

        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-linear-accent/10 rounded-linear flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-linear-accent/80" />
            </div>
            <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">ROI</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl md:text-3xl font-semibold">
              {isNaN(averageRoi) ? '0' : Math.round(averageRoi)}%
            </div>
            <div className="text-xs dark:text-text-secondary light:text-text-light-secondary">
              Average return
            </div>
          </div>
        </div>

        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-linear-warning/10 rounded-linear flex items-center justify-center">
              <Target className="w-5 h-5 text-linear-warning/80" />
            </div>
            <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Active</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl md:text-3xl font-semibold">{activeCampaigns}</div>
            <div className="text-xs dark:text-text-secondary light:text-text-light-secondary">
              Active campaigns
            </div>
          </div>
        </div>
      </div>

      {campaignsFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-sm dark:text-text-secondary light:text-text-light-secondary dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg">
          <div className="w-16 h-16 mb-4 rounded-full flex items-center justify-center dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle">
            <BarChart3 className="w-8 h-8 dark:text-text-tertiary light:text-text-light-tertiary" />
          </div>
          <div className="font-medium mb-2 dark:text-text-primary light:text-text-light-primary">No campaign data yet</div>
          <div className="text-xs max-w-sm text-center">
            {campaignsWithMetrics.length === 0
              ? 'Create a new campaign to see performance analytics here.'
              : 'Adjust your filters or create a new campaign to see performance analytics here.'}
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
            <h3 className="text-sm md:text-base font-medium mb-4">Spend vs Revenue by Campaign</h3>
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
            <h3 className="text-sm md:text-base font-medium mb-4">Campaign Breakdown</h3>
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <div className="hidden sm:grid grid-cols-7 gap-2 pb-2 border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle text-xs font-medium dark:text-text-secondary light:text-text-light-secondary">
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
                      <div className="col-span-1 sm:col-span-2 truncate font-medium" title={campaign.name}>
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
        </div>
      )}
    </div>
  );
}
