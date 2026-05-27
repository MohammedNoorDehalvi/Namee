import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getActiveSeason } from '@/lib/season-server';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = createSupabaseAdmin();
  const season = await getActiveSeason(supabase);

  return NextResponse.json({ season });
}
