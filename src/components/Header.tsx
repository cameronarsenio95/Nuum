import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  onBackClick?: () => void;
  onHowItWorksClick?: () => void;
  onPricingClick?: () => void;
  onResourcesClick?: () => void;
}

export function Header({ onLoginClick, onSignupClick, onBackClick, onHowItWorksClick, onPricingClick, onResourcesClick }: HeaderProps = {}) {
  const { theme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b dark:bg-linear-bg/90 dark:border-linear-border-subtle light:bg-linear-light-bg/90 light:border-linear-light-border-subtle">
      <nav className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <button
          onClick={onBackClick}
          className="flex items-center hover:opacity-80 linear-transition"
        >
          <img
            src={theme === 'dark' ? '/assets/nuum - Logo + Mark-15.png' : '/assets/nuum - Logo + Mark-12.png'}
            alt="NUUM"
            className="h-6 md:h-7 w-auto"
          />
        </button>

        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={onHowItWorksClick}
            className="text-sm dark:text-text-secondary light:text-text-light-secondary dark:hover:text-text-primary light:hover:text-text-light-primary linear-transition"
          >
            How It Works
          </button>
          <button
            onClick={onPricingClick}
            className="text-sm dark:text-text-secondary light:text-text-light-secondary dark:hover:text-text-primary light:hover:text-text-light-primary linear-transition"
          >
            Pricing
          </button>
          <button
            onClick={onResourcesClick}
            className="text-sm dark:text-text-secondary light:text-text-light-secondary dark:hover:text-text-primary light:hover:text-text-light-primary linear-transition"
          >
            Resources
          </button>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <button
            onClick={onLoginClick}
            className="text-xs md:text-sm px-2 md:px-0 dark:text-text-secondary light:text-text-light-secondary dark:hover:text-text-primary light:hover:text-text-light-primary linear-transition touch-manipulation active:scale-95"
          >
            Login
          </button>
          <button
            onClick={onSignupClick}
            className="px-3 md:px-4 py-1.5 rounded-linear text-xs md:text-sm font-medium linear-transition touch-manipulation active:scale-95 dark:bg-linear-accent dark:hover:bg-linear-accent-hover dark:shadow-linear-sm dark:text-linear-bg light:bg-linear-light-accent light:hover:bg-linear-light-accent-hover light:shadow-linear-light-sm light:text-linear-light-bg"
          >
            Start Free
          </button>
        </div>
      </nav>
    </header>
  );
}
