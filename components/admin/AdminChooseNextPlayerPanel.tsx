'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCw, Search, UserCheck } from 'lucide-react';

import { readSession } from '@/hooks/useSession';
import type { Auction, Player } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import { toast } from '@/components/ui/AppToaster';

type AdminOverviewLite = {
  players: Player[];
  auction: Auction | null;
};

function isChooseableAuctionPlayer(player: Player) {
  return (
    player.approval_status === 'Approved' &&
    player.status === 'Available' &&
    player.auction_status !== 'SOLD' &&
    player.auction_status !== 'UNSOLD'
  );
}

export function AdminChooseNextPlayerPanel() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function api<T>(path: string, options: RequestInit = {}) {
    const session = readSession();

    const res = await fetch(path, {
      ...options,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.token || ''}`,
        ...(options.headers || {}),
      },
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error((json as { error?: string }).error || 'Request failed');
    }

    return json as T;
  }

  async function load(silent = false) {
    if (!silent) setLoading(true);

    try {
      const json = await api<AdminOverviewLite>(`/api/admin/overview?t=${Date.now()}`);
      const nextPlayers = json.players || [];

      setPlayers(nextPlayers);
      setAuction(json.auction || null);

      setSelectedPlayerId((old) => {
        if (old && nextPlayers.some((player) => player.id === old && isChooseableAuctionPlayer(player))) {
          return old;
        }

        return nextPlayers.find(isChooseableAuctionPlayer)?.id || '';
      });
    } catch (error) {
      if (!silent) {
        toast(error instanceof Error ? error.message : 'Could not load approved players.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void load();

    const intervalId = window.setInterval(() => void load(true), 1200);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentPlayer = useMemo(
    () => players.find((player) => player.id === auction?.current_player_id) || null,
    [auction?.current_player_id, players],
  );

  const approvedAvailablePlayers = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();

    return players
      .filter(isChooseableAuctionPlayer)
      .filter((player) => !currentPlayer || player.id !== currentPlayer.id)
      .filter((player) => {
        if (!lowerSearch) return true;

        return (
          player.name.toLowerCase().includes(lowerSearch) ||
          player.role.toLowerCase().includes(lowerSearch) ||
          String(player.base_price || '').includes(lowerSearch)
        );
      });
  }, [currentPlayer, players, search]);

  async function choosePlayer() {
    if (!selectedPlayerId) {
      toast('Choose an approved player first.');
      return;
    }

    if (currentPlayer) {
      toast('Complete the current player first, then choose next player.');
      return;
    }

    const player = players.find((item) => item.id === selectedPlayerId);
    const ok = confirm(`Set ${player?.name || 'this player'} as the next auction player?`);

    if (!ok) return;

    setBusy(true);

    try {
      await api('/api/admin/auction/select-player', {
        method: 'POST',
        body: JSON.stringify({ player_id: selectedPlayerId }),
      });

      toast('Next player selected by admin.');
      await load(true);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not select next player.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur md:p-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-green-300/20 bg-green-300/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-green-300">
            <UserCheck size={15} /> Choose Next Player
          </p>

          <h2 className="mt-3 text-3xl font-black text-white">Admin Selected Next Player</h2>

          <p className="mt-2 max-w-2xl text-white/55">
            Use this instead of random when you want to choose the exact next approved player for auction.
          </p>
        </div>

        <button type="button" onClick={() => void load()} disabled={loading || busy} className="btn-ghost disabled:opacity-45">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {currentPlayer ? (
        <div className="mt-5 rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-4">
          <p className="font-black text-yellow-200">Current player is still active</p>
          <p className="mt-1 text-sm text-white/60">
            Complete <span className="font-bold text-white">{currentPlayer.name}</span> as Sold or Unsold before selecting the next player.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search approved players..."
              className="input pl-11"
            />
          </div>

          <select
            value={selectedPlayerId}
            onChange={(event) => setSelectedPlayerId(event.target.value)}
            className="input"
          >
            <option value="">Choose approved player</option>
            {approvedAvailablePlayers.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name} • {player.role} • Base {formatMoney(player.base_price)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void choosePlayer()}
            disabled={busy || !selectedPlayerId}
            className="btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-45"
          >
            <CheckCircle2 size={16} /> Set Next Player
          </button>
        </div>
      )}

      <div className="mt-5 rounded-3xl border border-white/10 bg-black/15 p-4">
        {approvedAvailablePlayers.length === 0 ? (
          <p className="text-sm text-white/50">No approved available players found.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {approvedAvailablePlayers.slice(0, 12).map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => setSelectedPlayerId(player.id)}
                className={`rounded-2xl border p-3 text-left transition ${
                  selectedPlayerId === player.id
                    ? 'border-green-300/50 bg-green-300/10'
                    : 'border-white/10 bg-white/[0.04] hover:border-apl-gold/50'
                }`}
              >
                <p className="font-black text-white">{player.name}</p>
                <p className="mt-1 text-xs text-white/50">
                  {player.role} • Base {formatMoney(player.base_price)} • {player.batting_style}/{player.bowling_style}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
