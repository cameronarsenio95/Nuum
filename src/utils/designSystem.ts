export const NUUM_COLORS = {
  background: '#0e0e0e',
  surface: '#161616',
  surfaceHover: '#1b1b1b',
  border: 'rgba(226,226,225,0.1)',
  borderHover: 'rgba(226,226,225,0.15)',
  accent: '#3e559e',
  accentHover: '#324885',
  textPrimary: '#ffffff',
  textSecondary: '#cecece',
  textMuted: '#cecece',
  success: '#66a56b',
  successMuted: 'rgba(102, 165, 107, 0.6)',
  error: '#9c3e3f',
  errorMuted: 'rgba(156, 62, 63, 0.5)',
  warning: '#e3a36e',
  warningMuted: 'rgba(227, 163, 110, 0.5)',
} as const;

export const STATUS_COLORS = {
  active: '#66a56b',
  completed: '#3e559e',
  done: '#3e559e',
  draft: '#e3a36e',
  pending: '#e3a36e',
  cancelled: '#9c3e3f',
} as const;

export const TRANSITIONS = {
  default: 'transition-all duration-150 ease-in-out',
  fast: 'transition-all duration-100 ease-in-out',
  slow: 'transition-all duration-300 ease-in-out',
} as const;

export const SHADOWS = {
  card: 'shadow-[0_0_8px_rgba(0,0,0,0.2)]',
  cardHover: 'shadow-[0_0_12px_rgba(42,83,208,0.15)]',
  modal: 'shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
} as const;

export const SPACING = {
  cardPadding: 'p-5',
  sectionGap: 'gap-6',
  outerPadding: 'p-8',
  cardGap: 'gap-6',
  verticalRhythm: 'space-y-10',
  sectionHeaderMargin: 'mb-3',
  horizontalPadding: 'px-8',
  verticalSectionGap: 'space-y-10',
} as const;

export const TYPOGRAPHY = {
  pageTitle: 'text-xl font-semibold text-white',
  sectionHeader: 'text-sm text-gray-400 uppercase tracking-wide',
  bodyText: 'text-sm text-gray-300 leading-relaxed',
  numeric: 'text-white font-medium',
  metadata: 'text-xs text-gray-500',
} as const;

export const RADIUS = {
  card: 'rounded-xl',
  button: 'rounded-lg',
  input: 'rounded-lg',
  badge: 'rounded-full',
} as const;

export const getStatusColorClass = (status: string): string => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'active':
    case 'in progress':
    case 'in_progress':
      return 'bg-[#1e2921] text-[#66a56b] text-xs font-medium px-2 py-0.5 rounded-full';
    case 'completed':
      return 'bg-[#141623] text-[#3e559e] text-xs font-medium px-2 py-0.5 rounded-full';
    case 'done':
      return 'bg-[#141623] text-[#3e559e] text-xs font-medium px-2 py-0.5 rounded-full';
    case 'draft':
      return 'bg-[#2e2720] text-[#e3a36e] text-xs font-medium px-2 py-0.5 rounded-full';
    case 'pending':
    case 'todo':
      return 'bg-[#2e2720] text-[#e3a36e] text-xs font-medium px-2 py-0.5 rounded-full';
    case 'cancelled':
    case 'archived':
      return 'bg-[#251816] text-[#9c3e3f] text-xs font-medium px-2 py-0.5 rounded-full';
    default:
      return 'bg-[#2e2f30] text-[#cecece] text-xs font-medium px-2 py-0.5 rounded-full';
  }
};

export const getPlatformColorClass = (platform: string): string => {
  const platformLower = platform.toLowerCase();
  switch (platformLower) {
    case 'instagram':
      return 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30';
    case 'tiktok':
      return 'bg-gradient-to-br from-black/40 to-cyan-600/20 border-cyan-500/30';
    case 'youtube':
      return 'bg-gradient-to-br from-red-600/20 to-red-700/20 border-red-500/30';
    case 'snapchat':
      return 'bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border-yellow-500/30';
    default:
      return 'bg-[#1C1C1C] border-[#2A2A2A]';
  }
};

export const getCardStyles = () => ({
  backgroundColor: NUUM_COLORS.surface,
  borderColor: NUUM_COLORS.border,
  borderWidth: '1px',
  borderRadius: '12px',
  padding: '16px',
  boxShadow: '0 0 8px rgba(0,0,0,0.2)',
  transition: 'all 150ms ease-in-out',
});

export const getCardHoverStyles = () => ({
  borderColor: NUUM_COLORS.borderHover,
  transform: 'scale(1.02)',
});
