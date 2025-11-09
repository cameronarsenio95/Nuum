import { useState, useEffect } from 'react';
import { Plus, ChevronRight, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PageLayout } from '../PageLayout';
import { Card } from '../Card';
import { NUUM_THEME, getStatusBadgeStyle, getROIColor } from '../../styles/nuumTheme';
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
        <div style={{ color: NUUM_THEME.colors.textSecondary }}>Loading campaigns...</div>
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
            className="flex items-center justify-center gap-2 px-4 py-2 text-white transition-all duration-200 whitespace-nowrap"
            style={{
              backgroundColor: NUUM_THEME.colors.accentBlue,
              borderRadius: NUUM_THEME.radius.button,
              boxShadow: NUUM_THEME.shadows.button,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = NUUM_THEME.colors.accentBlueDark}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = NUUM_THEME.colors.accentBlue}
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        }
      >
        {campaigns.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p style={{ color: NUUM_THEME.colors.textSecondary }}>
                No campaigns found. Create your first campaign to get started.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 text-white transition-all duration-200"
                style={{
                  backgroundColor: NUUM_THEME.colors.accentBlue,
                  borderRadius: NUUM_THEME.radius.button,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = NUUM_THEME.colors.accentBlueDark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = NUUM_THEME.colors.accentBlue}
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
                  <h3 className="font-semibold tracking-tight" style={{ color: NUUM_THEME.colors.textPrimary }}>
                    {campaign.name}
                  </h3>
                  <span
                    className="px-2 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: getStatusBadgeStyle(campaign.status).bg,
                      color: getStatusBadgeStyle(campaign.status).text,
                      borderRadius: NUUM_THEME.radius.badge,
                    }}
                  >
                    {campaign.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4" style={{ fontSize: '13px' }}>
                  <span style={{ color: NUUM_THEME.colors.textSecondary }}>Spend:</span>
                  <span style={{ color: NUUM_THEME.colors.textPrimary, fontWeight: 600 }}>€{campaign.total_spend.toLocaleString()}</span>

                  <span style={{ color: NUUM_THEME.colors.textSecondary }}>Revenue:</span>
                  <span style={{ color: NUUM_THEME.colors.accentGreen, fontWeight: 600 }}>€{campaign.total_revenue.toLocaleString()}</span>

                  <span style={{ color: NUUM_THEME.colors.textSecondary }}>ROI:</span>
                  <span style={{ color: getROIColor(campaign.roi), fontWeight: 600 }}>
                    {campaign.roi.toFixed(1)}%
                  </span>

                  <span style={{ color: NUUM_THEME.colors.textSecondary }}>Creators:</span>
                  <span style={{ color: NUUM_THEME.colors.textPrimary, fontWeight: 600 }}>{campaign.creators_count}</span>
                </div>

                <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: NUUM_THEME.colors.border }}>
                  <span className="text-xs" style={{ color: NUUM_THEME.colors.textSecondary }}>
                    {campaign.content_count} content items
                  </span>
                  <div className="flex items-center gap-1" style={{ color: NUUM_THEME.colors.textSecondary }}>
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
            className="w-full max-w-lg p-4 md:p-6 max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: NUUM_THEME.colors.backgroundSecondary,
              border: `1px solid ${NUUM_THEME.colors.border}`,
              borderRadius: NUUM_THEME.radius.modal,
              boxShadow: NUUM_THEME.shadows.modal,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold" style={{ color: NUUM_THEME.colors.textPrimary }}>
                Create New Campaign
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 transition-all duration-200"
                style={{
                  color: NUUM_THEME.colors.textSecondary,
                  borderRadius: '8px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = NUUM_THEME.colors.surfaceHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: NUUM_THEME.colors.textSecondary }}>
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full px-4 py-2 transition-all duration-200"
                  style={{
                    backgroundColor: NUUM_THEME.colors.background,
                    border: `1px solid ${NUUM_THEME.colors.border}`,
                    color: NUUM_THEME.colors.textPrimary,
                    borderRadius: NUUM_THEME.radius.input,
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = NUUM_THEME.colors.accentBlue}
                  onBlur={(e) => e.currentTarget.style.borderColor = NUUM_THEME.colors.border}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: NUUM_THEME.colors.textSecondary }}>
                  Status
                </label>
                <select
                  value={newCampaign.status}
                  onChange={(e) => setNewCampaign({ ...newCampaign, status: e.target.value as any })}
                  className="w-full px-4 py-2 transition-all duration-200"
                  style={{
                    backgroundColor: NUUM_THEME.colors.background,
                    border: `1px solid ${NUUM_THEME.colors.border}`,
                    color: NUUM_THEME.colors.textPrimary,
                    borderRadius: NUUM_THEME.radius.input,
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = NUUM_THEME.colors.accentBlue}
                  onBlur={(e) => e.currentTarget.style.borderColor = NUUM_THEME.colors.border}
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
                  className="flex-1 px-4 py-2 transition-all duration-200"
                  style={{
                    backgroundColor: NUUM_THEME.colors.border,
                    color: NUUM_THEME.colors.textPrimary,
                    borderRadius: NUUM_THEME.radius.button,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = NUUM_THEME.colors.borderHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = NUUM_THEME.colors.border}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 transition-all duration-200"
                  style={{
                    backgroundColor: NUUM_THEME.colors.accentBlue,
                    color: NUUM_THEME.colors.textPrimary,
                    borderRadius: NUUM_THEME.radius.button,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = NUUM_THEME.colors.accentBlueDark}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = NUUM_THEME.colors.accentBlue}
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
