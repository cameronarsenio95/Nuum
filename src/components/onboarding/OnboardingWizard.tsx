import { useState } from 'react';
import { X, Check, Sparkles, Users, Target, Zap } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface OnboardingData {
  companyName: string;
  role: string;
  teamSize: string;
  primaryGoal: string;
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const { theme } = useTheme();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    companyName: '',
    role: '',
    teamSize: '',
    primaryGoal: '',
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return data.companyName.trim().length > 0;
      case 3:
        return data.role.length > 0;
      case 4:
        return data.primaryGoal.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={theme === 'dark' ? '/assets/nuum - Logo + Mark-15.png' : '/assets/nuum - Logo + Mark-12.png'}
              alt="NUUM"
              className="h-8 w-auto"
            />
            <div>
              <h2 className="text-xl font-semibold">Welcome to NUUM</h2>
              <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                Step {step} of {totalSteps}
              </p>
            </div>
          </div>
          <button
            onClick={onSkip}
            className="p-2 hover:dark:bg-linear-bg-subtle hover:light:bg-linear-light-bg-subtle rounded-linear linear-transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full mx-1 linear-transition ${
                    s <= step
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                      : 'dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle'
                  }`}
                />
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Let's get you started</h3>
                <p className="dark:text-text-secondary light:text-text-light-secondary max-w-md mx-auto">
                  We'll help you set up your workspace in just a few steps. This will only take 2 minutes.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-8">
                <div className="p-4 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear-lg text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 dark:text-linear-accent light:text-linear-light-accent" />
                  <h4 className="font-medium mb-1">Manage Creators</h4>
                  <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">
                    Centralize all creator data
                  </p>
                </div>
                <div className="p-4 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear-lg text-center">
                  <Target className="w-8 h-8 mx-auto mb-2 dark:text-linear-accent light:text-linear-light-accent" />
                  <h4 className="font-medium mb-1">Track Campaigns</h4>
                  <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">
                    Monitor performance and ROI
                  </p>
                </div>
                <div className="p-4 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear-lg text-center">
                  <Zap className="w-8 h-8 mx-auto mb-2 dark:text-linear-accent light:text-linear-light-accent" />
                  <h4 className="font-medium mb-1">Store Content</h4>
                  <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">
                    Organize UGC library
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-2">Tell us about your company</h3>
                <p className="dark:text-text-secondary light:text-text-light-secondary">
                  This helps us personalize your experience
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Company or Brand Name</label>
                <input
                  type="text"
                  value={data.companyName}
                  onChange={(e) => setData({ ...data, companyName: e.target.value })}
                  placeholder="Enter your company name"
                  className="w-full px-4 py-3 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Team Size</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Just me', '2-5 people', '6-20 people', '20+ people'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setData({ ...data, teamSize: size })}
                      className={`p-3 rounded-linear border linear-transition text-left ${
                        data.teamSize === size
                          ? 'border-linear-accent dark:bg-linear-accent/10 light:bg-linear-light-accent/10'
                          : 'dark:border-linear-border dark:bg-linear-bg light:border-linear-light-border light:bg-linear-light-bg hover:border-linear-border-hover'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-2">What's your role?</h3>
                <p className="dark:text-text-secondary light:text-text-light-secondary">
                  This helps us customize your dashboard
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: 'marketing-manager', label: 'Marketing Manager', desc: 'Managing campaigns and strategy' },
                  { value: 'social-media-manager', label: 'Social Media Manager', desc: 'Running social campaigns' },
                  { value: 'brand-manager', label: 'Brand Manager', desc: 'Managing brand partnerships' },
                  { value: 'agency', label: 'Agency Professional', desc: 'Managing multiple clients' },
                  { value: 'founder', label: 'Founder/Owner', desc: 'Running the business' },
                  { value: 'other', label: 'Other', desc: 'Different role' },
                ].map((role) => (
                  <button
                    key={role.value}
                    onClick={() => setData({ ...data, role: role.value })}
                    className={`p-4 rounded-linear border linear-transition text-left ${
                      data.role === role.value
                        ? 'border-linear-accent dark:bg-linear-accent/10 light:bg-linear-light-accent/10'
                        : 'dark:border-linear-border dark:bg-linear-bg light:border-linear-light-border light:bg-linear-light-bg hover:border-linear-border-hover'
                    }`}
                  >
                    <div className="font-medium">{role.label}</div>
                    <div className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">{role.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-2">What's your primary goal?</h3>
                <p className="dark:text-text-secondary light:text-text-light-secondary">
                  We'll highlight the features that matter most to you
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: 'organize-creators', label: 'Organize Creator Database', desc: 'Centralize all creator information' },
                  { value: 'track-campaigns', label: 'Track Campaign Performance', desc: 'Monitor ROI and engagement' },
                  { value: 'manage-content', label: 'Manage UGC Content', desc: 'Store and organize creator content' },
                  { value: 'team-collaboration', label: 'Team Collaboration', desc: 'Work together with my team' },
                  { value: 'scale-operations', label: 'Scale Operations', desc: 'Grow creator program efficiently' },
                ].map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => setData({ ...data, primaryGoal: goal.value })}
                    className={`p-4 rounded-linear border linear-transition text-left ${
                      data.primaryGoal === goal.value
                        ? 'border-linear-accent dark:bg-linear-accent/10 light:bg-linear-light-accent/10'
                        : 'dark:border-linear-border dark:bg-linear-bg light:border-linear-light-border light:bg-linear-light-bg hover:border-linear-border-hover'
                    }`}
                  >
                    <div className="font-medium">{goal.label}</div>
                    <div className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">{goal.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle p-6 flex items-center justify-between">
          <button
            onClick={step === 1 ? onSkip : handleBack}
            className="px-4 py-2 dark:text-text-secondary light:text-text-light-secondary hover:dark:text-text-primary hover:light:text-text-light-primary linear-transition"
          >
            {step === 1 ? 'Skip' : 'Back'}
          </button>

          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-linear linear-transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === totalSteps ? (
              <>
                <Check className="w-4 h-4" />
                Complete
              </>
            ) : (
              'Next'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
