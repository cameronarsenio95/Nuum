import { useState } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { useSupportAuth } from '../contexts/SupportAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';

export function SupportLogin() {
  const { signIn } = useSupportAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message || 'Failed to sign in');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 dark:bg-linear-bg light:bg-linear-light-bg">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center gap-3 mb-4">
            <img
              src={theme === 'dark' ? '/assets/nuum - Logo + Mark-15.png' : '/assets/nuum - Logo + Mark-12.png'}
              alt="NUUM"
              className="h-12 w-auto"
            />
            <div className="w-10 h-10 rounded-linear bg-linear-error text-white flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <h1 className="text-3xl font-medium mb-2">Support Dashboard</h1>
          <p className="dark:text-text-secondary light:text-text-light-secondary">
            Sign in with your support staff credentials
          </p>
        </div>

        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-linear-error/10 border border-linear-error-border/20 rounded-linear flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-linear-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-linear-error">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                placeholder="support@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear">
            <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary text-center">
              This is a secure area for support staff only. All actions are logged and monitored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
