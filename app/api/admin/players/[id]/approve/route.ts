import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!requireRole(request, 'admin')) return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  const body = await request.json();
  const base_price = Number(body.base_price);
  if (!base_price || base_price < 1) return NextResponse.json({ error: 'Base price is required.' }, { status: 400 });
  const supabase = createSupabaseAdmin();
  const update = {
    name: body.name,
    phone: body.phone,
    role: body.role,
    batting_style: body.batting_style,
    bowling_style: body.bowling_style,
    base_price,
    current_bid: base_price,
    status: 'Available',
    approval_status: 'Approved'
  };
  const { error } = await supabase.from('players').update(update).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
