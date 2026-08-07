import type { SupabaseClient } from '@supabase/supabase-js';
import type { Season } from '@/lib/types';

export async function getActiveSeason(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as Season | null;
}

export async function requireActiveSeason(supabase: SupabaseClient) {
  const season = await getActiveSeason(supabase);
  if (!season) throw new Error('No current season going.');
  return season;
}

export function seasonName(seasonNumber: number) {
  return `APL ${seasonNumber}`;
}

export function isBidLockStale(lockStartedAt?: string | null) {
  if (!lockStartedAt) return true;
  return Date.now() - new Date(lockStartedAt).getTime() > 12_000;
}

export async function releaseBidLock(supabase: SupabaseClient) {
  await supabase
    .from('auction')
    .update({
      bid_processing: false,
      bid_lock_started_at: null,
      bid_lock_player_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);
}

/**
 * Freeze auction outcomes for a season so later resets / new seasons
 * never rewrite Sold / Unsold rows for this archive.
 *
 * - Re-stamps season_id on sold rows for this season's team ids
 * - Clears only CURRENT → PENDING for this season (never SOLD/UNSOLD)
 */
export async function freezeSeasonAuctionResults(supabase: SupabaseClient, seasonId: string) {
  const now = new Date().toISOString();

  // Only the lot that was mid-auction for THIS season returns to pool shape if still CURRENT
  await supabase
    .from('players')
    .update({ auction_status: 'PENDING', updated_at: now })
    .eq('season_id', seasonId)
    .eq('auction_status', 'CURRENT');

  // Load this season's team ids
  const { data: teams } = await supabase.from('teams').select('id').eq('season_id', seasonId);
  const teamIds = (teams || []).map((t) => t.id).filter(Boolean) as string[];

  // Ensure every sold player linked to this season's teams keeps Sold + season_id
  if (teamIds.length > 0) {
    await supabase
      .from('players')
      .update({
        status: 'Sold',
        auction_status: 'SOLD',
        season_id: seasonId,
        updated_at: now,
      })
      .in('sold_to_team_id', teamIds)
      .or('auction_status.eq.SOLD,status.eq.Sold');
  }

  // Sold already tagged with this season_id stay Sold (re-assert)
  await supabase
    .from('players')
    .update({
      status: 'Sold',
      auction_status: 'SOLD',
      season_id: seasonId,
      updated_at: now,
    })
    .eq('season_id', seasonId)
    .or('auction_status.eq.SOLD,status.eq.Sold');

  // Unsold for this season stay Unsold
  await supabase
    .from('players')
    .update({
      status: 'Unsold',
      auction_status: 'UNSOLD',
      season_id: seasonId,
      updated_at: now,
    })
    .eq('season_id', seasonId)
    .or('auction_status.eq.UNSOLD,status.eq.Unsold');
}

/**
 * Guard: never mutate players that belong to an ended / non-active season.
 */
export async function assertPlayerSeasonMutable(supabase: SupabaseClient, playerSeasonId?: string | null) {
  if (!playerSeasonId) return; // allow legacy null only for active ops that set season on write
  const active = await getActiveSeason(supabase);
  if (!active) throw new Error('No active season. Cannot change player auction state.');
  if (playerSeasonId !== active.id) {
    throw new Error('This player belongs to an older season and is read-only.');
  }
}
