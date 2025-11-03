/**
 * Application-wide constants
 */

export const APP_NAME = 'NUUM';
export const APP_TAGLINE = 'All Your Creator Data. One System.';
export const APP_DESCRIPTION = 'Centralize creators, campaigns, and UGC. Turn spreadsheets into a clear, measurable workflow.';

export const CONTACT_EMAIL = 'support@nuum.app';
export const LEGAL_EMAIL = 'legal@nuum.app';
export const PRIVACY_EMAIL = 'privacy@nuum.app';

export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/nuum',
  linkedin: 'https://linkedin.com/company/nuum',
  instagram: 'https://instagram.com/nuum',
};

export const TRIAL_DURATION_DAYS = 14;
export const FREE_PLAN_MAX_CREATORS = 25;
export const FREE_PLAN_MAX_STORAGE_GB = 5;
export const FREE_PLAN_MAX_TEAM_MEMBERS = 3;

export const PLAN_LIMITS = {
  free: {
    maxCreators: 25,
    maxStorageGB: 5,
    maxTeamMembers: 3,
  },
  standard: {
    maxCreators: 25,
    maxStorageGB: 5,
    maxTeamMembers: 3,
  },
  elite: {
    maxCreators: 50,
    maxStorageGB: 25,
    maxTeamMembers: 5,
  },
  enterprise: {
    maxCreators: -1, // unlimited
    maxStorageGB: -1, // unlimited
    maxTeamMembers: -1, // unlimited
  },
};

export const STORAGE_BUCKET_NAME = 'content';

export const SUPPORTED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  videos: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

export const MAX_FILE_SIZE_MB = 100;

export const SOCIAL_PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'Twitter' },
] as const;

export const CAMPAIGN_STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export const TASK_STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Completed' },
] as const;

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;
