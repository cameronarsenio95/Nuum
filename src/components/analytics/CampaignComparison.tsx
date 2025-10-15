import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Campaign = Database['public']['Tables']['campaigns']['Row'];

interface CampaignComparisonProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface CampaignStats {
  id: string;
  name: string;
  totalSpend: number;
  totalRevenue: number;
  roi: number;
  adSetCount: number;
  avgSpendPerAdSet: number;
  avgRevenuePerAdSet: number;
}

export function CampaignComparison({ workspaceId, isOpen, onClose }: CampaignComparisonProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<CampaignStats[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCampaigns();
    }
  }, [isOpen, workspaceId]);

  useEffect(() => {
    if (selectedCampaigns.length > 0) {
      loadComparisonData();
    } else {
      setComparisonData([]);
    }
  }, [selectedCampaigns]);

  const loadCampaigns = async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading campaigns:', error);
    } else {
      setCampaigns(data || []);
    }
  };

  const loadComparisonData = async () => {
    setLoading(true);
    const stats: CampaignStats[] = [];

    for (const campaignId of selectedCampaigns) {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) continue;

      const { data: adSets } = await supabase
        .from('ad_sets')
        .select('spend, revenue')
        .eq('campaign_id', campaignId);

      if (!adSets) continue;

      const totalSpend = adSets.reduce((sum, ad) => sum + (ad.spend || 0), 0);
      const totalRevenue = adSets.reduce((sum, ad) => sum + (ad.revenue || 0), 0);
      const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

      stats.push({
        id: campaign.id,
        name: campaign.name,
        totalSpend,
        totalRevenue,
        roi,
        adSetCount: adSets.length,
        avgSpendPerAdSet: adSets.length > 0 ? totalSpend / adSets.length : 0,
        avgRevenuePerAdSet: adSets.length > 0 ? totalRevenue / adSets.length : 0
      });
    }

    setComparisonData(stats);
    setLoading(false);
  };

  const toggleCampaign = (campaignId: string) => {
    setSelectedCampaigns(prev => {
      if (prev.includes(campaignId)) {
        return prev.filter(id => id !== campaignId);
      } else if (prev.length < 5) {
        return [...prev, campaignId];
      }
      return prev;
    });
  };

  const chartData = comparisonData.map(stat => ({
    name: stat.name.length > 15 ? stat.name.substring(0, 15) + '...' : stat.name,
    Spend: Math.round(stat.totalSpend),
    Revenue: Math.round(stat.totalRevenue),
    ROI: Math.round(stat.roi)
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={onClose}>
      <div
        className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 dark:text-linear-accent light:text-linear-light-accent" />
            <h2 className="text-2xl font-medium">Campaign Comparison</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:dark:bg-linear-bg-subtle hover:light:bg-linear-light-bg-subtle rounded-linear linear-transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3 dark:text-text-secondary light:text-text-light-secondary">
            Select up to 5 campaigns to compare
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {campaigns.map((campaign) => (
              <button
                key={campaign.id}
                onClick={() => toggleCampaign(campaign.id)}
                disabled={!selectedCampaigns.includes(campaign.id) && selectedCampaigns.length >= 5}
                className={`p-3 rounded-linear border text-left linear-transition ${
                  selectedCampaigns.includes(campaign.id)
                    ? 'dark:bg-linear-accent/10 light:bg-linear-light-accent/10 border-linear-accent'
                    : 'dark:bg-linear-bg-secondary light:bg-white dark:border-linear-border-subtle light:border-linear-light-border hover:dark:border-linear-border hover:light:border-linear-light-border'
                } ${!selectedCampaigns.includes(campaign.id) && selectedCampaigns.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="font-medium mb-1">{campaign.name}</div>
                <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                  {new Date(campaign.created_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="text-text-secondary">Loading comparison data...</div>
          </div>
        )}

        {!loading && comparisonData.length > 0 && (
          <div className="space-y-8">
            <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-6">
              <h3 className="text-lg font-medium mb-4">Spend vs Revenue</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="name"
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
                  <Bar dataKey="Spend" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-6">
              <h3 className="text-lg font-medium mb-4">ROI Comparison</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="name"
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
                    dataKey="ROI"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg overflow-hidden">
              <table className="w-full">
                <thead className="dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Campaign</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Ad Sets</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Total Spend</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Total Revenue</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">ROI</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Avg Spend/Ad Set</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Avg Revenue/Ad Set</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-linear-border-subtle light:divide-linear-light-border">
                  {comparisonData.map((stat) => (
                    <tr key={stat.id}>
                      <td className="px-4 py-3 font-medium">{stat.name}</td>
                      <td className="px-4 py-3 text-right dark:text-text-secondary light:text-text-light-secondary">{stat.adSetCount}</td>
                      <td className="px-4 py-3 text-right">${stat.totalSpend.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-linear-success">${stat.totalRevenue.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        stat.roi >= 0 ? 'text-linear-success' : 'text-linear-error'
                      }`}>
                        {stat.roi.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right dark:text-text-secondary light:text-text-light-secondary">
                        ${stat.avgSpendPerAdSet.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right dark:text-text-secondary light:text-text-light-secondary">
                        ${stat.avgRevenuePerAdSet.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && comparisonData.length === 0 && selectedCampaigns.length > 0 && (
          <div className="text-center py-12 dark:text-text-secondary light:text-text-light-secondary">
            No data available for selected campaigns
          </div>
        )}

        {!loading && selectedCampaigns.length === 0 && (
          <div className="text-center py-12 dark:text-text-secondary light:text-text-light-secondary">
            Select campaigns to compare their performance
          </div>
        )}
      </div>
    </div>
  );
}
