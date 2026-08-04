import { createHmac, timingSafeEqual } from 'crypto';

export type TokenPayload = { role: 'captain' | 'admin'; id: string; name: string; team_name?: string; exp: number };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    // Fail closed in production; allow a clear warning in development
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET environment variable must be set to a strong random value (min 32 chars).');
    }
    // eslint-disable-next-line no-console
    console.warn('[security] AUTH_SECRET is missing or too short. Using insecure dev fallback. Set AUTH_SECRET immediately.');
    return 'dev-insecure-secret-change-me-immediately-32chars-min';
  }
  return s;
}

function sign(data: string) {
  return createHmac('sha256', secret()).update(data).digest('base64url');
}

export function createSessionToken(payload: Omit<TokenPayload, 'exp'>, maxAgeHours = 12) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + maxAgeHours * 60 * 60 * 1000 })).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | null): TokenPayload | null {
  if (!token || !token.includes('.')) return null;
  const [body, signature] = token.split('.');
  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getBearerToken(request: Request) {
  const header = request.headers.get('authorization') || '';
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : null;
}

export function requireRole(request: Request, role: 'captain' | 'admin') {
  const payload = verifySessionToken(getBearerToken(request));
  if (!payload || payload.role !== role) return null;
  return payload;
}
