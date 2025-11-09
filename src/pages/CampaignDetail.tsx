import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, DollarSign, TrendingUp, Users, Target, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AdSetFormModal } from '../components/campaigns/AdSetFormModal';
import type { Database } from '../lib/database.types';

type Campaign = Database['public']['Tables']['campaigns']['Row'];
type AdSet = Database['public']['Tables']['ad_sets']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];

interface CampaignDetailProps {
  campaignId: string;
  workspaceId: string;
  onBack: () => void;
}

interface CreatorWithRevenue extends Creator {
  total_revenue: number;
  ad_sets_count: number;
}

export function CampaignDetail({ campaignId, workspaceId, onBack }: CampaignDetailProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [creators, setCreators] = useState<CreatorWithRevenue[]>([]);
  const [showAdSetModal, setShowAdSetModal] = useState(false);
  const [selectedAdSet, setSelectedAdSet] = useState<AdSet | null>(null);

  const [metrics, setMetrics] = useState({
    totalSpend: 0,
    totalRevenue: 0,
    roi: 0,
    totalCreators: 0,
  });

  useEffect(() => {
    loadCampaignData();
  }, [campaignId, workspaceId]);

  const loadCampaignData = async () => {
    setLoading(true);

    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (campaignError) {
      console.error('Error loading campaign:', campaignError);
      setLoading(false);
      return;
    }

    if (!campaignData) {
      console.error('Campaign not found');
      setLoading(false);
      return;
    }

    setCampaign(campaignData);

    const { data: adSetsData, error: adSetsError } = await supabase
      .from('ad_sets')
      .select('*, creators(*)')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (adSetsError) {
      console.error('Error loading ad sets:', adSetsError);
    } else if (adSetsData) {
      setAdSets(adSetsData);

      let totalSpend = 0;
      let totalRevenue = 0;
      const creatorMap = new Map<string, CreatorWithRevenue>();

      adSetsData.forEach(adSet => {
        const spend = Number(adSet.spend) || 0;
        const revenue = Number(adSet.revenue) || 0;

        totalSpend += spend;
        totalRevenue += revenue;

        if (adSet.creator_id && adSet.creators) {
          const existing = creatorMap.get(adSet.creator_id);
          if (existing) {
            existing.total_revenue += revenue;
            existing.ad_sets_count += 1;
          } else {
            creatorMap.set(adSet.creator_id, {
              ...(adSet.creators as Creator),
              total_revenue: revenue,
              ad_sets_count: 1,
            });
          }
        }
      });

      const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

      setMetrics({
        totalSpend,
        totalRevenue,
        roi,
        totalCreators: creatorMap.size,
      });

      setCreators(Array.from(creatorMap.values()).sort((a, b) => b.total_revenue - a.total_revenue));
    }

    setLoading(false);
  };

  const handleAddAdSet = () => {
    setSelectedAdSet(null);
    setShowAdSetModal(true);
  };

  const handleEditAdSet = (adSet: AdSet) => {
    setSelectedAdSet(adSet);
    setShowAdSetModal(true);
  };

  const handleDeleteAdSet = async (adSetId: string) => {
    if (!confirm('Are you sure you want to remove this ad set?')) return;

    const { error } = await supabase
      .from('ad_sets')
      .delete()
      .eq('id', adSetId)
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('Error deleting ad set:', error);
      alert('Failed to delete ad set');
      return;
    }

    loadCampaignData();
  };

  const handleCloseAdSetModal = () => {
    setShowAdSetModal(false);
    setSelectedAdSet(null);
  };

  const handleSaveAdSet = () => {
    loadCampaignData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-[#66a56b] bg-[#1e2921] border-[#66a56b]/20';
      case 'completed':
        return 'text-[#3e559e] bg-[#141623] border-[#3e559e]/20';
      case 'paused':
        return 'text-[#e3a36e] bg-[#2e2720] border-[#e3a36e]/20';
      case 'archived':
        return 'text-[#cecece] bg-[#2e2f30] border-[rgba(226,226,225,0.1)]';
      default:
        return 'text-[#cecece] bg-[#2e2f30] border-[rgba(226,226,225,0.1)]';
    }
  };

  if (loading) {
    return (
      <div className="text-[#cecece]">Loading campaign...</div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-[#cecece]">Campaign not found</div>
    );
  }

  return (
    <>
      {showAdSetModal && (
        <AdSetFormModal
          campaignId={campaignId}
          workspaceId={workspaceId}
          adSet={selectedAdSet}
          onClose={handleCloseAdSetModal}
          onSave={handleSaveAdSet}
        />
      )}

      <div className="space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-[#cecece] hover:text-white transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </button>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-semibold text-white">{campaign.name}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full border ${getStatusColor(campaign.status)}`}>
                {campaign.status}
              </span>
            </div>
            <p className="text-sm text-[#cecece]">
              Created on {new Date(campaign.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-[#161616] border border-[rgba(226,226,225,0.1)] rounded-[14px] p-6 hover:border-[#9c3e3f]/40 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-[#161616] rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#9c3e3f]" />
              </div>
            </div>
            <div className="text-xs text-[#cecece] mb-1">Total Spend</div>
            <div className="text-2xl font-semibold text-white">€{metrics.totalSpend.toLocaleString()}</div>
          </div>

          <div className="bg-[#161616] border border-[rgba(226,226,225,0.1)] rounded-[14px] p-6 hover:border-[#66a56b]/40 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-[#161616] rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#66a56b]" />
              </div>
            </div>
            <div className="text-xs text-[#cecece] mb-1">Total Revenue</div>
            <div className="text-2xl font-semibold text-[#66a56b]">€{metrics.totalRevenue.toLocaleString()}</div>
          </div>

          <div className="bg-[#161616] border border-[rgba(226,226,225,0.1)] rounded-[14px] p-6 hover:border-[#3e559e]/40 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-[#161616] rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#3e559e]" />
              </div>
            </div>
            <div className="text-xs text-[#cecece] mb-1">ROI</div>
            <div className={`text-2xl font-semibold ${metrics.roi >= 0 ? 'text-[#66a56b]' : 'text-[#9c3e3f]'}`}>
              {Math.round(metrics.roi)}%
            </div>
          </div>

          <div className="bg-[#161616] border border-[rgba(226,226,225,0.1)] rounded-[14px] p-6 hover:border-[#e3a36e]/40 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-[#161616] rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-[#e3a36e]" />
              </div>
            </div>
            <div className="text-xs text-[#cecece] mb-1">Creators</div>
            <div className="text-2xl font-semibold text-white">{metrics.totalCreators}</div>
          </div>
        </div>

        <div className="bg-[#161616] border border-[rgba(226,226,225,0.1)] rounded-[14px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#3e559e]" />
              <h2 className="text-lg font-semibold text-white">Ad Sets (Meta)</h2>
            </div>
            <button
              onClick={handleAddAdSet}
              className="flex items-center gap-2 px-4 py-2 bg-[#3e559e] hover:bg-[#324885] text-white rounded-[10px] transition-all duration-200 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Ad Set
            </button>
          </div>

          {adSets.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-[#cecece] mx-auto mb-3 opacity-50" />
              <p className="text-[#cecece] mb-4">No ad sets yet</p>
              <button
                onClick={handleAddAdSet}
                className="px-4 py-2 bg-[#3e559e] hover:bg-[#324885] text-white rounded-[10px] transition-all duration-200 text-sm"
              >
                Create your first ad set
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(226,226,225,0.1)] bg-[#161616]">
                    <th className="text-left py-3 px-3 text-xs font-medium text-[#cecece]">Name</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-[#cecece]">Platform</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-[#cecece]">Creator</th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-[#cecece]">Spend</th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-[#cecece]">Revenue</th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-[#cecece]">ROI</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-[#cecece]">Status</th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-[#cecece]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adSets.map((adSet) => {
                    const spend = Number(adSet.spend) || 0;
                    const revenue = Number(adSet.revenue) || 0;
                    const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
                    const creator = adSet.creators as Creator | null;

                    return (
                      <tr key={adSet.id} className="border-b border-[rgba(226,226,225,0.1)] hover:bg-[#1b1b1b] transition-all duration-200 even:bg-[#0e0e0e] odd:bg-[#161616]">
                        <td className="py-3 px-3 text-sm text-white">{adSet.name}</td>
                        <td className="py-3 px-3 text-sm text-[#cecece] capitalize">{adSet.platform}</td>
                        <td className="py-3 px-3 text-sm text-[#cecece]">
                          {creator ? creator.name : '-'}
                        </td>
                        <td className="py-3 px-3 text-sm text-right text-white">€{spend.toLocaleString()}</td>
                        <td className="py-3 px-3 text-sm text-right text-[#66a56b]">€{revenue.toLocaleString()}</td>
                        <td className={`py-3 px-3 text-sm text-right font-semibold ${roi >= 0 ? 'text-[#66a56b]' : 'text-[#9c3e3f]'}`}>
                          {Math.round(roi)}%
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${getStatusColor(adSet.status)}`}>
                            {adSet.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditAdSet(adSet)}
                              className="p-1.5 hover:bg-[#2e2720] rounded-lg transition-all duration-200 text-[#cecece] hover:text-[#e3a36e]"
                              title="Edit ad set"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAdSet(adSet.id)}
                              className="p-1.5 hover:bg-[#251816] rounded-lg transition-all duration-200 text-[#cecece] hover:text-[#9c3e3f]"
                              title="Delete ad set"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {creators.length > 0 && (
          <div className="bg-[#161616] border border-[rgba(226,226,225,0.1)] rounded-[14px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#3e559e]" />
              <h2 className="text-lg font-semibold text-white">Linked Creators</h2>
            </div>
            <div className="space-y-3">
              {creators.slice(0, 5).map((creator) => (
                <div key={creator.id} className="flex items-center justify-between py-2 hover:bg-[#1b1b1b] rounded-lg px-3 -mx-3 transition-all duration-200">
                  <div>
                    <div className="text-sm font-medium text-white">{creator.name}</div>
                    <div className="text-xs text-[#cecece]">{creator.ad_sets_count} ad set{creator.ad_sets_count !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="text-sm font-semibold text-[#66a56b]">
                    €{creator.total_revenue.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
