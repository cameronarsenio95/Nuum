import { Home, ArrowLeft } from 'lucide-react';

interface NotFoundProps {
  onHomeClick: () => void;
}

export function NotFound({ onHomeClick }: NotFoundProps) {
  return (
    <div className="min-h-screen dark:bg-linear-bg light:bg-linear-light-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-8xl font-bold mb-4 dark:text-text-primary light:text-text-light-primary">
            404
          </h1>
          <h2 className="text-2xl font-semibold mb-3 dark:text-text-primary light:text-text-light-primary">
            Page Not Found
          </h2>
          <p className="dark:text-text-secondary light:text-text-light-secondary mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onHomeClick}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium linear-transition dark:bg-linear-accent dark:hover:bg-linear-accent-hover dark:text-linear-bg light:bg-linear-light-accent light:hover:bg-linear-light-accent-hover light:text-linear-light-bg"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md text-sm linear-transition border dark:text-text-secondary dark:hover:text-text-primary dark:bg-linear-bg-hover dark:hover:bg-linear-bg-active dark:border-linear-border-subtle dark:hover:border-linear-border-hover light:text-text-light-secondary light:hover:text-text-light-primary light:bg-linear-light-bg-hover light:hover:bg-linear-light-bg-active light:border-linear-light-border-subtle light:hover:border-linear-light-border-hover"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        <div className="mt-12 pt-8 border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle">
          <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">
            Need help?{' '}
            <a
              href="mailto:support@nuum.app"
              className="dark:text-linear-accent light:text-text-light-link hover:underline"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
