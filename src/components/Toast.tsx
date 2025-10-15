import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
  duration?: number;
}

export function Toast({ id, message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[type];

  const colors = {
    success: {
      bg: 'dark:bg-linear-success-subtle light:bg-linear-light-success-subtle',
      border: 'dark:border-linear-success-border light:border-linear-light-success-border',
      text: 'dark:text-linear-success light:text-linear-light-success',
      icon: 'dark:text-linear-success light:text-linear-light-success',
    },
    error: {
      bg: 'dark:bg-linear-error-subtle light:bg-linear-light-error-subtle',
      border: 'dark:border-linear-error-border light:border-linear-light-error-border',
      text: 'dark:text-linear-error light:text-linear-light-error',
      icon: 'dark:text-linear-error light:text-linear-light-error',
    },
    warning: {
      bg: 'dark:bg-linear-warning-subtle light:bg-linear-light-warning-subtle',
      border: 'dark:border-linear-warning-border light:border-linear-light-warning-border',
      text: 'dark:text-linear-warning light:text-linear-light-warning',
      icon: 'dark:text-linear-warning light:text-linear-light-warning',
    },
    info: {
      bg: 'dark:bg-linear-info-subtle light:bg-linear-light-info-subtle',
      border: 'dark:border-linear-info-border light:border-linear-light-info-border',
      text: 'dark:text-linear-info light:text-linear-light-info',
      icon: 'dark:text-linear-info light:text-linear-light-info',
    },
  };

  const color = colors[type];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-md border ${color.bg} ${color.border} shadow-lg animate-slide-down`}
      role="alert"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${color.icon}`} />
      <p className={`text-sm flex-1 ${color.text}`}>{message}</p>
      <button
        onClick={() => onClose(id)}
        className={`flex-shrink-0 linear-transition ${color.text} opacity-60 hover:opacity-100`}
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
