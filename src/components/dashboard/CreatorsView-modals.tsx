import { X, Plus, Link2, Edit2, DollarSign, TrendingUp, Target, Zap, Mail, Phone, Award, Download, FileText, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { Database } from '../../lib/database.types';
import { exportAnalyticsPdf } from '../../utils/exportAnalyticsPdf';
import { supabase } from '../../lib/supabase';
import { useState, useEffect, useMemo } from 'react';

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
      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium">{title}</h3>
          <button onClick={onCancel} className="p-1 hover:dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Name <span className="text-linear-error">*</span>
              </label>
              <input
                type="text"
                value={newCreator.name}
                onChange={(e) => setNewCreator({ ...newCreator, name: e.target.value })}
                className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={newCreator.status}
                onChange={(e) => setNewCreator({ ...newCreator, status: e.target.value as any })}
                className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
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
                className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
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
                className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
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
                className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                placeholder="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">TikTok</label>
              <input
                type="text"
                value={newCreator.tiktok_handle}
                onChange={(e) => setNewCreator({ ...newCreator, tiktok_handle: e.target.value })}
                className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                placeholder="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Snapchat</label>
              <input
                type="text"
                value={newCreator.snapchat_handle}
                onChange={(e) => setNewCreator({ ...newCreator, snapchat_handle: e.target.value })}
                className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
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
              className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
              placeholder="e.g., CREATOR10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={newCreator.notes}
              onChange={(e) => setNewCreator({ ...newCreator, notes: e.target.value })}
              className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent h-24"
            />
          </div>

          <div className="flex gap-3 mt-6">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 bg-linear-error-subtle hover:bg-red-500/20 text-linear-error border border-linear-error-border/20 rounded-linear linear-transition"
              >
                Delete
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sortBy, setSortBy] = useState<'roi' | 'revenue'>('roi');
  const [isExporting, setIsExporting] = useState(false);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getPrimaryHandle = () => {
    return creator.instagram_handle || creator.tiktok_handle || creator.snapchat_handle;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-linear-success bg-linear-success-subtle border-linear-success-border';
      case 'inactive':
        return 'text-text-tertiary bg-linear-bg-hover border-linear-border';
      case 'blacklisted':
        return 'text-linear-error bg-linear-error-subtle border-linear-error-border';
      default:
        return 'text-text-tertiary bg-linear-bg-hover border-linear-border';
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    const campaignsData = campaignPerformance.map(cp => ({
      name: cp.campaign.name,
      status: cp.status,
      total_ad_sets: cp.adSetCount,
      active_ad_sets: cp.status === 'active' ? cp.adSetCount : 0,
      total_spend: cp.spend,
      total_revenue: cp.revenue,
      roi: cp.roi,
    }));

    exportAnalyticsPdf(
      campaignsData,
      [],
      [],
      performanceSummary,
      `${creator.name} Performance Report`
    );
    setTimeout(() => setIsExporting(false), 1000);
  };

  const handleExportCSV = () => {
    const csvData = campaignPerformance.map(cp => ({
      'Campaign': cp.campaign.name,
      'Status': cp.status,
      'Ad Sets': cp.adSetCount,
      'Spend (€)': cp.spend.toFixed(2),
      'Revenue (€)': cp.revenue.toFixed(2),
      'ROI (%)': cp.roi.toFixed(2),
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => row[h as keyof typeof row]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${creator.name.replace(/\s+/g, '_')}_performance.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto transition-opacity duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold">{creator.name}</h2>
                {getPrimaryHandle() && (
                  <span className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs dark:bg-linear-bg-primary light:bg-white hover:dark:bg-linear-bg-hover light:hover:bg-gray-50 border dark:border-linear-border-subtle light:border-gray-300 rounded-linear linear-transition disabled:opacity-50"
              title="Export PDF Report"
            >
              <FileText className="w-3.5 h-3.5" />
              PDF
            </button>
            <button
              onClick={handleExportCSV}
              disabled={campaignPerformance.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs dark:bg-linear-bg-primary light:bg-white hover:dark:bg-linear-bg-hover light:hover:bg-gray-50 border dark:border-linear-border-subtle light:border-gray-300 rounded-linear linear-transition disabled:opacity-50"
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
              className="p-2 hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover rounded-linear linear-transition"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover rounded-linear linear-transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:border-[#2A53D0] rounded-linear-lg p-4 linear-transition">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 bg-red-500/10 rounded-linear flex items-center justify-center">
                  <Zap className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Total Spend</span>
              </div>
              <div>
                <div className="text-xl font-semibold">{formatCurrency(totalSpend)}</div>
                <div className="text-sm dark:text-text-secondary light:text-text-light-secondary mt-0.5">
                  Investment
                </div>
              </div>
            </div>

            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:border-[#2A53D0] rounded-linear-lg p-4 linear-transition">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 bg-green-500/10 rounded-linear flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Total Revenue</span>
              </div>
              <div>
                <div className="text-xl font-semibold">{formatCurrency(totalRevenue)}</div>
                <div className="text-sm dark:text-text-secondary light:text-text-light-secondary mt-0.5">
                  Generated
                </div>
              </div>
            </div>

            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:border-[#2A53D0] rounded-linear-lg p-4 linear-transition">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 bg-linear-accent-subtle rounded-linear flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-linear-accent" />
                </div>
                <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Avg ROI</span>
              </div>
              <div>
                <div className={`text-xl font-semibold ${roi > 0 ? 'text-linear-success' : 'text-linear-error'}`}>
                  {roi > 0 ? '+' : ''}{Math.round(roi)}%
                </div>
                <div className="text-sm dark:text-text-secondary light:text-text-light-secondary mt-0.5">
                  Return
                </div>
              </div>
            </div>

            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:border-[#2A53D0] rounded-linear-lg p-4 linear-transition">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 bg-linear-info-subtle rounded-linear flex items-center justify-center">
                  <Target className="w-4 h-4 text-linear-info" />
                </div>
                <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Active Campaigns</span>
              </div>
              <div>
                <div className="text-xl font-semibold">{activeCount}</div>
                <div className="text-sm dark:text-text-secondary light:text-text-light-secondary mt-0.5">
                  {adSets.length} total
                </div>
              </div>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4">
              <h3 className="text-sm font-medium mb-3">Performance per Campaign</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2A53D0" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2A53D0" stopOpacity={0}/>
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
                    stroke="#2A53D0"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                    dot={{ fill: '#2A53D0', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {campaignPerformance.length > 0 && (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4">
              <p className="text-xs dark:text-text-secondary light:text-text-light-secondary mb-3">
                {performanceSummary}
              </p>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Campaign History</h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="dark:text-text-tertiary light:text-text-light-tertiary">Sort by:</span>
                  <button
                    onClick={() => setSortBy('roi')}
                    className={`px-2 py-1 rounded linear-transition ${
                      sortBy === 'roi'
                        ? 'dark:bg-linear-accent-subtle light:bg-blue-100 text-linear-accent'
                        : 'dark:text-text-secondary light:text-gray-600 hover:dark:bg-linear-bg-hover light:hover:bg-gray-100'
                    }`}
                  >
                    ROI
                  </button>
                  <button
                    onClick={() => setSortBy('revenue')}
                    className={`px-2 py-1 rounded linear-transition ${
                      sortBy === 'revenue'
                        ? 'dark:bg-linear-accent-subtle light:bg-blue-100 text-linear-accent'
                        : 'dark:text-text-secondary light:text-gray-600 hover:dark:bg-linear-bg-hover light:hover:bg-gray-100'
                    }`}
                  >
                    Revenue
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-linear-border-subtle light:border-gray-200">
                      <th className="text-left py-2 px-2 text-xs dark:text-text-tertiary light:text-gray-600 font-medium">Campaign</th>
                      <th className="text-left py-2 px-2 text-xs dark:text-text-tertiary light:text-gray-600 font-medium">Status</th>
                      <th className="text-right py-2 px-2 text-xs dark:text-text-tertiary light:text-gray-600 font-medium">Ad Sets</th>
                      <th className="text-right py-2 px-2 text-xs dark:text-text-tertiary light:text-gray-600 font-medium">Spend</th>
                      <th className="text-right py-2 px-2 text-xs dark:text-text-tertiary light:text-gray-600 font-medium">Revenue</th>
                      <th className="text-right py-2 px-2 text-xs dark:text-text-tertiary light:text-gray-600 font-medium">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignPerformance.map((cp, idx) => (
                      <tr key={cp.campaign.id} className="border-b dark:border-linear-border-subtle/50 light:border-gray-100 hover:dark:bg-linear-bg-hover/30 light:hover:bg-gray-50 linear-transition">
                        <td className="py-2 px-2 font-medium">{cp.campaign.name}</td>
                        <td className="py-2 px-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(cp.status)}`}>
                            {cp.status}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right dark:text-text-secondary light:text-gray-600">{cp.adSetCount}</td>
                        <td className="py-2 px-2 text-right dark:text-text-secondary light:text-gray-600">{formatCurrency(cp.spend)}</td>
                        <td className="py-2 px-2 text-right font-medium">{formatCurrency(cp.revenue)}</td>
                        <td className="py-2 px-2 text-right font-semibold">
                          <span className={cp.roi > 0 ? 'text-linear-success' : 'text-linear-error'}>
                            {cp.roi > 0 ? '+' : ''}{Math.round(cp.roi)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 dark:border-linear-border light:border-gray-300 font-semibold">
                      <td className="py-2 px-2" colSpan={3}>Total</td>
                      <td className="py-2 px-2 text-right">{formatCurrency(totalSpend)}</td>
                      <td className="py-2 px-2 text-right">{formatCurrency(totalRevenue)}</td>
                      <td className="py-2 px-2 text-right">
                        <span className={roi > 0 ? 'text-linear-success' : 'text-linear-error'}>
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
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4">
              <h3 className="text-sm font-medium mb-3 dark:text-text-primary light:text-gray-900">Contact & Details</h3>
              <div className="space-y-2">
                {creator.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 dark:text-gray-400 light:text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs dark:text-gray-400 light:text-gray-500">Email</div>
                      <a
                        href={`mailto:${creator.email}`}
                        className="text-sm dark:text-white light:text-gray-900 hover:text-linear-accent truncate block linear-transition"
                      >
                        {creator.email}
                      </a>
                    </div>
                  </div>
                )}
                {creator.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 dark:text-gray-400 light:text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs dark:text-gray-400 light:text-gray-500">Phone</div>
                      <a
                        href={`tel:${creator.phone}`}
                        className="text-sm dark:text-white light:text-gray-900 hover:text-linear-accent linear-transition"
                      >
                        {creator.phone}
                      </a>
                    </div>
                  </div>
                )}
                {!creator.email && !creator.phone && (
                  <p className="text-xs dark:text-text-tertiary light:text-gray-500">No contact information</p>
                )}
              </div>
            </div>

            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4">
              <h3 className="text-sm font-medium mb-3 dark:text-text-primary light:text-gray-900">Social Media & Code</h3>
              <div className="space-y-2">
                {creator.discount_code && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Award className="w-3.5 h-3.5 dark:text-gray-400 light:text-gray-500" />
                      <div className="text-xs dark:text-gray-400 light:text-gray-500">Discount Code</div>
                    </div>
                    <div className="px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear border dark:border-linear-accent/50 light:border-linear-light-accent">
                      <div className="font-mono text-sm font-semibold text-linear-accent text-center tracking-wider">
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
                      <span className="w-16 dark:text-gray-400 light:text-gray-500">Instagram</span>
                      <span className="dark:text-white light:text-gray-900 group-hover:text-linear-accent linear-transition truncate">@{creator.instagram_handle}</span>
                    </a>
                  )}
                  {creator.tiktok_handle && (
                    <a
                      href={`https://tiktok.com/@${creator.tiktok_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs group"
                    >
                      <span className="w-16 dark:text-gray-400 light:text-gray-500">TikTok</span>
                      <span className="dark:text-white light:text-gray-900 group-hover:text-linear-accent linear-transition truncate">@{creator.tiktok_handle}</span>
                    </a>
                  )}
                  {creator.snapchat_handle && (
                    <a
                      href={`https://snapchat.com/add/${creator.snapchat_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs group"
                    >
                      <span className="w-16 dark:text-gray-400 light:text-gray-500">Snapchat</span>
                      <span className="dark:text-white light:text-gray-900 group-hover:text-linear-accent linear-transition truncate">@{creator.snapchat_handle}</span>
                    </a>
                  )}
                  {!creator.instagram_handle && !creator.tiktok_handle && !creator.snapchat_handle && !creator.discount_code && (
                    <p className="text-xs dark:text-text-tertiary light:text-gray-500">No social media linked</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {creator.tags && creator.tags.length > 0 && (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4">
              <h3 className="text-sm font-medium mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {creator.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs dark:bg-linear-info-subtle light:bg-linear-light-info-subtle dark:text-linear-info light:text-linear-light-info rounded-full border dark:border-linear-info-border light:border-linear-light-info-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {creator.notes && (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4">
              <h3 className="text-sm font-medium mb-2">Notes</h3>
              <p className="text-sm dark:text-text-secondary light:text-text-light-secondary whitespace-pre-wrap">
                {creator.notes}
              </p>
            </div>
          )}

          {adSets.length > 0 && (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Ad Set Performance
                </h3>
                <button
                  onClick={onAddToCampaign}
                  className="text-xs px-3 py-1.5 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
                >
                  Add Ad Set
                </button>
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
                      className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-3 hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover linear-transition"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate mb-1">{adSet.name}</div>
                          <span className={`inline-flex text-xs px-2 py-0.5 rounded-full border ${
                            adSet.status === 'active' ? 'text-linear-success bg-linear-success-subtle border-linear-success-border' :
                            adSet.status === 'completed' ? 'text-linear-info bg-linear-info-subtle border-linear-info-border' :
                            'text-text-tertiary bg-linear-bg-hover border-linear-border'
                          }`}>
                            {adSet.status}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-semibold text-sm">{formatCurrency(adSetRevenue)}</div>
                          <div className={`text-xs ${adSetRoi > 0 ? 'text-linear-success' : 'text-linear-error'}`}>
                            {adSetRoi > 0 ? '+' : ''}{Math.round(adSetRoi)}% ROI
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle text-xs">
                        <div>
                          <div className="dark:text-text-tertiary light:text-text-light-tertiary">Costs</div>
                          <div className="font-medium mt-0.5">{formatCurrency(adSetSpend)}</div>
                        </div>
                        <div className="text-right">
                          <div className="dark:text-text-tertiary light:text-text-light-tertiary">Profit</div>
                          <div className="font-medium mt-0.5">{formatCurrency(adSetProfit)}</div>
                        </div>
                        <button
                          onClick={() => onRemoveAdSet(adSet.id)}
                          className="text-xs text-linear-error hover:text-red-400 linear-transition"
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
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Ad Set Performance
                </h3>
                <button
                  onClick={onAddToCampaign}
                  className="text-xs px-3 py-1.5 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
                >
                  Add Ad Set
                </button>
              </div>
              <p className="text-sm dark:text-text-secondary light:text-text-light-secondary py-6 text-center">
                No ad sets created yet. Click "Add Ad Set" to get started.
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
      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium">Add to Campaign</h3>
          <button onClick={onClose} className="p-1 hover:dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear">
            <X className="w-5 h-5" />
          </button>
        </div>
        {campaigns.length === 0 ? (
          <p className="dark:text-text-secondary light:text-text-light-secondary py-8 text-center">No campaigns available</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {campaigns.map((campaign) => (
              <button
                key={campaign.id}
                onClick={() => onSelect(campaign.id)}
                className="w-full text-left p-4 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
              >
                <p className="font-medium">{campaign.name}</p>
                {campaign.description && (
                  <p className="text-sm dark:text-text-secondary light:text-text-light-secondary mt-1">{campaign.description}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
