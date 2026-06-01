"use client";

import { useEffect, useMemo, useState } from 'react';
import type { Player, PlayerRole } from '@/lib/types';

export function useApprovedPlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<PlayerRole | 'All'>('All');

  async function load(silent = false) {
    if (!silent) setLoading(true);

    try {
      const res = await fetch(`/api/players?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      const json = await res.json().catch(() => ({ players: [] }));
      setPlayers((json.players || []) as Player[]);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void load();

    const intervalId = window.setInterval(() => void load(true), 2500);

    return () => window.clearInterval(intervalId);
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
