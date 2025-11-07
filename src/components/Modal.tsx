import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { NUUM_COLORS } from '../utils/designSystem';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'lg' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className={`${maxWidthClasses[maxWidth]} w-full rounded-xl border p-6 animate-fade-in-up`}
        style={{
          backgroundColor: NUUM_COLORS.surface,
          borderColor: NUUM_COLORS.border,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold" style={{ color: NUUM_COLORS.textPrimary }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition-all duration-150"
              style={{ color: NUUM_COLORS.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = NUUM_COLORS.surfaceHover;
                e.currentTarget.style.color = NUUM_COLORS.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = NUUM_COLORS.textSecondary;
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
}
