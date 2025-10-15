/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
  if (!input) return '';

  return input
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';

  return email
    .toLowerCase()
    .trim()
    .replace(/[^\w\s@.\-+]/gi, '');
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return url.trim();
  } catch {
    return '';
  }
}

/**
 * Validate and sanitize social media handle
 */
export function sanitizeSocialHandle(handle: string): string {
  if (!handle) return '';

  return handle
    .replace(/[^a-zA-Z0-9._]/g, '')
    .replace(/^@/, '')
    .trim();
}
