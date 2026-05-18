import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAuctionEvent, jsonError, requireAdminRequest } from '@/lib/auction-server';

export const runtime = 'nodejs';

type CreateTeamCaptainBody = {
  team_name?: string;
  captain_name?: string;
  password?: string;
  budget?: number | string;
  max_players?: number | string;
};

type TeamRow = {
  id: string;
  team_name: string | null;
  captain_id?: string | null;
  captain_name?: string | null;
  budget?: number | null;
  remaining_budget?: number | null;
  max_players?: number | null;
};

type CaptainRow = {
  id: string;
  captain_name: string | null;
  team_name: string | null;
  team_id?: string | null;
  budget?: number | null;
  remaining_budget?: number | null;
};

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function cleanNumber(value: unknown, fallback: number) {
  if (value === undefined || value === null || value === '') return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return Number.NaN;
  return Math.round(number);
}

function key(value: unknown) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function isDuplicateError(error: unknown) {
  const maybe = error as { code?: string; message?: string } | null;
  return maybe?.code === '23505' || String(maybe?.message || '').toLowerCase().includes('duplicate key');
}

async function readTeams(supabase: ReturnType<typeof requireAdminRequest>['supabase']) {
  if (!supabase) return [] as TeamRow[];
  const { data, error } = await supabase
    .from('teams')
    .select('id,team_name,captain_id,captain_name,budget,remaining_budget,max_players');

  if (error) throw new Error(error.message);
  return (data || []) as TeamRow[];
}

async function readCaptains(supabase: ReturnType<typeof requireAdminRequest>['supabase']) {
  if (!supabase) return [] as CaptainRow[];
  const { data, error } = await supabase
    .from('captains')
    .select('id,captain_name,team_name,team_id,budget,remaining_budget');

  if (error) throw new Error(error.message);
  return (data || []) as CaptainRow[];
}

export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);
  if (response || !supabase) return response;

  const body = (await request.json().catch(() => ({}))) as CreateTeamCaptainBody;
  const teamName = cleanText(body.team_name);
  const captainName = cleanText(body.captain_name);
  const password = typeof body.password === 'string' ? body.password.trim() : '';
  const budget = cleanNumber(body.budget, 50000);
  const maxPlayers = cleanNumber(body.max_players, 4);

  if (teamName.length < 2) return jsonError('Team name must be at least 2 characters.');
  if (captainName.length < 2) return jsonError('Captain name must be at least 2 characters.');
  if (password.length < 4) return jsonError('Captain password must be at least 4 characters.');
  if (!Number.isFinite(budget) || budget <= 0) return jsonError('Budget must be a positive number.');
  if (!Number.isFinite(maxPlayers) || maxPlayers < 1 || maxPlayers > 20) {
    return jsonError('Max players must be between 1 and 20.');
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const [teams, captains] = await Promise.all([readTeams(supabase), readCaptains(supabase)]);

    const existingTeam = teams.find((team) => key(team.team_name) === key(teamName)) || null;
    const captainByName = captains.find((captain) => key(captain.captain_name) === key(captainName)) || null;
    const captainByTeam = captains.find((captain) => key(captain.team_name) === key(teamName)) || null;

    if (captainByName && captainByTeam && captainByName.id !== captainByTeam.id) {
      return jsonError(
        `Cannot save because ${captainName} and ${teamName} are already connected to different captain records. Delete one old test record or use a new name.`,
        409,
      );
    }

    if (captainByName && captainByName.team_name && key(captainByName.team_name) !== key(teamName)) {
      return jsonError(`Captain ${captainName} already belongs to team ${captainByName.team_name}.`, 409);
    }

    const existingCaptain = captainByName || captainByTeam || null;

    let captain: CaptainRow | null = null;
    const captainPayload = {
      captain_name: captainName,
      team_name: teamName,
      password_hash: passwordHash,
      budget,
      remaining_budget: budget,
    };

    if (existingCaptain?.id) {
      const { data, error } = await supabase
        .from('captains')
        .update(captainPayload)
        .eq('id', existingCaptain.id)
        .select('id,captain_name,team_name,team_id,budget,remaining_budget')
        .single();

      if (error) return jsonError(error.message, 500);
      captain = data as CaptainRow;
    } else {
      const { data, error } = await supabase
        .from('captains')
        .insert(captainPayload)
        .select('id,captain_name,team_name,team_id,budget,remaining_budget')
        .single();

      if (error) {
        if (!isDuplicateError(error)) return jsonError(error.message, 500);

        const freshCaptains = await readCaptains(supabase);
        const duplicateCaptain =
          freshCaptains.find((item) => key(item.captain_name) === key(captainName)) ||
          freshCaptains.find((item) => key(item.team_name) === key(teamName));

        if (!duplicateCaptain) return jsonError('Captain already exists. Refresh and try again.', 409);

        const retry = await supabase
          .from('captains')
          .update(captainPayload)
          .eq('id', duplicateCaptain.id)
          .select('id,captain_name,team_name,team_id,budget,remaining_budget')
          .single();

        if (retry.error) return jsonError(retry.error.message, 500);
        captain = retry.data as CaptainRow;
      } else {
        captain = data as CaptainRow;
      }
    }

    if (!captain?.id) return jsonError('Could not save captain.', 500);

    let team: TeamRow | null = null;
    const teamPayload = {
      team_name: teamName,
      captain_id: captain.id,
      captain_name: captainName,
      budget,
      remaining_budget: budget,
      max_players: maxPlayers,
    };

    if (existingTeam?.id) {
      const { data, error } = await supabase
        .from('teams')
        .update(teamPayload)
        .eq('id', existingTeam.id)
        .select('id,team_name,captain_id,captain_name,budget,remaining_budget,max_players')
        .single();

      if (error) return jsonError(error.message, 500);
      team = data as TeamRow;
    } else {
      const { data, error } = await supabase
        .from('teams')
        .insert(teamPayload)
        .select('id,team_name,captain_id,captain_name,budget,remaining_budget,max_players')
        .single();

      if (error) {
        if (!isDuplicateError(error)) return jsonError(error.message, 500);

        const freshTeams = await readTeams(supabase);
        const duplicateTeam = freshTeams.find((item) => key(item.team_name) === key(teamName));
        if (!duplicateTeam) return jsonError('Team already exists. Refresh and try again.', 409);

        const retry = await supabase
          .from('teams')
          .update(teamPayload)
          .eq('id', duplicateTeam.id)
          .select('id,team_name,captain_id,captain_name,budget,remaining_budget,max_players')
          .single();

        if (retry.error) return jsonError(retry.error.message, 500);
        team = retry.data as TeamRow;
      } else {
        team = data as TeamRow;
      }
    }

    if (!team?.id) return jsonError('Could not save team.', 500);

    const { data: linkedCaptain, error: linkError } = await supabase
      .from('captains')
      .update({ team_id: team.id, team_name: teamName, budget, remaining_budget: budget })
      .eq('id', captain.id)
      .select('id,captain_name,team_name,team_id,budget,remaining_budget')
      .single();

    if (linkError) return jsonError(linkError.message, 500);

    try {
      await createAuctionEvent(supabase, {
        event_type: existingTeam ? 'STATUS' : 'TEAM_CREATED',
        message: existingTeam
          ? `Admin updated ${teamName} with captain ${captainName}.`
          : `Admin added ${teamName} with captain ${captainName}.`,
        team_id: team.id,
        captain_id: captain.id,
        metadata: { budget, max_players: maxPlayers },
      });
    } catch {
      // Saving team/captain should not fail just because event table is missing.
    }

    return NextResponse.json({
      ok: true,
      message: existingTeam ? 'Team existed, so details were updated.' : 'Team and captain saved.',
      team,
      captain: linkedCaptain,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Could not save team and captain.', 500);
  }
}
