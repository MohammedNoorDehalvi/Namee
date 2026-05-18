import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!requireRole(request, 'admin')) return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  const { player_id } = await request.json();
  if (!player_id) return NextResponse.json({ error: 'Select a player first.' }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const { data: player, error: playerError } = await supabase.from('players').select('*').eq('id', player_id).eq('approval_status', 'Approved').maybeSingle();
  if (playerError || !player) return NextResponse.json({ error: 'Approved player not found.' }, { status: 404 });
  if (player.status !== 'Available') return NextResponse.json({ error: 'Only available players can be auctioned.' }, { status: 400 });

  const base = Number(player.base_price || 0);
  await supabase.from('players').update({ current_bid: base, sold_to_team: null, sold_to_captain_id: null, sold_price: null }).eq('id', player_id);
  const { error } = await supabase.from('auction').upsert({
    id: 1,
    current_player_id: player_id,
    auction_status: 'Live',
    highest_bid: base,
    highest_bidder_id: null,
    highest_team_name: null,
    updated_at: new Date().toISOString()
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
