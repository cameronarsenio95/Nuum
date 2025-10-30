import { AlertTriangle, CreditCard } from 'lucide-react';

interface FrozenAccountBannerProps {
  onUpgradeClick: () => void;
}

export function FrozenAccountBanner({ onUpgradeClick }: FrozenAccountBannerProps) {
  return (
    <div className="sticky top-0 z-40 bg-red-500 border-b-2 border-red-600 shadow-lg animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="w-5 h-5 text-white flex-shrink-0" strokeWidth={2.5} />
            <div>
              <p className="text-white font-semibold text-sm">
                Account Frozen - All features locked
              </p>
              <p className="text-red-100 text-xs">
                Your Free plan expired. Upgrade to Standard to unlock.
              </p>
            </div>
          </div>
          <button
            onClick={onUpgradeClick}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-red-600 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg flex-shrink-0"
          >
            <CreditCard className="w-4 h-4" />
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}
