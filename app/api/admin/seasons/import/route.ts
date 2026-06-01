import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdminRequest } from '@/lib/auction-server';
import { getActiveSeason } from '@/lib/season-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type AnyRow = Record<string, any>;

const schema = z.object({
  source_season_id: z.string().uuid(),
  import_type: z.enum(['teams', 'captains', 'players', 'all']),
  ids: z.array(z.string().uuid()).optional().default([]),
});

function cleanText(value: unknown) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function stripSystemFields(row: AnyRow) {
  const copy: AnyRow = { ...row };

  delete copy.id;
  delete copy.created_at;
  delete copy.updated_at;

  return copy;
}

function selectRows<T extends { id?: string }>(rows: T[], ids: string[]) {
  return ids.length ? rows.filter((row) => row.id && ids.includes(row.id)) : rows;
}

async function findExistingCaptain(supabase: any, seasonId: string, captainName: string, teamName: string) {
  const { data: byCaptain } = await supabase
    .from('captains')
    .select('*')
    .eq('season_id', seasonId)
    .ilike('captain_name', captainName)
    .limit(1);

  if (byCaptain?.[0]) return byCaptain[0];

  const { data: byTeam } = await supabase
    .from('captains')
    .select('*')
    .eq('season_id', seasonId)
    .ilike('team_name', teamName)
    .limit(1);

  return byTeam?.[0] || null;
}

async function findExistingTeam(supabase: any, seasonId: string, teamName: string) {
  const { data } = await supabase
    .from('teams')
    .select('*')
    .eq('season_id', seasonId)
    .ilike('team_name', teamName)
    .limit(1);

  return data?.[0] || null;
}

async function findExistingPlayer(supabase: any, seasonId: string, playerName: string) {
  const { data } = await supabase
    .from('players')
    .select('*')
    .eq('season_id', seasonId)
    .ilike('name', playerName)
    .limit(1);

  return data?.[0] || null;
}

async function saveCaptainCopy(supabase: any, oldCaptain: AnyRow, activeSeasonId: string) {
  const captainName = cleanText(oldCaptain.captain_name);
  const teamName = cleanText(oldCaptain.team_name);

  if (!captainName || !teamName) return null;

  const existing = await findExistingCaptain(supabase, activeSeasonId, captainName, teamName);

  const payload: AnyRow = {
    ...stripSystemFields(oldCaptain),
    captain_name: captainName,
    team_name: teamName,
    team_id: null,
    season_id: activeSeasonId,
  };

  if (!payload.budget) payload.budget = 50000;
  if (!payload.remaining_budget) payload.remaining_budget = payload.budget;

  if (!payload.password_hash) {
    // Fallback only for broken old rows. Admin can reset password later from Add Team + Captain form.
    payload.password_hash = '$2a$12$KIXr19AlfWHFjzPbqmV.Seh2oqhrZotvEjfYDQyEWW4m9m7BHTD8K';
  }

  if (existing?.id) {
    const { data, error } = await supabase.from('captains').update(payload).eq('id', existing.id).select('*').single();

    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabase.from('captains').insert(payload).select('*').single();

  if (error) {
    throw new Error(
      `${error.message}. If this says duplicate key, run supabase/season_import_current_data_fix.sql again. If it says ON CONFLICT, redeploy this new route.`,
    );
  }

  return data;
}

async function saveTeamCopy(supabase: any, oldTeam: AnyRow, copiedCaptain: AnyRow | null, activeSeasonId: string) {
  const teamName = cleanText(oldTeam.team_name);

  if (!teamName) return null;

  const existing = await findExistingTeam(supabase, activeSeasonId, teamName);

  const payload: AnyRow = {
    ...stripSystemFields(oldTeam),
    team_name: teamName,
    captain_id: copiedCaptain?.id || null,
    captain_name: copiedCaptain?.captain_name || oldTeam.captain_name || null,
    season_id: activeSeasonId,
  };

  if (!payload.budget) payload.budget = 50000;
  if (!payload.remaining_budget) payload.remaining_budget = payload.budget;
  if (!payload.max_players) payload.max_players = 4;

  if (existing?.id) {
    const { data, error } = await supabase.from('teams').update(payload).eq('id', existing.id).select('*').single();

    if (error) throw new Error(error.message);

    if (data?.id && copiedCaptain?.id) {
      await supabase
        .from('captains')
        .update({ team_id: data.id, team_name: data.team_name, season_id: activeSeasonId })
        .eq('id', copiedCaptain.id);
    }

    return data;
  }

  const { data, error } = await supabase.from('teams').insert(payload).select('*').single();

  if (error) {
    throw new Error(
      `${error.message}. If this says duplicate key, run supabase/season_import_current_data_fix.sql again. If it says ON CONFLICT, redeploy this new route.`,
    );
  }

  if (data?.id && copiedCaptain?.id) {
    await supabase
      .from('captains')
      .update({ team_id: data.id, team_name: data.team_name, season_id: activeSeasonId })
      .eq('id', copiedCaptain.id);
  }

  return data;
}

function findCaptainForTeam(oldTeam: AnyRow, oldCaptains: AnyRow[]) {
  return (
    oldCaptains.find((captain) => captain.id && captain.id === oldTeam.captain_id) ||
    oldCaptains.find((captain) => cleanText(captain.team_name).toLowerCase() === cleanText(oldTeam.team_name).toLowerCase()) ||
    oldCaptains.find((captain) => cleanText(captain.captain_name).toLowerCase() === cleanText(oldTeam.captain_name).toLowerCase()) ||
    null
  );
}

function findTeamForCaptain(oldCaptain: AnyRow, oldTeams: AnyRow[]) {
  return (
    oldTeams.find((team) => team.id && oldCaptain.team_id && team.id === oldCaptain.team_id) ||
    oldTeams.find((team) => cleanText(team.team_name).toLowerCase() === cleanText(oldCaptain.team_name).toLowerCase()) ||
    oldTeams.find((team) => cleanText(team.captain_name).toLowerCase() === cleanText(oldCaptain.captain_name).toLowerCase()) ||
    null
  );
}

async function copyTeamWithCaptain(
  supabase: any,
  oldTeam: AnyRow,
  oldCaptains: AnyRow[],
  activeSeasonId: string,
  output: Record<string, unknown[]>,
) {
  const oldCaptain = findCaptainForTeam(oldTeam, oldCaptains);
  const copiedCaptain = oldCaptain ? await saveCaptainCopy(supabase, oldCaptain, activeSeasonId) : null;
  const copiedTeam = await saveTeamCopy(supabase, oldTeam, copiedCaptain, activeSeasonId);

  if (copiedCaptain && !output.captains.some((item: any) => item.id === copiedCaptain.id)) {
    output.captains.push(copiedCaptain);
  }

  if (copiedTeam && !output.teams.some((item: any) => item.id === copiedTeam.id)) {
    output.teams.push(copiedTeam);
  }
}

async function copyCaptainWithTeam(
  supabase: any,
  oldCaptain: AnyRow,
  oldTeams: AnyRow[],
  activeSeasonId: string,
  output: Record<string, unknown[]>,
) {
  const copiedCaptain = await saveCaptainCopy(supabase, oldCaptain, activeSeasonId);
  const oldTeam = findTeamForCaptain(oldCaptain, oldTeams);

  if (copiedCaptain && !output.captains.some((item: any) => item.id === copiedCaptain.id)) {
    output.captains.push(copiedCaptain);
  }

  if (oldTeam) {
    const copiedTeam = await saveTeamCopy(supabase, oldTeam, copiedCaptain, activeSeasonId);

    if (copiedTeam && !output.teams.some((item: any) => item.id === copiedTeam.id)) {
      output.teams.push(copiedTeam);
    }
  }
}

async function copyApprovedPlayers(supabase: any, oldPlayers: AnyRow[], selectedIds: string[], activeSeasonId: string) {
  const rows = selectRows(
    oldPlayers.filter((player) => player.approval_status === 'Approved'),
    selectedIds,
  );

  const inserted: unknown[] = [];

  for (const row of rows) {
    const playerName = cleanText(row.name);

    if (!playerName) continue;

    const existing = await findExistingPlayer(supabase, activeSeasonId, playerName);

    if (existing?.id) continue;

    const payload: AnyRow = {
      ...stripSystemFields(row),
      name: playerName,
      season_id: activeSeasonId,
      approval_status: 'Approved',
      status: 'Available',
      auction_status: 'PENDING',
      current_bid: Number(row.base_price || 0),
      sold_to_team: null,
      sold_to_team_id: null,
      sold_to_captain_id: null,
      sold_price: null,
      assigned_by_admin: false,
    };

    const { data, error } = await supabase.from('players').insert(payload).select('*').single();

    if (error) throw new Error(error.message);
    if (data) inserted.push(data);
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

  const { source_season_id, import_type, ids } = parsed.data;

  const [{ data: oldTeams }, { data: oldCaptains }, { data: oldPlayers }] = await Promise.all([
    supabase.from('teams').select('*').eq('season_id', source_season_id),
    supabase.from('captains').select('*').eq('season_id', source_season_id),
    supabase.from('players').select('*').eq('season_id', source_season_id).eq('approval_status', 'Approved'),
  ]);

  const output: Record<string, unknown[]> = { teams: [], captains: [], players: [] };

  try {
    if (import_type === 'teams') {
      const selectedTeams = selectRows(oldTeams || [], ids);

      for (const team of selectedTeams) {
        await copyTeamWithCaptain(supabase, team, oldCaptains || [], activeSeason.id, output);
      }
    }

    if (import_type === 'captains') {
      const selectedCaptains = selectRows(oldCaptains || [], ids);

      for (const captain of selectedCaptains) {
        await copyCaptainWithTeam(supabase, captain, oldTeams || [], activeSeason.id, output);
      }
    }

    if (import_type === 'players') {
      output.players = await copyApprovedPlayers(supabase, oldPlayers || [], ids, activeSeason.id);
    }

    if (import_type === 'all') {
      for (const team of oldTeams || []) {
        await copyTeamWithCaptain(supabase, team, oldCaptains || [], activeSeason.id, output);
      }

      for (const captain of oldCaptains || []) {
        const alreadyCopied = output.captains.some(
          (item: any) => cleanText(item.captain_name).toLowerCase() === cleanText(captain.captain_name).toLowerCase(),
        );

        if (!alreadyCopied) {
          await copyCaptainWithTeam(supabase, captain, oldTeams || [], activeSeason.id, output);
        }
      }

      output.players = await copyApprovedPlayers(supabase, oldPlayers || [], [], activeSeason.id);
    }

    return NextResponse.json({ ok: true, imported: output });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Import failed.',
      },
      { status: 500 },
    );
  }
}
