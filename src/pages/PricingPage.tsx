import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { TRIAL_DURATION_DAYS } from '../utils/constants';

const trialFeatures = [
  `${TRIAL_DURATION_DAYS}-day trial with Elite features`,
  'Up to 3 brand workspaces',
  'Up to 50 creators',
  '25GB storage',
  'Full analytics & exports',
  'Team collaboration (5 members)',
  'Priority support',
];

const standardFeatures = [
  '1 brand workspace',
  'Up to 25 creators',
  '5GB storage',
  'Advanced analytics',
  'Revenue tracking',
  'Team collaboration (3 members)',
  'Email support',
];

const eliteFeatures = [
  'Up to 3 brand workspaces',
  'Up to 50 creators',
  '25GB storage',
  'Full analytics & exports',
  'Revenue tracking',
  'Task assignment',
  'Team collaboration (5 members)',
  'Priority support',
];

const enterpriseFeatures = [
  'Unlimited workspaces',
  'Unlimited creators',
  'Unlimited storage',
  'Custom integrations',
  'Dedicated account manager',
];

const faqs = [
  {
    question: 'Can I switch plans anytime?',
    answer: 'Yes — you can upgrade or downgrade in one click.',
  },
  {
    question: 'Do I need a credit card for the trial?',
    answer: 'No. Start free, no payment info needed.',
  },
  {
    question: 'Is my data safe?',
    answer: '100%. We use encrypted storage and GDPR-compliant processing.',
  },
  {
    question: 'Can agencies manage multiple clients?',
    answer: "Yes — that's exactly what the Elite plan is built for.",
  },
];

interface PricingPageProps {
  onBackClick: () => void;
  onLoginClick: () => void;
  onSignupClick?: () => void;
  onPricingClick?: () => void;
  onResourcesClick?: () => void;
  onHowItWorksClick?: () => void;
}

export function PricingPage({ onBackClick, onLoginClick, onSignupClick, onPricingClick, onResourcesClick, onHowItWorksClick }: PricingPageProps) {
  const [activeSection, setActiveSection] = useState('hero');
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'plans', 'comparison', 'faq', 'cta'];
      const scrollPosition = window.scrollY + 200;

      setShowStickyCTA(window.scrollY > 600);

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'hero', label: 'Overview' },
    { id: 'plans', label: 'Plans' },
    { id: 'comparison', label: 'Comparison' },
    { id: 'faq', label: 'FAQ' },
    { id: 'cta', label: 'Get Started' },
  ];

  return (
    <div className="min-h-screen">
      <Header
        onLoginClick={onLoginClick}
        onSignupClick={onSignupClick}
        onBackClick={onBackClick}
        onPricingClick={onPricingClick}
        onResourcesClick={onResourcesClick}
        onHowItWorksClick={onHowItWorksClick}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 right-10 w-72 h-72 bg-linear-accent/10 rounded-full blur-3xl animate-pulse text-linear-bg" style={{ animationDuration: '5s' }} />
        <div className="absolute bottom-40 left-10 w-96 h-96 bg-linear-accent/5 rounded-full blur-3xl animate-pulse text-linear-bg" style={{ animationDuration: '7s' }} />
      </div>

      <div className="fixed left-8 top-1/2 -translate-y-1/2 z-30 hidden lg:block">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`block w-2 h-2 rounded-full linear-transition ${
                activeSection === item.id ? 'bg-linear-accent w-8' : 'bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Navigate to ${item.label}`}
            />
          ))}
        </nav>
      </div>

      {showStickyCTA && (
        <div className="fixed bottom-6 right-6 z-40 animate-slide-up">
          <button
            onClick={onLoginClick}
            className="group px-6 py-3 bg-linear-accent hover:bg-linear-accent-hover hover:shadow-xl hover:shadow-linear-accent/30 rounded-linear text-sm font-medium linear-transition flex items-center gap-2 text-linear-bg"
          >
            Start Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 linear-transition" strokeWidth={2} />
          </button>
        </div>
      )}

      <div className="pt-24 px-6 relative">
        <section id="hero" className="py-12 max-w-7xl mx-auto">
          <button
            onClick={onBackClick}
            className="flex items-center gap-2 text-sm dark:text-text-secondary light:text-text-light-secondary hover:dark:text-text-primary light:text-text-light-primary linear-transition mb-12"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>

          <div className="text-center mb-20 animate-slide-up">
              <h1 className="mb-6 text-balance">Simple, transparent pricing.</h1>
              <p className="text-xl dark:text-text-secondary light:text-text-light-secondary text-balance max-w-2xl mx-auto">
                No hidden fees. No contracts. Start free and upgrade anytime.
              </p>
          </div>

          <div id="plans" className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
              <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border-2 border-green-500/30 rounded-linear-lg p-6 relative hover:border-green-500/50 hover:shadow-xl linear-transition hover:scale-[1.02] animate-slide-up flex flex-col" style={{ animationDelay: '0.05s' }}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 rounded-full text-xs font-medium text-white">
                  Start Here
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-medium mb-2">{TRIAL_DURATION_DAYS}-Day Trial</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-medium">€0</span>
                    <span className="dark:text-text-secondary light:text-text-light-secondary text-sm">for {TRIAL_DURATION_DAYS} days</span>
                  </div>
                  <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mt-2">Then choose a plan</p>
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {trialFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="dark:text-text-secondary light:text-text-light-secondary text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onLoginClick}
                  className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-linear text-sm font-medium linear-transition flex items-center justify-center gap-2 group shadow-md hover:shadow-lg mt-auto"
                >
                  Start Free Trial
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 linear-transition" strokeWidth={2} />
                </button>
              </div>

              <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-6 hover:dark:border-linear-border light:border-linear-light-border hover:shadow-lg linear-transition hover:scale-[1.02] animate-slide-up flex flex-col" style={{ animationDelay: '0.1s' }}>
                <div className="mb-6">
                  <h3 className="text-xl font-medium mb-2">Standard</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-medium">€49</span>
                    <span className="dark:text-text-secondary light:text-text-light-secondary text-sm">/ month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {standardFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="dark:text-text-secondary light:text-text-light-secondary text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onLoginClick}
                  className="w-full py-2.5 bg-linear-accent hover:bg-linear-accent-hover hover:shadow-lg hover:shadow-linear-accent/20 rounded-linear text-sm font-medium linear-transition flex items-center justify-center gap-2 group text-linear-bg mt-auto"
                >
                  Start Free Trial
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 linear-transition" strokeWidth={2} />
                </button>
              </div>

              <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border-2 border-linear-accent/30 rounded-linear-lg p-6 relative hover:border-linear-accent/50 hover:shadow-xl linear-transition hover:scale-[1.02] animate-slide-up flex flex-col" style={{ animationDelay: '0.15s' }}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-linear-accent rounded-full text-xs font-medium text-linear-bg">
                  Most Popular
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-medium mb-2">Elite</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-medium">€99</span>
                    <span className="dark:text-text-secondary light:text-text-light-secondary text-sm">/ month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {eliteFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="dark:text-text-secondary light:text-text-light-secondary text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onLoginClick}
                  className="w-full py-2.5 bg-linear-accent hover:bg-linear-accent-hover hover:shadow-lg hover:shadow-linear-accent/20 rounded-linear text-sm font-medium linear-transition flex items-center justify-center gap-2 group text-linear-bg mt-auto"
                >
                  Start Free Trial
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 linear-transition" strokeWidth={2} />
                </button>
              </div>

              <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-6 hover:dark:border-linear-border light:border-linear-light-border hover:shadow-lg linear-transition hover:scale-[1.02] animate-slide-up flex flex-col" style={{ animationDelay: '0.2s' }}>
                <div className="mb-6">
                  <h3 className="text-xl font-medium mb-2">Enterprise</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-medium">Custom</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {enterpriseFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="dark:text-text-secondary light:text-text-light-secondary text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onLoginClick}
                  className="w-full py-2.5 dark:bg-linear-bg-tertiary light:bg-linear-light-bg-tertiary border dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:border-linear-border light:border-linear-light-border rounded-linear text-sm font-medium linear-transition flex items-center justify-center gap-2 group mt-auto"
                >
                  Contact Sales
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 linear-transition" strokeWidth={2} />
                </button>
              </div>
          </div>

          <p className="text-center text-sm dark:text-text-secondary light:text-text-light-secondary mb-24">
              Start with a {TRIAL_DURATION_DAYS}-day trial with full Elite access — no credit card required.
          </p>

          <div id="comparison" className="mb-24 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <h2 className="text-2xl font-medium text-center mb-12">Compare all features</h2>

              <div className="max-w-6xl mx-auto overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle">
                      <th className="text-left py-4 px-6 font-medium text-sm dark:text-text-secondary light:text-text-light-secondary">Feature</th>
                      <th className="text-center py-4 px-6 font-medium">{TRIAL_DURATION_DAYS}-Day Trial</th>
                      <th className="text-center py-4 px-6 font-medium">Standard</th>
                      <th className="text-center py-4 px-6 font-medium">Elite</th>
                      <th className="text-center py-4 px-6 font-medium">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle">
                      <td colSpan={5} className="py-3 px-6 text-sm font-medium dark:text-text-secondary light:text-text-light-secondary">Workspace Limits</td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Brand workspaces</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">3</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">1</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">3</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Unlimited</td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Creator profiles</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">50</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">25</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">50</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Unlimited</td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Storage</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">25GB</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">5GB</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">25GB</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Unlimited</td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Team members</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">5</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">3</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">5</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Unlimited</td>
                    </tr>

                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle">
                      <td colSpan={5} className="py-3 px-6 text-sm font-medium dark:text-text-secondary light:text-text-light-secondary">Creator Management</td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Creator profiles</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Contact details & socials</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Custom tags</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Notes & status tracking</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Revenue tracking</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>

                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle">
                      <td colSpan={5} className="py-3 px-6 text-sm font-medium dark:text-text-secondary light:text-text-light-secondary">Campaigns & Tasks</td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Campaign management</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Link creators to campaigns</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Budget & revenue tracking</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Task management</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Assign tasks to team</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-tertiary light:text-text-light-tertiary">—</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-tertiary light:text-text-light-tertiary">—</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>

                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle">
                      <td colSpan={5} className="py-3 px-6 text-sm font-medium dark:text-text-secondary light:text-text-light-secondary">Content Library</td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Upload & organize media</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Tag & categorize content</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Preview & download</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Search content</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>

                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle">
                      <td colSpan={5} className="py-3 px-6 text-sm font-medium dark:text-text-secondary light:text-text-light-secondary">Team Collaboration</td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Team member access</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Role-based permissions</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Shared notes</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>

                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle">
                      <td colSpan={5} className="py-3 px-6 text-sm font-medium dark:text-text-secondary light:text-text-light-secondary">Support</td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Email support</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Priority support</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-tertiary light:text-text-light-tertiary">—</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-tertiary light:text-text-light-tertiary">—</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Dedicated account manager</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-tertiary light:text-text-light-tertiary">—</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-tertiary light:text-text-light-tertiary">—</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-tertiary light:text-text-light-tertiary">—</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>
                    <tr className="border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary linear-transition">
                      <td className="py-3 px-6 text-sm dark:text-text-secondary light:text-text-light-secondary">Onboarding & training</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-tertiary light:text-text-light-tertiary">—</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-tertiary light:text-text-light-tertiary">—</td>
                      <td className="text-center py-3 px-6 text-sm dark:text-text-tertiary light:text-text-light-tertiary">—</td>
                      <td className="text-center py-3 px-6"><Check className="w-4 h-4 text-blue-400 mx-auto" strokeWidth={2} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
          </div>

          <div id="faq" className="mb-24 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <h2 className="text-2xl font-medium text-center mb-12">Frequently Asked Questions</h2>
              <div className="max-w-3xl mx-auto space-y-6">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-6 hover:dark:border-linear-border light:border-linear-light-border linear-transition hover:scale-[1.01]"
                  >
                    <h3 className="text-lg font-medium mb-2">{faq.question}</h3>
                    <p className="dark:text-text-secondary light:text-text-light-secondary">{faq.answer}</p>
                  </div>
                ))}
              </div>
          </div>

          <div id="cta" className="text-center pt-12 border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <h2 className="text-2xl font-medium mb-4">Start managing your creators smarter.</h2>
              <p className="dark:text-text-secondary light:text-text-light-secondary mb-8 max-w-2xl mx-auto">
                Join brands and agencies already simplifying their influencer workflows with UGC System.
              </p>
              <button
                onClick={onLoginClick}
                className="group px-6 py-3 bg-linear-accent hover:bg-linear-accent-hover hover:shadow-lg hover:shadow-linear-accent/20 rounded-linear text-sm font-medium linear-transition inline-flex items-center gap-2 text-linear-bg"
              >
                Start Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 linear-transition" strokeWidth={2} />
              </button>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
