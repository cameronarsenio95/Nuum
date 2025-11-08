import { Plus } from 'lucide-react';
import { NUUM_COLORS, TYPOGRAPHY } from '../../utils/designSystem';
import type { Database } from '../../lib/database.types';

type AdSet = Database['public']['Tables']['ad_sets']['Row'];

interface AdSetsCardProps {
  adSets: AdSet[];
  onAddAdSet: () => void;
  onEditAdSet: (adSet: AdSet) => void;
}

const PLATFORM_LABELS: Record<string, string> = {
  'instagram': 'Instagram',
  'tiktok': 'TikTok',
  'meta': 'Meta',
  'snapchat': 'Snapchat',
  'youtube': 'YouTube',
};

const STATUS_LABELS: Record<string, string> = {
  'active': 'Active',
  'paused': 'Paused',
  'completed': 'Completed',
};

export function AdSetsCard({ adSets, onAddAdSet, onEditAdSet }: AdSetsCardProps) {
  return (
    <section
      className="rounded-lg border px-5 py-4 flex flex-col gap-3"
      style={{
        backgroundColor: NUUM_COLORS.surface,
        borderColor: NUUM_COLORS.border,
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-1"
            style={{ color: NUUM_COLORS.textSecondary }}
          >
            Ad Sets
          </h3>
          <p className="text-[11px]" style={{ color: NUUM_COLORS.textMuted }}>
            Performance of ad sets within this campaign
          </p>
        </div>
        <button
          onClick={onAddAdSet}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all duration-150"
          style={{
            borderColor: NUUM_COLORS.border,
            color: NUUM_COLORS.textSecondary,
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = NUUM_COLORS.surfaceHover;
            e.currentTarget.style.color = NUUM_COLORS.textPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = NUUM_COLORS.textSecondary;
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Ad Set
        </button>
      </div>

      <div className="space-y-1.5 max-h-96 overflow-y-auto">
        {adSets.length === 0 ? (
          <p className="text-xs py-8 text-center" style={{ color: NUUM_COLORS.textMuted }}>
            No ad sets yet for this campaign.
          </p>
        ) : (
          adSets.map((adSet) => {
            const spend = Number(adSet.spend) || 0;
            const revenue = Number(adSet.revenue) || 0;
            const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;

            return (
              <button
                key={adSet.id}
                className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-left transition-all duration-150"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = NUUM_COLORS.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={() => onEditAdSet(adSet)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm mb-0.5" style={{ color: NUUM_COLORS.textPrimary }}>
                    {adSet.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]" style={{ color: NUUM_COLORS.textMuted }}>
                    <span>{PLATFORM_LABELS[adSet.platform] || adSet.platform}</span>
                    <span>•</span>
                    <span>{STATUS_LABELS[adSet.status] || adSet.status}</span>
                  </div>
                </div>

                <div className="text-right ml-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div>
                      <div className="text-[10px] mb-0.5" style={{ color: NUUM_COLORS.textMuted }}>
                        Spend
                      </div>
                      <div className="text-xs font-medium" style={{ color: NUUM_COLORS.textSecondary }}>
                        €{spend.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] mb-0.5" style={{ color: NUUM_COLORS.textMuted }}>
                        Revenue
                      </div>
                      <div className="text-xs font-medium" style={{ color: 'rgba(56, 226, 159, 0.9)' }}>
                        €{revenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] font-medium" style={{ color: roi >= 0 ? 'rgba(56, 226, 159, 0.8)' : 'rgba(231, 76, 60, 0.8)' }}>
                    {roi.toFixed(1)}% ROI
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
