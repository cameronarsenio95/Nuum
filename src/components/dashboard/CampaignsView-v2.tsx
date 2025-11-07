import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PageLayout } from '../PageLayout';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { NUUM_COLORS, TYPOGRAPHY, getStatusColorClass } from '../../utils/designSystem';
import { CampaignDetailModal } from './CampaignDetailModal';
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
}

type StatusFilter = 'all' | 'active' | 'draft' | 'completed' | 'archived';
type TimeFilter = 'all' | '30d' | '7d';

export function CampaignsView({ workspace }: CampaignsViewProps) {
  const [campaigns, setCampaigns] = useState<CampaignWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignWithMetrics | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, [workspace.id]);

  const loadCampaigns = async () => {
    setLoading(true);

    const { data: campaignsData, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false });

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

  const filteredCampaigns = campaigns.filter(campaign => {
    if (statusFilter !== 'all' && campaign.status !== statusFilter) return false;

    if (timeFilter !== 'all') {
      const createdAt = new Date(campaign.created_at);
      const now = new Date();
      const daysAgo = timeFilter === '7d' ? 7 : 30;
      const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      if (createdAt < cutoff) return false;
    }

    return true;
  });

  const FilterButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-sm rounded-lg transition-all duration-150"
      style={{
        backgroundColor: active ? 'rgba(42, 83, 208, 0.08)' : 'transparent',
        color: active ? NUUM_COLORS.textPrimary : '#C8C8C8',
        border: `1px solid ${active ? NUUM_COLORS.accent : '#1C1C1C'}`,
      }}
    >
      {children}
    </button>
  );

  if (loading) {
    return (
      <PageLayout title="Campaigns" subtitle="Manage your campaigns">
        <div style={{ color: NUUM_COLORS.textSecondary }}>Loading campaigns...</div>
      </PageLayout>
    );
  }

  return (
    <>
      <PageLayout title="Campaigns" subtitle="Manage your campaigns">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className={TYPOGRAPHY.metadata} style={{ color: NUUM_COLORS.textMuted }}>Status:</span>
              <div className="flex gap-2">
                <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>All</FilterButton>
                <FilterButton active={statusFilter === 'active'} onClick={() => setStatusFilter('active')}>Active</FilterButton>
                <FilterButton active={statusFilter === 'draft'} onClick={() => setStatusFilter('draft')}>Draft</FilterButton>
                <FilterButton active={statusFilter === 'completed'} onClick={() => setStatusFilter('completed')}>Completed</FilterButton>
                <FilterButton active={statusFilter === 'archived'} onClick={() => setStatusFilter('archived')}>Archived</FilterButton>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={TYPOGRAPHY.metadata} style={{ color: NUUM_COLORS.textMuted }}>Time:</span>
              <div className="flex gap-2">
                <FilterButton active={timeFilter === 'all'} onClick={() => setTimeFilter('all')}>All time</FilterButton>
                <FilterButton active={timeFilter === '30d'} onClick={() => setTimeFilter('30d')}>Last 30 days</FilterButton>
                <FilterButton active={timeFilter === '7d'} onClick={() => setTimeFilter('7d')}>Last 7 days</FilterButton>
              </div>
            </div>
          </div>

          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>

        {filteredCampaigns.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className={TYPOGRAPHY.bodyText} style={{ color: NUUM_COLORS.textSecondary }}>
                No campaigns found. Create your first campaign to get started.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCampaigns.map(campaign => (
              <Card
                key={campaign.id}
                hover
                onClick={() => setSelectedCampaign(campaign)}
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
                  <span style={{ color: '#C8C8C8' }}>Spend:</span>
                  <span style={{ color: NUUM_COLORS.textPrimary }}>€{campaign.total_spend.toLocaleString()}</span>

                  <span style={{ color: '#C8C8C8' }}>Revenue:</span>
                  <span style={{ color: NUUM_COLORS.textPrimary }}>€{campaign.total_revenue.toLocaleString()}</span>

                  <span style={{ color: '#C8C8C8' }}>ROI:</span>
                  <span style={{ color: campaign.roi >= 0 ? 'rgba(56, 226, 159, 0.9)' : 'rgba(231, 76, 60, 0.9)' }}>
                    {campaign.roi.toFixed(1)}%
                  </span>

                  <span style={{ color: '#C8C8C8' }}>Creators:</span>
                  <span style={{ color: NUUM_COLORS.textPrimary }}>{campaign.creators_count}</span>
                </div>

                <div className="pt-3 border-t" style={{ borderColor: '#1C1C1C' }}>
                  <span className={TYPOGRAPHY.metadata} style={{ color: NUUM_COLORS.textMuted }}>
                    {campaign.content_count} content items
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageLayout>

      {selectedCampaign && (
        <CampaignDetailModal
          campaign={selectedCampaign}
          workspace={workspace}
          onClose={() => setSelectedCampaign(null)}
          onUpdate={loadCampaigns}
        />
      )}
    </>
  );
}
