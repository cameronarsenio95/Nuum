import { X, Check, AlertCircle, Mail, Lock, Building, Briefcase, Chrome, Apple as AppleIcon } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const useCaseOptions = [
  { value: 'brand', label: 'Brand' },
  { value: 'agency', label: 'Agency' },
  { value: 'creator-manager', label: 'Creator Manager' },
];

export function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [useCase, setUseCase] = useState('brand');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const passwordStrength = (pwd: string) => {
    if (pwd.length < 6) return { score: 0, label: 'Too short' };
    if (pwd.length < 8) return { score: 1, label: 'Weak' };
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { score: 3, label: 'Strong' };
    if (pwd.length >= 8) return { score: 2, label: 'Good' };
    return { score: 0, label: '' };
  };

  const strength = passwordStrength(password);

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'azure') => {
    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (signInError) throw signInError;
    } catch (err: any) {
      setError(err.message || 'Social login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (window.UGC?.track) {
      window.UGC.track('submit_signup');
    }

    if (!consent) {
      setError('Please accept the privacy policy');
      return;
    }

    if (strength.score < 2) {
      setError('Please use a stronger password (at least 8 characters)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            company_name: companyName,
            use_case: useCase,
          },
        },
      });

      if (signupError) throw signupError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="border rounded-linear-lg max-w-md w-full p-8 relative dark:bg-linear-bg-secondary dark:border-linear-border light:bg-white light:border-gray-300 light:shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 linear-transition dark:text-text-secondary dark:hover:text-text-primary light:text-text-light-secondary light:hover:text-text-light-primary"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" strokeWidth={2} />
            </div>
            <h3 className="text-xl font-medium mb-2 dark:text-text-primary light:text-text-light-primary">Welcome to UGC System!</h3>
            <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">Redirecting to your dashboard...</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-medium mb-2 dark:text-text-primary light:text-text-light-primary">Start your free trial</h2>
            <p className="text-sm mb-6 dark:text-text-secondary light:text-text-light-secondary">No credit card required. 14 days free.</p>

            {!showEmailForm ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  disabled={loading}
                  className="w-full py-3 px-4 border rounded-linear text-sm font-medium linear-transition flex items-center justify-center gap-3 disabled:opacity-50 dark:bg-linear-bg dark:border-linear-border dark:hover:bg-linear-bg-hover dark:text-text-primary light:bg-white light:border-gray-300 light:hover:bg-gray-50 light:text-text-light-primary light:shadow-sm light:hover:shadow-md"
                >
                  <Chrome className="w-5 h-5" />
                  Continue with Google
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('apple')}
                  disabled={loading}
                  className="w-full py-3 px-4 border rounded-linear text-sm font-medium linear-transition flex items-center justify-center gap-3 disabled:opacity-50 dark:bg-linear-bg dark:border-linear-border dark:hover:bg-linear-bg-hover dark:text-text-primary light:bg-white light:border-gray-300 light:hover:bg-gray-50 light:text-text-light-primary light:shadow-sm light:hover:shadow-md"
                >
                  <AppleIcon className="w-5 h-5" />
                  Continue with Apple
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('azure')}
                  disabled={loading}
                  className="w-full py-3 px-4 border rounded-linear text-sm font-medium linear-transition flex items-center justify-center gap-3 disabled:opacity-50 dark:bg-linear-bg dark:border-linear-border dark:hover:bg-linear-bg-hover dark:text-text-primary light:bg-white light:border-gray-300 light:hover:bg-gray-50 light:text-text-light-primary light:shadow-sm light:hover:shadow-md"
                >
                  <svg className="w-5 h-5" viewBox="0 0 23 23" fill="currentColor">
                    <path d="M0 0h11v11H0zm12 0h11v11H12zM0 12h11v11H0zm12 0h11v11H12z"/>
                  </svg>
                  Continue with Microsoft
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t dark:border-linear-border-subtle light:border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 dark:bg-linear-bg-secondary dark:text-text-tertiary light:bg-white light:text-text-light-tertiary">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="w-full py-3 px-4 border rounded-linear text-sm font-medium linear-transition dark:bg-linear-accent dark:hover:bg-linear-accent-hover dark:text-linear-bg dark:border-linear-accent light:bg-linear-light-accent light:hover:bg-linear-light-accent-hover light:text-white light:border-linear-light-accent light:shadow-md light:hover:shadow-lg"
                >
                  <Mail className="w-4 h-4 inline mr-2" />
                  Continue with Email
                </button>

                {error && (
                  <div className="p-3 border rounded-linear text-sm flex items-start gap-2 dark:bg-linear-error-subtle dark:border-linear-error-border dark:text-linear-error light:bg-red-50 light:border-red-200 light:text-red-600">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <p className="text-xs text-center pt-2 dark:text-text-tertiary light:text-text-light-tertiary">
                  By continuing, you acknowledge that you understand and agree to the{' '}
                  <a href="/terms" className="underline hover:no-underline">Terms & Conditions</a> and{' '}
                  <a href="/privacy" className="underline hover:no-underline">Privacy Policy</a>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-text-primary light:text-text-light-primary">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-linear text-sm focus:outline-none linear-transition dark:bg-linear-bg dark:border-linear-border-subtle dark:focus:border-linear-border dark:text-text-primary dark:placeholder:text-text-tertiary light:bg-white light:border-gray-300 light:focus:border-gray-400 light:text-text-light-primary light:placeholder:text-text-light-tertiary"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-text-primary light:text-text-light-primary">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-linear text-sm focus:outline-none linear-transition dark:bg-linear-bg dark:border-linear-border-subtle dark:focus:border-linear-border dark:text-text-primary dark:placeholder:text-text-tertiary light:bg-white light:border-gray-300 light:focus:border-gray-400 light:text-text-light-primary light:placeholder:text-text-light-tertiary"
                  placeholder="••••••••"
                />
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full linear-transition ${
                            i < strength.score
                              ? strength.score === 1
                                ? 'bg-orange-500'
                                : strength.score === 2
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'dark:bg-linear-bg-hover light:bg-linear-light-bg-hover'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">{strength.label}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-text-primary light:text-text-light-primary">
                  <Building className="w-4 h-4 inline mr-2" />
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-linear text-sm focus:outline-none linear-transition dark:bg-linear-bg dark:border-linear-border-subtle dark:focus:border-linear-border dark:text-text-primary dark:placeholder:text-text-tertiary light:bg-white light:border-gray-300 light:focus:border-gray-400 light:text-text-light-primary light:placeholder:text-text-light-tertiary"
                  placeholder="Your Company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-text-primary light:text-text-light-primary">
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  Use Case
                </label>
                <select
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-linear text-sm focus:outline-none linear-transition dark:bg-linear-bg dark:border-linear-border-subtle dark:focus:border-linear-border dark:text-text-primary light:bg-white light:border-gray-300 light:focus:border-gray-400 light:text-text-light-primary"
                >
                  {useCaseOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="consent" className="text-xs dark:text-text-secondary light:text-text-light-secondary">
                  I agree to the privacy policy and terms of service
                </label>
              </div>

              {error && (
                <div className="p-3 border rounded-linear text-sm flex items-start gap-2 dark:bg-linear-error-subtle dark:border-linear-error-border dark:text-linear-error light:bg-red-50 light:border-red-200 light:text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-linear text-sm font-medium linear-transition disabled:opacity-50 dark:bg-linear-accent dark:hover:bg-linear-accent-hover dark:text-linear-bg light:bg-linear-light-accent light:hover:bg-linear-light-accent-hover light:text-white light:shadow-md light:hover:shadow-lg"
              >
                {loading ? 'Creating account...' : 'Start Free Trial'}
              </button>

              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="w-full text-sm dark:text-text-secondary dark:hover:text-text-primary light:text-text-light-secondary light:hover:text-text-light-primary linear-transition"
              >
                ← Back to login options
              </button>
            </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
