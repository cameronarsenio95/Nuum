/**
 * Analytics tracking utility
 * Safely tracks events using window.UGC if available
 */

declare global {
  interface Window {
    UGC?: {
      track: (event: string, properties?: Record<string, any>) => void;
    };
  }
}

export const analytics = {
  track: (event: string, properties?: Record<string, any>) => {
    try {
      if (typeof window !== 'undefined' && window.UGC?.track) {
        window.UGC.track(event, properties);
      }
    } catch (error) {
      // Silently fail - don't break the app if analytics fail
      if (import.meta.env.MODE === 'development') {
        console.warn('Analytics tracking failed:', event, error);
      }
    }
  },

  page: (name: string, properties?: Record<string, any>) => {
    analytics.track(`view_${name}`, properties);
  },

  // Common events
  signup: (method?: string) => {
    analytics.track('signup', { method });
  },

  login: (method?: string) => {
    analytics.track('login', { method });
  },

  logout: () => {
    analytics.track('logout');
  },

  cta: (location: string, label?: string) => {
    analytics.track('click_cta', { location, label });
  },

  upgrade: (from: string, to: string) => {
    analytics.track('upgrade_plan', { from, to });
  },

  campaign: {
    create: () => analytics.track('campaign_create'),
    update: () => analytics.track('campaign_update'),
    delete: () => analytics.track('campaign_delete'),
  },

  creator: {
    add: () => analytics.track('creator_add'),
    update: () => analytics.track('creator_update'),
    delete: () => analytics.track('creator_delete'),
  },

  content: {
    upload: (type: string) => analytics.track('content_upload', { type }),
    download: (type: string) => analytics.track('content_download', { type }),
    delete: () => analytics.track('content_delete'),
  },
};
