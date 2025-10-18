import { X, Target, TrendingUp, DollarSign, Calendar, Users } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type AdSet = Database['public']['Tables']['ad_sets']['Row'];

interface CampaignDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  total_revenue: number;
  total_spend: number;
  profit: number;
  roi_percentage: number;
  total_conversions: number;
  total_clicks: number;
  total_impressions: number;
  avg_ctr: number;
  cost_per_conversion: number;
  goals: any;
  brand_guidelines: string | null;
  brand: string | null;
  total_ad_sets: number;
  active_ad_sets: number;
}

interface CampaignDetailModalProps {
  campaign: CampaignDetail;
  adSets: AdSet[];
  onClose: () => void;
}

export default function CampaignDetailModal({ campaign, adSets, onClose }: CampaignDetailModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('nl-NL').format(num);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
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

  const platformMetrics = adSets.reduce((acc, adSet) => {
    const platform = adSet.platform;
    if (!acc[platform]) {
      acc[platform] = {
        revenue: 0,
        spend: 0,
        conversions: 0,
        clicks: 0,
        impressions: 0,
        count: 0
      };
    }
    acc[platform].revenue += Number(adSet.revenue) || 0;
    acc[platform].spend += Number(adSet.spend) || 0;
    acc[platform].conversions += Number(adSet.conversions) || 0;
    acc[platform].clicks += Number(adSet.clicks) || 0;
    acc[platform].impressions += Number(adSet.impressions) || 0;
    acc[platform].count += 1;
    return acc;
  }, {} as Record<string, any>);

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
            <h2 className="text-xl md:text-2xl font-medium mb-2 truncate">{campaign.name}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`inline-flex text-xs px-2.5 py-1 rounded-full border ${getStatusColor(campaign.status)}`}>
                {campaign.status}
              </span>
              {campaign.brand && (
                <span className="text-xs px-2.5 py-1 rounded-full dark:bg-linear-accent-subtle light:bg-linear-light-accent-subtle dark:text-linear-accent light:text-linear-light-accent border dark:border-linear-accent-border light:border-linear-light-accent-border">
                  {campaign.brand}
                </span>
              )}
              {campaign.start_date && (
                <div className="flex items-center gap-1.5 text-xs dark:text-text-secondary light:text-text-light-secondary">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                </div>
              )}
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
              <div className="text-xl font-medium">{formatCurrency(campaign.total_revenue)}</div>
              <div className="text-xs dark:text-text-secondary light:text-text-light-secondary mt-1">
                Profit: {formatCurrency(campaign.profit)}
              </div>
            </div>

            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-linear-info-subtle rounded-linear flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-linear-info" />
                </div>
                <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">ROI</span>
              </div>
              <div className={`text-xl font-medium ${campaign.roi_percentage > 0 ? 'text-linear-success' : 'text-linear-error'}`}>
                {campaign.roi_percentage > 0 ? '+' : ''}{campaign.roi_percentage}%
              </div>
              <div className="text-xs dark:text-text-secondary light:text-text-light-secondary mt-1">
                Costs: {formatCurrency(campaign.total_spend)}
              </div>
            </div>

            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-linear-warning-subtle rounded-linear flex items-center justify-center">
                  <Target className="w-4 h-4 text-linear-warning" />
                </div>
                <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Conversions</span>
              </div>
              <div className="text-xl font-medium">{formatNumber(campaign.total_conversions)}</div>
              <div className="text-xs dark:text-text-secondary light:text-text-light-secondary mt-1">
                {campaign.cost_per_conversion > 0 ? formatCurrency(campaign.cost_per_conversion) : '€0'} per conversion
              </div>
            </div>

            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-linear-accent-subtle rounded-linear flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-linear-accent" />
                </div>
                <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Costs</span>
              </div>
              <div className="text-xl font-medium">{formatCurrency(campaign.total_spend)}</div>
              <div className="text-xs dark:text-text-secondary light:text-text-light-secondary mt-1">
                Total investment
              </div>
            </div>
          </div>

          {Object.keys(platformMetrics).length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Platform Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(platformMetrics).map(([platform, metrics]: [string, any]) => {
                  const profit = metrics.revenue - metrics.spend;
                  const roi = metrics.spend > 0 ? ((profit / metrics.spend) * 100).toFixed(2) : '0';
                  const ctr = metrics.impressions > 0 ? ((metrics.clicks / metrics.impressions) * 100).toFixed(2) : '0';

                  return (
                    <div
                      key={platform}
                      className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm capitalize">{platform}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          Number(roi) > 0
                            ? 'bg-linear-success-subtle text-linear-success border border-linear-success-border'
                            : 'bg-linear-error-subtle text-linear-error border border-linear-error-border'
                        }`}>
                          {Number(roi) > 0 ? '+' : ''}{Math.round(Number(roi))}% ROI
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="dark:text-text-secondary light:text-text-light-secondary">Ad Sets</span>
                          <span className="font-medium">{metrics.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="dark:text-text-secondary light:text-text-light-secondary">Revenue</span>
                          <span className="font-medium">{formatCurrency(metrics.revenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="dark:text-text-secondary light:text-text-light-secondary">Conversions</span>
                          <span className="font-medium">{formatNumber(metrics.conversions)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle">
                          <span className="dark:text-text-secondary light:text-text-light-secondary">CTR</span>
                          <span className="font-medium">{ctr}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {campaign.description && (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4">
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <p className="text-sm dark:text-text-secondary light:text-text-light-secondary whitespace-pre-wrap">
                {campaign.description}
              </p>
            </div>
          )}

          {campaign.goals && Object.keys(campaign.goals).length > 0 && (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4">
              <h3 className="text-sm font-medium mb-2">Campaign Goals</h3>
              <div className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(campaign.goals, null, 2)}</pre>
              </div>
            </div>
          )}

          {adSets.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
                <h3 className="text-sm font-medium">Ad Sets ({adSets.length})</h3>
              </div>
              <div className="space-y-2">
                {adSets.map((adSet) => {
                  const adSetProfit = Number(adSet.revenue || 0) - Number(adSet.spend || 0);
                  const adSetROI = Number(adSet.spend) > 0
                    ? ((adSetProfit / Number(adSet.spend)) * 100).toFixed(2)
                    : '0';

                  return (
                    <div
                      key={adSet.id}
                      className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{adSet.name}</div>
                          <div className="flex items-center gap-2 mt-1 text-xs dark:text-text-secondary light:text-text-light-secondary">
                            <span className="capitalize">{adSet.platform}</span>
                            <span className="dark:text-text-tertiary light:text-text-light-tertiary">•</span>
                            <span className="capitalize">{adSet.status}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-medium text-sm">{formatCurrency(Number(adSet.revenue || 0))}</div>
                          <div className={`text-xs font-medium ${Number(adSetROI) > 0 ? 'text-linear-success' : 'text-linear-error'}`}>
                            {Number(adSetROI) > 0 ? '+' : ''}{adSetROI}% ROI
                          </div>
                        </div>
                      </div>
                      {(adSet.conversions || adSet.clicks) && (
                        <div className="flex gap-4 mt-2 pt-2 border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                          {adSet.conversions && (
                            <span>{formatNumber(adSet.conversions)} conversions</span>
                          )}
                          {adSet.clicks && (
                            <span>{formatNumber(adSet.clicks)} clicks</span>
                          )}
                        </div>
                      )}
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
