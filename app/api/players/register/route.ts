import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cleanPhoneInput, jsonError } from '@/lib/auction-server';
import { isValidPhoneNumber } from '@/lib/auction-utils';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const schema = z.object({
  name: z.string().trim().min(2, 'Player name is required.'),
  phone: z.string().trim().min(10, 'Phone number is required.'),
  role: z.enum(['Batter', 'Bowler', 'All-rounder', 'Wicketkeeper']),
  batting_style: z.enum(['Right Hand', 'Left Hand']),
  bowling_style: z.enum(['Fast', 'Medium', 'Spin', 'None']),
  photo_url: z.string().url().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || 'Invalid registration details.');

    const phone = cleanPhoneInput(parsed.data.phone);
    if (!isValidPhoneNumber(phone)) return jsonError('Enter a valid phone number.');

    const supabase = createSupabaseAdmin();
    const { count, error: countError } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('normalized_phone', phone);

    if (countError) return jsonError(countError.message, 500);
    if ((count || 0) >= 2) return jsonError('This phone number has already registered 2 players.');

    const { error } = await supabase.from('players').insert({
      name: parsed.data.name,
      phone,
      normalized_phone: phone,
      role: parsed.data.role,
      batting_style: parsed.data.batting_style,
      bowling_style: parsed.data.bowling_style,
      photo_url: parsed.data.photo_url || null,
      approval_status: 'Pending',
      status: 'Available',
      auction_status: 'PENDING',
      base_price: null,
      current_bid: 0,
    });

    if (error) return jsonError(error.message.includes('already registered 2') ? 'This phone number has already registered 2 players.' : error.message, 400);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Registration failed.', 500);
  }
}
