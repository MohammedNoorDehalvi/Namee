/**
 * Simple in-memory rate limiter for Next.js API routes.
 * Suitable for single-instance / low-traffic deployments.
 * For multi-instance production, replace the store with Upstash Redis or a Supabase table + RPC.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

const CLEAN_INTERVAL_MS = 5 * 60 * 1000;
let lastClean = Date.now();

function cleanExpired() {
  const now = Date.now();
  if (now - lastClean < CLEAN_INTERVAL_MS) return;
  lastClean = now;
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
};

/**
 * Check and consume one request against the rate limit.
 * @param key Unique key (usually `ip:action` or `userId:action`)
 * @param limit Max requests in the window
 * @param windowMs Window length in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  cleanExpired();
  const now = Date.now();
  let bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    store.set(key, bucket);
  }

  if (bucket.count >= limit) {
    return { success: false, remaining: 0, resetAt: bucket.resetAt, limit };
  }

  bucket.count += 1;
  return {
    success: true,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
    limit,
  };
}

/** Extract client IP from common proxy headers (Render, Vercel, Cloudflare, etc.) */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for') || headers.get('x-real-ip') || headers.get('cf-connecting-ip');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return 'unknown';
}

/** Convenience: rate-limit by IP + action name */
export function rateLimitByIp(
  request: Request,
  action: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const ip = getClientIp(request);
  return rateLimit(`${ip}:${action}`, limit, windowMs);
}
