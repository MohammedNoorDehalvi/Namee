import { NextResponse } from 'next/server';

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
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .order('season_number', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message, seasons: [] }, { status: 500, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ seasons: data || [] }, { headers: NO_STORE_HEADERS });
}
