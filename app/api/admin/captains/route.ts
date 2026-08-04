import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getActiveSeason } from '@/lib/season-server';
import { isStrongPassword, passwordPolicyMessage, sanitizeText } from '@/lib/security/sanitize';

export const runtime = 'nodejs';

function cleanText(value: unknown) {
  return sanitizeText(value, 120);
}

function cleanNumber(value: unknown, fallback: number) {
  if (value === undefined || value === null || value === '') return fallback;

  const number = Number(value);

  if (!Number.isFinite(number)) return Number.NaN;

  return Math.round(number);
}

export async function POST(request: Request) {
  if (!requireRole(request, 'admin')) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const captainName = cleanText(body.captain_name);
  const teamName = cleanText(body.team_name);
  const cleanPassword = typeof body.password === 'string' ? body.password.trim() : '';
  const amount = cleanNumber(body.budget, 50000);

  if (!captainName || !teamName || !cleanPassword) {
    return NextResponse.json({ error: 'Captain name, team name, and password are required.' }, { status: 400 });
  }

  if (!isStrongPassword(cleanPassword, 8)) {
    return NextResponse.json({ error: passwordPolicyMessage(8) }, { status: 400 });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Budget must be a positive number.' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const season = await getActiveSeason(supabase);

  if (!season) {
    return NextResponse.json({ error: 'Start a season before adding captains.' }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(cleanPassword, 12);

  // Two parameterized lookups instead of a raw-string .or() filter
  const byName = await supabase
    .from('captains')
    .select('*')
    .eq('season_id', season.id)
    .ilike('captain_name', captainName)
    .limit(1)
    .maybeSingle();

  if (byName.error) {
    return NextResponse.json({ error: byName.error.message }, { status: 500 });
  }

  const byTeam = byName.data
    ? { data: null, error: null }
    : await supabase
        .from('captains')
        .select('*')
        .eq('season_id', season.id)
        .ilike('team_name', teamName)
        .limit(1)
        .maybeSingle();

  if (byTeam.error) {
    return NextResponse.json({ error: byTeam.error.message }, { status: 500 });
  }

  const existingCaptain = byName.data || byTeam.data;

  const captainPayload = {
    captain_name: captainName,
    team_name: teamName,
    password_hash,
    budget: amount,
    remaining_budget: amount,
    season_id: season.id,
  };

  const captainResult = existingCaptain?.id
    ? await supabase.from('captains').update(captainPayload).eq('id', existingCaptain.id).select('*').single()
    : await supabase.from('captains').insert(captainPayload).select('*').single();

  if (captainResult.error) {
    return NextResponse.json({ error: captainResult.error.message }, { status: 500 });
  }

  return NextResponse.json({ captain: captainResult.data });
}
