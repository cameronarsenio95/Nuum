import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Target, AlertCircle, Calendar, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Campaign = Database['public']['Tables']['campaigns']['Row'];
type AdSet = Database['public']['Tables']['ad_sets']['Row'];

interface CampaignAnalyticsProps {
  campaign: Campaign;
  workspaceId: string;
}

interface TimeSeriesData {
  date: string;
  spend: number;
  revenue: number;
  roi: number;
}

interface CampaignMetrics {
  totalSpend: number;
  totalRevenue: number;
  avgROI: number;
  adSetCount: number;
  activeAdSets: number;
  spendTrend: number;
  revenueTrend: number;
}

export function CampaignAnalytics({ campaign, workspaceId }: CampaignAnalyticsProps) {
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [budgetAlerts, setBudgetAlerts] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [campaign.id, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    await Promise.all([
      loadTimeSeriesData(),
      loadMetrics(),
      checkBudgetAlerts()
    ]);
    setLoading(false);
  };

  const loadTimeSeriesData = async () => {
    const { data: adSets } = await supabase
      .from('ad_sets')
      .select('created_at, spend, revenue, updated_at')
      .eq('campaign_id', campaign.id)
      .order('created_at', { ascending: true });

    if (!adSets || adSets.length === 0) {
      setTimeSeriesData([]);
      return;
    }

    const dateMap = new Map<string, { spend: number; revenue: number }>();

    adSets.forEach((adSet) => {
      const date = new Date(adSet.created_at).toISOString().split('T')[0];
      const existing = dateMap.get(date) || { spend: 0, revenue: 0 };
      dateMap.set(date, {
        spend: existing.spend + (adSet.spend || 0),
        revenue: existing.revenue + (adSet.revenue || 0)
      });
    });

    const seriesData: TimeSeriesData[] = Array.from(dateMap.entries())
      .map(([date, values]) => ({
        date,
        spend: values.spend,
        revenue: values.revenue,
        roi: values.spend > 0 ? ((values.revenue - values.spend) / values.spend) * 100 : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    let cumulativeSpend = 0;
    let cumulativeRevenue = 0;
    const cumulativeData = seriesData.map(item => {
      cumulativeSpend += item.spend;
      cumulativeRevenue += item.revenue;
      return {
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        spend: Math.round(cumulativeSpend),
        revenue: Math.round(cumulativeRevenue),
        roi: cumulativeSpend > 0 ? Math.round(((cumulativeRevenue - cumulativeSpend) / cumulativeSpend) * 100) : 0
      };
    });

    setTimeSeriesData(cumulativeData);
  };

  const loadMetrics = async () => {
    const { data: adSets } = await supabase
      .from('ad_sets')
      .select('spend, revenue, status')
      .eq('campaign_id', campaign.id);

    if (!adSets) {
      setMetrics(null);
      return;
    }

    const totalSpend = adSets.reduce((sum, ad) => sum + (ad.spend || 0), 0);
    const totalRevenue = adSets.reduce((sum, ad) => sum + (ad.revenue || 0), 0);
    const avgROI = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
    const activeAdSets = adSets.filter(ad => ad.status === 'active').length;

    const recentAdSets = adSets.slice(-7);
    const recentSpend = recentAdSets.reduce((sum, ad) => sum + (ad.spend || 0), 0);
    const recentRevenue = recentAdSets.reduce((sum, ad) => sum + (ad.revenue || 0), 0);

    const olderAdSets = adSets.slice(0, -7);
    const olderSpend = olderAdSets.reduce((sum, ad) => sum + (ad.spend || 0), 0);
    const olderRevenue = olderAdSets.reduce((sum, ad) => sum + (ad.revenue || 0), 0);

    const spendTrend = olderSpend > 0 ? ((recentSpend - olderSpend) / olderSpend) * 100 : 0;
    const revenueTrend = olderRevenue > 0 ? ((recentRevenue - olderRevenue) / olderRevenue) * 100 : 0;

    setMetrics({
      totalSpend,
      totalRevenue,
      avgROI,
      adSetCount: adSets.length,
      activeAdSets,
      spendTrend,
      revenueTrend
    });
  };

  const checkBudgetAlerts = async () => {
    const alerts: string[] = [];

    if (!campaign.budget) {
      setBudgetAlerts(alerts);
      return;
    }

    const { data: adSets } = await supabase
      .from('ad_sets')
      .select('spend')
      .eq('campaign_id', campaign.id);

    if (!adSets) {
      setBudgetAlerts(alerts);
      return;
    }

    const totalSpend = adSets.reduce((sum, ad) => sum + (ad.spend || 0), 0);
    const budgetUsage = (totalSpend / campaign.budget) * 100;

    if (budgetUsage >= 100) {
      alerts.push(`Budget exceeded: $${totalSpend.toLocaleString()} / $${campaign.budget.toLocaleString()}`);
    } else if (budgetUsage >= 90) {
      alerts.push(`Budget warning: ${budgetUsage.toFixed(0)}% used ($${totalSpend.toLocaleString()} / $${campaign.budget.toLocaleString()})`);
    } else if (budgetUsage >= 75) {
      alerts.push(`Budget notice: ${budgetUsage.toFixed(0)}% used ($${totalSpend.toLocaleString()} / $${campaign.budget.toLocaleString()})`);
    }

    setBudgetAlerts(alerts);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-secondary">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {budgetAlerts.length > 0 && (
        <div className="bg-linear-warning/10 border border-linear-warning-border/20 rounded-linear-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-linear-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-linear-warning mb-1">Budget Alerts</h4>
              <ul className="text-sm text-linear-warning space-y-1">
                {budgetAlerts.map((alert, idx) => (
                  <li key={idx}>{alert}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
              <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Total Spend</span>
            </div>
            <p className="text-2xl font-medium mb-1">${metrics.totalSpend.toLocaleString()}</p>
            {metrics.spendTrend !== 0 && (
              <p className={`text-xs ${metrics.spendTrend > 0 ? 'text-linear-error' : 'text-linear-success'}`}>
                {metrics.spendTrend > 0 ? '+' : ''}{metrics.spendTrend.toFixed(1)}% vs previous period
              </p>
            )}
          </div>

          <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
              <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Total Revenue</span>
            </div>
            <p className="text-2xl font-medium mb-1">${metrics.totalRevenue.toLocaleString()}</p>
            {metrics.revenueTrend !== 0 && (
              <p className={`text-xs ${metrics.revenueTrend > 0 ? 'text-linear-success' : 'text-linear-error'}`}>
                {metrics.revenueTrend > 0 ? '+' : ''}{metrics.revenueTrend.toFixed(1)}% vs previous period
              </p>
            )}
          </div>

          <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
              <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Average ROI</span>
            </div>
            <p className={`text-2xl font-medium ${
              metrics.avgROI >= 0 ? 'text-linear-success' : 'text-linear-error'
            }`}>
              {metrics.avgROI.toFixed(1)}%
            </p>
            <p className="text-xs dark:text-text-secondary light:text-text-light-secondary">
              Net: ${(metrics.totalRevenue - metrics.totalSpend).toLocaleString()}
            </p>
          </div>

          <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
              <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Ad Sets</span>
            </div>
            <p className="text-2xl font-medium mb-1">{metrics.adSetCount}</p>
            <p className="text-xs dark:text-text-secondary light:text-text-light-secondary">
              {metrics.activeAdSets} active
            </p>
          </div>
        </div>
      )}

      {timeSeriesData.length > 0 && (
        <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium">Performance Over Time</h3>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-1 text-sm dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>

          <div className="mb-8">
            <h4 className="text-sm font-medium mb-4 dark:text-text-secondary light:text-text-light-secondary">Cumulative Spend vs Revenue</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="spend"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Spend"
                  dot={{ fill: '#ef4444' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Revenue"
                  dot={{ fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4 dark:text-text-secondary light:text-text-light-secondary">ROI Trend</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'ROI']}
                />
                <Bar
                  dataKey="roi"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {timeSeriesData.length === 0 && (
        <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-12 text-center">
          <BarChart3 className="w-12 h-12 dark:text-text-tertiary light:text-text-light-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
          <p className="dark:text-text-secondary light:text-text-light-secondary">
            Add ad sets with spend and revenue data to see analytics
          </p>
        </div>
      )}
    </div>
  );
}
