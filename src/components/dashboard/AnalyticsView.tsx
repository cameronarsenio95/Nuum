import { useState, useEffect } from 'react';
import { Target, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
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

export default function AnalyticsView({ workspace }: AnalyticsViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignsWithMetrics, setCampaignsWithMetrics] = useState<CampaignWithMetrics[]>([]);

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

  const totalSpend = campaignsWithMetrics.reduce((sum, c) => sum + c.total_spend, 0);
  const totalRevenue = campaignsWithMetrics.reduce((sum, c) => sum + c.total_revenue, 0);
  const campaignsWithSpend = campaignsWithMetrics.filter(c => c.total_spend > 0);
  const averageRoi = campaignsWithSpend.length > 0
    ? campaignsWithSpend.reduce((sum, c) => sum + c.roi, 0) / campaignsWithSpend.length
    : 0;
  const activeCampaigns = campaignsWithMetrics.filter(c => c.status === 'active').length;

  const chartData = campaignsWithMetrics
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
    switch (status) {
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
          <p className={`text-sm font-medium ${data.roi >= 0 ? 'text-linear-success' : 'text-linear-error'}`}>
            ROI: {Math.round(data.roi)}%
          </p>
        </div>
      );
    }
    return null;
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-red-500/10 rounded-linear flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Costs</span>
          </div>
          <div className="space-y-1">
            <div className="text-xl md:text-2xl font-medium">{formatCurrency(totalSpend)}</div>
            <div className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary">
              Total investment
            </div>
          </div>
        </div>

        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-500/10 rounded-linear flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Revenue</span>
          </div>
          <div className="space-y-1">
            <div className="text-xl md:text-2xl font-medium">{formatCurrency(totalRevenue)}</div>
            <div className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary">
              Total generated
            </div>
          </div>
        </div>

        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-linear-accent-subtle rounded-linear flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-linear-accent" />
            </div>
            <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">ROI</span>
          </div>
          <div className="space-y-1">
            <div className="text-xl md:text-2xl font-medium">
              {isNaN(averageRoi) ? '0' : Math.round(averageRoi)}%
            </div>
            <div className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary">
              Average return
            </div>
          </div>
        </div>

        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-linear-warning-subtle rounded-linear flex items-center justify-center">
              <Target className="w-5 h-5 text-linear-warning" />
            </div>
            <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Active</span>
          </div>
          <div className="space-y-1">
            <div className="text-xl md:text-2xl font-medium">{activeCampaigns}</div>
            <div className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary">
              Active campaigns
            </div>
          </div>
        </div>
      </div>

      {campaignsWithMetrics.length === 0 ? (
        <div className="text-center py-12 md:py-20 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg">
          <Target className="w-10 h-10 md:w-12 md:h-12 dark:text-text-tertiary light:text-text-light-tertiary mx-auto mb-4" />
          <p className="text-sm md:text-base dark:text-text-secondary light:text-text-light-secondary">
            No campaign data yet. Create a campaign to see analytics.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
            <h3 className="text-sm md:text-base font-medium mb-4">Spend vs Revenue by Campaign</h3>
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-64 dark:text-text-secondary light:text-text-light-secondary">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    className="dark:fill-text-secondary light:fill-text-light-secondary"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="dark:fill-text-secondary light:fill-text-light-secondary"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="spend" name="Spend" fill="#ef4444" />
                  <Bar dataKey="revenue" name="Revenue" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
            <h3 className="text-sm md:text-base font-medium mb-4">Campaign Breakdown</h3>
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <div className="grid grid-cols-7 gap-2 pb-2 border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle text-xs font-medium dark:text-text-secondary light:text-text-light-secondary">
                  <div className="col-span-2">Campaign</div>
                  <div>Status</div>
                  <div>Ad Sets</div>
                  <div className="text-right">Spend</div>
                  <div className="text-right">Revenue</div>
                  <div className="text-right">ROI</div>
                </div>
                <div className="space-y-2 mt-2">
                  {campaignsWithMetrics.map(campaign => (
                    <div
                      key={campaign.id}
                      className="grid grid-cols-7 gap-2 py-2 text-xs hover:dark:bg-linear-bg-subtle light:hover:bg-linear-light-bg-subtle rounded-linear px-1"
                    >
                      <div className="col-span-2 truncate font-medium" title={campaign.name}>
                        {campaign.name}
                      </div>
                      <div>
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                      <div className="dark:text-text-secondary light:text-text-light-secondary">
                        {campaign.total_ad_sets}
                        {campaign.active_ad_sets > 0 && (
                          <span className="text-linear-success ml-1">({campaign.active_ad_sets})</span>
                        )}
                      </div>
                      <div className="text-right dark:text-text-secondary light:text-text-light-secondary">
                        {formatCurrency(campaign.total_spend)}
                      </div>
                      <div className="text-right dark:text-text-secondary light:text-text-light-secondary">
                        {formatCurrency(campaign.total_revenue)}
                      </div>
                      <div className={`text-right font-medium ${campaign.roi >= 0 ? 'text-linear-success' : 'text-linear-error'}`}>
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
