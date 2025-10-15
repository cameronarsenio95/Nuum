import { useState } from 'react';
import { AlertCircle, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface SubscriptionManagerProps {
  workspaceId: string;
  currentPlan: string;
  subscriptionStatus: string | null;
  stripeSubscriptionId: string | null;
  onUpdate: () => void;
}

export function SubscriptionManager({
  workspaceId,
  currentPlan,
  subscriptionStatus,
  stripeSubscriptionId,
  onUpdate,
}: SubscriptionManagerProps) {
  const [loading, setLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { showToast } = useToast();

  const handleCancelSubscription = async () => {
    if (!stripeSubscriptionId) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-subscription`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'cancel',
            subscriptionId: stripeSubscriptionId,
            workspaceId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel subscription');
      }

      showToast('Subscription canceled. Access continues until period end.', 'success');
      setShowCancelDialog(false);
      onUpdate();
    } catch (error) {
      console.error('Cancel error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to cancel subscription', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    if (!stripeSubscriptionId) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-subscription`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'resume',
            subscriptionId: stripeSubscriptionId,
            workspaceId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resume subscription');
      }

      showToast('Subscription resumed successfully', 'success');
      onUpdate();
    } catch (error) {
      console.error('Resume error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to resume subscription', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (currentPlan === 'free' || !stripeSubscriptionId) {
    return null;
  }

  return (
    <>
      <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-6">
        <h3 className="text-lg font-medium mb-4">Subscription Management</h3>

        <div className="space-y-4">
          {subscriptionStatus === 'active' && (
            <div>
              <p className="text-sm dark:text-text-secondary light:text-text-light-secondary mb-4">
                Cancel your subscription anytime. You'll continue to have access until the end of your billing period.
              </p>
              <button
                onClick={() => setShowCancelDialog(true)}
                disabled={loading}
                className="px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-linear text-sm font-medium linear-transition disabled:opacity-50"
              >
                Cancel Subscription
              </button>
            </div>
          )}

          {subscriptionStatus === 'canceled' && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-linear">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm dark:text-text-secondary light:text-text-light-secondary mb-3">
                    Your subscription has been canceled. You can resume it to continue enjoying all features.
                  </p>
                  <button
                    onClick={handleResumeSubscription}
                    disabled={loading}
                    className="px-4 py-2 bg-linear-accent hover:bg-linear-accent-hover text-white rounded-linear text-sm font-medium linear-transition disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Resume Subscription'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50" onClick={() => setShowCancelDialog(false)}>
          <div className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-medium">Cancel Subscription</h3>
              <button
                onClick={() => setShowCancelDialog(false)}
                className="p-1 hover:dark:bg-linear-bg-subtle hover:light:bg-linear-light-bg-subtle rounded-linear linear-transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="dark:text-text-secondary light:text-text-light-secondary mb-4">
                Are you sure you want to cancel your subscription?
              </p>
              <div className="space-y-2 text-sm dark:text-text-tertiary light:text-text-light-tertiary">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <span>You'll keep access until the end of your billing period</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <span>No charges after cancellation</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <span>You can resume your subscription anytime</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:dark:bg-linear-bg-tertiary hover:light:bg-linear-light-bg-tertiary rounded-linear text-sm font-medium linear-transition disabled:opacity-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-linear text-sm font-medium linear-transition disabled:opacity-50"
              >
                {loading ? 'Canceling...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
