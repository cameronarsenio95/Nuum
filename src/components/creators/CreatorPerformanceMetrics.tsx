import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Target, Users, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Creator = Database['public']['Tables']['creators']['Row'];
type AdSet = Database['public']['Tables']['ad_sets']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];

interface CreatorPerformanceMetricsProps {
  creator: Creator;
  isOpen: boolean;
  onClose: () => void;
}

interface PerformanceData {
  totalRevenue: number;
  totalSpend: number;
  avgROI: number;
  adSetCount: number;
  campaignCount: number;
  activeCampaigns: number;
  platformBreakdown: { platform: string; revenue: number; count: number }[];
  performanceOverTime: { date: string; revenue: number; spend: number }[];
  topCampaigns: { name: string; revenue: number; roi: number }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function CreatorPerformanceMetrics({ creator, isOpen, onClose }: CreatorPerformanceMetricsProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    if (isOpen) {
      loadPerformanceData();
    }
  }, [isOpen, creator.id, timeRange]);

  const loadPerformanceData = async () => {
    setLoading(true);

    const { data: adSets } = await supabase
      .from('ad_sets')
      .select('*, campaign:campaigns(*)')
      .eq('creator_id', creator.id);

    if (!adSets) {
      setLoading(false);
      return;
    }

    const totalRevenue = adSets.reduce((sum, ad) => sum + (ad.revenue || 0), 0);
    const totalSpend = adSets.reduce((sum, ad) => sum + (ad.spend || 0), 0);
    const avgROI = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

    const uniqueCampaigns = new Set(adSets.map(ad => ad.campaign_id));
    const campaignCount = uniqueCampaigns.size;

    const activeCampaigns = new Set(
      adSets.filter(ad => ad.status === 'active').map(ad => ad.campaign_id)
    ).size;

    const platformMap = new Map<string, { revenue: number; count: number }>();
    adSets.forEach(ad => {
      const existing = platformMap.get(ad.platform) || { revenue: 0, count: 0 };
      platformMap.set(ad.platform, {
        revenue: existing.revenue + (ad.revenue || 0),
        count: existing.count + 1
      });
    });
    const platformBreakdown = Array.from(platformMap.entries()).map(([platform, data]) => ({
      platform,
      revenue: data.revenue,
      count: data.count
    }));

    const dateMap = new Map<string, { revenue: number; spend: number }>();
    adSets.forEach(ad => {
      const date = new Date(ad.created_at).toISOString().split('T')[0];
      const existing = dateMap.get(date) || { revenue: 0, spend: 0 };
      dateMap.set(date, {
        revenue: existing.revenue + (ad.revenue || 0),
        spend: existing.spend + (ad.spend || 0)
      });
    });
    const performanceOverTime = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Math.round(data.revenue),
        spend: Math.round(data.spend)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const campaignRevenues = new Map<string, { name: string; revenue: number; spend: number }>();
    adSets.forEach(ad => {
      const campaign = (ad as any).campaign;
      if (!campaign) return;
      const existing = campaignRevenues.get(ad.campaign_id) || {
        name: campaign.name,
        revenue: 0,
        spend: 0
      };
      campaignRevenues.set(ad.campaign_id, {
        name: campaign.name,
        revenue: existing.revenue + (ad.revenue || 0),
        spend: existing.spend + (ad.spend || 0)
      });
    });
    const topCampaigns = Array.from(campaignRevenues.values())
      .map(c => ({
        name: c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name,
        revenue: c.revenue,
        roi: c.spend > 0 ? ((c.revenue - c.spend) / c.spend) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setPerformanceData({
      totalRevenue,
      totalSpend,
      avgROI,
      adSetCount: adSets.length,
      campaignCount,
      activeCampaigns,
      platformBreakdown,
      performanceOverTime,
      topCampaigns
    });

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={onClose}>
      <div
        className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-medium mb-2">{creator.name}</h2>
            <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">Performance Metrics</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:dark:bg-linear-bg-subtle hover:light:bg-linear-light-bg-subtle rounded-linear linear-transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-text-secondary">Loading performance data...</div>
          </div>
        ) : performanceData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
                  <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Total Revenue</span>
                </div>
                <p className="text-2xl font-medium text-linear-success">${performanceData.totalRevenue.toLocaleString()}</p>
              </div>

              <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
                  <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Average ROI</span>
                </div>
                <p className={`text-2xl font-medium ${
                  performanceData.avgROI >= 0 ? 'text-linear-success' : 'text-linear-error'
                }`}>
                  {performanceData.avgROI.toFixed(1)}%
                </p>
              </div>

              <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
                  <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Campaigns</span>
                </div>
                <p className="text-2xl font-medium">{performanceData.campaignCount}</p>
                <p className="text-xs dark:text-text-secondary light:text-text-light-secondary">
                  {performanceData.activeCampaigns} active
                </p>
              </div>

              <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
                  <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Ad Sets</span>
                </div>
                <p className="text-2xl font-medium">{performanceData.adSetCount}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-6">
                <h3 className="text-lg font-medium mb-4">Platform Performance</h3>
                {performanceData.platformBreakdown.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={performanceData.platformBreakdown}
                          dataKey="revenue"
                          nameKey="platform"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry) => entry.platform}
                        >
                          {performanceData.platformBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-4">
                      {performanceData.platformBreakdown.map((platform, idx) => (
                        <div key={platform.platform} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <span>{platform.platform}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${platform.revenue.toLocaleString()}</div>
                            <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                              {platform.count} ad {platform.count === 1 ? 'set' : 'sets'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-center py-8 dark:text-text-secondary light:text-text-light-secondary">
                    No platform data available
                  </p>
                )}
              </div>

              <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-6">
                <h3 className="text-lg font-medium mb-4">Top Campaigns</h3>
                {performanceData.topCampaigns.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={performanceData.topCampaigns} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis
                        type="number"
                        stroke="#666"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#666"
                        style={{ fontSize: '12px' }}
                        width={120}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #333',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'Revenue') return [`$${value.toLocaleString()}`, name];
                          return [`${value.toFixed(1)}%`, name];
                        }}
                      />
                      <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center py-8 dark:text-text-secondary light:text-text-light-secondary">
                    No campaign data available
                  </p>
                )}
              </div>
            </div>

            {performanceData.performanceOverTime.length > 0 && (
              <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-6">
                <h3 className="text-lg font-medium mb-4">Revenue Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData.performanceOverTime}>
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
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Revenue"
                      dot={{ fill: '#10b981' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="spend"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Spend"
                      dot={{ fill: '#ef4444' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 dark:text-text-secondary light:text-text-light-secondary">
            No performance data available
          </div>
        )}
      </div>
    </div>
  );
}
