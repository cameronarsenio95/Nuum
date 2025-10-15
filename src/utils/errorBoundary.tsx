import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen dark:bg-linear-bg light:bg-linear-light-bg flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-16 h-16 border-4 rounded-full flex items-center justify-center mx-auto mb-4 dark:border-linear-error dark:bg-linear-error-subtle light:border-linear-light-error light:bg-linear-light-error-subtle">
                <svg
                  className="w-8 h-8 dark:text-linear-error light:text-linear-light-error"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-2 dark:text-text-primary light:text-text-light-primary">
                Something went wrong
              </h2>
              <p className="dark:text-text-secondary light:text-text-light-secondary mb-6">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-md text-sm font-medium linear-transition dark:bg-linear-accent dark:hover:bg-linear-accent-hover dark:text-linear-bg light:bg-linear-light-accent light:hover:bg-linear-light-accent-hover light:text-linear-light-bg"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
