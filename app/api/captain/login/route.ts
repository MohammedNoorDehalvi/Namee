import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { createSessionToken } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { name, password } = await request.json();
    if (!name || !password) return NextResponse.json({ error: 'Captain name and password are required.' }, { status: 400 });
    const supabase = createSupabaseAdmin();
    const { data: captain, error } = await supabase.from('captains').select('*').ilike('captain_name', name).maybeSingle();
    if (error || !captain) return NextResponse.json({ error: 'Invalid captain login.' }, { status: 401 });
    const ok = await bcrypt.compare(password, captain.password_hash);
    if (!ok) return NextResponse.json({ error: 'Invalid captain login.' }, { status: 401 });
    const token = createSessionToken({ role: 'captain', id: captain.id, name: captain.captain_name, team_name: captain.team_name });
    return NextResponse.json({ session: { role: 'captain', id: captain.id, name: captain.captain_name, team_name: captain.team_name, token, expires_at: Date.now() + 12 * 60 * 60 * 1000 } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Login failed.' }, { status: 500 });
  }
}
