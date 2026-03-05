import { logger } from '../../config/logger.js';

const BLOCKED_DOMAINS = [
  'twitter.com',
  'x.com',
  'reddit.com',
  'instagram.com',
  'tiktok.com',
  'facebook.com',
  'linkedin.com',
  'youtube.com',
  'threads.net',
];

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
];

function isPrivateIp(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower === '0.0.0.0') return true;
  return PRIVATE_IP_RANGES.some((re) => re.test(lower));
}

function isBlockedDomain(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return BLOCKED_DOMAINS.some(
    (domain) => lower === domain || lower.endsWith(`.${domain}`)
  );
}

export interface UrlValidationResult {
  valid: boolean;
  reason?: string;
  warning?: string;
}

export async function validateBlogUrl(url: string): Promise<UrlValidationResult> {
  // 1. Must be a valid URL
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }

  // 2. Must be HTTPS
  if (parsed.protocol !== 'https:') {
    return { valid: false, reason: 'URL must use HTTPS' };
  }

  // 3. Not a social media domain
  if (isBlockedDomain(parsed.hostname)) {
    return { valid: false, reason: 'Social media URLs are not allowed. Add blogs only.' };
  }

  // 4. Not private IP / localhost (SSRF prevention)
  if (isPrivateIp(parsed.hostname)) {
    return { valid: false, reason: 'Private/local addresses are not allowed' };
  }

  // 5. HEAD request returns 200 (with 5s timeout)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        valid: true,
        warning: `Blog returned HTTP ${response.status}. Added anyway — it may be temporarily down.`,
      };
    }
  } catch (err) {
    logger.warn({ url, error: (err as Error).message }, '[BLOG-VALIDATOR] HEAD request failed');
    return {
      valid: true,
      warning: 'Could not reach blog (timeout or network error). Added anyway.',
    };
  }

  return { valid: true };
}

export { isPrivateIp, isBlockedDomain, BLOCKED_DOMAINS };
