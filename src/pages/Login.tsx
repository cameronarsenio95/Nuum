import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Chrome, Apple as AppleIcon, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onClose?: () => void;
}

export function Login({ onClose }: LoginProps = {}) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

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
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 dark:bg-linear-bg light:bg-linear-light-bg">
      <div className="w-full max-w-md relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute -top-4 right-0 z-10 w-10 h-10 flex items-center justify-center rounded-full linear-transition dark:bg-linear-bg-secondary dark:hover:bg-linear-bg-tertiary dark:text-text-secondary dark:hover:text-text-primary light:bg-linear-light-bg-secondary light:hover:bg-linear-light-bg-tertiary light:text-text-light-secondary light:hover:text-text-light-primary"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-linear flex items-center justify-center dark:bg-linear-accent light:bg-linear-light-accent dark:text-linear-bg light:text-linear-light-bg">
              <LogIn className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-medium dark:text-text-primary light:text-text-light-primary">NUUM</h1>
          </div>
          <p className="dark:text-text-secondary light:text-text-light-secondary">
            {isSignUp ? 'Create your workspace account' : 'Welcome back'}
          </p>
        </div>

        <div className="border rounded-linear-lg p-8 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary dark:border-linear-border-subtle light:border-linear-light-border-subtle light:bg-linear-light-bg-secondary light:border-linear-light-border-subtle">
          <div className="space-y-3 mb-6">
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
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 dark:bg-linear-bg-secondary dark:text-text-tertiary light:bg-linear-light-bg-secondary light:text-text-light-tertiary">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 dark:text-text-primary light:text-text-light-primary">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-linear linear-transition focus:outline-none dark:bg-linear-bg light:bg-linear-light-bg dark:border-linear-border light:border-linear-light-border dark:text-text-primary light:text-text-light-primary dark:placeholder:text-text-tertiary light:text-text-light-tertiary dark:focus:border-linear-accent light:bg-linear-light-bg light:border-linear-light-border light:text-text-light-primary light:placeholder:text-text-light-tertiary light:focus:border-linear-light-accent"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 dark:text-text-primary light:text-text-light-primary">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-linear linear-transition focus:outline-none dark:bg-linear-bg light:bg-linear-light-bg dark:border-linear-border light:border-linear-light-border dark:text-text-primary light:text-text-light-primary dark:placeholder:text-text-tertiary light:text-text-light-tertiary dark:focus:border-linear-accent light:bg-linear-light-bg light:border-linear-light-border light:text-text-light-primary light:placeholder:text-text-light-tertiary light:focus:border-linear-light-accent"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 border rounded-linear text-sm dark:bg-linear-error-subtle dark:border-linear-error-border dark:text-linear-error light:bg-linear-light-error-subtle light:border-linear-light-error-border light:text-linear-light-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 font-medium rounded-linear linear-transition disabled:opacity-50 dark:bg-white dark:hover:bg-gray-100 dark:text-black light:bg-black light:hover:bg-gray-900 light:text-white"
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm linear-transition dark:text-text-secondary light:text-text-light-secondary dark:hover:text-text-primary light:text-text-light-primary light:text-text-light-secondary light:hover:text-text-light-primary"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
