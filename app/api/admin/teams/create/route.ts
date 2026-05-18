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

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function cleanNumber(value: unknown, fallback: number) {
  if (value === undefined || value === null || value === '') return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return Number.NaN;
  return Math.round(number);
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

  const [{ data: sameTeam }, { data: sameCaptain }] = await Promise.all([
    supabase.from('teams').select('id').ilike('team_name', teamName).maybeSingle(),
    supabase.from('captains').select('id').ilike('captain_name', captainName).maybeSingle(),
  ]);

  if (sameTeam) return jsonError('A team with this name already exists.');
  if (sameCaptain) return jsonError('A captain with this name already exists.');

  const passwordHash = await bcrypt.hash(password, 12);

  const { data: captain, error: captainError } = await supabase
    .from('captains')
    .insert({
      captain_name: captainName,
      team_name: teamName,
      password_hash: passwordHash,
      budget,
      remaining_budget: budget,
    })
    .select('id,captain_name,team_name,budget,remaining_budget,created_at')
    .single();

  if (captainError || !captain) {
    return jsonError(captainError?.message || 'Could not create captain.', 500);
  }

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      team_name: teamName,
      captain_id: captain.id,
      captain_name: captainName,
      budget,
      remaining_budget: budget,
      max_players: maxPlayers,
    })
    .select('*')
    .single();

  if (teamError || !team) {
    await supabase.from('captains').delete().eq('id', captain.id);
    return jsonError(teamError?.message || 'Could not create team.', 500);
  }

  const { error: linkError } = await supabase
    .from('captains')
    .update({ team_id: team.id, budget, remaining_budget: budget })
    .eq('id', captain.id);

  if (linkError) {
    await supabase.from('teams').delete().eq('id', team.id);
    await supabase.from('captains').delete().eq('id', captain.id);
    return jsonError(linkError.message, 500);
  }

  await createAuctionEvent(supabase, {
    event_type: 'STATUS',
    message: `Admin added ${teamName} with captain ${captainName}.`,
    team_id: team.id,
    captain_id: captain.id,
    metadata: { budget, max_players: maxPlayers },
  });

  return NextResponse.json({
    ok: true,
    team,
    captain: { ...captain, team_id: team.id },
  });
}
