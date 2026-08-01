import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { createSessionToken } from '@/lib/auth/session';
import { getActiveSeason } from '@/lib/season-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { name, password } = await request.json();
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanPassword = typeof password === 'string' ? password : '';

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
      return NextResponse.json({ error: 'Invalid captain login.' }, { status: 401 });
    }

    const ok = await bcrypt.compare(cleanPassword, captain.password_hash);

    if (!ok) {
      return NextResponse.json({ error: 'Invalid captain login.' }, { status: 401 });
    }

    const token = createSessionToken({
      role: 'captain',
      id: captain.id,
      name: captain.captain_name,
      team_name: captain.team_name,
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
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Login failed.' }, { status: 500 });
  }
}
