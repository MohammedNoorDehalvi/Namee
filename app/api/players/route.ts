import { NextResponse } from 'next/server';

import { getActiveSeason } from '@/lib/season-server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const season = await getActiveSeason(supabase);

    if (!season) {
      return NextResponse.json({ season: null, players: [] }, { headers: NO_STORE_HEADERS });
    }

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('season_id', season.id)
      .eq('approval_status', 'Approved')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message, players: [] }, { status: 500, headers: NO_STORE_HEADERS });
    }

    return NextResponse.json({ season, players: data || [] }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load players.', players: [] },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
