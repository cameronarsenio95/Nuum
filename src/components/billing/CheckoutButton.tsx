import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

interface CheckoutButtonProps {
  plan: 'standard' | 'elite';
  workspaceId: string;
  className?: string;
}

const PLAN_PRICES = {
  standard: {
    monthly: 49,
    annual: 470,
  },
  elite: {
    monthly: 99,
    annual: 950,
  },
};

export function CheckoutButton({ plan, workspaceId, className }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const { showToast } = useToast();

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          billingPeriod,
          workspaceId,
          successUrl: `${window.location.origin}/dashboard?checkout=success`,
          cancelUrl: `${window.location.origin}/dashboard?checkout=cancelled`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Checkout response:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Failed to create checkout session: ${errorMessage}`, 'error');
      setLoading(false);
    }
  };

  const price = PLAN_PRICES[plan][billingPeriod];
  const savings = billingPeriod === 'annual' ? Math.round(PLAN_PRICES[plan].monthly * 12 - PLAN_PRICES[plan].annual) : 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear">
        <button
          onClick={() => setBillingPeriod('monthly')}
          className={`flex-1 px-4 py-2 rounded-linear text-sm font-medium linear-transition ${
            billingPeriod === 'monthly'
              ? 'bg-white text-black'
              : 'dark:text-text-secondary light:text-text-light-secondary hover:dark:text-text-primary hover:light:text-text-light-primary'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingPeriod('annual')}
          className={`flex-1 px-4 py-2 rounded-linear text-sm font-medium linear-transition relative ${
            billingPeriod === 'annual'
              ? 'bg-white text-black'
              : 'dark:text-text-secondary light:text-text-light-secondary hover:dark:text-text-primary hover:light:text-text-light-primary'
          }`}
        >
          Annual
          {savings > 0 && (
            <span className="absolute -top-2 -right-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
              Save €{savings}
            </span>
          )}
        </button>
      </div>

      <div className="text-center py-4">
        <div className="text-4xl font-bold mb-1">
          €{price}
          <span className="text-lg font-normal dark:text-text-secondary light:text-text-light-secondary">
            /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
          </span>
        </div>
        {billingPeriod === 'annual' && (
          <div className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">
            €{Math.round(price / 12)}/mo billed annually
          </div>
        )}
      </div>

      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-linear linear-transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Subscribe to {plan === 'standard' ? 'Standard' : 'Elite'}
          </>
        )}
      </button>

      <p className="text-xs text-center dark:text-text-tertiary light:text-text-light-tertiary">
        Secure payment powered by Stripe. Cancel anytime.
      </p>
    </div>
  );
}
