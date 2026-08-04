import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { createSessionToken } from '@/lib/auth/session';
import { rateLimitByIp } from '@/lib/security/rate-limit';
import { sanitizeIdentifier } from '@/lib/security/sanitize';
import { logSecurityEvent, getRequestMeta } from '@/lib/security/logger';

export const runtime = 'nodejs';

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: Request) {
  const meta = getRequestMeta(request);

  // Rate limit first — protect against brute force
  const rl = rateLimitByIp(request, 'admin-login', LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!rl.success) {
    logSecurityEvent({
      level: 'warn',
      event: 'rate_limit_exceeded',
      ...meta,
      role: 'anonymous',
      details: { action: 'admin-login', limit: rl.limit, resetAt: new Date(rl.resetAt).toISOString() },
    });
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(rl.resetAt / 1000)),
        },
      },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const rawName = body?.name;
    const password = typeof body?.password === 'string' ? body.password : '';

    const name = sanitizeIdentifier(rawName, 120);
    if (!name || !password) {
      return NextResponse.json({ error: 'Admin name/email and password are required.' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    // Safe queries — never interpolate user input into filter strings
    const [{ data: byName }, { data: byEmail }] = await Promise.all([
      supabase.from('admin').select('*').ilike('admin_name', name).maybeSingle(),
      supabase.from('admin').select('*').ilike('email', name).maybeSingle(),
    ]);

    const admin = byName || byEmail;

    if (!admin) {
      logSecurityEvent({
        level: 'warn',
        event: 'login_failed',
        ...meta,
        role: 'admin',
        details: { reason: 'user_not_found', attempted_name: name },
      });
      return NextResponse.json({ error: 'Invalid admin login.' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) {
      logSecurityEvent({
        level: 'warn',
        event: 'login_failed',
        ...meta,
        role: 'admin',
        user_id: admin.id,
        details: { reason: 'invalid_password', attempted_name: name },
      });
      return NextResponse.json({ error: 'Invalid admin login.' }, { status: 401 });
    }

    const token = createSessionToken({ role: 'admin', id: admin.id, name: admin.admin_name });

    logSecurityEvent({
      level: 'info',
      event: 'login_success',
      ...meta,
      role: 'admin',
      user_id: admin.id,
      details: { name: admin.admin_name },
    });

    return NextResponse.json({
      session: {
        role: 'admin',
        id: admin.id,
        name: admin.admin_name,
        token,
        expires_at: Date.now() + 12 * 60 * 60 * 1000,
      },
    });
  } catch (error) {
    logSecurityEvent({
      level: 'error',
      event: 'login_failed',
      ...meta,
      role: 'admin',
      details: { reason: 'server_error', message: error instanceof Error ? error.message : 'unknown' },
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Login failed.' }, { status: 500 });
  }
}
