import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .order('season_number', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ seasons: data || [] });
}
