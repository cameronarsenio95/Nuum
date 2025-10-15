import { useState } from 'react';
import { FileText, Download, Calendar, Filter, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { exportToPDF, exportToCSV, exportToJSON } from '../../utils/exportUtils';

interface ReportGeneratorProps {
  workspaceId: string;
}

type ReportType = 'campaign-performance' | 'creator-performance' | 'content-summary' | 'roi-analysis' | 'custom';
type DateRange = '7d' | '30d' | '90d' | 'custom';
type ExportFormat = 'pdf' | 'csv' | 'json';

export function ReportGenerator({ workspaceId }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<ReportType>('campaign-performance');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [includeSections, setIncludeSections] = useState({
    summary: true,
    metrics: true,
    charts: true,
    details: true
  });
  const [generating, setGenerating] = useState(false);

  const getDateRangeFilter = () => {
    const now = new Date();
    let startFilter = '';

    switch (dateRange) {
      case '7d':
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        startFilter = sevenDaysAgo.toISOString();
        break;
      case '30d':
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        startFilter = thirtyDaysAgo.toISOString();
        break;
      case '90d':
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(now.getDate() - 90);
        startFilter = ninetyDaysAgo.toISOString();
        break;
      case 'custom':
        startFilter = startDate ? new Date(startDate).toISOString() : '';
        break;
    }

    return startFilter;
  };

  const generateCampaignPerformanceReport = async () => {
    const startFilter = getDateRangeFilter();

    let query = supabase
      .from('campaigns')
      .select('*, ad_sets(*)')
      .eq('workspace_id', workspaceId);

    if (startFilter) {
      query = query.gte('created_at', startFilter);
    }

    if (dateRange === 'custom' && endDate) {
      query = query.lte('created_at', new Date(endDate).toISOString());
    }

    const { data: campaigns, error } = await query;

    if (error) {
      console.error('Error fetching campaigns:', error);
      return null;
    }

    const reportData = {
      title: 'Campaign Performance Report',
      dateRange: dateRange === 'custom' ? `${startDate} to ${endDate}` : dateRange,
      generatedAt: new Date().toISOString(),
      sections: [] as any[]
    };

    if (includeSections.summary) {
      const totalCampaigns = campaigns?.length || 0;
      const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
      const totalAdSets = campaigns?.reduce((sum, c) => sum + ((c as any).ad_sets?.length || 0), 0) || 0;

      reportData.sections.push({
        title: 'Executive Summary',
        data: {
          'Total Campaigns': totalCampaigns,
          'Active Campaigns': activeCampaigns,
          'Total Ad Sets': totalAdSets
        }
      });
    }

    if (includeSections.metrics) {
      const campaignMetrics = campaigns?.map((campaign: any) => {
        const adSets = campaign.ad_sets || [];
        const totalSpend = adSets.reduce((sum: number, ad: any) => sum + (ad.spend || 0), 0);
        const totalRevenue = adSets.reduce((sum: number, ad: any) => sum + (ad.revenue || 0), 0);
        const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

        return {
          name: campaign.name,
          status: campaign.status,
          adSets: adSets.length,
          spend: totalSpend,
          revenue: totalRevenue,
          roi: roi.toFixed(2) + '%'
        };
      });

      reportData.sections.push({
        title: 'Campaign Metrics',
        data: campaignMetrics
      });
    }

    if (includeSections.details) {
      const campaignDetails = campaigns?.map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        created: new Date(campaign.created_at).toLocaleDateString(),
        adSetsCount: (campaign.ad_sets || []).length
      }));

      reportData.sections.push({
        title: 'Campaign Details',
        data: campaignDetails
      });
    }

    return reportData;
  };

  const generateCreatorPerformanceReport = async () => {
    const startFilter = getDateRangeFilter();

    const { data: creators } = await supabase
      .from('creators')
      .select('*, ad_sets(*)')
      .eq('workspace_id', workspaceId);

    if (!creators) return null;

    const reportData = {
      title: 'Creator Performance Report',
      dateRange: dateRange === 'custom' ? `${startDate} to ${endDate}` : dateRange,
      generatedAt: new Date().toISOString(),
      sections: [] as any[]
    };

    if (includeSections.summary) {
      const totalCreators = creators.length;
      const activeCreators = creators.filter(c => c.status === 'active').length;

      reportData.sections.push({
        title: 'Creator Summary',
        data: {
          'Total Creators': totalCreators,
          'Active Creators': activeCreators
        }
      });
    }

    if (includeSections.metrics) {
      const creatorMetrics = creators.map((creator: any) => {
        const adSets = creator.ad_sets || [];
        const filteredAdSets = startFilter
          ? adSets.filter((ad: any) => new Date(ad.created_at) >= new Date(startFilter))
          : adSets;

        const totalRevenue = filteredAdSets.reduce((sum: number, ad: any) => sum + (ad.revenue || 0), 0);
        const totalSpend = filteredAdSets.reduce((sum: number, ad: any) => sum + (ad.spend || 0), 0);
        const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

        return {
          name: creator.name,
          email: creator.email || 'N/A',
          status: creator.status,
          adSets: filteredAdSets.length,
          revenue: totalRevenue,
          spend: totalSpend,
          roi: roi.toFixed(2) + '%'
        };
      }).sort((a, b) => b.revenue - a.revenue);

      reportData.sections.push({
        title: 'Creator Performance Metrics',
        data: creatorMetrics
      });
    }

    return reportData;
  };

  const generateReport = async () => {
    setGenerating(true);

    try {
      let reportData = null;

      switch (reportType) {
        case 'campaign-performance':
          reportData = await generateCampaignPerformanceReport();
          break;
        case 'creator-performance':
          reportData = await generateCreatorPerformanceReport();
          break;
        default:
          alert('Report type not implemented yet');
          setGenerating(false);
          return;
      }

      if (!reportData) {
        alert('Failed to generate report');
        setGenerating(false);
        return;
      }

      switch (exportFormat) {
        case 'pdf':
          exportToPDF(reportData, `${reportType}-report`);
          break;
        case 'csv':
          exportToCSV(reportData.sections[reportData.sections.length - 1].data, `${reportType}-report`);
          break;
        case 'json':
          exportToJSON(reportData, `${reportType}-report`);
          break;
      }
    } catch (error) {
      console.error('Report generation error:', error);
      alert('Failed to generate report');
    }

    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium mb-6 flex items-center gap-3">
          <FileText className="w-7 h-7 dark:text-linear-accent light:text-linear-light-accent" />
          Report Generator
        </h2>
      </div>

      <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
          >
            <option value="campaign-performance">Campaign Performance</option>
            <option value="creator-performance">Creator Performance</option>
            <option value="content-summary">Content Summary</option>
            <option value="roi-analysis">ROI Analysis</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date Range
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {dateRange === 'custom' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-3 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Include Sections
          </label>
          <div className="space-y-2">
            {Object.entries(includeSections).map(([key, value]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setIncludeSections(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="w-4 h-4 rounded border-linear-border focus:ring-2 focus:ring-linear-accent"
                />
                <span className="text-sm capitalize">{key}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Export Format</label>
          <div className="flex gap-3">
            {(['pdf', 'csv', 'json'] as ExportFormat[]).map(format => (
              <button
                key={format}
                onClick={() => setExportFormat(format)}
                className={`px-4 py-2 rounded-linear border text-sm linear-transition ${
                  exportFormat === format
                    ? 'dark:bg-linear-accent/10 light:bg-linear-light-accent/10 border-linear-accent'
                    : 'dark:bg-linear-bg light:bg-linear-light-bg dark:border-linear-border light:border-linear-light-border hover:dark:border-linear-border-subtle hover:light:border-linear-light-border'
                }`}
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition disabled:opacity-50"
        >
          <Download className="w-5 h-5" />
          {generating ? 'Generating Report...' : 'Generate & Download Report'}
        </button>
      </div>
    </div>
  );
}
