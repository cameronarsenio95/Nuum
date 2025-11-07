import { ReactNode } from 'react';
import { NUUM_COLORS, TYPOGRAPHY, SPACING } from '../utils/designSystem';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function PageLayout({ title, subtitle, children }: PageLayoutProps) {
  return (
    <div className={SPACING.verticalSectionGap}>
      <div>
        <h2 className={TYPOGRAPHY.pageTitle} style={{ color: NUUM_COLORS.textPrimary }}>
          {title}
        </h2>
        {subtitle && (
          <p className={TYPOGRAPHY.bodyText} style={{ color: NUUM_COLORS.textSecondary }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

interface SectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ title, children, className = '' }: SectionProps) {
  return (
    <div className={className}>
      {title && (
        <h3
          className={`${TYPOGRAPHY.sectionHeader} ${SPACING.sectionHeaderMargin}`}
          style={{ color: NUUM_COLORS.textSecondary }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
