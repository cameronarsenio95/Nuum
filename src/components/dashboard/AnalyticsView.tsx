import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Target, BarChart3, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CampaignDetailModal from './CampaignDetailModal';
import CreatorDetailModal from './CreatorDetailModal';

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

type DateRange = '7d' | '14d' | '30d' | 'all';

export default function AnalyticsView({ workspaceId }: AnalyticsViewProps) {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignPerformance[]>([]);
  const [topCreators, setTopCreators] = useState<CreatorPerformance[]>([]);
  const [platformData, setPlatformData] = useState<PlatformPerformance[]>([]);

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [campaignDetails, setCampaignDetails] = useState<any>(null);
  const [creatorDetails, setCreatorDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const getDateRangeFilter = (range: DateRange) => {
    if (range === 'all') return { start: null, end: null };

    const end = new Date();
    const start = new Date();

    switch (range) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '14d':
        start.setDate(end.getDate() - 14);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
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

      console.log('[ANALYTICS] Loading analytics for workspace:', workspaceId);
      console.log('[ANALYTICS] Date range:', { start, end, dateRange });

      // Load all campaigns for this workspace
      const { data: allCampaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (campaignsError) {
        console.error('[ANALYTICS] Error loading campaigns:', campaignsError);
      }

      console.log('[ANALYTICS] Found campaigns:', allCampaigns?.length);

      // Load all ad sets for these campaigns
      let adSetsQuery = supabase
        .from('ad_sets')
        .select('*, campaign:campaigns!inner(id, name, status, workspace_id), creator:creators(id, name)')
        .eq('campaign.workspace_id', workspaceId);

      // Apply date filter if specified
      if (start) {
        adSetsQuery = adSetsQuery.gte('created_at', start);
      }
      if (end) {
        adSetsQuery = adSetsQuery.lte('created_at', end);
      }

      const { data: adSetsData, error: adSetsError } = await adSetsQuery;

      if (adSetsError) {
        console.error('[ANALYTICS] Error loading ad sets:', adSetsError);
      }

      console.log('[ANALYTICS] Found ad sets:', adSetsData?.length);

      // Calculate summary metrics
      const totalRevenue = adSetsData?.reduce((sum, ad) => sum + (Number(ad.revenue) || 0), 0) || 0;
      const totalSpend = adSetsData?.reduce((sum, ad) => sum + (Number(ad.spend) || 0), 0) || 0;
      const totalProfit = totalRevenue - totalSpend;
      const overallROI = totalSpend > 0 ? ((totalProfit / totalSpend) * 100) : 0;
      const totalConversions = adSetsData?.reduce((sum, ad) => sum + (Number(ad.conversions) || 0), 0) || 0;
      const totalClicks = adSetsData?.reduce((sum, ad) => sum + (Number(ad.clicks) || 0), 0) || 0;
      const totalImpressions = adSetsData?.reduce((sum, ad) => sum + (Number(ad.impressions) || 0), 0) || 0;
      const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100) : 0;

      setSummary({
        total_campaigns: allCampaigns?.length || 0,
        active_campaigns: allCampaigns?.filter(c => c.status === 'active').length || 0,
        total_creators: new Set(adSetsData?.map(ad => ad.creator_id) || []).size,
        total_ad_sets: adSetsData?.length || 0,
        total_revenue: totalRevenue,
        total_spend: totalSpend,
        total_profit: totalProfit,
        overall_roi: overallROI,
        total_conversions: totalConversions,
        total_clicks: totalClicks,
        total_impressions: totalImpressions,
        avg_ctr: avgCTR
      });

      console.log('[ANALYTICS] Summary:', { totalRevenue, totalSpend, totalProfit, overallROI });

      // Calculate campaign performance
      const campaignMetrics = (allCampaigns || []).map(campaign => {
        const campaignAdSets = adSetsData?.filter(ad => ad.campaign_id === campaign.id) || [];
        const revenue = campaignAdSets.reduce((sum, ad) => sum + (Number(ad.revenue) || 0), 0);
        const spend = campaignAdSets.reduce((sum, ad) => sum + (Number(ad.spend) || 0), 0);
        const profit = revenue - spend;
        const roi = spend > 0 ? ((profit / spend) * 100) : 0;
        const conversions = campaignAdSets.reduce((sum, ad) => sum + (Number(ad.conversions) || 0), 0);
        const clicks = campaignAdSets.reduce((sum, ad) => sum + (Number(ad.clicks) || 0), 0);
        const impressions = campaignAdSets.reduce((sum, ad) => sum + (Number(ad.impressions) || 0), 0);
        const ctr = impressions > 0 ? ((clicks / impressions) * 100) : 0;

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          total_revenue: revenue,
          total_spend: spend,
          profit: profit,
          roi_percentage: roi,
          total_conversions: conversions,
          avg_ctr: ctr
        };
      });

      const sortedCampaigns = campaignMetrics
        .filter(c => c.total_revenue > 0 || c.total_spend > 0)
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10);

      console.log('[ANALYTICS] Campaign metrics:', sortedCampaigns);
      setCampaigns(sortedCampaigns);

      // Calculate creator performance directly from ad sets
      const { data: allCreators, error: creatorsLoadError } = await supabase
        .from('creators')
        .select('id, name')
        .eq('workspace_id', workspaceId);

      if (creatorsLoadError) {
        console.error('[ANALYTICS] Error loading creators:', creatorsLoadError);
        setTopCreators([]);
      } else {
        const creatorMetrics = (allCreators || []).map(creator => {
          const creatorAdSets = adSetsData?.filter(ad => ad.creator_id === creator.id) || [];
          const revenue = creatorAdSets.reduce((sum, ad) => sum + (Number(ad.revenue) || 0), 0);
          const spend = creatorAdSets.reduce((sum, ad) => sum + (Number(ad.spend) || 0), 0);
          const profit = revenue - spend;
          const roi = spend > 0 ? ((profit / spend) * 100) : 0;
          const conversions = creatorAdSets.reduce((sum, ad) => sum + (Number(ad.conversions) || 0), 0);
          const uniqueCampaigns = new Set(creatorAdSets.map(ad => ad.campaign_id));

          return {
            creator_id: creator.id,
            creator_name: creator.name,
            total_revenue: revenue,
            total_spend: spend,
            profit: profit,
            roi_percentage: roi,
            conversions: conversions,
            campaigns_count: uniqueCampaigns.size
          };
        });

        const sortedCreators = creatorMetrics
          .filter(c => c.total_revenue > 0 || c.campaigns_count > 0)
          .sort((a, b) => b.total_revenue - a.total_revenue)
          .slice(0, 10);

        console.log('[ANALYTICS] Creator metrics:', sortedCreators);
        setTopCreators(sortedCreators);
      }

      // Calculate platform performance directly from ad sets
      const platformMetrics = (adSetsData || []).reduce((acc: any[], ad: any) => {
        const platform = ad.platform || 'Unknown';
        const existing = acc.find(p => p.platform === platform);

        const revenue = Number(ad.revenue) || 0;
        const spend = Number(ad.spend) || 0;
        const conversions = Number(ad.conversions) || 0;

        if (existing) {
          existing.total_revenue += revenue;
          existing.total_spend += spend;
          existing.total_conversions += conversions;
        } else {
          acc.push({
            platform: platform,
            total_revenue: revenue,
            total_spend: spend,
            total_conversions: conversions
          });
        }
        return acc;
      }, []);

      // Calculate profit and ROI for each platform
      platformMetrics.forEach(p => {
        p.profit = p.total_revenue - p.total_spend;
        p.roi_percentage = p.total_spend > 0
          ? Number(((p.profit / p.total_spend) * 100).toFixed(2))
          : 0;
      });

      console.log('[ANALYTICS] Platform metrics:', platformMetrics);
      setPlatformData(platformMetrics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  const exportToCSV = () => {
    if (!campaigns.length) return;

    const headers = ['Campaign', 'Status', 'Revenue', 'Costs', 'Profit', 'ROI %', 'Conversions', 'CTR %'];
    const rows = campaigns.map(c => [
      c.name,
      c.status,
      c.total_revenue,
      c.total_spend,
      c.profit,
      Math.round(c.roi_percentage),
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

  async function loadCampaignDetails(campaignId: string) {
    try {
      setDetailsLoading(true);

      const { data: campaignData, error: campaignError } = await supabase
        .from('campaign_performance_summary')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;

      const { data: adSetsData, error: adSetsError } = await supabase
        .from('ad_sets')
        .select('*')
        .eq('campaign_id', campaignId);

      if (adSetsError) throw adSetsError;

      setCampaignDetails({
        campaign: campaignData,
        adSets: adSetsData || []
      });
    } catch (error) {
      console.error('Error loading campaign details:', error);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function loadCreatorDetails(creatorId: string, creatorIndex: number) {
    try {
      setDetailsLoading(true);

      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select('*')
        .eq('id', creatorId)
        .single();

      if (creatorError) throw creatorError;

      const { data: adSetsData, error: adSetsError } = await supabase
        .from('ad_sets')
        .select('*, campaign:campaigns(id, name, status)')
        .eq('creator_id', creatorId);

      if (adSetsError) throw adSetsError;

      const campaignMetrics = (adSetsData || []).reduce((acc: any[], adSet: any) => {
        const campaignId = adSet.campaign?.id;
        if (!campaignId) return acc;

        let existing = acc.find(c => c.campaign_id === campaignId);
        if (!existing) {
          existing = {
            campaign_id: campaignId,
            campaign_name: adSet.campaign.name,
            campaign_status: adSet.campaign.status,
            revenue: 0,
            spend: 0,
            conversions: 0,
            roi: 0
          };
          acc.push(existing);
        }

        existing.revenue += Number(adSet.revenue) || 0;
        existing.spend += Number(adSet.spend) || 0;
        existing.conversions += Number(adSet.conversions) || 0;

        return acc;
      }, []);

      campaignMetrics.forEach((c: any) => {
        c.roi = c.spend > 0 ? ((c.revenue - c.spend) / c.spend) * 100 : 0;
      });

      const creatorPerformance = topCreators.find(c => c.creator_id === creatorId);

      setCreatorDetails({
        creator: {
          ...creatorPerformance,
          email: creatorData.email,
          phone: creatorData.phone,
          instagram_handle: creatorData.instagram_handle,
          tiktok_handle: creatorData.tiktok_handle,
          snapchat_handle: creatorData.snapchat_handle,
          discount_code: creatorData.discount_code,
          tags: creatorData.tags,
          notes: creatorData.notes,
          status: creatorData.status,
          follower_count: creatorData.follower_count,
          engagement_rate: creatorData.engagement_rate
        },
        campaigns: campaignMetrics,
        rank: creatorIndex + 1
      });
    } catch (error) {
      console.error('Error loading creator details:', error);
    } finally {
      setDetailsLoading(false);
    }
  }

  function handleCampaignClick(campaignId: string) {
    setSelectedCampaignId(campaignId);
    loadCampaignDetails(campaignId);
  }

  function handleCreatorClick(creatorId: string, index: number) {
    setSelectedCreatorId(creatorId);
    loadCreatorDetails(creatorId, index);
  }

  function closeCampaignModal() {
    setSelectedCampaignId(null);
    setCampaignDetails(null);
  }

  function closeCreatorModal() {
    setSelectedCreatorId(null);
    setCreatorDetails(null);
  }

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
              onClick={() => setDateRange('14d')}
              className={`px-3 py-1.5 rounded-linear text-xs md:text-sm font-medium linear-transition ${
                dateRange === '14d'
                  ? 'dark:bg-linear-accent light:bg-linear-light-accent dark:text-linear-bg light:text-linear-light-bg'
                  : 'dark:text-text-secondary light:text-text-light-secondary hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover'
              }`}
            >
              14 Days
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
              <div className="w-10 h-10 bg-red-500/10 rounded-linear flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Costs</span>
            </div>
            <div className="space-y-1">
              <div className="text-xl md:text-2xl font-medium">{formatCurrency(summary.total_spend)}</div>
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
              <div className="text-xl md:text-2xl font-medium">{formatCurrency(summary.total_revenue)}</div>
              <div className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-linear-success" />
                Profit: {formatCurrency(summary.total_profit)}
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
              <div className="text-xl md:text-2xl font-medium">{Math.round(parseFloat(summary.overall_roi))}%</div>
              <div className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary">
                Return on investment
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
              {campaigns.slice(0, 3).map((campaign) => (
                <div
                  key={campaign.id}
                  onClick={() => handleCampaignClick(campaign.id)}
                  className="p-3 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear hover:dark:bg-linear-bg-subtle light:hover:bg-linear-light-bg-subtle linear-transition cursor-pointer"
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
                      {campaign.roi_percentage > 0 ? '+' : ''}{Math.round(campaign.roi_percentage)}% ROI
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
              {topCreators.slice(0, 3).map((creator, index) => (
                <div
                  key={creator.creator_id}
                  onClick={() => handleCreatorClick(creator.creator_id, index)}
                  className="p-3 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear hover:dark:bg-linear-bg-subtle light:hover:bg-linear-light-bg-subtle linear-transition relative cursor-pointer"
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
                        {creator.roi_percentage > 0 ? '+' : ''}{Math.round(creator.roi_percentage)}% ROI
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
                    {Number(platform.roi_percentage) > 0 ? '+' : ''}{Math.round(Number(platform.roi_percentage))}% ROI
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="dark:text-text-secondary light:text-text-light-secondary">Revenue</span>
                    <span className="font-medium">{formatCurrency(platform.total_revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="dark:text-text-secondary light:text-text-light-secondary">Costs</span>
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

      {selectedCampaignId && campaignDetails && !detailsLoading && (
        <CampaignDetailModal
          campaign={campaignDetails.campaign}
          adSets={campaignDetails.adSets}
          onClose={closeCampaignModal}
        />
      )}

      {selectedCreatorId && creatorDetails && !detailsLoading && (
        <CreatorDetailModal
          creator={creatorDetails.creator}
          campaigns={creatorDetails.campaigns}
          rank={creatorDetails.rank}
          onClose={closeCreatorModal}
        />
      )}
    </div>
  );
}
