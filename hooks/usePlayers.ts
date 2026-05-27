'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Player, PlayerRole, Season } from '@/lib/types';

async function getActiveSeason() {
  const { data } = await supabase
    .from('seasons')
    .select('*')
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as Season | null;
}

export function useApprovedPlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<PlayerRole | 'All'>('All');

  async function load() {
    setLoading(true);

    const season = await getActiveSeason();

    if (!season) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('season_id', season.id)
      .eq('approval_status', 'Approved')
      .order('created_at', { ascending: false });

    setPlayers((data || []) as Player[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();

    const channel = supabase
      .channel('apl-approved-players-season')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seasons' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => void load())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const filteredPlayers = useMemo(
    () =>
      players.filter((player) => {
        const searchMatch = player.name.toLowerCase().includes(search.toLowerCase());
        const roleMatch = role === 'All' || player.role === role;

        return searchMatch && roleMatch;
      }),
    [players, search, role],
  );

  return { players, filteredPlayers, loading, search, setSearch, role, setRole, refresh: load };
}
