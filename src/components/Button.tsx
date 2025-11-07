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
          backgroundColor: NUUM_COLORS.textPrimary,
          color: NUUM_COLORS.background,
          border: 'none',
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          color: NUUM_COLORS.textSecondary,
          border: `1px solid ${NUUM_COLORS.border}`,
        };
      case 'danger':
        return {
          backgroundColor: 'transparent',
          color: '#C34B4B',
          border: '1px solid #C34B4B',
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
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          } else if (variant === 'secondary') {
            e.currentTarget.style.borderColor = NUUM_COLORS.borderHover;
            e.currentTarget.style.color = NUUM_COLORS.textPrimary;
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
