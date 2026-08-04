import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { createSessionToken } from '@/lib/auth/session';
import { getActiveSeason } from '@/lib/season-server';
import { rateLimitByIp } from '@/lib/security/rate-limit';
import { sanitizeIdentifier } from '@/lib/security/sanitize';
import { logSecurityEvent, getRequestMeta } from '@/lib/security/logger';

export const runtime = 'nodejs';

const LOGIN_LIMIT = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: Request) {
  const meta = getRequestMeta(request);

  const rl = rateLimitByIp(request, 'captain-login', LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!rl.success) {
    logSecurityEvent({
      level: 'warn',
      event: 'rate_limit_exceeded',
      ...meta,
      role: 'anonymous',
      details: { action: 'captain-login', limit: rl.limit, resetAt: new Date(rl.resetAt).toISOString() },
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
    const cleanName = sanitizeIdentifier(body?.name, 80);
    const cleanPassword = typeof body?.password === 'string' ? body.password : '';

    if (!cleanName || !cleanPassword) {
      return NextResponse.json({ error: 'Captain name and password are required.' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const season = await getActiveSeason(supabase);

    if (!season) {
      return NextResponse.json({ error: 'No active season found.' }, { status: 400 });
    }

    const { data: captain, error } = await supabase
      .from('captains')
      .select('*')
      .eq('season_id', season.id)
      .ilike('captain_name', cleanName)
      .limit(1)
      .maybeSingle();

    if (error || !captain) {
      logSecurityEvent({
        level: 'warn',
        event: 'login_failed',
        ...meta,
        role: 'captain',
        details: { reason: 'user_not_found', attempted_name: cleanName },
      });
      return NextResponse.json({ error: 'Invalid captain login.' }, { status: 401 });
    }

    const ok = await bcrypt.compare(cleanPassword, captain.password_hash);

    if (!ok) {
      logSecurityEvent({
        level: 'warn',
        event: 'login_failed',
        ...meta,
        role: 'captain',
        user_id: captain.id,
        details: { reason: 'invalid_password', attempted_name: cleanName },
      });
      return NextResponse.json({ error: 'Invalid captain login.' }, { status: 401 });
    }

    const token = createSessionToken({
      role: 'captain',
      id: captain.id,
      name: captain.captain_name,
      team_name: captain.team_name,
    });

    logSecurityEvent({
      level: 'info',
      event: 'login_success',
      ...meta,
      role: 'captain',
      user_id: captain.id,
      details: { name: captain.captain_name, team: captain.team_name },
    });

    return NextResponse.json({
      session: {
        role: 'captain',
        id: captain.id,
        name: captain.captain_name,
        team_name: captain.team_name,
        token,
        expires_at: Date.now() + 12 * 60 * 60 * 1000,
      },
    });
  } catch (error) {
    logSecurityEvent({
      level: 'error',
      event: 'login_failed',
      ...meta,
      role: 'captain',
      details: { reason: 'server_error', message: error instanceof Error ? error.message : 'unknown' },
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Login failed.' }, { status: 500 });
  }
}
