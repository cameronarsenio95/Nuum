import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-linear linear-transition dark:hover:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 dark:text-text-secondary light:text-text-light-secondary" />
      ) : (
        <Moon className="w-4 h-4 dark:text-text-secondary light:text-text-light-secondary" />
      )}
    </button>
  );
}
