import { useState, useEffect } from 'react';
import { CreditCard, Check, Clock, AlertCircle, Download, ExternalLink, Crown, Zap, Building, FileText, AlertTriangle, Calendar, ArrowRight } from 'lucide-react';
import { CheckoutButton } from '../billing/CheckoutButton';
import { SubscriptionManager } from '../billing/SubscriptionManager';
import { supabase } from '../../lib/supabase';
import { usePlanLimits } from '../../contexts/PlanLimitsContext';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];

interface BillingViewProps {
  workspace: Workspace;
  onWorkspaceUpdate?: () => void;
}

interface PaymentMethod {
  id: string;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
}

interface Invoice {
  id: string;
  stripe_invoice_id: string;
  invoice_number: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: string;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
  paid_at: string | null;
  created_at: string;
}

export function BillingView({ workspace, onWorkspaceUpdate }: BillingViewProps) {
  const { freeAccountInfo } = usePlanLimits();
  const [showCheckout, setShowCheckout] = useState<'standard' | 'elite' | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomerPortal, setShowCustomerPortal] = useState(false);

  const getTrialInfo = () => {
    if (!workspace.trial_ends_at) return null;

    const now = new Date();
    const trialEnd = new Date(workspace.trial_ends_at);
    const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      isActive: workspace.subscription_status === 'trialing' && daysRemaining > 0,
      daysRemaining: Math.max(0, daysRemaining),
      endDate: trialEnd,
    };
  };

  const trialInfo = getTrialInfo();

  const plans = [
    {
      name: '7-Day Trial',
      subtitle: 'Then choose a plan',
      price: 0,
      period: 'for 7 days',
      features: [
        '7-day trial with Elite features',
        'Up to 3 brand workspaces',
        'Up to 50 creators',
        '25GB storage',
        'Full analytics & exports',
        'Team collaboration (5 members)',
        'Priority support',
      ],
      value: 'free',
      highlighted: false,
      startHere: true,
    },
    {
      name: 'Standard',
      price: 49,
      period: 'month',
      features: [
        '1 brand workspace',
        'Up to 25 creators',
        '5GB storage',
        'Advanced analytics',
        'Revenue tracking',
        'Team collaboration (3 members)',
        'Email support',
      ],
      value: 'standard',
      highlighted: false,
    },
    {
      name: 'Elite',
      price: 99,
      period: 'month',
      features: [
        'Up to 3 brand workspaces',
        'Up to 50 creators',
        '25GB storage',
        'Full analytics & exports',
        'Revenue tracking',
        'Task assignment',
        'Team collaboration (5 members)',
        'Priority support',
      ],
      value: 'elite',
      highlighted: true,
      mostPopular: true,
    },
    {
      name: 'Enterprise',
      price: null,
      subtitle: 'Custom',
      features: [
        'Unlimited workspaces',
        'Unlimited creators',
        'Unlimited storage',
        'Custom integrations',
        'Dedicated account manager',
      ],
      value: 'enterprise',
      highlighted: false,
    },
  ];

  const currentPlan = plans.find(p => p.value === workspace.plan);

  useEffect(() => {
    loadBillingData();
  }, [workspace.id]);

  const loadBillingData = async () => {
    setLoading(true);
    try {
      if (workspace.stripe_customer_id) {
        const { data: pmData } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('stripe_customer_id', workspace.stripe_customer_id)
          .order('is_default', { ascending: false });

        if (pmData) setPaymentMethods(pmData);

        const { data: invData } = await supabase
          .from('invoices')
          .select('*')
          .eq('workspace_id', workspace.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (invData) setInvoices(invData);
      }
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspaceId: workspace.id,
            returnUrl: window.location.href,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create portal session');
      }

      window.location.href = result.url;
    } catch (error) {
      console.error('Portal error:', error);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-medium mb-2">Billing & Subscription</h2>
        <p className="dark:text-text-secondary light:text-text-light-secondary">
          Manage your subscription, billing, and payment methods
        </p>
      </div>

      {freeAccountInfo.isFrozen && (
        <div className="mb-8 p-6 bg-red-500/10 border-2 border-red-500/30 rounded-linear-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-linear bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2 text-red-400">Account Frozen</h3>
              <p className="dark:text-text-secondary light:text-text-light-secondary mb-3">
                Your Free plan has expired. Your account is now frozen and you cannot create or edit any data.
              </p>
              <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary mb-4">
                Upgrade to Standard plan to unlock your account and continue using all features.
              </p>
              <button
                onClick={() => setShowCheckout('standard')}
                className="px-6 py-2.5 rounded-linear text-sm font-medium bg-red-500 hover:bg-red-600 text-white linear-transition"
              >
                Upgrade Now to Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {freeAccountInfo.isFreePlan && !freeAccountInfo.isFrozen && (
        <div className={`mb-8 p-6 border-2 rounded-linear-lg ${
          freeAccountInfo.daysRemaining <= 2
            ? 'bg-red-500/10 border-red-500/30'
            : freeAccountInfo.daysRemaining <= 3
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-blue-500/10 border-blue-500/30'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-linear flex items-center justify-center flex-shrink-0 ${
              freeAccountInfo.daysRemaining <= 2
                ? 'bg-red-500/20'
                : freeAccountInfo.daysRemaining <= 3
                ? 'bg-yellow-500/20'
                : 'bg-blue-500/20'
            }`}>
              <Calendar className={`w-6 h-6 ${
                freeAccountInfo.daysRemaining <= 2
                  ? 'text-red-400'
                  : freeAccountInfo.daysRemaining <= 3
                  ? 'text-yellow-400'
                  : 'text-blue-400'
              }`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2">
                {freeAccountInfo.daysRemaining <= 2 ? 'Free Plan Expiring Soon!' : 'Free Plan Active'}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="dark:text-text-secondary light:text-text-light-secondary mb-2">
                    {freeAccountInfo.daysRemaining > 0 ? (
                      <>
                        You have <strong className={freeAccountInfo.daysRemaining <= 2 ? 'text-red-400' : ''}>{freeAccountInfo.daysRemaining} {freeAccountInfo.daysRemaining === 1 ? 'day' : 'days'}</strong> remaining in your Free plan.
                      </>
                    ) : (
                      <strong className="text-red-400">Your Free plan expires today!</strong>
                    )}
                  </p>
                  <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">
                    Account created: <strong>{new Date(workspace.created_at).toLocaleDateString()}</strong>
                    {' • '}
                    Expires: <strong>{freeAccountInfo.expiresAt?.toLocaleDateString()}</strong>
                  </p>
                </div>

                <div className="relative w-full h-2 bg-gray-700/50 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full linear-transition ${
                      freeAccountInfo.daysRemaining <= 2
                        ? 'bg-red-500'
                        : freeAccountInfo.daysRemaining <= 3
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, (7 - freeAccountInfo.daysRemaining) / 7 * 100))}%` }}
                  />
                </div>

                <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">
                  {freeAccountInfo.daysRemaining <= 2 ? (
                    <strong className="text-red-400">Warning: Your account will be frozen if you don't upgrade to Standard plan.</strong>
                  ) : (
                    'After 7 days, your account will be frozen until you upgrade to a paid plan.'
                  )}
                </p>

                <button
                  onClick={() => setShowCheckout('standard')}
                  className={`px-6 py-2.5 rounded-linear text-sm font-medium linear-transition ${
                    freeAccountInfo.daysRemaining <= 2
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Upgrade to Standard Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {trialInfo?.isActive && (
        <div className="mb-8 p-6 bg-linear-accent/10 border border-linear-accent/20 rounded-linear-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-linear bg-linear-accent flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2">Your Trial is Active</h3>
              <p className="dark:text-text-secondary light:text-text-light-secondary mb-3">
                You have <strong>{trialInfo.daysRemaining} {trialInfo.daysRemaining === 1 ? 'day' : 'days'}</strong> remaining in your trial.
                Trial ends on {trialInfo.endDate.toLocaleDateString()}.
              </p>
              <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">
                Choose a plan below to continue enjoying all features after your trial ends.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-6">
        <h3 className="text-lg font-medium mb-4">Current Plan</h3>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {currentPlan ? (
              <>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-xl font-medium">{currentPlan.name}</h4>
                    <span className={`text-xs px-3 py-1 rounded-full border capitalize ${
                      workspace.plan === 'free'
                        ? 'text-gray-400 bg-gray-400/10 border-gray-400/20'
                        : workspace.plan === 'standard'
                        ? 'text-blue-400 bg-blue-400/10 border-blue-400/20'
                        : workspace.plan === 'elite'
                        ? 'text-linear-accent bg-linear-accent/10 border-linear-accent/20'
                        : 'text-purple-400 bg-purple-400/10 border-purple-400/20'
                    }`}>
                      {workspace.subscription_status || 'active'}
                    </span>
                  </div>
                  {currentPlan.price !== null && currentPlan.price > 0 && (
                    <p className="dark:text-text-secondary light:text-text-light-secondary">
                      €{currentPlan.price} per {currentPlan.period}
                    </p>
                  )}
                  {workspace.subscription_expires_at && (
                    <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary mt-1">
                      {workspace.subscription_status === 'trialing'
                        ? `Trial ends ${new Date(workspace.subscription_expires_at).toLocaleDateString()}`
                        : `Renews ${new Date(workspace.subscription_expires_at).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div>
                <p className="dark:text-text-secondary light:text-text-light-secondary">No plan selected</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Available Plans</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => {
            const isCurrent = plan.value === workspace.plan;
            const canUpgrade = plan.value !== 'free' && plan.value !== workspace.plan;
            const animationDelay = `${0.05 * (index + 1)}s`;

            return (
              <div
                key={plan.value}
                className={`relative dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border-2 rounded-linear-lg p-6 linear-transition hover:scale-[1.02] animate-slide-up flex flex-col ${
                  plan.startHere
                    ? 'border-green-500/30 hover:border-green-500/50 hover:shadow-xl'
                    : plan.highlighted
                    ? 'border-linear-accent/30 hover:border-linear-accent/50 hover:shadow-xl'
                    : 'dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:border-linear-border hover:light:border-linear-light-border hover:shadow-lg'
                }`}
                style={{ animationDelay }}
              >
                {plan.startHere && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 rounded-full text-xs font-medium text-white">
                    Start Here
                  </div>
                )}

                {plan.mostPopular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white rounded-full text-xs font-medium text-black">
                    Most Popular
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle border dark:border-linear-border light:border-linear-light-border rounded-full text-xs font-medium">
                    Current Plan
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-medium mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-2">
                    {plan.price !== null ? (
                      <>
                        <span className="text-3xl font-medium">€{plan.price}</span>
                        <span className="dark:text-text-secondary light:text-text-light-secondary text-sm">/ {plan.period}</span>
                      </>
                    ) : (
                      <span className="text-3xl font-medium">{plan.subtitle || 'Custom'}</span>
                    )}
                  </div>
                  {plan.subtitle && plan.price === 0 && (
                    <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mt-2">{plan.subtitle}</p>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="dark:text-text-secondary light:text-text-light-secondary text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.value === 'enterprise' ? (
                  <button
                    className="group w-full py-2.5 dark:bg-linear-bg-tertiary light:bg-linear-light-bg-tertiary border dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:border-linear-border hover:light:border-linear-light-border rounded-linear text-sm font-medium linear-transition flex items-center justify-center gap-2 mt-auto"
                  >
                    Contact Sales
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 linear-transition" strokeWidth={2} />
                  </button>
                ) : isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-linear text-sm font-medium dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle dark:text-text-tertiary light:text-text-light-tertiary cursor-not-allowed mt-auto"
                  >
                    Current Plan
                  </button>
                ) : canUpgrade ? (
                  plan.value === 'free' ? (
                    <button
                      onClick={() => setShowCheckout('standard')}
                      className="group w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-linear text-sm font-medium linear-transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg mt-auto"
                    >
                      Start Free Trial
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 linear-transition" strokeWidth={2} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowCheckout(plan.value as 'standard' | 'elite')}
                      className="group w-full py-2.5 bg-white hover:bg-gray-100 text-black rounded-linear text-sm font-medium linear-transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg mt-auto"
                    >
                      Upgrade
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 linear-transition" strokeWidth={2} />
                    </button>
                  )
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-linear text-sm font-medium dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle dark:text-text-tertiary light:text-text-light-tertiary cursor-not-allowed mt-auto"
                  >
                    Not Available
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SubscriptionManager
        workspaceId={workspace.id}
        currentPlan={workspace.plan}
        subscriptionStatus={workspace.subscription_status}
        stripeSubscriptionId={workspace.stripe_subscription_id}
        onUpdate={() => {
          loadBillingData();
          onWorkspaceUpdate?.();
        }}
      />

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 dark:text-linear-accent light:text-linear-light-accent" />
              <h3 className="font-medium">Payment Methods</h3>
            </div>
            {workspace.stripe_customer_id && (
              <button
                onClick={openCustomerPortal}
                className="text-xs dark:text-linear-accent light:text-linear-light-accent hover:underline"
              >
                Manage
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">Loading...</p>
          ) : paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between p-3 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-8 dark:bg-linear-bg-tertiary light:bg-linear-light-bg-tertiary rounded border dark:border-linear-border-subtle light:border-linear-light-border-subtle flex items-center justify-center">
                      <CreditCard className="w-4 h-4 dark:text-text-secondary light:text-text-light-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {pm.card_brand?.toUpperCase()} •••• {pm.card_last4}
                      </p>
                      <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                        Expires {pm.card_exp_month}/{pm.card_exp_year}
                      </p>
                    </div>
                  </div>
                  {pm.is_default && (
                    <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
                      Default
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div>
              <p className="text-sm dark:text-text-secondary light:text-text-light-secondary mb-4">
                {workspace.plan === 'free'
                  ? 'No payment method on file. Upgrade to a paid plan to add your payment details.'
                  : 'No payment methods found. Add a payment method through Stripe Customer Portal.'}
              </p>
              {workspace.stripe_customer_id && (
                <button
                  onClick={openCustomerPortal}
                  className="text-sm dark:text-linear-accent light:text-linear-light-accent hover:underline"
                >
                  Add Payment Method
                </button>
              )}
            </div>
          )}
        </div>

        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 dark:text-linear-accent light:text-linear-light-accent" />
            <h3 className="font-medium">Recent Invoices</h3>
          </div>

          {loading ? (
            <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">Loading...</p>
          ) : invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.slice(0, 5).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {invoice.invoice_number || 'Draft'}
                    </p>
                    <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                      {new Date(invoice.created_at).toLocaleDateString()} • €{(invoice.amount_due / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full border capitalize ${
                      invoice.status === 'paid'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : invoice.status === 'open'
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {invoice.status}
                    </span>
                    {invoice.invoice_pdf && (
                      <a
                        href={invoice.invoice_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:dark:bg-linear-bg-tertiary hover:light:bg-linear-light-bg-tertiary rounded-linear linear-transition"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {workspace.stripe_customer_id && (
                <button
                  onClick={openCustomerPortal}
                  className="text-sm dark:text-linear-accent light:text-linear-light-accent hover:underline mt-2"
                >
                  View All Invoices
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">
              {workspace.plan === 'free'
                ? 'No invoices available on the free plan.'
                : 'No invoices found yet.'}
            </p>
          )}
        </div>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50" onClick={() => setShowCheckout(null)}>
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium">Complete Your Upgrade</h3>
              <button
                onClick={() => setShowCheckout(null)}
                className="p-1 hover:dark:bg-linear-bg-subtle hover:light:bg-linear-light-bg-subtle rounded-linear linear-transition"
              >
                <ExternalLink className="w-5 h-5" />
              </button>
            </div>

            <CheckoutButton
              plan={showCheckout}
              workspaceId={workspace.id}
            />
          </div>
        </div>
      )}
    </div>
  );
}
