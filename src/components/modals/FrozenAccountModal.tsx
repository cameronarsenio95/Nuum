import { AlertTriangle, CreditCard, X } from 'lucide-react';

interface FrozenAccountModalProps {
  onUpgrade: () => void;
  onClose: () => void;
}

export function FrozenAccountModal({ onUpgrade, onClose }: FrozenAccountModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-8 w-full max-w-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:dark:bg-linear-bg-subtle hover:light:bg-linear-light-bg-subtle rounded-linear linear-transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-linear bg-red-500/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          <h2 className="text-2xl font-medium mb-3">Account Frozen</h2>

          <p className="dark:text-text-secondary light:text-text-light-secondary mb-4">
            Your Free plan has expired after 7 days. Your account is now frozen and you cannot create or edit any data.
          </p>

          <div className="w-full p-4 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear mb-6 text-left">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              What does this mean?
            </h3>
            <ul className="space-y-2 text-sm dark:text-text-secondary light:text-text-light-secondary">
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>You can view your existing data but cannot make changes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>You cannot create new campaigns, creators, or tasks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>Your data is safe and will be restored after upgrading</span>
              </li>
            </ul>
          </div>

          <div className="w-full space-y-3">
            <button
              onClick={onUpgrade}
              className="w-full py-3 rounded-linear text-base font-medium bg-red-500 hover:bg-red-600 text-white linear-transition flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Upgrade to Standard Plan
            </button>

            <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
              Upgrade to unlock full access and continue managing your creator campaigns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
