import { useState, useEffect } from 'react';
import { Plus, ChevronRight, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PageLayout } from '../PageLayout';
import { Card } from '../Card';
import { Button } from '../Button';
import { NUUM_COLORS, TYPOGRAPHY, getStatusColorClass } from '../../utils/designSystem';
import { useAuth } from '../../contexts/AuthContext';
import { useWritePermission } from '../../hooks/useWritePermission';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];

interface CampaignWithMetrics extends Campaign {
  total_spend: number;
  total_revenue: number;
  roi: number;
  creators_count: number;
  content_count: number;
}

interface CampaignsViewProps {
  workspace: Workspace;
  onCampaignClick?: (campaign: Campaign) => void;
}

export function CampaignsView({ workspace, onCampaignClick }: CampaignsViewProps) {
  const { user } = useAuth();
  const { checkWritePermission } = useWritePermission();
  const [campaigns, setCampaigns] = useState<CampaignWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    status: 'draft' as 'draft' | 'active' | 'completed' | 'archived',
  });

  useEffect(() => {
    loadCampaigns();
  }, [workspace.id]);

  const loadCampaigns = async () => {
    setLoading(true);

    const { data: campaignsData, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('updated_at', { ascending: false });

    if (error || !campaignsData) {
      console.error('Error loading campaigns:', error);
      setLoading(false);
      return;
    }

    const { data: adSetsData } = await supabase
      .from('ad_sets')
      .select('campaign_id, status, spend, revenue, creator_id')
      .in('campaign_id', campaignsData.map(c => c.id));

    const { data: contentData } = await supabase
      .from('content_media')
      .select('campaign_id')
      .in('campaign_id', campaignsData.map(c => c.id));

    const campaignsWithMetrics: CampaignWithMetrics[] = campaignsData.map(campaign => {
      const campaignAdSets = adSetsData?.filter(ad => ad.campaign_id === campaign.id) || [];
      const total_spend = campaignAdSets.reduce((sum, ad) => sum + (Number(ad.spend) || 0), 0);
      const total_revenue = campaignAdSets.reduce((sum, ad) => sum + (Number(ad.revenue) || 0), 0);
      const roi = total_spend > 0 ? ((total_revenue - total_spend) / total_spend) * 100 : 0;

      const uniqueCreators = new Set(campaignAdSets.map(ad => ad.creator_id).filter(Boolean));
      const campaignContent = contentData?.filter(c => c.campaign_id === campaign.id) || [];

      return {
        ...campaign,
        total_spend,
        total_revenue,
        roi,
        creators_count: uniqueCreators.size,
        content_count: campaignContent.length,
      };
    });

    setCampaigns(campaignsWithMetrics);
    setLoading(false);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!checkWritePermission('create campaigns')) {
      setShowCreateModal(false);
      return;
    }

    const { error } = await supabase.from('campaigns').insert({
      workspace_id: workspace.id,
      name: newCampaign.name,
      created_by: user.id,
      status: newCampaign.status,
    });

    if (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
      return;
    }

    setShowCreateModal(false);
    setNewCampaign({ name: '', status: 'draft' });
    loadCampaigns();
  };

  if (loading) {
    return (
      <PageLayout title="Campaigns" subtitle="Manage your campaigns">
        <div style={{ color: NUUM_COLORS.textSecondary }}>Loading campaigns...</div>
      </PageLayout>
    );
  }

  return (
    <>
      <PageLayout
        title="Campaigns"
        subtitle="Manage your campaigns"
        action={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-[10px] transition-all duration-200 whitespace-nowrap shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
            style={{ backgroundColor: NUUM_COLORS.accent }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = NUUM_COLORS.accentHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = NUUM_COLORS.accent}
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        }
      >
        {campaigns.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className={TYPOGRAPHY.bodyText} style={{ color: NUUM_COLORS.textSecondary }}>
                No campaigns found. Create your first campaign to get started.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 text-white rounded-[10px] transition-all duration-200"
                style={{ backgroundColor: NUUM_COLORS.accent }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = NUUM_COLORS.accentHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = NUUM_COLORS.accent}
              >
                Create Campaign
              </button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map(campaign => (
              <Card
                key={campaign.id}
                hover
                onClick={() => onCampaignClick?.(campaign)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className={TYPOGRAPHY.numeric} style={{ color: NUUM_COLORS.textPrimary }}>
                    {campaign.name}
                  </h3>
                  <span className={getStatusColorClass(campaign.status)}>
                    {campaign.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4" style={{ fontSize: '13px' }}>
                  <span style={{ color: NUUM_COLORS.textSecondary }}>Spend:</span>
                  <span style={{ color: NUUM_COLORS.textPrimary, fontWeight: 600 }}>€{campaign.total_spend.toLocaleString()}</span>

                  <span style={{ color: NUUM_COLORS.textSecondary }}>Revenue:</span>
                  <span style={{ color: NUUM_COLORS.success, fontWeight: 600 }}>€{campaign.total_revenue.toLocaleString()}</span>

                  <span style={{ color: NUUM_COLORS.textSecondary }}>ROI:</span>
                  <span style={{ color: campaign.roi >= 0 ? NUUM_COLORS.success : NUUM_COLORS.error, fontWeight: 600 }}>
                    {campaign.roi.toFixed(1)}%
                  </span>

                  <span style={{ color: NUUM_COLORS.textSecondary }}>Creators:</span>
                  <span style={{ color: NUUM_COLORS.textPrimary, fontWeight: 600 }}>{campaign.creators_count}</span>
                </div>

                <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: NUUM_COLORS.border }}>
                  <span className={TYPOGRAPHY.metadata} style={{ color: NUUM_COLORS.textSecondary }}>
                    {campaign.content_count} content items
                  </span>
                  <div className="flex items-center gap-1" style={{ color: NUUM_COLORS.textSecondary }}>
                    <span className="text-xs">View details</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageLayout>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 md:p-6 z-50" onClick={() => setShowCreateModal(false)}>
          <div
            className="w-full max-w-lg rounded-[14px] p-4 md:p-6 max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            style={{ backgroundColor: NUUM_COLORS.surface, border: `1px solid ${NUUM_COLORS.borderHover}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold" style={{ color: NUUM_COLORS.textPrimary }}>
                Create New Campaign
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-[8px] transition-all duration-200"
                style={{ color: NUUM_COLORS.textSecondary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = NUUM_COLORS.surfaceHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: NUUM_COLORS.textSecondary }}>
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-[10px] transition-all duration-200"
                  style={{
                    backgroundColor: NUUM_COLORS.background,
                    border: `1px solid ${NUUM_COLORS.borderHover}`,
                    color: NUUM_COLORS.textPrimary,
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.accent}
                  onBlur={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.borderHover}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: NUUM_COLORS.textSecondary }}>
                  Status
                </label>
                <select
                  value={newCampaign.status}
                  onChange={(e) => setNewCampaign({ ...newCampaign, status: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-[10px] transition-all duration-200"
                  style={{
                    backgroundColor: NUUM_COLORS.background,
                    border: `1px solid ${NUUM_COLORS.borderHover}`,
                    color: NUUM_COLORS.textPrimary,
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.accent}
                  onBlur={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.borderHover}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setNewCampaign({ name: '', status: 'draft' }); }}
                  className="flex-1 px-4 py-2 rounded-[10px] transition-all duration-200"
                  style={{ backgroundColor: '#2e2f30', color: NUUM_COLORS.textPrimary }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3b3c'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2e2f30'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-[10px] transition-all duration-200"
                  style={{ backgroundColor: NUUM_COLORS.accent, color: NUUM_COLORS.textPrimary }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = NUUM_COLORS.accentHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = NUUM_COLORS.accent}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
