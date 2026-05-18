import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!requireRole(request, 'admin')) return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  const { captain_name, team_name, password, budget } = await request.json();
  if (!captain_name || !team_name || !password) return NextResponse.json({ error: 'Captain name, team name, and password are required.' }, { status: 400 });
  const password_hash = await bcrypt.hash(password, 10);
  const amount = Number(budget || 50000);
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.from('captains').insert({ captain_name, team_name, password_hash, budget: amount, remaining_budget: amount }).select('id,captain_name,team_name,budget,remaining_budget,created_at').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ captain: data });
}
