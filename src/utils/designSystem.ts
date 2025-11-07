export const NUUM_COLORS = {
  background: '#0E0E0E',
  surface: '#111111',
  surfaceHover: '#151515',
  border: '#1C1C1C',
  borderHover: '#2A53D0',
  accent: '#2A53D0',
  accentHover: '#1E3BA1',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#666666',
  success: '#38E29F',
  successMuted: 'rgba(56, 226, 159, 0.6)',
  error: '#C34B4B',
  errorMuted: 'rgba(231, 76, 60, 0.5)',
  warning: '#E6B450',
  warningMuted: 'rgba(230, 180, 80, 0.5)',
} as const;

export const STATUS_COLORS = {
  active: '#3E7C6D',
  completed: '#3B4A5C',
  done: '#36454F',
  draft: '#5A5454',
  pending: '#6B5B3A',
  cancelled: '#4A3B3B',
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
  cardPadding: 'p-4 md:p-5',
  sectionGap: 'gap-6',
  outerPadding: 'p-8',
  cardGap: 'gap-6',
  verticalRhythm: 'space-y-10',
  sectionHeaderMargin: 'mb-6',
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
      return 'bg-[#3E7C6D] text-gray-200 text-xs font-medium px-2 py-0.5 rounded-full';
    case 'completed':
      return 'bg-[#3B4A5C] text-gray-200 text-xs font-medium px-2 py-0.5 rounded-full';
    case 'done':
      return 'bg-[#36454F] text-gray-200 text-xs font-medium px-2 py-0.5 rounded-full';
    case 'draft':
      return 'bg-[#5A5454] text-gray-200 text-xs font-medium px-2 py-0.5 rounded-full';
    case 'pending':
    case 'todo':
      return 'bg-[#6B5B3A] text-gray-200 text-xs font-medium px-2 py-0.5 rounded-full';
    case 'cancelled':
    case 'archived':
      return 'bg-[#4A3B3B] text-gray-200 text-xs font-medium px-2 py-0.5 rounded-full';
    default:
      return 'bg-[#2A2A2A] text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full';
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
