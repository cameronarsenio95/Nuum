import { useState, useEffect } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PageLayout } from '../PageLayout';
import { Card } from '../Card';
import { Button } from '../Button';
import { NUUM_COLORS, TYPOGRAPHY, getStatusColorClass } from '../../utils/designSystem';
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
  const [campaigns, setCampaigns] = useState<CampaignWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);

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
        {campaigns.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className={TYPOGRAPHY.bodyText} style={{ color: NUUM_COLORS.textSecondary }}>
                No campaigns found. Create your first campaign to get started.
              </p>
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

                <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: '#1C1C1C' }}>
                  <span className={TYPOGRAPHY.metadata} style={{ color: NUUM_COLORS.textMuted }}>
                    {campaign.content_count} content items
                  </span>
                  <div className="flex items-center gap-1" style={{ color: '#666666' }}>
                    <span className="text-xs">View details</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageLayout>

    </>
  );
}
