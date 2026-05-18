"use client";

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Player, PlayerRole } from '@/lib/types';

export function useApprovedPlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<PlayerRole | 'All'>('All');

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('players').select('*').eq('approval_status', 'Approved').order('created_at', { ascending: false });
    setPlayers((data || []) as Player[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase.channel('apl-approved-players').on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => load()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredPlayers = useMemo(() => players.filter((player) => {
    const searchMatch = player.name.toLowerCase().includes(search.toLowerCase());
    const roleMatch = role === 'All' || player.role === role;
    return searchMatch && roleMatch;
  }), [players, search, role]);

  return { players, filteredPlayers, loading, search, setSearch, role, setRole, refresh: load };
}
