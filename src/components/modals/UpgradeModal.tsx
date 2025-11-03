import { useState } from 'react';
import { X, Check, Lock, Crown, Zap, Building } from 'lucide-react';
import { CheckoutButton } from '../billing/CheckoutButton';
import { TRIAL_DURATION_DAYS } from '../../utils/constants';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  workspaceId: string;
  reason?: string;
  suggestedPlan?: 'standard' | 'elite' | 'enterprise';
  trialDaysRemaining?: number;
  isTrialActive?: boolean;
}

export function UpgradeModal({ isOpen, onClose, currentPlan, workspaceId, reason, suggestedPlan = 'elite', trialDaysRemaining = 0, isTrialActive = false }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'elite' | null>(null);

  if (!isOpen) return null;

  const plans = [
    {
      name: isTrialActive ? `${TRIAL_DURATION_DAYS}-Day Trial` : 'Free (After Trial)',
      price: '€0',
      period: isTrialActive ? ` for ${TRIAL_DURATION_DAYS} days` : '/month',
      icon: Lock,
      color: 'text-gray-400',
      bgColor: 'bg-gray-400/10',
      features: isTrialActive ? [
        'Standard plan access',
        `${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'day' : 'days'} remaining`,
        'Up to 25 creators',
        '5GB storage',
        'Basic analytics',
        'Team collaboration (3)',
      ] : [
        'Limited features',
        'Choose a plan to continue',
        'Basic access only',
      ],
      highlighted: false,
      value: 'free',
    },
    {
      name: 'Standard',
      price: '€49',
      period: '/month',
      icon: Zap,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      features: [
        '1 brand workspace',
        'Up to 25 creators',
        '5GB storage',
        'Basic analytics',
        'Team collaboration (3 members)',
        'Email support',
      ],
      highlighted: suggestedPlan === 'standard',
      value: 'standard',
    },
    {
      name: 'Elite',
      price: '€99',
      period: '/month',
      icon: Crown,
      color: 'text-linear-accent',
      bgColor: 'bg-linear-accent/10',
      features: [
        'Up to 3 brand workspaces',
        'Up to 50 creators',
        '25GB storage',
        'Full analytics & exports',
        'Team collaboration (5 members)',
        'Revenue tracking',
        'Priority support',
      ],
      highlighted: suggestedPlan === 'elite' || isTrialActive,
      value: 'elite',
      badge: isTrialActive ? 'Keep Your Access' : undefined,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      icon: Building,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      features: [
        'Unlimited workspaces',
        'Unlimited creators',
        'Unlimited storage',
        'Custom integrations',
        'Unlimited team members',
        'Dedicated account manager',
        'Onboarding & training',
      ],
      highlighted: suggestedPlan === 'enterprise',
      value: 'enterprise',
    },
  ];

  const currentPlanIndex = plans.findIndex(p => p.value === currentPlan);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50 overflow-y-auto" onClick={onClose}>
      <div className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 dark:bg-linear-bg light:bg-linear-light-bg border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-medium mb-2">
              {isTrialActive ? `${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'Day' : 'Days'} Left in Your Trial` : 'Upgrade Your Plan'}
            </h2>
            {isTrialActive && (
              <p className="dark:text-text-secondary light:text-text-light-secondary text-sm">
                Choose a plan to continue enjoying all Elite features after your trial ends.
              </p>
            )}
            {!isTrialActive && reason && (
              <p className="dark:text-text-secondary light:text-text-light-secondary text-sm">{reason}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear linear-transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const isCurrent = plan.value === currentPlan;
              const isDowngrade = index < currentPlanIndex;
              const isUpgrade = index > currentPlanIndex;

              return (
                <div
                  key={plan.name}
                  className={`relative dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border rounded-linear-lg p-6 linear-transition ${
                    plan.highlighted
                      ? 'border-linear-accent shadow-lg shadow-linear-accent/20 scale-105'
                      : 'dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:border-linear-border light:border-linear-light-border'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-linear-accent rounded-full text-xs font-medium text-linear-bg">
                      {plan.badge || 'Recommended'}
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle border dark:border-linear-border light:border-linear-light-border rounded-full text-xs font-medium">
                      Current Plan
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 ${plan.bgColor} rounded-linear flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${plan.color}`} />
                    </div>
                    <div>
                      <h3 className="font-medium">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-medium">{plan.price}</span>
                        <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">{plan.period}</span>
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                        <span className="dark:text-text-secondary light:text-text-light-secondary">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => {
                      if (plan.value === 'standard' || plan.value === 'elite') {
                        setSelectedPlan(plan.value);
                      }
                    }}
                    disabled={isCurrent || isDowngrade}
                    className={`w-full py-2.5 rounded-linear text-sm font-medium linear-transition ${
                      isCurrent
                        ? 'dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle dark:text-text-tertiary light:text-text-light-tertiary cursor-not-allowed'
                        : isDowngrade
                        ? 'dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle dark:text-text-tertiary light:text-text-light-tertiary cursor-not-allowed'
                        : plan.highlighted
                        ? 'bg-linear-accent hover:bg-linear-accent-hover text-linear-bg shadow-md hover:shadow-lg'
                        : 'bg-white hover:bg-gray-100 text-black'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : isDowngrade ? 'Not Available' : plan.value === 'enterprise' ? 'Contact Sales' : 'Select Plan'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-6 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg">
            <h3 className="font-medium mb-4">{isTrialActive ? 'What You Get:' : 'All Plans Include:'}</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm dark:text-text-secondary light:text-text-light-secondary">
              {!isTrialActive && (
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <span>{TRIAL_DURATION_DAYS}-day trial for new users</span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <span>Secure payment processing</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <span>Data encryption & GDPR compliant</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <span>Regular feature updates</span>
              </div>
              {isTrialActive && (
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <span>Seamless upgrade from trial</span>
                </div>
              )}
            </div>
          </div>

          {isTrialActive && (
            <div className="mt-6 p-4 bg-linear-accent/10 border border-linear-accent/20 rounded-linear">
              <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                <strong>Keep your momentum!</strong> Upgrade now and your trial features will seamlessly continue without interruption.
              </p>
            </div>
          )}

          <div className="mt-6 text-center text-sm dark:text-text-tertiary light:text-text-light-tertiary">
            Need help choosing? <button className="dark:text-linear-accent light:text-linear-light-accent hover:underline">Contact our sales team</button>
          </div>
        </div>
      </div>

      {selectedPlan && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-[60]" onClick={() => setSelectedPlan(null)}>
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium">Complete Your Upgrade</h3>
              <button
                onClick={() => setSelectedPlan(null)}
                className="p-1 hover:dark:bg-linear-bg-subtle hover:light:bg-linear-light-bg-subtle rounded-linear linear-transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <CheckoutButton
              plan={selectedPlan}
              workspaceId={workspaceId}
            />
          </div>
        </div>
      )}
    </div>
  );
}
