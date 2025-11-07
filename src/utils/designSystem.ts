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
  textTertiary: '#6B6B6B',
  success: '#38E29F',
  successMuted: 'rgba(56, 226, 159, 0.6)',
  error: '#E74C3C',
  errorMuted: 'rgba(231, 76, 60, 0.5)',
  warning: '#F39C12',
  warningMuted: 'rgba(243, 156, 18, 0.5)',
} as const;

export const STATUS_COLORS = {
  active: '#3E7C6D',
  completed: '#3B4A5C',
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
  card: 'shadow-sm',
  cardHover: 'shadow-md',
  modal: 'shadow-2xl',
} as const;

export const SPACING = {
  cardPadding: 'p-4 lg:p-6',
  sectionGap: 'gap-6',
  horizontalPadding: 'px-8 lg:px-10',
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
      return 'bg-[#3E7C6D] text-white';
    case 'completed':
    case 'done':
      return 'bg-[#3B4A5C] text-white';
    case 'draft':
      return 'bg-[#5A5454] text-white';
    case 'pending':
      return 'bg-[#6B5B3A] text-white';
    case 'cancelled':
      return 'bg-[#4A3B3B] text-white';
    default:
      return 'bg-[#2A2A2A] text-gray-300';
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
