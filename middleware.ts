import { NextResponse, type NextRequest } from 'next/server';

// --- Rate limiting -----------------------------------------------------
// In-memory, per-instance limiter. Protects only the truly abusable endpoints.
// Login and registration stay tightly limited.
// Bidding and normal API polling (admin dashboard, live auction) are NOT limited
// here because real captains need to bid quickly and the dashboard polls often.
// For multi-instance production, move to Upstash Redis later.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Only protect endpoints that are dangerous if abused.
// - Login: prevent password brute-force
// - Registration: prevent spam / database flooding
// Everything else (bids, overview polling, auction status) is left unrestricted
// so the live auction and admin dashboard work smoothly under normal load.
const RULES: { match: (path: string) => boolean; limit: number; windowMs: number }[] = [
  { match: (p) => p === '/api/admin/login' || p === '/api/captain/login', limit: 8, windowMs: 60_000 },
  { match: (p) => p === '/api/players/register', limit: 5, windowMs: 60_000 },
];

function clientIp(req: NextRequest) {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count };
}

// Periodic cleanup so the Map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000);

// --- Security headers ----------------------------------------------------
function withSecurityHeaders(res: NextResponse) {
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/')) {
    const rule = RULES.find((r) => r.match(pathname));
    if (rule) {
      const ip = clientIp(req);
      const key = `${pathname}:${ip}`;
      const result = checkRateLimit(key, rule.limit, rule.windowMs);
      if (!result.ok) {
        const res = NextResponse.json(
          { error: 'Too many requests. Please slow down and try again shortly.' },
          { status: 429 },
        );
        res.headers.set('Retry-After', String(Math.ceil((result.retryAfterMs || 1000) / 1000)));
        return withSecurityHeaders(res);
      }
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
