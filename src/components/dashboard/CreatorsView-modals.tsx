import { X, Plus, Link2, Edit2, DollarSign, TrendingUp, Target, Zap, Mail, Phone, Award, Download, FileText, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { Database } from '../../lib/database.types';
import { exportCreatorPerformancePdf, exportCreatorPerformanceCsv } from '../../utils/exportCreatorAnalytics';
import { supabase } from '../../lib/supabase';
import { useState, useEffect, useMemo } from 'react';
import { useCurrentWorkspace } from '../../hooks/useCurrentWorkspace';

type Creator = Database['public']['Tables']['creators']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];
type AdSet = Database['public']['Tables']['ad_sets']['Row'];

interface CreatorFormProps {
  newCreator: {
    name: string;
    email: string;
    phone: string;
    instagram_handle: string;
    tiktok_handle: string;
    snapchat_handle: string;
    notes: string;
    status: 'active' | 'inactive' | 'blacklisted';
    tags: string[];
    discount_code?: string;
  };
  setNewCreator: (creator: any) => void;
  tagInput: string;
  setTagInput: (value: string) => void;
  addTag: () => void;
  removeTag: (tag: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
  title: string;
  onDelete?: () => void;
}

export function CreatorFormModal({
  newCreator,
  setNewCreator,
  tagInput,
  setTagInput,
  addTag,
  removeTag,
  onSubmit,
  onCancel,
  submitLabel,
  title,
  onDelete,
}: CreatorFormProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={onCancel}>
      <div className="bg-nuum-surface border border-nuum-border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium">{title}</h3>
          <button onClick={onCancel} className="p-1 hover:bg-nuum-border rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Name <span className="text-nuum-accent-red">*</span>
              </label>
              <input
                type="text"
                value={newCreator.name}
                onChange={(e) => setNewCreator({ ...newCreator, name: e.target.value })}
                className="w-full px-4 py-2 bg-nuum-background border border-nuum-border rounded-lg focus:outline-none focus:border-nuum-accent-blue"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={newCreator.status}
                onChange={(e) => setNewCreator({ ...newCreator, status: e.target.value as any })}
                className="w-full px-4 py-2 bg-nuum-background border border-nuum-border rounded-lg focus:outline-none focus:border-nuum-accent-blue"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blacklisted">Blacklisted</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={newCreator.email}
                onChange={(e) => setNewCreator({ ...newCreator, email: e.target.value })}
                className="w-full px-4 py-2 bg-nuum-background border border-nuum-border rounded-lg focus:outline-none focus:border-nuum-accent-blue"
                placeholder="creator@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={newCreator.phone}
                onChange={(e) => setNewCreator({ ...newCreator, phone: e.target.value })}
                className="w-full px-4 py-2 bg-nuum-background border border-nuum-border rounded-lg focus:outline-none focus:border-nuum-accent-blue"
                placeholder="+31 6 12345678"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Instagram</label>
              <input
                type="text"
                value={newCreator.instagram_handle}
                onChange={(e) => setNewCreator({ ...newCreator, instagram_handle: e.target.value })}
                className="w-full px-4 py-2 bg-nuum-background border border-nuum-border rounded-lg focus:outline-none focus:border-nuum-accent-blue"
                placeholder="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">TikTok</label>
              <input
                type="text"
                value={newCreator.tiktok_handle}
                onChange={(e) => setNewCreator({ ...newCreator, tiktok_handle: e.target.value })}
                className="w-full px-4 py-2 bg-nuum-background border border-nuum-border rounded-lg focus:outline-none focus:border-nuum-accent-blue"
                placeholder="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Snapchat</label>
              <input
                type="text"
                value={newCreator.snapchat_handle}
                onChange={(e) => setNewCreator({ ...newCreator, snapchat_handle: e.target.value })}
                className="w-full px-4 py-2 bg-nuum-background border border-nuum-border rounded-lg focus:outline-none focus:border-nuum-accent-blue"
                placeholder="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Discount Code</label>
            <input
              type="text"
              value={newCreator.discount_code || ''}
              onChange={(e) => setNewCreator({ ...newCreator, discount_code: e.target.value })}
              className="w-full px-4 py-2 bg-nuum-background border border-nuum-border rounded-lg focus:outline-none focus:border-nuum-accent-blue"
              placeholder="e.g., CREATOR10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={newCreator.notes}
              onChange={(e) => setNewCreator({ ...newCreator, notes: e.target.value })}
              className="w-full px-4 py-2 bg-nuum-background border border-nuum-border rounded-lg focus:outline-none focus:border-nuum-accent-blue h-24"
            />
          </div>

          <div className="flex gap-3 mt-6">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 bg-nuum-dark-red hover:bg-nuum-accent-red text-nuum-accent-red hover:text-white border border-nuum-accent-red/20 rounded-lg linear-transition"
              >
                Delete
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-nuum-border hover:bg-nuum-border/70 rounded-lg linear-transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-nuum-accent-blue hover:bg-nuum-dark-blue text-white rounded-lg linear-transition"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DetailModalProps {
  creator: Creator;
  adSets: AdSet[];
  onClose: () => void;
  onEdit: () => void;
  onAddToCampaign: () => void;
  onRemoveAdSet: (id: string) => void;
}

export function CreatorDetailModal({
  creator,
  adSets,
  onClose,
  onEdit,
  onAddToCampaign,
  onRemoveAdSet,
}: DetailModalProps) {
  const { workspace } = useCurrentWorkspace();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sortBy, setSortBy] = useState<'roi' | 'revenue'>('roi');
  const [isExporting, setIsExporting] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalRevenue = adSets.reduce((sum, adSet) => sum + (Number(adSet.revenue) || 0), 0);
  const totalSpend = adSets.reduce((sum, adSet) => sum + (Number(adSet.spend) || 0), 0);
  const profit = totalRevenue - totalSpend;
  const roi = totalSpend > 0 ? ((profit / totalSpend) * 100) : 0;
  const activeCount = adSets.filter(as => as.status === 'active').length;

  useEffect(() => {
    loadCampaignData();
  }, [creator.id]);

  const loadCampaignData = async () => {
    const campaignIds = [...new Set(adSets.map(as => as.campaign_id))];
    if (campaignIds.length === 0) return;

    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .in('id', campaignIds);

    if (data) setCampaigns(data);
  };

  const campaignPerformance = useMemo(() => {
    const perfMap = new Map<string, {
      campaign: Campaign;
      adSetCount: number;
      spend: number;
      revenue: number;
      roi: number;
      status: string;
    }>();

    adSets.forEach(adSet => {
      const campaign = campaigns.find(c => c.id === adSet.campaign_id);
      if (!campaign) return;

      const existing = perfMap.get(campaign.id);
      const spend = Number(adSet.spend) || 0;
      const revenue = Number(adSet.revenue) || 0;

      if (existing) {
        existing.adSetCount++;
        existing.spend += spend;
        existing.revenue += revenue;
      } else {
        perfMap.set(campaign.id, {
          campaign,
          adSetCount: 1,
          spend,
          revenue,
          roi: 0,
          status: adSet.status,
        });
      }
    });

    perfMap.forEach(perf => {
      perf.roi = perf.spend > 0 ? ((perf.revenue - perf.spend) / perf.spend) * 100 : 0;
    });

    const sorted = Array.from(perfMap.values()).sort((a, b) => {
      if (sortBy === 'roi') return b.roi - a.roi;
      return b.revenue - a.revenue;
    });

    return sorted;
  }, [adSets, campaigns, sortBy]);

  const chartData = useMemo(() => {
    return campaignPerformance.slice(0, 5).map(cp => ({
      name: cp.campaign.name.length > 12 ? cp.campaign.name.substring(0, 12) + '...' : cp.campaign.name,
      revenue: cp.revenue,
    }));
  }, [campaignPerformance]);

  const topCampaign = campaignPerformance.length > 0 ? campaignPerformance[0] : null;
  const performanceSummary = topCampaign
    ? `Top Campaign: ${topCampaign.campaign.name} (ROI +${Math.round(topCampaign.roi)}%) • Total Revenue ${formatCurrency(totalRevenue)} across ${campaignPerformance.length} campaign${campaignPerformance.length !== 1 ? 's' : ''}.`
    : `No campaign data available yet.`;

  const getPrimaryHandle = () => {
    return creator.instagram_handle || creator.tiktok_handle || creator.snapchat_handle;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-nuum-accent-green bg-nuum-dark-green border-nuum-accent-green/20';
      case 'inactive':
        return 'text-nuum-text-secondary bg-nuum-border border-nuum-border';
      case 'blacklisted':
        return 'text-nuum-accent-red bg-nuum-dark-red border-nuum-accent-red/20';
      default:
        return 'text-nuum-text-secondary bg-nuum-border border-nuum-border';
    }
  };

  const handleExportPDF = () => {
    if (campaignPerformance.length === 0 || !workspace) return;

    setIsExporting(true);
    try {
      const platformStats = new Map<string, { creators: number; revenue: number }>();

      adSets.forEach(adSet => {
        const platform = adSet.platform === 'META' ? 'Instagram' : adSet.platform;
        const revenue = Number(adSet.revenue) || 0;

        if (!platformStats.has(platform)) {
          platformStats.set(platform, { creators: 1, revenue: 0 });
        }
        platformStats.get(platform)!.revenue += revenue;
      });

      const totalPlatformRevenue = Array.from(platformStats.values()).reduce((sum, p) => sum + p.revenue, 0);

      const platforms = Array.from(platformStats.entries()).map(([platform, stats]) => ({
        platform,
        creators: stats.creators,
        revenue: stats.revenue,
        share: totalPlatformRevenue > 0 ? (stats.revenue / totalPlatformRevenue) * 100 : 0,
      }));

      const primaryPlatform = platforms.length > 0
        ? platforms.reduce((max, p) => p.revenue > max.revenue ? p : max).platform
        : undefined;

      exportCreatorPerformancePdf({
        workspaceName: workspace.name,
        creatorName: creator.name,
        creatorHandle: creator.instagram_handle || creator.tiktok_handle || creator.snapchat_handle || undefined,
        generatedAt: new Date(),
        timeFilterLabel: 'All time',
        statusFilterLabel: 'All statuses',
        summary: {
          totalSpend,
          totalRevenue,
          avgRoi: roi,
          activeCampaigns: activeCount,
        },
        campaigns: campaignPerformance.map(cp => ({
          name: cp.campaign.name,
          status: cp.status,
          adSets: cp.adSetCount,
          spend: cp.spend,
          revenue: cp.revenue,
          roi: cp.roi,
        })),
        topCreatorRow: {
          rank: 1,
          name: creator.name,
          handle: creator.instagram_handle || creator.tiktok_handle || creator.snapchat_handle || undefined,
          platform: primaryPlatform,
          revenue: totalRevenue,
        },
        platforms,
      });
    } catch (error) {
      console.error('PDF export error:', error);
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  const handleExportCSV = () => {
    if (campaignPerformance.length === 0 || !workspace) return;

    const platformStats = new Map<string, { creators: number; revenue: number }>();

    adSets.forEach(adSet => {
      const platform = adSet.platform === 'META' ? 'Instagram' : adSet.platform;
      const revenue = Number(adSet.revenue) || 0;

      if (!platformStats.has(platform)) {
        platformStats.set(platform, { creators: 1, revenue: 0 });
      }
      platformStats.get(platform)!.revenue += revenue;
    });

    const totalPlatformRevenue = Array.from(platformStats.values()).reduce((sum, p) => sum + p.revenue, 0);

    const platforms = Array.from(platformStats.entries()).map(([platform, stats]) => ({
      platform,
      creators: stats.creators,
      revenue: stats.revenue,
      share: totalPlatformRevenue > 0 ? (stats.revenue / totalPlatformRevenue) * 100 : 0,
    }));

    exportCreatorPerformanceCsv({
      workspaceName: workspace.name,
      creatorName: creator.name,
      creatorHandle: creator.instagram_handle || creator.tiktok_handle || creator.snapchat_handle || undefined,
      generatedAt: new Date(),
      timeFilterLabel: 'All time',
      statusFilterLabel: 'All statuses',
      summary: {
        totalSpend,
        totalRevenue,
        avgRoi: roi,
        activeCampaigns: activeCount,
      },
      campaigns: campaignPerformance.map(cp => ({
        name: cp.campaign.name,
        status: cp.status,
        adSets: cp.adSetCount,
        spend: cp.spend,
        revenue: cp.revenue,
        roi: cp.roi,
      })),
      platforms,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-nuum-background border border-nuum-border rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto transition-opacity duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-nuum-surface border-b border-nuum-border p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold">{creator.name}</h2>
                {getPrimaryHandle() && (
                  <span className="text-sm text-nuum-text-secondary">
                    @{getPrimaryHandle()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleExportPDF}
              disabled={isExporting || campaignPerformance.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-nuum-background hover:bg-nuum-border border border-nuum-border rounded-lg linear-transition disabled:opacity-50"
              title="Export PDF Report"
            >
              <FileText className="w-3.5 h-3.5" />
              PDF
            </button>
            <button
              onClick={handleExportCSV}
              disabled={campaignPerformance.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-nuum-background hover:bg-nuum-border border border-nuum-border rounded-lg linear-transition disabled:opacity-50"
              title="Export CSV Data"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <span className={`inline-flex text-xs px-2.5 py-1 rounded-full border ${getStatusColor(creator.status)}`}>
              {creator.status}
            </span>
            <button
              onClick={onEdit}
              className="p-2 hover:bg-nuum-border rounded-lg linear-transition"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-nuum-border rounded-lg linear-transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-nuum-surface border border-nuum-border hover:border-[#3e559e] rounded-xl p-4 linear-transition">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 bg-nuum-dark-red rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-nuum-accent-red" />
                </div>
                <span className="text-xs text-nuum-text-secondary">Total Spend</span>
              </div>
              <div>
                <div className="text-xl font-semibold">{formatCurrency(totalSpend)}</div>
                <div className="text-sm text-nuum-text-secondary mt-0.5">
                  Investment
                </div>
              </div>
            </div>

            <div className="bg-nuum-surface border border-nuum-border hover:border-[#3e559e] rounded-xl p-4 linear-transition">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 bg-nuum-dark-green rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-nuum-accent-green" />
                </div>
                <span className="text-xs text-nuum-text-secondary">Total Revenue</span>
              </div>
              <div>
                <div className="text-xl font-semibold">{formatCurrency(totalRevenue)}</div>
                <div className="text-sm text-nuum-text-secondary mt-0.5">
                  Generated
                </div>
              </div>
            </div>

            <div className="bg-nuum-surface border border-nuum-border hover:border-[#3e559e] rounded-xl p-4 linear-transition">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 bg-nuum-dark-blue rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-nuum-accent-blue" />
                </div>
                <span className="text-xs text-nuum-text-secondary">Avg ROI</span>
              </div>
              <div>
                <div className={`text-xl font-semibold ${roi > 0 ? 'text-nuum-accent-green' : 'text-nuum-accent-red'}`}>
                  {roi > 0 ? '+' : ''}{Math.round(roi)}%
                </div>
                <div className="text-sm text-nuum-text-secondary mt-0.5">
                  Return
                </div>
              </div>
            </div>

            <div className="bg-nuum-surface border border-nuum-border hover:border-[#3e559e] rounded-xl p-4 linear-transition">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 bg-nuum-dark-blue rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-nuum-accent-blue" />
                </div>
                <span className="text-xs text-nuum-text-secondary">Active Campaigns</span>
              </div>
              <div>
                <div className="text-xl font-semibold">{activeCount}</div>
                <div className="text-sm text-nuum-text-secondary mt-0.5">
                  {adSets.length} total
                </div>
              </div>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="bg-nuum-surface border border-nuum-border rounded-xl p-4">
              <h3 className="text-sm font-medium mb-3">Performance per Campaign</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3e559e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3e559e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#888', fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#888', fontSize: 11 }}
                    tickLine={false}
                    tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`€${value.toFixed(0)}`, 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3e559e"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                    dot={{ fill: '#3e559e', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {campaignPerformance.length > 0 && (
            <div className="bg-nuum-surface border border-nuum-border rounded-xl p-4">
              <p className="text-xs text-nuum-text-secondary mb-3">
                {performanceSummary}
              </p>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Campaign History</h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-nuum-text-secondary">Sort by:</span>
                  <button
                    onClick={() => setSortBy('roi')}
                    className={`px-2 py-1 rounded linear-transition ${
                      sortBy === 'roi'
                        ? 'bg-nuum-dark-blue text-nuum-accent-blue'
                        : 'text-nuum-text-secondary hover:bg-nuum-border'
                    }`}
                  >
                    ROI
                  </button>
                  <button
                    onClick={() => setSortBy('revenue')}
                    className={`px-2 py-1 rounded linear-transition ${
                      sortBy === 'revenue'
                        ? 'bg-nuum-dark-blue text-nuum-accent-blue'
                        : 'text-nuum-text-secondary hover:bg-nuum-border'
                    }`}
                  >
                    Revenue
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-nuum-border">
                      <th className="text-left py-2 px-2 text-xs text-nuum-text-secondary font-medium">Campaign</th>
                      <th className="text-left py-2 px-2 text-xs text-nuum-text-secondary font-medium">Status</th>
                      <th className="text-right py-2 px-2 text-xs text-nuum-text-secondary font-medium">Ad Sets</th>
                      <th className="text-right py-2 px-2 text-xs text-nuum-text-secondary font-medium">Spend</th>
                      <th className="text-right py-2 px-2 text-xs text-nuum-text-secondary font-medium">Revenue</th>
                      <th className="text-right py-2 px-2 text-xs text-nuum-text-secondary font-medium">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignPerformance.map((cp, idx) => (
                      <tr key={cp.campaign.id} className="border-b border-nuum-border hover:bg-nuum-border linear-transition">
                        <td className="py-2 px-2 font-medium">{cp.campaign.name}</td>
                        <td className="py-2 px-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(cp.status)}`}>
                            {cp.status}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right text-nuum-text-secondary">{cp.adSetCount}</td>
                        <td className="py-2 px-2 text-right text-nuum-text-secondary">{formatCurrency(cp.spend)}</td>
                        <td className="py-2 px-2 text-right font-medium">{formatCurrency(cp.revenue)}</td>
                        <td className="py-2 px-2 text-right font-semibold">
                          <span className={cp.roi > 0 ? 'text-nuum-accent-green' : 'text-nuum-accent-red'}>
                            {cp.roi > 0 ? '+' : ''}{Math.round(cp.roi)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-nuum-border font-semibold">
                      <td className="py-2 px-2" colSpan={3}>Total</td>
                      <td className="py-2 px-2 text-right">{formatCurrency(totalSpend)}</td>
                      <td className="py-2 px-2 text-right">{formatCurrency(totalRevenue)}</td>
                      <td className="py-2 px-2 text-right">
                        <span className={roi > 0 ? 'text-nuum-accent-green' : 'text-nuum-accent-red'}>
                          {roi > 0 ? '+' : ''}{Math.round(roi)}%
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-nuum-surface border border-nuum-border rounded-xl p-4">
              <h3 className="text-sm font-medium mb-3 text-nuum-text-main">Contact & Details</h3>
              <div className="space-y-2">
                {creator.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-nuum-text-secondary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-nuum-text-secondary">Email</div>
                      <a
                        href={`mailto:${creator.email}`}
                        className="text-sm text-nuum-text-main hover:text-nuum-accent-blue truncate block linear-transition"
                      >
                        {creator.email}
                      </a>
                    </div>
                  </div>
                )}
                {creator.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-nuum-text-secondary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-nuum-text-secondary">Phone</div>
                      <a
                        href={`tel:${creator.phone}`}
                        className="text-sm text-nuum-text-main hover:text-nuum-accent-blue linear-transition"
                      >
                        {creator.phone}
                      </a>
                    </div>
                  </div>
                )}
                {!creator.email && !creator.phone && (
                  <p className="text-xs text-nuum-text-secondary">No contact information</p>
                )}
              </div>
            </div>

            <div className="bg-nuum-surface border border-nuum-border rounded-xl p-4">
              <h3 className="text-sm font-medium mb-3 text-nuum-text-main">Social Media & Code</h3>
              <div className="space-y-2">
                {creator.discount_code && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Award className="w-3.5 h-3.5 text-nuum-text-secondary" />
                      <div className="text-xs text-nuum-text-secondary">Discount Code</div>
                    </div>
                    <div className="px-3 py-2 bg-nuum-background rounded-lg border border-nuum-accent-orange/50">
                      <div className="font-mono text-sm font-semibold text-nuum-accent-orange text-center tracking-wider">
                        {creator.discount_code}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  {creator.instagram_handle && (
                    <a
                      href={`https://instagram.com/${creator.instagram_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs group"
                    >
                      <span className="w-16 text-nuum-text-secondary">Instagram</span>
                      <span className="text-nuum-text-main group-hover:text-nuum-accent-blue linear-transition truncate">@{creator.instagram_handle}</span>
                    </a>
                  )}
                  {creator.tiktok_handle && (
                    <a
                      href={`https://tiktok.com/@${creator.tiktok_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs group"
                    >
                      <span className="w-16 text-nuum-text-secondary">TikTok</span>
                      <span className="text-nuum-text-main group-hover:text-nuum-accent-blue linear-transition truncate">@{creator.tiktok_handle}</span>
                    </a>
                  )}
                  {creator.snapchat_handle && (
                    <a
                      href={`https://snapchat.com/add/${creator.snapchat_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs group"
                    >
                      <span className="w-16 text-nuum-text-secondary">Snapchat</span>
                      <span className="text-nuum-text-main group-hover:text-nuum-accent-blue linear-transition truncate">@{creator.snapchat_handle}</span>
                    </a>
                  )}
                  {!creator.instagram_handle && !creator.tiktok_handle && !creator.snapchat_handle && !creator.discount_code && (
                    <p className="text-xs text-nuum-text-secondary">No social media linked</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {creator.tags && creator.tags.length > 0 && (
            <div className="bg-nuum-surface border border-nuum-border rounded-xl p-4">
              <h3 className="text-sm font-medium mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {creator.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs bg-nuum-dark-blue text-nuum-accent-blue rounded-full border border-nuum-accent-blue/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {creator.notes && (
            <div className="bg-nuum-surface border border-nuum-border rounded-xl p-4">
              <h3 className="text-sm font-medium mb-2">Notes</h3>
              <p className="text-sm text-nuum-text-secondary whitespace-pre-wrap">
                {creator.notes}
              </p>
            </div>
          )}

          {adSets.length > 0 && (
            <div className="bg-nuum-surface border border-nuum-border rounded-xl p-4">
              <div className="mb-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Ad Set Performance
                </h3>
              </div>
              <div className="space-y-2">
                {adSets.map((adSet) => {
                  const adSetRevenue = Number(adSet.revenue) || 0;
                  const adSetSpend = Number(adSet.spend) || 0;
                  const adSetProfit = adSetRevenue - adSetSpend;
                  const adSetRoi = adSetSpend > 0 ? ((adSetProfit / adSetSpend) * 100) : 0;

                  return (
                    <div
                      key={adSet.id}
                      className="bg-nuum-background border border-nuum-border rounded-lg p-3 hover:bg-nuum-border linear-transition"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate mb-1">{adSet.name}</div>
                          <span className={`inline-flex text-xs px-2 py-0.5 rounded-full border ${
                            adSet.status === 'active' ? 'text-nuum-accent-green bg-nuum-dark-green border-nuum-accent-green/20' :
                            adSet.status === 'completed' ? 'text-nuum-accent-blue bg-nuum-dark-blue border-nuum-accent-blue/20' :
                            'text-nuum-text-secondary bg-nuum-border border-nuum-border'
                          }`}>
                            {adSet.status}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-semibold text-sm">{formatCurrency(adSetRevenue)}</div>
                          <div className={`text-xs ${adSetRoi > 0 ? 'text-nuum-accent-green' : 'text-nuum-accent-red'}`}>
                            {adSetRoi > 0 ? '+' : ''}{Math.round(adSetRoi)}% ROI
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-nuum-border text-xs">
                        <div>
                          <div className="text-nuum-text-secondary">Costs</div>
                          <div className="font-medium mt-0.5">{formatCurrency(adSetSpend)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-nuum-text-secondary">Profit</div>
                          <div className="font-medium mt-0.5">{formatCurrency(adSetProfit)}</div>
                        </div>
                        <button
                          onClick={() => onRemoveAdSet(adSet.id)}
                          className="text-xs text-nuum-accent-red hover:text-red-400 linear-transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {adSets.length === 0 && (
            <div className="bg-nuum-surface border border-nuum-border rounded-xl p-4">
              <div className="mb-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Ad Set Performance
                </h3>
              </div>
              <p className="text-sm text-nuum-text-secondary py-6 text-center">
                No ad sets created yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CampaignModalProps {
  campaigns: Campaign[];
  onSelect: (campaignId: string) => void;
  onClose: () => void;
}

export function AddToCampaignModal({ campaigns, onSelect, onClose }: CampaignModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={onClose}>
      <div className="bg-nuum-surface border border-nuum-border rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium">Add to Campaign</h3>
          <button onClick={onClose} className="p-1 hover:bg-nuum-border rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        {campaigns.length === 0 ? (
          <p className="text-nuum-text-secondary py-8 text-center">No campaigns available</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {campaigns.map((campaign) => (
              <button
                key={campaign.id}
                onClick={() => onSelect(campaign.id)}
                className="w-full text-left p-4 bg-nuum-border hover:bg-nuum-border/70 rounded-lg linear-transition"
              >
                <p className="font-medium">{campaign.name}</p>
                {campaign.description && (
                  <p className="text-sm text-nuum-text-secondary mt-1">{campaign.description}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
