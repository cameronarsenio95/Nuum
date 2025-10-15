import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, TrendingDown, DollarSign, Target, Users, BarChart3, Download, Calendar } from 'lucide-react';

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

      if (creatorsError) throw creatorsError;
      setTopCreators(creatorsData || []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Comprehensive performance insights</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
            <button
              onClick={() => setDateRange('7d')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                dateRange === '7d'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                dateRange === '30d'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setDateRange('90d')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                dateRange === '90d'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              90 Days
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                dateRange === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              All Time
            </button>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(summary.total_revenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">Profit: {formatCurrency(summary.total_profit)}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">ROI</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {summary.overall_roi}%
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Spend: {formatCurrency(summary.total_spend)}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Conversions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatNumber(summary.total_conversions)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                CTR: {summary.avg_ctr}%
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {summary.active_campaigns}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {summary.total_creators} Creators
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Campaigns</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Campaign</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ROI</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Conv.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{campaign.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{campaign.status}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(campaign.total_revenue)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(campaign.profit)} profit
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        campaign.roi_percentage > 0
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {campaign.roi_percentage > 0 ? '+' : ''}{campaign.roi_percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 dark:text-white font-medium">
                      {formatNumber(campaign.total_conversions)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Creators</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Creator</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ROI</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Campaigns</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {topCreators.map((creator) => (
                  <tr key={creator.creator_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{creator.creator_name}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(creator.total_revenue)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        creator.roi_percentage > 0
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {creator.roi_percentage > 0 ? '+' : ''}{creator.roi_percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 dark:text-white font-medium">
                      {creator.campaigns_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {platformData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Platform Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {platformData.map((platform) => (
              <div key={platform.platform} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{platform.platform}</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    Number(platform.roi_percentage) > 0
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {Number(platform.roi_percentage) > 0 ? '+' : ''}{platform.roi_percentage}% ROI
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Revenue</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(platform.total_revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Spend</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(platform.total_spend)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Conversions</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatNumber(platform.total_conversions)}
                    </span>
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
