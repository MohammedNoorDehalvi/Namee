import { NextResponse } from 'next/server';

import { getActiveSeason } from '@/lib/season-server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import type { Captain, Player, Team } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

type PublicTeam = Team & {
  players: Player[];
  captain_photo_url?: string | null;
};

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const season = await getActiveSeason(supabase);

    if (!season) {
      return NextResponse.json({ season: null, teams: [] }, { headers: NO_STORE_HEADERS });
    }

    const [{ data: teamData, error: teamError }, { data: captainData }, { data: playerData }] = await Promise.all([
      supabase.from('teams').select('*').eq('season_id', season.id).order('team_name', { ascending: true }),
      supabase
        .from('captains')
        .select('id,season_id,captain_name,team_name,team_id,photo_url,budget,remaining_budget,created_at')
        .eq('season_id', season.id),
      supabase.from('players').select('*').eq('season_id', season.id),
    ]);

    if (teamError) {
      return NextResponse.json({ error: teamError.message, season, teams: [] }, { status: 500, headers: NO_STORE_HEADERS });
    }

    const captains = (captainData || []) as Captain[];
    const players = (playerData || []) as Player[];

    const teams: PublicTeam[] = ((teamData || []) as Team[]).map((team) => {
      const captain =
        captains.find((item) => item.id === team.captain_id) ||
        captains.find((item) => item.team_id === team.id) ||
        captains.find((item) => item.team_name === team.team_name);

      const soldPlayers = players.filter(
        (player) =>
          player.status === 'Sold' &&
          (player.sold_to_team_id === team.id ||
            player.sold_to_team === team.team_name ||
            player.sold_to_captain_id === team.captain_id),
      );

      return {
        ...team,
        captain_name: team.captain_name || captain?.captain_name || 'Captain',
        captain_photo_url: captain?.photo_url || team.captain_photo_url || null,
        players: soldPlayers,
      };
    });

    return NextResponse.json({ season, teams }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load teams.', season: null, teams: [] },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
