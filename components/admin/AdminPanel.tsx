"use client";

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Gavel,
  ImageIcon,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  Shuffle,
  Trophy,
  UserPlus,
  Users,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { readSession } from '@/hooks/useSession';
import { boughtPlayersForTeam, computeTeamSpent } from '@/lib/auction-utils';
import type { Auction, AuctionEvent, AuctionSummary, BattingStyle, Bid, BowlingStyle, Captain, Player, PlayerRole, Team } from '@/lib/types';
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

type PlayerDraft = {
  name: string;
  phone: string;
  role: PlayerRole;
  batting_style: BattingStyle;
  bowling_style: BowlingStyle;
  base_price: string;
};

const roles: PlayerRole[] = ['Batter', 'Bowler', 'All-rounder', 'Wicketkeeper'];
const battingStyles: BattingStyle[] = ['Right Hand', 'Left Hand'];
const bowlingStyles: BowlingStyle[] = ['Fast', 'Medium', 'Spin', 'None'];

function draftFromPlayer(player: Player): PlayerDraft {
  return {
    name: player.name || '',
    phone: player.phone || '',
    role: player.role,
    batting_style: player.batting_style,
    bowling_style: player.bowling_style,
    base_price: String(player.base_price || 100),
  };
}

export function AdminPanel() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState({ player_id: '', team_id: '', price: '' });
  const [drafts, setDrafts] = useState<Record<string, PlayerDraft>>({});

  async function api<T = unknown>(path: string, options: RequestInit = {}) {
    const session = readSession();
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${session?.token || ''}`);

    const res = await fetch(path, {
      ...options,
      headers,
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string } & T;
    if (!res.ok) throw new Error(json.error || 'Request failed');
    return json as T;
  }

  async function load() {
    setLoading(true);
    try {
      const json = await api<Overview>('/api/admin/overview');
      setData(json);

      setDrafts((old) => {
        const next = { ...old };
        json.players.forEach((player) => {
          if (!next[player.id] && player.approval_status !== 'Approved') {
            next[player.id] = draftFromPlayer(player);
          }
        });
        return next;
      });

      if (!manual.player_id && json.players?.length) {
        const firstUnsold = json.players.find((player) => player.auction_status === 'UNSOLD' || player.status === 'Unsold');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function updateDraft(player: Player, patch: Partial<PlayerDraft>) {
    setDrafts((old) => ({
      ...old,
      [player.id]: {
        ...(old[player.id] || draftFromPlayer(player)),
        ...patch,
      },
    }));
  }

  async function playerAction(player: Player, action: 'approve' | 'reject' | 'update' | 'approve-update') {
    const draft = drafts[player.id] || draftFromPlayer(player);
    const labels: Record<typeof action, string> = {
      approve: 'Player approved',
      reject: 'Player rejected',
      update: 'Player updated',
      'approve-update': 'Player approved and updated',
    };

    const confirmText: Record<typeof action, string> = {
      approve: `Approve ${player.name} for auction?`,
      reject: `Reject ${player.name}'s registration?`,
      update: `Save edited details for ${player.name}?`,
      'approve-update': `Approve ${player.name} with these edited details?`,
    };

    if (!confirm(confirmText[action])) return;

    await run(labels[action], () =>
      api('/api/admin/players/action', {
        method: 'POST',
        body: JSON.stringify({
          action,
          player_id: player.id,
          ...draft,
          base_price: Number(draft.base_price || 0),
        }),
      }).then(() => undefined),
    );
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
    await run('Player assigned manually', () =>
      api('/api/admin/auction/manual-assign', {
        method: 'POST',
        body: JSON.stringify({ player_id: manual.player_id, team_id: manual.team_id, price: Number(manual.price || 0) }),
      }).then(() => undefined),
    );
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
  const pendingPlayers = data?.players.filter((player) => player.approval_status === 'Pending') || [];
  const rejectedPlayers = data?.players.filter((player) => player.approval_status === 'Rejected') || [];
  const approvedPlayers = data?.players.filter((player) => player.approval_status === 'Approved') || [];
  const approvedPending = data?.players.filter((player) => player.approval_status === 'Approved' && player.status === 'Available' && player.auction_status !== 'SOLD' && player.auction_status !== 'UNSOLD') || [];
  const unsoldPlayers = data?.players.filter((player) => player.auction_status === 'UNSOLD' || player.status === 'Unsold') || [];
  const canStart = Boolean(data && data.teams.length >= 4 && data.captains.length >= 4 && approvedPending.length > 0);
  const soldDisabled = !currentPlayer || !data?.auction?.highest_bidder_id;
  const unsoldDisabled = !currentPlayer || Boolean(data?.auction?.highest_bidder_id);
  const showManualPicker = Boolean(data?.auction?.auction_status === 'LIVE' && !data.auction.manual_picker_hidden && !currentPlayer);

  if (loading) return <LoadingSpinner label="Loading admin command center..." />;
  if (!data) return <EmptyState title="Admin data unavailable" description="Refresh and login again." />;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="glass-card rounded-[2rem] p-5 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="badge text-apl-gold">Admin Control</span>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">APL Auction Command Center</h1>
            <p className="mt-3 text-sm font-semibold text-white/60">
              Status: {data.auction?.auction_status || 'NOT_STARTED'} • Teams: {data.teams.length} • Captains: {data.captains.length} • Pending approvals: {pendingPlayers.length}
            </p>
          </div>
          <button disabled={busy} onClick={() => void load()} className="btn-ghost disabled:opacity-50">
            <RefreshCw size={18} /> Refresh
          </button>
        </div>

        {!canStart && data.auction?.auction_status === 'NOT_STARTED' && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm font-semibold text-amber-100">
            <AlertTriangle className="mt-0.5 shrink-0" size={18} />
            <span>Need at least 4 teams and 4 captains before starting auction. Also approve players for auction.</span>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button disabled={busy || !canStart || data.auction?.auction_status === 'LIVE'} onClick={() => void status('start')} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
            <Play size={17} /> Start Auction
          </button>
          <button disabled={busy || data.auction?.auction_status !== 'LIVE'} onClick={() => void status('pause')} className="btn-ghost disabled:opacity-50">
            <Pause size={17} /> Pause
          </button>
          <button disabled={busy || data.auction?.auction_status !== 'PAUSED'} onClick={() => void status('resume')} className="btn-ghost disabled:opacity-50">
            <Play size={17} /> Resume
          </button>
          <button disabled={busy || data.auction?.auction_status === 'ENDED'} onClick={() => void status('end')} className="btn-ghost disabled:opacity-50">
            <Trophy size={17} /> End
          </button>
          <button disabled={busy} onClick={() => void status('reset')} className="btn-ghost disabled:opacity-50">
            <RotateCcw size={17} /> Reset
          </button>
          <button disabled={busy} onClick={() => void undo()} className="btn-ghost disabled:opacity-50">
            <RefreshCw size={17} /> Undo Last Action
          </button>
        </div>
      </section>

      <section className="glass-card rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-apl-gold">
              <UserPlus size={20} />
              <h2 className="text-2xl font-black">Player Approval Requests</h2>
            </div>
            <p className="mt-2 text-sm text-white/60">Approve, reject, or edit registered players from the dashboard UI.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-black uppercase tracking-wide text-white/70">
            <MiniStat label="Pending" value={pendingPlayers.length} />
            <MiniStat label="Approved" value={approvedPlayers.length} />
            <MiniStat label="Rejected" value={rejectedPlayers.length} />
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {pendingPlayers.length === 0 ? (
            <EmptyState title="No pending player requests" description="New registrations will appear here for approval." />
          ) : (
            pendingPlayers.map((player) => (
              <PlayerApprovalCard
                key={player.id}
                player={player}
                draft={drafts[player.id] || draftFromPlayer(player)}
                busy={busy}
                onDraft={(patch) => updateDraft(player, patch)}
                onApprove={() => void playerAction(player, 'approve')}
                onApproveUpdate={() => void playerAction(player, 'approve-update')}
                onReject={() => void playerAction(player, 'reject')}
                onSave={() => void playerAction(player, 'update')}
              />
            ))
          )}
        </div>

        {rejectedPlayers.length > 0 && (
          <div className="mt-6 rounded-3xl border border-red-300/15 bg-red-400/5 p-4">
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-red-100">Rejected Players</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {rejectedPlayers.map((player) => (
                <div key={player.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <div>
                    <p className="font-black">{player.name}</p>
                    <p className="text-xs text-white/55">{player.role} • {player.phone}</p>
                  </div>
                  <button disabled={busy} onClick={() => void playerAction(player, 'approve')} className="btn-primary px-4 py-2 text-xs disabled:opacity-50">
                    Approve
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {showManualPicker && (
        <section className="glass-card rounded-[2rem] p-5 sm:p-6">
          <h2 className="text-xl font-black">Select First Player</h2>
          <p className="mt-1 text-sm text-white/60">This sidebar hides after the first player is selected.</p>
          <div className="mt-4 grid max-h-[420px] gap-3 overflow-y-auto pr-1 md:grid-cols-2 lg:grid-cols-3">
            {approvedPending.length === 0 && <EmptyState title="No approved players" description="Approve players first." />}
            {approvedPending.map((player) => (
              <button key={player.id} disabled={busy} onClick={() => void selectPlayer(player.id)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left hover:border-apl-gold/50 disabled:opacity-50">
                <p className="font-black">{player.name}</p>
                <p className="mt-1 text-xs text-white/55">{player.role} • Base {formatMoney(player.base_price)}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="glass-card rounded-[2rem] p-5 sm:p-6">
        <h2 className="text-xl font-black">Current Player Control</h2>
        <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.06] p-6 text-center">
          {currentPlayer ? (
            <div>
              <span className="badge text-apl-gold">{currentPlayer.auction_status}</span>
              <h3 className="mt-3 text-3xl font-black">{currentPlayer.name}</h3>
              <p className="mt-2 text-white/60">{currentPlayer.role} • {currentPlayer.batting_style} • {currentPlayer.bowling_style}</p>
              <p className="mt-3 text-sm font-bold text-apl-gold">
                Current bid: {formatMoney(data.auction?.highest_bid || currentPlayer.current_bid || currentPlayer.base_price)} • Highest bidder: {data.auction?.highest_team_name || 'No bids yet'}
              </p>
            </div>
          ) : (
            <EmptyState title="No current player selected" description="Select first player or press next random." />
          )}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <button disabled={busy || soldDisabled} onClick={() => void sold()} className="btn-primary disabled:cursor-not-allowed disabled:grayscale disabled:opacity-45">
            <CheckCircle2 size={17} /> Sold to Current Bidder
          </button>
          <button disabled={busy || unsoldDisabled} onClick={() => void unsold()} className="btn-ghost disabled:cursor-not-allowed disabled:opacity-45">
            <XCircle size={17} /> Unsold
          </button>
          <button disabled={busy || data.auction?.auction_status !== 'LIVE'} onClick={() => void nextRandom()} className="btn-ghost disabled:cursor-not-allowed disabled:opacity-45">
            <Shuffle size={17} /> Next Player Random
          </button>
        </div>
      </section>

      <ReportCard title="Bid History" icon={<Gavel className="text-apl-gold" size={20} />}>
        {data.bids.length === 0 ? <p className="text-sm text-white/55">No bids yet.</p> : (
          <div className="space-y-2">
            {data.bids.slice(0, 10).map((bid) => (
              <div key={bid.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <span className="font-bold">{bid.team_name}</span>
                <span className="font-black text-apl-gold">{formatMoney(bid.bid_amount)}</span>
              </div>
            ))}
          </div>
        )}
      </ReportCard>

      <ReportCard title="Unsold Players" icon={<Users className="text-apl-neon" size={20} />}>
        {unsoldPlayers.length === 0 ? <p className="text-sm text-white/55">No unsold players yet.</p> : (
          <div className="flex flex-wrap gap-2">
            {unsoldPlayers.map((player) => <span key={player.id} className="badge">{player.name}</span>)}
          </div>
        )}
      </ReportCard>

      <section className="glass-card rounded-[2rem] p-5 sm:p-6">
        <h2 className="text-xl font-black">Manual Team Fixes</h2>
        <p className="mt-1 text-sm text-white/60">Assign unsold player, remove player from team, or edit sold price.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]">
          <select className="input" value={manual.player_id} onChange={(e) => setManual({ ...manual, player_id: e.target.value })}>
            <option value="">Choose unsold/available player</option>
            {[...unsoldPlayers, ...approvedPending].map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
          </select>
          <select className="input" value={manual.team_id} onChange={(e) => setManual({ ...manual, team_id: e.target.value })}>
            <option value="">Choose team</option>
            {data.teams.map((team) => <option key={team.id} value={team.id}>{team.team_name}</option>)}
          </select>
          <input className="input" value={manual.price} onChange={(e) => setManual({ ...manual, price: e.target.value })} type="number" min="0" placeholder="Price" />
          <button disabled={busy} onClick={() => void manualAssign()} className="btn-primary disabled:opacity-50">
            <UserPlus size={17} /> Assign
          </button>
        </div>
      </section>

      <ReportCard title="Teams" icon={<WalletCards className="text-apl-gold" size={20} />}>
        {data.teams.length === 0 ? <p className="text-sm text-white/55">No teams created yet.</p> : (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.teams.map((team) => {
              const bought = boughtPlayersForTeam(data.players, team);
              const full = bought.length >= (team.max_players || 4);
              return (
                <div key={team.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black">{team.team_name}</h3>
                      <p className="text-sm text-white/55">Captain: {team.captain_name}</p>
                    </div>
                    {full && <span className="badge border-apl-neon/30 bg-apl-neon/10 text-apl-neon">Full</span>}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white/70">Remaining: {formatMoney(team.remaining_budget)} • Spent: {formatMoney(computeTeamSpent(data.players, team))}</p>
                  <div className="mt-3 space-y-2">
                    {bought.map((player) => (
                      <div key={player.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-black/20 p-3 text-sm">
                        <span className="font-bold">{player.name}</span>
                        <span className="text-apl-gold">{formatMoney(player.sold_price)}</span>
                        <button disabled={busy} onClick={() => void editPrice(player)} className="text-apl-gold disabled:opacity-50">Edit price</button>
                        <button disabled={busy} onClick={() => void removePlayer(player.id)} className="text-red-200 disabled:opacity-50">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ReportCard>

      <ReportCard title="Auction Summary" icon={<Trophy className="text-apl-gold" size={20} />}>
        <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat label="Approved" value={data.summary.totalApprovedPlayers} />
          <MiniStat label="Sold" value={data.summary.totalSoldPlayers} />
          <MiniStat label="Unsold" value={data.summary.totalUnsoldPlayers} />
          <MiniStat label="Full squads" value={data.summary.teamsFull.length} />
          <MiniStat label="Most expensive" value={`${data.summary.mostExpensivePlayer?.name || 'None'} (${formatMoney(data.summary.mostExpensivePlayer?.sold_price)})`} />
          <MiniStat label="Cheapest sold" value={`${data.summary.cheapestSoldPlayer?.name || 'None'} (${formatMoney(data.summary.cheapestSoldPlayer?.sold_price)})`} />
          <MiniStat label="Less than 4" value={data.summary.teamsLessThanFour.length} />
          <MiniStat label="Total players" value={data.players.length} />
        </div>
      </ReportCard>

      <ReportCard title="Live Events" icon={<AlertTriangle className="text-apl-neon" size={20} />}>
        {data.events.length === 0 ? <p className="text-sm text-white/55">No events yet.</p> : (
          <div className="space-y-2">
            {data.events.slice(0, 8).map((event) => <div key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/75">{event.message}</div>)}
          </div>
        )}
      </ReportCard>
    </div>
  );
}

function PlayerApprovalCard({
  player,
  draft,
  busy,
  onDraft,
  onApprove,
  onApproveUpdate,
  onReject,
  onSave,
}: {
  player: Player;
  draft: PlayerDraft;
  busy: boolean;
  onDraft: (patch: Partial<PlayerDraft>) => void;
  onApprove: () => void;
  onApproveUpdate: () => void;
  onReject: () => void;
  onSave: () => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-3">
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.name} className="h-44 w-full rounded-2xl object-cover" />
          ) : (
            <div className="flex h-44 items-center justify-center rounded-2xl bg-white/[0.05] text-white/45">
              <ImageIcon size={36} />
            </div>
          )}
          <p className="mt-3 text-sm font-black">{player.name}</p>
          <p className="text-xs text-white/50">Registered phone: {player.phone}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wide text-white/50">Player Name</span>
            <input className="input" value={draft.name} onChange={(e) => onDraft({ name: e.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wide text-white/50">Phone</span>
            <input className="input" value={draft.phone} onChange={(e) => onDraft({ phone: e.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wide text-white/50">Base Price</span>
            <input className="input" type="number" min="1" value={draft.base_price} onChange={(e) => onDraft({ base_price: e.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wide text-white/50">Role</span>
            <select className="input" value={draft.role} onChange={(e) => onDraft({ role: e.target.value as PlayerRole })}>
              {roles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wide text-white/50">Batting</span>
            <select className="input" value={draft.batting_style} onChange={(e) => onDraft({ batting_style: e.target.value as BattingStyle })}>
              {battingStyles.map((style) => <option key={style} value={style}>{style}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wide text-white/50">Bowling</span>
            <select className="input" value={draft.bowling_style} onChange={(e) => onDraft({ bowling_style: e.target.value as BowlingStyle })}>
              {bowlingStyles.map((style) => <option key={style} value={style}>{style}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button disabled={busy} onClick={onApprove} className="btn-primary disabled:opacity-50">
          <CheckCircle2 size={17} /> Approve
        </button>
        <button disabled={busy} onClick={onApproveUpdate} className="btn-ghost disabled:opacity-50">
          <Edit3 size={17} /> Approve & Edit
        </button>
        <button disabled={busy} onClick={onSave} className="btn-ghost disabled:opacity-50">
          <Save size={17} /> Save Edit Only
        </button>
        <button disabled={busy} onClick={onReject} className="btn-ghost border-red-300/20 text-red-100 disabled:opacity-50">
          <XCircle size={17} /> Reject
        </button>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <p className="text-[0.68rem] font-black uppercase tracking-wide text-white/45">{label}</p>
      <p className="mt-1 font-black text-white">{value}</p>
    </div>
  );
}

function ReportCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="glass-card rounded-[2rem] p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}
