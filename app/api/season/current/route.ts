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

    return NextResponse.json({ season: season || null }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { season: null, error: error instanceof Error ? error.message : 'Could not load current season.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
