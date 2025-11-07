import { ReactNode } from 'react';
import { NUUM_COLORS, SHADOWS } from '../utils/designSystem';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const isClickable = !!onClick;

  return (
    <div
      className={`border rounded-xl p-4 md:p-5 transition-all duration-150 ease-in-out ${
        hover || isClickable ? 'cursor-pointer' : ''
      } ${SHADOWS.card} ${className}`}
      style={{
        backgroundColor: NUUM_COLORS.surface,
        borderColor: NUUM_COLORS.border,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (hover || isClickable) {
          e.currentTarget.style.borderColor = NUUM_COLORS.borderHover;
          e.currentTarget.style.transform = 'scale(1.02)';
        }
      }}
      onMouseLeave={(e) => {
        if (hover || isClickable) {
          e.currentTarget.style.borderColor = NUUM_COLORS.border;
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
    >
      {children}
    </div>
  );
}
