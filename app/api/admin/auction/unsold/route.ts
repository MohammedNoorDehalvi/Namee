import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!requireRole(request, 'admin')) return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  const supabase = createSupabaseAdmin();
  const { data: auction } = await supabase.from('auction').select('*').eq('id', 1).maybeSingle();
  if (!auction?.current_player_id) return NextResponse.json({ error: 'No current player.' }, { status: 400 });
  await supabase.from('players').update({ status: 'Unsold' }).eq('id', auction.current_player_id);
  await supabase.from('auction').update({ auction_status: 'Unsold', updated_at: new Date().toISOString() }).eq('id', 1);
  return NextResponse.json({ ok: true });
}
