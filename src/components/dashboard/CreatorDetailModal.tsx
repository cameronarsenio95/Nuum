import { X, TrendingUp, DollarSign, Target, Zap, Mail, Phone, Link2, Award } from 'lucide-react';

interface CreatorDetail {
  creator_id: string;
  creator_name: string;
  total_revenue: number;
  total_spend: number;
  profit: number;
  roi_percentage: number;
  conversions: number;
  campaigns_count: number;
  ad_sets_count: number;
  email?: string;
  phone?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  snapchat_handle?: string;
  discount_code?: string;
  tags?: string[];
  notes?: string;
  status?: string;
  follower_count?: Record<string, number>;
  engagement_rate?: number;
}

interface CreatorCampaign {
  campaign_id: string;
  campaign_name: string;
  campaign_status: string;
  revenue: number;
  spend: number;
  conversions: number;
  roi: number;
}

interface CreatorDetailModalProps {
  creator: CreatorDetail;
  campaigns: CreatorCampaign[];
  rank: number;
  onClose: () => void;
}

export default function CreatorDetailModal({ creator, campaigns, rank, onClose }: CreatorDetailModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('nl-NL').format(num);
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

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle p-4 md:p-6 flex items-start justify-between z-10">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl md:text-2xl font-medium truncate">{creator.creator_name}</h2>
              <div className="flex-shrink-0 w-8 h-8 dark:bg-linear-warning-subtle light:bg-linear-light-warning-subtle rounded-full flex items-center justify-center border dark:border-linear-warning-border light:border-linear-light-warning-border">
                <span className="text-sm font-medium text-linear-warning">#{rank}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {creator.status && (
                <span className={`inline-flex text-xs px-2.5 py-1 rounded-full border ${getStatusColor(creator.status)}`}>
                  {creator.status}
                </span>
              )}
              <span className="text-xs px-2.5 py-1 rounded-full dark:bg-linear-info-subtle light:bg-linear-light-info-subtle dark:text-linear-info light:text-linear-light-info border dark:border-linear-info-border light:border-linear-light-info-border">
                {creator.campaigns_count} campaigns
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full dark:bg-linear-accent-subtle light:bg-linear-light-accent-subtle dark:text-linear-accent light:text-linear-light-accent border dark:border-linear-accent-border light:border-linear-light-accent-border">
                {creator.ad_sets_count} ad sets
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover rounded-linear linear-transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-linear-success-subtle rounded-linear flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-linear-success" />
                </div>
                <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Revenue</span>
              </div>
              <div className="text-xl font-medium">{formatCurrency(creator.total_revenue)}</div>
              <div className="text-xs dark:text-text-secondary light:text-text-light-secondary mt-1">
                Total generated
              </div>
            </div>

            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-linear-info-subtle rounded-linear flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-linear-info" />
                </div>
                <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">ROI</span>
              </div>
              <div className={`text-xl font-medium ${creator.roi_percentage > 0 ? 'text-linear-success' : 'text-linear-error'}`}>
                {creator.roi_percentage > 0 ? '+' : ''}{creator.roi_percentage}%
              </div>
              <div className="text-xs dark:text-text-secondary light:text-text-light-secondary mt-1">
                {formatCurrency(creator.profit)} profit
              </div>
            </div>

            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-linear-warning-subtle rounded-linear flex items-center justify-center">
                  <Target className="w-4 h-4 text-linear-warning" />
                </div>
                <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Conversions</span>
              </div>
              <div className="text-xl font-medium">{formatNumber(creator.conversions)}</div>
              <div className="text-xs dark:text-text-secondary light:text-text-light-secondary mt-1">
                Across all campaigns
              </div>
            </div>

            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-linear-accent-subtle rounded-linear flex items-center justify-center">
                  <Zap className="w-4 h-4 text-linear-accent" />
                </div>
                <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Spend</span>
              </div>
              <div className="text-xl font-medium">{formatCurrency(creator.total_spend)}</div>
              <div className="text-xs dark:text-text-secondary light:text-text-light-secondary mt-1">
                Total investment
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {(creator.email || creator.phone) && (
              <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4">
                <h3 className="text-sm font-medium mb-3">Contact Information</h3>
                <div className="space-y-3">
                  {creator.email && (
                    <a
                      href={`mailto:${creator.email}`}
                      className="flex items-center gap-3 text-sm hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover p-2 rounded-linear linear-transition"
                    >
                      <Mail className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary flex-shrink-0" />
                      <span className="text-linear-info truncate">{creator.email}</span>
                    </a>
                  )}
                  {creator.phone && (
                    <a
                      href={`tel:${creator.phone}`}
                      className="flex items-center gap-3 text-sm hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover p-2 rounded-linear linear-transition"
                    >
                      <Phone className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary flex-shrink-0" />
                      <span className="text-linear-info">{creator.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {creator.follower_count && Object.keys(creator.follower_count).length > 0 && (
              <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4">
                <h3 className="text-sm font-medium mb-3">Follower Count</h3>
                <div className="space-y-2">
                  {Object.entries(creator.follower_count).map(([platform, count]) => (
                    <div key={platform} className="flex items-center justify-between text-sm">
                      <span className="capitalize dark:text-text-secondary light:text-text-light-secondary">{platform}</span>
                      <span className="font-medium">{formatNumber(count)}</span>
                    </div>
                  ))}
                  {creator.engagement_rate && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle">
                      <span className="dark:text-text-secondary light:text-text-light-secondary">Engagement Rate</span>
                      <span className="font-medium text-linear-success">{creator.engagement_rate}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {(creator.instagram_handle || creator.tiktok_handle || creator.snapchat_handle) && (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4">
              <h3 className="text-sm font-medium mb-3">Social Media</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {creator.instagram_handle && (
                  <a
                    href={`https://instagram.com/${creator.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover linear-transition"
                  >
                    <Link2 className="w-4 h-4 dark:text-text-secondary light:text-text-light-secondary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Instagram</div>
                      <div className="text-sm font-medium truncate">@{creator.instagram_handle}</div>
                    </div>
                  </a>
                )}
                {creator.tiktok_handle && (
                  <a
                    href={`https://tiktok.com/@${creator.tiktok_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover linear-transition"
                  >
                    <Link2 className="w-4 h-4 dark:text-text-secondary light:text-text-light-secondary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">TikTok</div>
                      <div className="text-sm font-medium truncate">@{creator.tiktok_handle}</div>
                    </div>
                  </a>
                )}
                {creator.snapchat_handle && (
                  <a
                    href={`https://snapchat.com/add/${creator.snapchat_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover linear-transition"
                  >
                    <Link2 className="w-4 h-4 dark:text-text-secondary light:text-text-light-secondary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Snapchat</div>
                      <div className="text-sm font-medium truncate">@{creator.snapchat_handle}</div>
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}

          {creator.discount_code && (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
                <h3 className="text-sm font-medium">Discount Code</h3>
              </div>
              <div className="mt-2 px-4 py-3 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear border-2 dark:border-linear-accent light:border-linear-light-accent">
                <div className="font-mono text-lg font-medium text-linear-accent text-center tracking-wider">
                  {creator.discount_code}
                </div>
              </div>
            </div>
          )}

          {creator.tags && creator.tags.length > 0 && (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4">
              <h3 className="text-sm font-medium mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {creator.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 text-xs dark:bg-linear-info-subtle light:bg-linear-light-info-subtle dark:text-linear-info light:text-linear-light-info rounded-full border dark:border-linear-info-border light:border-linear-light-info-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {creator.notes && (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4">
              <h3 className="text-sm font-medium mb-2">Notes</h3>
              <p className="text-sm dark:text-text-secondary light:text-text-light-secondary whitespace-pre-wrap">
                {creator.notes}
              </p>
            </div>
          )}

          {campaigns.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Campaign Performance</h3>
              <div className="space-y-2">
                {campaigns.map((campaign) => {
                  const getCampaignStatusColor = (status: string) => {
                    switch (status) {
                      case 'active':
                        return 'text-linear-success bg-linear-success-subtle border-linear-success-border';
                      case 'completed':
                        return 'text-linear-info bg-linear-info-subtle border-linear-info-border';
                      case 'draft':
                        return 'text-text-tertiary bg-linear-bg-hover border-linear-border';
                      default:
                        return 'text-text-tertiary bg-linear-bg-hover border-linear-border';
                    }
                  };

                  return (
                    <div
                      key={campaign.campaign_id}
                      className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate mb-1">{campaign.campaign_name}</div>
                          <span className={`inline-flex text-xs px-2 py-0.5 rounded-full border ${getCampaignStatusColor(campaign.campaign_status)}`}>
                            {campaign.campaign_status}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-medium">{formatCurrency(campaign.revenue)}</div>
                          <div className={`text-xs font-medium ${campaign.roi > 0 ? 'text-linear-success' : 'text-linear-error'}`}>
                            {campaign.roi > 0 ? '+' : ''}{campaign.roi.toFixed(2)}% ROI
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle text-xs">
                        <div>
                          <div className="dark:text-text-tertiary light:text-text-light-tertiary mb-1">Spend</div>
                          <div className="font-medium">{formatCurrency(campaign.spend)}</div>
                        </div>
                        <div>
                          <div className="dark:text-text-tertiary light:text-text-light-tertiary mb-1">Conversions</div>
                          <div className="font-medium">{formatNumber(campaign.conversions)}</div>
                        </div>
                        <div>
                          <div className="dark:text-text-tertiary light:text-text-light-tertiary mb-1">Profit</div>
                          <div className="font-medium">{formatCurrency(campaign.revenue - campaign.spend)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
