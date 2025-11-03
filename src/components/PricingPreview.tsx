import { Check } from 'lucide-react';

interface PricingPreviewProps {
  onSignupClick: () => void;
}

const plans = [
  {
    name: 'Standard',
    price: 49,
    features: [
      '1 brand workspace',
      'Up to 25 creators',
      '5GB storage',
      'Advanced analytics',
      'Revenue tracking',
      'Team collaboration (3)',
    ],
  },
  {
    name: 'Elite',
    price: 99,
    featured: true,
    features: [
      'Up to 3 brand workspaces',
      'Up to 50 creators',
      '25GB storage',
      'Full analytics & exports',
      'Revenue tracking',
      'Task assignment',
      'Team collaboration (5)',
      'Priority support',
    ],
  },
];

export function PricingPreview({ onSignupClick }: PricingPreviewProps) {
  const handleClick = (planName: string) => {
    if (window.UGC?.track) {
      window.UGC.track(
        planName === 'Standard' ? 'click_pricing_card_standard' : 'click_pricing_card_elite'
      );
    }
    onSignupClick();
  };

  return (
    <section id="pricing" className="py-12 md:py-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 md:mb-4 tracking-tight">Simple pricing, built for growing teams.</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto mb-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`border rounded-lg p-5 md:p-6 touch-manipulation active:scale-98 ${
                plan.featured
                  ? 'dark:border-linear-accent dark:shadow-lg dark:shadow-linear-accent/10 light:border-linear-light-accent light:shadow-lg light:shadow-linear-light-accent/10'
                  : 'dark:border-linear-border-subtle light:border-linear-light-border-subtle'
              } dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary`}
            >
              {plan.featured && (
                <div className="inline-block px-2.5 py-1 rounded-md text-xs font-medium mb-4 dark:bg-linear-accent dark:text-linear-bg light:bg-linear-light-accent light:text-linear-light-bg">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-medium mb-2 dark:text-text-primary light:text-text-light-primary">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-medium dark:text-text-primary light:text-text-light-primary">€{plan.price}</span>
                <span className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">/ month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5 dark:text-text-secondary light:text-text-light-secondary" strokeWidth={2} />
                    <span className="text-sm dark:text-text-secondary light:text-text-light-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleClick(plan.name)}
                className="w-full py-3 md:py-2.5 rounded-md text-base md:text-sm font-medium linear-transition touch-manipulation active:scale-95 dark:bg-linear-accent dark:hover:bg-linear-accent-hover dark:text-linear-bg light:bg-linear-light-accent light:hover:bg-linear-light-accent-hover light:text-linear-light-bg"
              >
                Start Free
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-sm dark:text-text-secondary light:text-text-light-secondary">
          Start with 7-day trial · No credit card required
        </p>
      </div>
    </section>
  );
}
