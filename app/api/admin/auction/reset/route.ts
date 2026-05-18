import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!requireRole(request, 'admin')) return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('auction').upsert({
    id: 1,
    current_player_id: null,
    auction_status: 'Not Started',
    highest_bid: 0,
    highest_bidder_id: null,
    highest_team_name: null,
    updated_at: new Date().toISOString()
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
