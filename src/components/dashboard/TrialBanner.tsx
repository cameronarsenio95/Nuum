import { AlertCircle, Crown, X } from 'lucide-react';
import { useState } from 'react';

interface TrialBannerProps {
  daysRemaining: number;
  onUpgradeClick: () => void;
}

export function TrialBanner({ daysRemaining, onUpgradeClick }: TrialBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const isUrgent = daysRemaining <= 2;

  return (
    <div
      className={`relative p-4 rounded-linear-lg border-2 mb-6 ${
        isUrgent
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-linear-accent/10 border-linear-accent/30'
      }`}
    >
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-4 right-4 p-1 hover:dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear linear-transition"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4 pr-8">
        <div
          className={`w-10 h-10 rounded-linear flex items-center justify-center flex-shrink-0 ${
            isUrgent ? 'bg-red-500/20' : 'bg-linear-accent/20'
          }`}
        >
          {isUrgent ? (
            <AlertCircle className="w-5 h-5 text-red-400" />
          ) : (
            <Crown className="w-5 h-5 text-linear-accent" />
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-base font-medium mb-1">
            {isUrgent ? 'Your Trial Expires Soon!' : '7-Day Trial Active'}
          </h3>
          <p className="text-sm dark:text-text-secondary light:text-text-light-secondary mb-3">
            {isUrgent ? (
              <>
                Only <strong>{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</strong> left in your trial with 25 creators, 5GB storage, and Standard features.
                Upgrade to Elite for unlimited access!
              </>
            ) : (
              <>
                You have <strong>{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</strong> remaining to test Standard features.
                Upgrade to Elite anytime for more creators and storage.
              </>
            )}
          </p>

          <button
            onClick={onUpgradeClick}
            className={`px-4 py-2 rounded-linear text-sm font-medium linear-transition ${
              isUrgent
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-linear-accent hover:bg-linear-accent-hover text-linear-bg'
            }`}
          >
            {isUrgent ? 'Upgrade Now' : 'View Plans'}
          </button>
        </div>
      </div>
    </div>
  );
}
