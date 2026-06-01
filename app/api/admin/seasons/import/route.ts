import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdminRequest } from '@/lib/auction-server';
import { getActiveSeason } from '@/lib/season-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const schema = z.object({
  source_season_id: z.string().uuid(),
  import_type: z.enum(['teams', 'captains', 'players', 'all']),
  ids: z.array(z.string().uuid()).optional().default([]),
});

function stripSystemFields(row: Record<string, unknown>) {
  const copy = { ...row };

  delete copy.id;
  delete copy.created_at;
  delete copy.updated_at;

  return copy;
}

function bySelected<T extends { id?: string }>(rows: T[], ids: string[]) {
  return ids.length ? rows.filter((row) => row.id && ids.includes(row.id)) : rows;
}

function approvedOnly<T extends { approval_status?: string | null }>(rows: T[]) {
  return rows.filter((row) => row.approval_status === 'Approved');
}

async function insertIfMissing(
  supabase: NonNullable<ReturnType<typeof requireAdminRequest>['supabase']>,
  table: 'teams' | 'captains' | 'players',
  rows: Record<string, unknown>[],
  activeSeasonId: string,
) {
  const inserted: unknown[] = [];

  for (const row of rows) {
    const clean = stripSystemFields(row);
    const nameField = table === 'teams' ? 'team_name' : table === 'captains' ? 'captain_name' : 'name';
    const name = String(clean[nameField] || '').trim();

    if (!name) continue;

    const { data: existing } = await supabase
      .from(table)
      .select('id')
      .eq('season_id', activeSeasonId)
      .eq(nameField, name)
      .limit(1);

    if (existing?.length) continue;

    if (table === 'players') {
      clean.status = 'Available';
      clean.auction_status = 'PENDING';
      clean.approval_status = 'Approved';
      clean.current_bid = Number(clean.base_price || 0);
      clean.sold_to_team = null;
      clean.sold_to_team_id = null;
      clean.sold_to_captain_id = null;
      clean.sold_price = null;
      clean.assigned_by_admin = false;
    }

    clean.season_id = activeSeasonId;

    const { data, error } = await supabase.from(table).insert(clean).select('*').single();

    if (!error && data) inserted.push(data);
  }

  return inserted;
}

export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);

  if (response || !supabase) return response;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid import request.' }, { status: 400 });
  }

  const activeSeason = await getActiveSeason(supabase);

  if (!activeSeason) {
    return NextResponse.json({ error: 'Start a new season before importing.' }, { status: 400 });
  }

  if (activeSeason.id === parsed.data.source_season_id) {
    return NextResponse.json({ error: 'Choose an old season, not the current season.' }, { status: 400 });
  }

  const { import_type, source_season_id, ids } = parsed.data;
  const output: Record<string, unknown[]> = { teams: [], captains: [], players: [] };

  if (import_type === 'captains' || import_type === 'all') {
    const { data } = await supabase.from('captains').select('*').eq('season_id', source_season_id);
    output.captains = await insertIfMissing(supabase, 'captains', bySelected(data || [], ids), activeSeason.id);
  }

  if (import_type === 'teams' || import_type === 'all') {
    const { data } = await supabase.from('teams').select('*').eq('season_id', source_season_id);
    output.teams = await insertIfMissing(supabase, 'teams', bySelected(data || [], ids), activeSeason.id);
  }

  if (import_type === 'players' || import_type === 'all') {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('season_id', source_season_id)
      .eq('approval_status', 'Approved');

    const approvedRows = approvedOnly(data || []);
    output.players = await insertIfMissing(supabase, 'players', bySelected(approvedRows, ids), activeSeason.id);
  }

  return NextResponse.json({ ok: true, imported: output });
}
