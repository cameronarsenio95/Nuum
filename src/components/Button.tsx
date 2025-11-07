import { NUUM_COLORS } from '../utils/designSystem';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'transparent',
          color: NUUM_COLORS.textPrimary,
          border: `1px solid ${NUUM_COLORS.accent}`,
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          color: '#9CA3AF',
          border: '1px solid #1E1E1E',
        };
      case 'danger':
        return {
          backgroundColor: 'transparent',
          color: NUUM_COLORS.error,
          border: `1px solid rgba(195, 75, 75, 0.4)`,
        };
      default:
        return {};
    }
  };

  return (
    <button
      className={`${sizeClasses[size]} rounded-lg font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={getVariantStyles()}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled) {
          if (variant === 'primary') {
            e.currentTarget.style.backgroundColor = 'rgba(42, 83, 208, 0.1)';
          } else if (variant === 'secondary') {
            e.currentTarget.style.borderColor = 'rgba(42, 83, 208, 0.6)';
          } else if (variant === 'danger') {
            e.currentTarget.style.backgroundColor = 'rgba(195, 75, 75, 0.1)';
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          const styles = getVariantStyles();
          Object.assign(e.currentTarget.style, styles);
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}
