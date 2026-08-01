import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getActiveSeason } from '@/lib/season-server';

export const runtime = 'nodejs';

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
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

  const { captain_name, team_name, password, budget } = await request.json();

  const captainName = cleanText(captain_name);
  const teamName = cleanText(team_name);
  const cleanPassword = typeof password === 'string' ? password.trim() : '';
  const amount = cleanNumber(budget, 50000);

  if (!captainName || !teamName || !cleanPassword) {
    return NextResponse.json({ error: 'Captain name, team name, and password are required.' }, { status: 400 });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Budget must be a positive number.' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const season = await getActiveSeason(supabase);

  if (!season) {
    return NextResponse.json({ error: 'Start a season before adding captains.' }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(cleanPassword, 10);

  const { data: existingCaptain, error: lookupError } = await supabase
    .from('captains')
    .select('*')
    .eq('season_id', season.id)
    .or(`captain_name.ilike.${captainName},team_name.ilike.${teamName}`)
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

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
