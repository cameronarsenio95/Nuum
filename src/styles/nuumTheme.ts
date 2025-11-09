export const NUUM_THEME = {
  colors: {
    background: '#0e0e0e',
    backgroundSecondary: '#161616',
    surface: '#161616',
    surfaceHover: '#1c1c1c',

    border: '#2e2f30',
    borderSubtle: '#e2e2e1',
    borderHover: '#3a3b3c',

    textPrimary: '#ffffff',
    textSecondary: '#cecece',
    textMuted: '#8a8a8a',

    accentGreen: '#66a56b',
    accentGreenDark: '#1e2921',

    accentBlue: '#3e559e',
    accentBlueDark: '#141623',

    accentOrange: '#e3a36e',
    accentOrangeDark: '#2e2720',

    accentRed: '#9c3e3f',
    accentRedDark: '#251816',

    success: '#66a56b',
    successDark: '#1e2921',

    error: '#9c3e3f',
    errorDark: '#251816',

    warning: '#e3a36e',
    warningDark: '#2e2720',

    info: '#3e559e',
    infoDark: '#141623',
  },

  badges: {
    todo: {
      bg: '#e3a36e',
      text: '#2e2720',
    },
    inProgress: {
      bg: '#66a56b',
      text: '#ffffff',
    },
    active: {
      bg: '#66a56b',
      text: '#ffffff',
    },
    completed: {
      bg: '#3e559e',
      text: '#ffffff',
    },
    done: {
      bg: '#3e559e',
      text: '#ffffff',
    },
    draft: {
      bg: '#e3a36e',
      text: '#2e2720',
    },
    archived: {
      bg: '#2e2f30',
      text: '#8a8a8a',
    },
    paused: {
      bg: '#e3a36e',
      text: '#2e2720',
    },
  },

  platforms: {
    tiktok: {
      bg: '#3e559e',
      text: '#ffffff',
    },
    snapchat: {
      bg: '#e3a36e',
      text: '#2e2720',
    },
    meta: {
      bg: '#141623',
      text: '#ffffff',
    },
    instagram: {
      bg: '#9c3e3f',
      text: '#ffffff',
    },
  },

  typography: {
    heading: 'font-semibold',
    subheading: 'font-medium',
    body: 'font-normal',
    metadata: 'text-xs',
    numeric: 'font-semibold tracking-tight',
  },

  spacing: {
    card: 'p-4 md:p-6',
    cardGap: 'gap-6',
    section: 'space-y-6',
  },

  radius: {
    card: '14px',
    button: '10px',
    input: '10px',
    badge: '6px',
    modal: '14px',
  },

  shadows: {
    card: '0 2px 4px rgba(0, 0, 0, 0.2)',
    modal: '0 8px 32px rgba(0, 0, 0, 0.4)',
    button: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
} as const;

export type NUUMTheme = typeof NUUM_THEME;

export function getStatusBadgeStyle(status: string): { bg: string; text: string } {
  const normalizedStatus = status.toLowerCase().replace(/[_\s-]/g, '');

  if (normalizedStatus === 'active') return NUUM_THEME.badges.active;
  if (normalizedStatus === 'completed') return NUUM_THEME.badges.completed;
  if (normalizedStatus === 'done') return NUUM_THEME.badges.done;
  if (normalizedStatus === 'todo') return NUUM_THEME.badges.todo;
  if (normalizedStatus === 'inprogress') return NUUM_THEME.badges.inProgress;
  if (normalizedStatus === 'draft') return NUUM_THEME.badges.draft;
  if (normalizedStatus === 'archived') return NUUM_THEME.badges.archived;
  if (normalizedStatus === 'paused') return NUUM_THEME.badges.paused;

  return { bg: NUUM_THEME.colors.border, text: NUUM_THEME.colors.textSecondary };
}

export function getPlatformBadgeStyle(platform: string): { bg: string; text: string } {
  const normalizedPlatform = platform.toLowerCase();

  if (normalizedPlatform.includes('tiktok')) return NUUM_THEME.platforms.tiktok;
  if (normalizedPlatform.includes('snapchat')) return NUUM_THEME.platforms.snapchat;
  if (normalizedPlatform.includes('meta') || normalizedPlatform.includes('facebook')) return NUUM_THEME.platforms.meta;
  if (normalizedPlatform.includes('instagram')) return NUUM_THEME.platforms.instagram;

  return { bg: NUUM_THEME.colors.border, text: NUUM_THEME.colors.textSecondary };
}

export function getROIColor(roi: number): string {
  return roi >= 0 ? NUUM_THEME.colors.accentGreen : NUUM_THEME.colors.accentRed;
}
