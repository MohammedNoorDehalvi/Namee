"use client";

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Gavel, Pause, Play, RefreshCw, RotateCcw, Shuffle, Trophy, UserPlus, Users, WalletCards, XCircle } from 'lucide-react';
import { readSession } from '@/hooks/useSession';
import { boughtPlayersForTeam, computeTeamSpent } from '@/lib/auction-utils';
import type { Auction, AuctionEvent, AuctionSummary, Bid, Captain, Player, Team } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import { toast } from '@/components/ui/AppToaster';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

type Overview = {
  players: Player[];
  teams: Team[];
  captains: Captain[];
  bids: Bid[];
  auction: Auction | null;
  events: AuctionEvent[];
  summary: AuctionSummary;
};

export function AdminPanel() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState({ player_id: '', team_id: '', price: '' });

  async function api(path: string, options: RequestInit = {}) {
    const session = readSession();
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.token || ''}`,
        ...(options.headers || {}),
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Request failed');
    return json;
  }

  async function load() {
    setLoading(true);
    try {
      const json = await api('/api/admin/overview');
      setData(json);
      if (!manual.player_id && json.players?.length) {
        const firstUnsold = json.players.find((player: Player) => player.auction_status === 'UNSOLD' || player.status === 'Unsold');
        if (firstUnsold) setManual((old) => ({ ...old, player_id: firstUnsold.id }));
      }
      if (!manual.team_id && json.teams?.length) setManual((old) => ({ ...old, team_id: json.teams[0].id }));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      toast(label);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  async function status(action: 'start' | 'pause' | 'resume' | 'end' | 'reset') {
    const confirmText: Record<typeof action, string> = {
      start: 'Start auction now?',
      pause: 'Pause auction?',
      resume: 'Resume auction?',
      end: 'End auction and show reports?',
      reset: 'Reset full auction? This clears bids and sold/unsold decisions.',
    };
    if (!confirm(confirmText[action])) return;
    await run(`Auction ${action} done`, () => api('/api/admin/auction/status', { method: 'POST', body: JSON.stringify({ action }) }).then(() => undefined));
  }

  async function selectPlayer(playerId: string) {
    await run('Player selected', () => api('/api/admin/auction/select-player', { method: 'POST', body: JSON.stringify({ player_id: playerId }) }).then(() => undefined));
  }

  async function sold() {
    if (!confirm('Confirm sold to current highest bidder?')) return;
    await run('Player sold', () => api('/api/admin/auction/sold', { method: 'POST' }).then(() => undefined));
  }

  async function unsold() {
    if (!confirm('Confirm mark current player as unsold?')) return;
    await run('Player marked unsold', () => api('/api/admin/auction/unsold', { method: 'POST' }).then(() => undefined));
  }

  async function nextRandom() {
    await run('Next random player selected', () => api('/api/admin/auction/next', { method: 'POST' }).then(() => undefined));
  }

  async function undo() {
    await run('Last admin decision undone', () => api('/api/admin/auction/undo', { method: 'POST' }).then(() => undefined));
  }

  async function manualAssign() {
    if (!manual.player_id || !manual.team_id) return toast('Choose player and team.');
    if (!confirm('Assign this player manually to team?')) return;
    await run('Player assigned manually', () => api('/api/admin/auction/manual-assign', {
      method: 'POST',
      body: JSON.stringify({ player_id: manual.player_id, team_id: manual.team_id, price: Number(manual.price || 0) }),
    }).then(() => undefined));
  }

  async function removePlayer(playerId: string) {
    if (!confirm('Remove this player from team and return points?')) return;
    await run('Player removed from team', () => api('/api/admin/auction/remove-player', { method: 'POST', body: JSON.stringify({ player_id: playerId }) }).then(() => undefined));
  }

  async function editPrice(player: Player) {
    const value = prompt('New sold price', String(player.sold_price || 0));
    if (value === null) return;
    await run('Sold price edited', () => api('/api/admin/auction/edit-price', { method: 'POST', body: JSON.stringify({ player_id: player.id, price: Number(value) }) }).then(() => undefined));
  }

  const currentPlayer = useMemo(() => data?.players.find((player) => player.id === data.auction?.current_player_id) || null, [data]);
  const approvedPending = data?.players.filter((player) => player.approval_status === 'Approved' && player.status === 'Available' && player.auction_status !== 'SOLD' && player.auction_status !== 'UNSOLD') || [];
  const unsoldPlayers = data?.players.filter((player) => player.auction_status === 'UNSOLD' || player.status === 'Unsold') || [];
  const soldPlayers = data?.players.filter((player) => player.auction_status === 'SOLD' || player.status === 'Sold') || [];
  const canStart = Boolean(data && data.teams.length >= 4 && data.captains.length >= 4 && approvedPending.length > 0);
  const soldDisabled = !currentPlayer || !data?.auction?.highest_bidder_id;
  const unsoldDisabled = !currentPlayer || Boolean(data?.auction?.highest_bidder_id);
  const showManualPicker = Boolean(data?.auction?.auction_status === 'LIVE' && !data.auction.manual_picker_hidden && !currentPlayer);

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  if (!data) return <EmptyState title="Admin data not available" description="Try refreshing the dashboard." />;

  return (
    <main className="min-h-screen bg-stadium px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="glass-card rounded-[2rem] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="badge inline-flex border-apl-gold/40 bg-apl-gold/10 text-apl-gold">Admin Control</p>
              <h1 className="mt-3 text-3xl font-black sm:text-5xl">APL Auction Command Center</h1>
              <p className="mt-2 text-sm text-white/60">Status: {data.auction?.auction_status || 'NOT_STARTED'} • Teams: {data.teams.length} • Captains: {data.captains.length}</p>
            </div>
            <button onClick={load} className="btn-ghost"><RefreshCw className="h-4 w-4" /> Refresh</button>
          </div>

          {!canStart && data.auction?.auction_status === 'NOT_STARTED' && (
            <div className="mt-5 flex gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>Need at least 4 teams and 4 captains before starting auction. Also approve players for auction.</p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button disabled={!canStart || busy || data.auction?.auction_status === 'LIVE'} onClick={() => void status('start')} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"><Play className="h-4 w-4" /> Start Auction</button>
            <button disabled={busy || data.auction?.auction_status !== 'LIVE'} onClick={() => void status('pause')} className="btn-ghost disabled:opacity-50"><Pause className="h-4 w-4" /> Pause</button>
            <button disabled={busy || data.auction?.auction_status !== 'PAUSED'} onClick={() => void status('resume')} className="btn-ghost disabled:opacity-50"><Play className="h-4 w-4" /> Resume</button>
            <button disabled={busy || data.auction?.auction_status === 'ENDED'} onClick={() => void status('end')} className="btn-ghost disabled:opacity-50"><Trophy className="h-4 w-4" /> End</button>
            <button disabled={busy} onClick={() => void status('reset')} className="btn-ghost disabled:opacity-50"><RotateCcw className="h-4 w-4" /> Reset</button>
            <button disabled={busy} onClick={() => void undo()} className="btn-ghost disabled:opacity-50">Undo Last Action</button>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[320px_1fr_360px]">
          {showManualPicker && (
            <aside className="glass-card max-h-[780px] overflow-y-auto rounded-[2rem] p-5">
              <h2 className="text-xl font-black">Select First Player</h2>
              <p className="mt-1 text-xs text-white/50">This sidebar hides after the first player is selected.</p>
              <div className="mt-4 space-y-3">
                {approvedPending.length === 0 && <EmptyState title="No approved players" description="Approve players first." />}
                {approvedPending.map((player) => (
                  <button key={player.id} onClick={() => void selectPlayer(player.id)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left hover:border-apl-gold/50">
                    <p className="font-black">{player.name}</p>
                    <p className="text-xs text-white/55">{player.role} • Base {formatMoney(player.base_price)}</p>
                  </button>
                ))}
              </div>
            </aside>
          )}

          <div className={showManualPicker ? 'space-y-5' : 'space-y-5 xl:col-span-2'}>
            <section className="glass-card rounded-[2rem] p-5">
              <h2 className="mb-4 text-xl font-black">Current Player Control</h2>
              {currentPlayer ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="badge inline-flex">{currentPlayer.auction_status}</p>
                  <h3 className="mt-3 text-3xl font-black">{currentPlayer.name}</h3>
                  <p className="mt-1 text-sm text-white/60">{currentPlayer.role} • {currentPlayer.batting_style} • {currentPlayer.bowling_style}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Current Bid" value={formatMoney(data.auction?.highest_bid || currentPlayer.current_bid)} />
                    <MiniStat label="Highest Bidder" value={data.auction?.highest_team_name || 'No bid'} />
                    <MiniStat label="Base" value={formatMoney(currentPlayer.base_price)} />
                  </div>
                </div>
              ) : <EmptyState title="No current player selected" description="Select first player or press next random." />}

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <button disabled={soldDisabled || busy} onClick={() => void sold()} className="btn-primary disabled:cursor-not-allowed disabled:grayscale disabled:opacity-45"><CheckCircle2 className="h-4 w-4" /> Sold to Current Bidder</button>
                <button disabled={unsoldDisabled || busy} onClick={() => void unsold()} className="btn-ghost disabled:cursor-not-allowed disabled:opacity-45"><XCircle className="h-4 w-4" /> Unsold</button>
                <button disabled={busy || data.auction?.auction_status !== 'LIVE'} onClick={() => void nextRandom()} className="btn-ghost disabled:cursor-not-allowed disabled:opacity-45"><Shuffle className="h-4 w-4" /> Next Player Random</button>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <ReportCard title="Bid History" icon={<Gavel className="h-5 w-5 text-apl-gold" />}>
                {data.bids.length === 0 && <p className="text-sm text-white/50">No bids yet.</p>}
                {data.bids.slice(0, 10).map((bid) => <div key={bid.id} className="flex justify-between rounded-xl bg-white/[0.05] px-3 py-2 text-sm"><span>{bid.team_name}</span><b>{formatMoney(bid.bid_amount)}</b></div>)}
              </ReportCard>
              <ReportCard title="Unsold Players" icon={<Users className="h-5 w-5 text-apl-neon" />}>
                {unsoldPlayers.length === 0 && <p className="text-sm text-white/50">No unsold players yet.</p>}
                {unsoldPlayers.map((player) => <p key={player.id} className="rounded-xl bg-white/[0.05] px-3 py-2 text-sm">{player.name}</p>)}
              </ReportCard>
            </section>

            <section className="glass-card rounded-[2rem] p-5">
              <h2 className="text-xl font-black">Manual Team Fixes</h2>
              <p className="mt-1 text-sm text-white/55">Assign unsold player, remove player from team, or edit sold price.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_140px_auto]">
                <select className="input" value={manual.player_id} onChange={(e) => setManual({ ...manual, player_id: e.target.value })}>
                  <option value="">Choose unsold/available player</option>
                  {[...unsoldPlayers, ...approvedPending].map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                </select>
                <select className="input" value={manual.team_id} onChange={(e) => setManual({ ...manual, team_id: e.target.value })}>
                  <option value="">Choose team</option>
                  {data.teams.map((team) => <option key={team.id} value={team.id}>{team.team_name}</option>)}
                </select>
                <input className="input" value={manual.price} onChange={(e) => setManual({ ...manual, price: e.target.value })} type="number" min="0" placeholder="Price" />
                <button onClick={() => void manualAssign()} className="btn-primary"><UserPlus className="h-4 w-4" /> Assign</button>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <ReportCard title="Teams" icon={<WalletCards className="h-5 w-5 text-apl-gold" />}>
              {data.teams.length === 0 && <p className="text-sm text-white/50">No teams created yet.</p>}
              {data.teams.map((team) => {
                const bought = boughtPlayersForTeam(data.players, team);
                const full = bought.length >= (team.max_players || 4);
                return (
                  <div key={team.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="font-black">{team.team_name}</p><p className="text-xs text-white/50">Captain: {team.captain_name}</p></div>
                      {full && <span className="badge border-green-400/30 bg-green-400/10 text-green-200">Full</span>}
                    </div>
                    <p className="mt-2 text-xs text-white/60">Remaining: {formatMoney(team.remaining_budget)} • Spent: {formatMoney(computeTeamSpent(data.players, team))}</p>
                    <div className="mt-3 space-y-2">
                      {bought.map((player) => (
                        <div key={player.id} className="rounded-xl bg-black/20 p-2 text-xs">
                          <div className="flex justify-between gap-2"><b>{player.name}</b><span>{formatMoney(player.sold_price)}</span></div>
                          <div className="mt-2 flex gap-2"><button onClick={() => void editPrice(player)} className="text-apl-gold">Edit price</button><button onClick={() => void removePlayer(player.id)} className="text-red-200">Remove</button></div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </ReportCard>
            <ReportCard title="Auction Summary" icon={<Trophy className="h-5 w-5 text-apl-gold" />}>
              <p className="text-sm text-white/70">Approved: {data.summary.totalApprovedPlayers}</p>
              <p className="text-sm text-white/70">Sold: {data.summary.totalSoldPlayers}</p>
              <p className="text-sm text-white/70">Unsold: {data.summary.totalUnsoldPlayers}</p>
              <p className="text-sm text-white/70">Most expensive: {data.summary.mostExpensivePlayer?.name || 'None'} ({formatMoney(data.summary.mostExpensivePlayer?.sold_price)})</p>
              <p className="text-sm text-white/70">Cheapest sold: {data.summary.cheapestSoldPlayer?.name || 'None'} ({formatMoney(data.summary.cheapestSoldPlayer?.sold_price)})</p>
              <p className="text-sm text-white/70">Full squads: {data.summary.teamsFull.length}</p>
              <p className="text-sm text-white/70">Less than 4: {data.summary.teamsLessThanFour.length}</p>
            </ReportCard>
            <ReportCard title="Live Events" icon={<AlertTriangle className="h-5 w-5 text-apl-neon" />}>
              {data.events.length === 0 && <p className="text-sm text-white/50">No events yet.</p>}
              {data.events.slice(0, 8).map((event) => <p key={event.id} className="rounded-xl bg-white/[0.05] p-2 text-xs text-white/70">{event.message}</p>)}
            </ReportCard>
          </aside>
        </section>
      </div>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="text-xs uppercase tracking-[0.18em] text-white/40">{label}</p><p className="mt-1 font-black">{value}</p></div>;
}

function ReportCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="glass-card rounded-[2rem] p-5"><div className="mb-4 flex items-center gap-2">{icon}<h3 className="font-black">{title}</h3></div><div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">{children}</div></div>;
}
