"use client";

import { useEffect, useMemo, useRef, useState } from 'react';

import type { AuctionEvent, Player, Team } from '@/lib/types';

export type SaleCelebration = {
  id: string;
  playerName: string;
  teamName: string;
  teamLogo?: string | null;
};

type Options = {
  events: AuctionEvent[];
  players: Player[];
  teams: Team[];
  loading: boolean;
  fallbackTeam?: Team | null;
};

function resolveTeam(
  event: AuctionEvent,
  players: Player[],
  teams: Team[],
  fallbackTeam: Team | null,
) {
  const player = players.find((item) => item.id === event.player_id) || null;

  return (
    teams.find((team) => team.id === event.team_id) ||
    teams.find((team) => team.team_name === player?.sold_to_team) ||
    teams.find((team) => team.team_name === fallbackTeam?.team_name) ||
    fallbackTeam ||
    null
  );
}

function resolvePlayerName(event: AuctionEvent, players: Player[]) {
  return players.find((item) => item.id === event.player_id)?.name || event.message.split(' sold to ')[0]?.trim() || 'Player';
}

export function usePlayerSoldCelebration({ events, players, teams, loading, fallbackTeam = null }: Options) {
  const [celebration, setCelebration] = useState<SaleCelebration | null>(null);
  const [queue, setQueue] = useState<SaleCelebration[]>([]);
  const seenSoldEventIdsRef = useRef<Set<string>>(new Set());
  const hasPrimedSnapshotRef = useRef(false);

  const soldEvents = useMemo(
    () =>
      [...events]
        .filter((event) => event.event_type === 'SOLD')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [events],
  );

  useEffect(() => {
    if (loading) return;

    const currentSoldEventIds = new Set(soldEvents.map((event) => event.id));

    if (!hasPrimedSnapshotRef.current) {
      seenSoldEventIdsRef.current = currentSoldEventIds;
      hasPrimedSnapshotRef.current = true;
      return;
    }

    const seenSoldEventIds = seenSoldEventIdsRef.current;
    const newlySoldEvents = soldEvents.filter((event) => !seenSoldEventIds.has(event.id));

    seenSoldEventIdsRef.current = currentSoldEventIds;

    if (newlySoldEvents.length === 0) return;

    const queuedCelebrations = newlySoldEvents.map<SaleCelebration>((event) => {
      const player = players.find((item) => item.id === event.player_id) || null;
      const team = resolveTeam(event, players, teams, fallbackTeam);

      return {
        id: event.id,
        playerName: resolvePlayerName(event, players),
        teamName: team?.team_name || player?.sold_to_team || 'Team',
        teamLogo: team?.logo_url || null,
      };
    });

    setQueue((previous) => [...previous, ...queuedCelebrations]);
  }, [fallbackTeam, loading, players, soldEvents, teams]);

  useEffect(() => {
    if (celebration || queue.length === 0) return;

    const [nextCelebration, ...remaining] = queue;
    setCelebration(nextCelebration);
    setQueue(remaining);

    const timeoutId = window.setTimeout(() => setCelebration(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [celebration, queue]);

  return { celebration };
}
