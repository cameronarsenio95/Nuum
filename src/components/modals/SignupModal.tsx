import { X, Check, AlertCircle, Mail, Lock, Building, Briefcase, Chrome, Apple as AppleIcon } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { generateUniqueSlug, createWorkspaceWithOwner } from '../../utils/workspaceHelpers';

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

    console.log('[SignupModal] Starting OAuth flow with provider:', provider);

    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('[SignupModal] Redirect URL:', redirectUrl);

      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });

      if (signInError) {
        console.error('[SignupModal] OAuth error:', signInError);
        throw signInError;
      }

      console.log('[SignupModal] OAuth initiated, redirecting to provider...');
    } catch (err: any) {
      console.error('[SignupModal] OAuth exception:', err);
      let errorMessage = 'Social login failed. Please try again.';

      if (err.message?.includes('not enabled')) {
        errorMessage = 'This login method is not configured. Please use email/password or contact support.';
      } else if (err.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
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

    console.log('[SIGNUP] Starting signup process for:', email);

    try {
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            company_name: companyName,
            use_case: useCase,
          },
        },
      });

      console.log('[SIGNUP] Auth signup result:', { authData, signupError });

      if (signupError) {
        console.error('[SIGNUP] Signup error:', signupError);
        throw signupError;
      }

      if (!authData.user) {
        console.error('[SIGNUP] No user data returned');
        throw new Error('No user data returned from signup');
      }

      const userId = authData.user.id;
      console.log('[SIGNUP] User created:', userId);

      console.log('[SIGNUP] Waiting for authentication session to be established...');
      let sessionReady = false;
      let attempts = 0;
      const maxAttempts = 20;
      let backoffDelay = 200;

      while (!sessionReady && attempts < maxAttempts) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && session.user && session.user.id === userId) {
            sessionReady = true;
            console.log('[SIGNUP] Session established and verified:', {
              userId: session.user.id,
              hasAccessToken: !!session.access_token,
              attemptsTaken: attempts + 1
            });
          } else {
            attempts++;
            console.log(`[SIGNUP] Attempt ${attempts}/${maxAttempts} - waiting for session...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            backoffDelay = Math.min(backoffDelay * 1.2, 500);
          }
        } catch (e) {
          attempts++;
          console.log(`[SIGNUP] Attempt ${attempts}/${maxAttempts} - error checking session:`, e);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          backoffDelay = Math.min(backoffDelay * 1.2, 500);
        }
      }

      if (!sessionReady) {
        console.error('[SIGNUP] Session establishment timeout after', maxAttempts, 'attempts');
        throw new Error('Authentication session took too long to establish. Please try again or contact support if the issue persists.');
      }

      console.log('[SIGNUP] Verifying auth.uid() is available...');
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser || currentUser.id !== userId) {
        console.error('[SIGNUP] Auth user mismatch:', { expected: userId, got: currentUser?.id });
        throw new Error('Authentication verification failed. Please try logging in.');
      }
      console.log('[SIGNUP] Auth.uid() confirmed:', currentUser.id);

      console.log('[SIGNUP] Checking for existing profile...');
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      console.log('[SIGNUP] Existing profile check:', existingProfile);

      if (!existingProfile) {
        console.log('[SIGNUP] Creating profile...');
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email,
            full_name: email.split('@')[0],
            company: companyName,
            notifications_enabled: true,
            onboarding_completed: false,
          });

        if (profileError) {
          console.error('[SIGNUP] Profile creation error:', profileError);
          console.error('[SIGNUP] Error details:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint
          });
          console.error('[SIGNUP] Full error object:', JSON.stringify(profileError, null, 2));

          let errorMessage = 'Failed to create your profile in the database';

          if (profileError.code === '42501') {
            errorMessage = 'Permission denied while creating profile. Your account was created but setup is incomplete. Please contact support with error code: RLS-PROFILE-INSERT';
            console.error('[SIGNUP] RLS policy denied profile insertion - Policy may be misconfigured');
          } else if (profileError.code === '23505') {
            errorMessage = 'A profile already exists for this account. Try refreshing the page or logging in.';
            console.error('[SIGNUP] Duplicate profile detected');
          } else if (profileError.code === '23503') {
            errorMessage = 'Database relationship error. Please contact support with error code: FK-PROFILE';
            console.error('[SIGNUP] Foreign key constraint violation on profile');
          } else if (profileError.message) {
            errorMessage = `Failed to create profile: ${profileError.message}`;
          }

          console.error('[SIGNUP] Profile creation failed with code:', profileError.code);
          throw new Error(errorMessage);
        }

        console.log('[SIGNUP] Profile created successfully');

        console.log('[SIGNUP] Generating unique workspace slug...');
        const workspaceSlug = await generateUniqueSlug(companyName, userId);
        console.log('[SIGNUP] Using slug:', workspaceSlug);

        console.log('[SIGNUP] Creating workspace atomically with owner membership...');
        const result = await createWorkspaceWithOwner(
          userId,
          companyName,
          workspaceSlug,
          'standard'
        );

        console.log('[SIGNUP] ✅ Workspace and membership created successfully:', {
          workspaceId: result.workspace_id,
          membershipId: result.membership_id
        });
      } else {
        console.log('[SIGNUP] Profile already exists, skipping creation');
      }

      console.log('[SIGNUP] Signup completed successfully!');

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('[SIGNUP] ❌ Signup failed');
      console.error('[SIGNUP] Error:', err);
      console.error('[SIGNUP] Error details:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));

      let userMessage = 'Something went wrong during signup. Please try again.';

      if (err.code) {
        console.error('[SIGNUP] PostgreSQL Error Code:', err.code);

        if (err.code === '23505') {
          if (err.message?.includes('email') || err.message?.includes('users')) {
            userMessage = 'This email is already registered. Try logging in.';
          } else {
            userMessage = 'A workspace with this name already exists. Please try again.';
          }
        } else if (err.code === '42501') {
          userMessage = "We're finalizing your workspace. Please try again in a few seconds.";
        } else if (err.code === '23503') {
          userMessage = 'Database error. Please contact support.';
        }
      } else if (err.message?.includes('network') || err.message?.includes('fetch') || err.message?.includes('Failed to fetch')) {
        userMessage = 'Connection issue. Please try again.';
      } else if (err.message?.includes('timeout')) {
        userMessage = 'Connection timeout. Please try again.';
      } else if (err.message?.includes('User already registered')) {
        userMessage = 'This email is already registered. Try logging in.';
      }

      setError(userMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="border rounded-linear-lg max-w-md w-full p-8 relative dark:bg-linear-bg-secondary dark:border-linear-border light:bg-linear-light-bg-secondary light:border-linear-light-border">
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
                  className="w-full py-3 px-4 border rounded-linear text-sm font-medium linear-transition flex items-center justify-center gap-3 hover:shadow-sm disabled:opacity-50 dark:bg-linear-bg dark:border-linear-border dark:hover:bg-linear-bg-hover dark:text-text-primary light:bg-white light:border-linear-light-border light:hover:bg-linear-light-bg-hover light:text-text-light-primary"
                >
                  <Chrome className="w-5 h-5" />
                  Continue with Google
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('apple')}
                  disabled={loading}
                  className="w-full py-3 px-4 border rounded-linear text-sm font-medium linear-transition flex items-center justify-center gap-3 hover:shadow-sm disabled:opacity-50 dark:bg-linear-bg dark:border-linear-border dark:hover:bg-linear-bg-hover dark:text-text-primary light:bg-white light:border-linear-light-border light:hover:bg-linear-light-bg-hover light:text-text-light-primary"
                >
                  <AppleIcon className="w-5 h-5" />
                  Continue with Apple
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('azure')}
                  disabled={loading}
                  className="w-full py-3 px-4 border rounded-linear text-sm font-medium linear-transition flex items-center justify-center gap-3 hover:shadow-sm disabled:opacity-50 dark:bg-linear-bg dark:border-linear-border dark:hover:bg-linear-bg-hover dark:text-text-primary light:bg-white light:border-linear-light-border light:hover:bg-linear-light-bg-hover light:text-text-light-primary"
                >
                  <svg className="w-5 h-5" viewBox="0 0 23 23" fill="currentColor">
                    <path d="M0 0h11v11H0zm12 0h11v11H12zM0 12h11v11H0zm12 0h11v11H12z"/>
                  </svg>
                  Continue with Microsoft
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 dark:bg-linear-bg-secondary dark:text-text-tertiary light:bg-linear-light-bg-secondary light:text-text-light-tertiary">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="w-full py-3 px-4 border rounded-linear text-sm font-medium linear-transition hover:shadow-sm dark:bg-linear-accent dark:hover:bg-linear-accent-hover dark:text-linear-bg dark:border-linear-accent light:bg-linear-light-accent light:hover:bg-linear-light-accent-hover light:text-white light:border-linear-light-accent"
                >
                  <Mail className="w-4 h-4 inline mr-2" />
                  Continue with Email
                </button>

                {error && (
                  <div className="p-3 border rounded-linear text-sm flex items-start gap-2 dark:bg-linear-error-subtle dark:border-linear-error-border dark:text-linear-error light:bg-linear-light-error-subtle light:border-linear-light-error-border light:text-linear-light-error">
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
                  className="w-full px-4 py-2.5 border rounded-linear text-sm focus:outline-none linear-transition dark:bg-linear-bg dark:border-linear-border-subtle dark:focus:border-linear-border dark:text-text-primary dark:placeholder:text-text-tertiary light:bg-linear-light-bg light:border-linear-light-border-subtle light:focus:border-linear-light-border light:text-text-light-primary light:placeholder:text-text-light-tertiary"
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
                  className="w-full px-4 py-2.5 border rounded-linear text-sm focus:outline-none linear-transition dark:bg-linear-bg dark:border-linear-border-subtle dark:focus:border-linear-border dark:text-text-primary dark:placeholder:text-text-tertiary light:bg-linear-light-bg light:border-linear-light-border-subtle light:focus:border-linear-light-border light:text-text-light-primary light:placeholder:text-text-light-tertiary"
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
                  className="w-full px-4 py-2.5 border rounded-linear text-sm focus:outline-none linear-transition dark:bg-linear-bg dark:border-linear-border-subtle dark:focus:border-linear-border dark:text-text-primary dark:placeholder:text-text-tertiary light:bg-linear-light-bg light:border-linear-light-border-subtle light:focus:border-linear-light-border light:text-text-light-primary light:placeholder:text-text-light-tertiary"
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
                  className="w-full px-4 py-2.5 border rounded-linear text-sm focus:outline-none linear-transition dark:bg-linear-bg dark:border-linear-border-subtle dark:focus:border-linear-border dark:text-text-primary light:bg-linear-light-bg light:border-linear-light-border-subtle light:focus:border-linear-light-border light:text-text-light-primary"
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
                <div className="p-3 border rounded-linear text-sm flex items-start gap-2 dark:bg-linear-error-subtle dark:border-linear-error-border dark:text-linear-error light:bg-linear-light-error-subtle light:border-linear-light-error-border light:text-linear-light-error">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-linear text-sm font-medium linear-transition disabled:opacity-50 dark:bg-linear-accent dark:hover:bg-linear-accent-hover dark:text-linear-bg light:bg-linear-light-accent light:hover:bg-linear-light-accent-hover light:text-linear-light-bg"
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
