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
