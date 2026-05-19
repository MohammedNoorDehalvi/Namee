'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Gavel,
  ImagePlus,
  KeyRound,
  Pause,
  Play,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Shuffle,
  Trophy,
  Trash2,
  UserPlus,
  Users,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { readSession } from '@/hooks/useSession';
import { boughtPlayersForTeam, computeTeamSpent } from '@/lib/auction-utils';
import type { Auction, AuctionEvent, AuctionSummary, Bid, Captain, Player, Team } from '@/lib/types';
import { formatMoney, initials } from '@/lib/format';
import { compressImageFile, fileSizeLabel } from '@/lib/image-client';
import { toast } from '@/components/ui/AppToaster';

type Overview = {
  players: Player[];
  teams: Team[];
  captains: Captain[];
  bids: Bid[];
  auction: Auction | null;
  events: AuctionEvent[];
  summary: AuctionSummary;
};

type PlayerEdit = {
  name: string;
  phone: string;
  role: string;
  batting_style: string;
  bowling_style: string;
  base_price: string;
};

const inputClass =
  'w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition focus:border-apl-gold/60 focus:bg-white/[0.09] placeholder:text-white/35';

const selectClass = `${inputClass} appearance-none`;

const emptyTeamForm = {
  team_name: '',
  captain_name: '',
  password: '',
  budget: '50000',
  max_players: '4',
};

function makePlayerEdit(player: Player): PlayerEdit {
  return {
    name: player.name || '',
    phone: player.phone || '',
    role: player.role || 'Batter',
    batting_style: player.batting_style || 'Right Hand',
    bowling_style: player.bowling_style || 'None',
    base_price: String(player.base_price || 100),
  };
}

function makePassword() {
  const word = 'APL';
  const number = Math.floor(1000 + Math.random() * 9000);
  const tail = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${word}${number}${tail}`;
}

export function AdminPanel() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState({ player_id: '', team_id: '', price: '' });
  const [teamForm, setTeamForm] = useState(emptyTeamForm);
  const [teamLogoFile, setTeamLogoFile] = useState<File | null>(null);
  const [captainPhotoFile, setCaptainPhotoFile] = useState<File | null>(null);
  const [editingPlayers, setEditingPlayers] = useState<Record<string, PlayerEdit>>({});

  async function api<T = unknown>(path: string, options: RequestInit = {}) {
    const session = readSession();
    const isFormData = options.body instanceof FormData;
    const res = await fetch(path, {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${session?.token || ''}`,
        ...(options.headers || {}),
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((json as { error?: string }).error || 'Request failed');
    return json as T;
  }

  async function load() {
    setLoading(true);
    try {
      const json = await api<Overview>('/api/admin/overview');
      setData(json);
      setEditingPlayers((old) => {
        const next = { ...old };
        json.players
          .filter((player) => player.approval_status === 'Pending')
          .forEach((player) => {
            if (!next[player.id]) next[player.id] = makePlayerEdit(player);
          });
        return next;
      });
      if (!manual.player_id && json.players?.length) {
        const firstUnsold = json.players.find(
          (player) => player.auction_status === 'UNSOLD' || player.status === 'Unsold',
        );
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

  async function status(action: 'start' | 'pause' | 'resume' | 'end' | 'reset') {
    const confirmText: Record<typeof action, string> = {
      start: 'Start auction now?',
      pause: 'Pause auction?',
      resume: 'Resume auction?',
      end: 'End auction and show reports?',
      reset: 'Reset full auction? This clears bids and sold/unsold decisions.',
    };
    if (!confirm(confirmText[action])) return;
    await run(`Auction ${action} done`, () =>
      api('/api/admin/auction/status', { method: 'POST', body: JSON.stringify({ action }) }).then(() => undefined),
    );
  }

  async function chooseTeamImage(file: File | null, target: 'team-logo' | 'captain-photo') {
    if (!file) {
      if (target === 'team-logo') setTeamLogoFile(null);
      else setCaptainPhotoFile(null);
      return;
    }

    try {
      const optimized = await compressImageFile(file, { maxDimension: 800, maxSizeBytes: 800 * 1024, quality: 0.8 });
      if (target === 'team-logo') setTeamLogoFile(optimized);
      else setCaptainPhotoFile(optimized);
      if (optimized.size < file.size) toast(`Image optimized: ${fileSizeLabel(optimized.size)}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not use this image.');
      if (target === 'team-logo') setTeamLogoFile(null);
      else setCaptainPhotoFile(null);
    }
  }

  async function addTeamCaptain() {
    const body = new FormData();
    body.append('team_name', teamForm.team_name);
    body.append('captain_name', teamForm.captain_name);
    body.append('password', teamForm.password);
    body.append('budget', String(Number(teamForm.budget || 50000)));
    body.append('max_players', String(Number(teamForm.max_players || 4)));
    if (teamLogoFile) body.append('team_logo', teamLogoFile);
    if (captainPhotoFile) body.append('captain_photo', captainPhotoFile);

    await run('Team and captain added', () =>
      api('/api/admin/teams/create', {
        method: 'POST',
        body,
      }).then(() => {
        setTeamForm(emptyTeamForm);
        setTeamLogoFile(null);
        setCaptainPhotoFile(null);
      }),
    );
  }

  async function playerAction(player: Player, action: 'approve' | 'reject' | 'update' | 'approve-update') {
    const edit = editingPlayers[player.id] || makePlayerEdit(player);
    const label: Record<typeof action, string> = {
      approve: 'Player approved',
      reject: 'Player rejected',
      update: 'Player details saved',
      'approve-update': 'Player approved with edits',
    };
    const confirmText: Record<typeof action, string> = {
      approve: `Approve ${player.name}?`,
      reject: `Reject ${player.name}?`,
      update: `Save changes for ${player.name}?`,
      'approve-update': `Approve ${player.name} with these edits?`,
    };
    if (!confirm(confirmText[action])) return;
    await run(label[action], () =>
      api('/api/admin/players/action', {
        method: 'POST',
        body: JSON.stringify({ player_id: player.id, action, ...edit }),
      }).then(() => undefined),
    );
  }

  async function selectPlayer(playerId: string) {
    await run('Player selected', () =>
      api('/api/admin/auction/select-player', { method: 'POST', body: JSON.stringify({ player_id: playerId }) }).then(
        () => undefined,
      ),
    );
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
    await run('Next random player selected', () =>
      api('/api/admin/auction/next', { method: 'POST' }).then(() => undefined),
    );
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
        body: JSON.stringify({
          player_id: manual.player_id,
          team_id: manual.team_id,
          price: Number(manual.price || 0),
        }),
      }).then(() => undefined),
    );
  }

  async function removePlayer(playerId: string) {
    if (!confirm('Remove this player from team and return points?')) return;
    await run('Player removed from team', () =>
      api('/api/admin/auction/remove-player', {
        method: 'POST',
        body: JSON.stringify({ player_id: playerId }),
      }).then(() => undefined),
    );
  }

  async function editPrice(player: Player) {
    const value = prompt('New sold price', String(player.sold_price || 0));
    if (value === null) return;
    await run('Sold price edited', () =>
      api('/api/admin/auction/edit-price', {
        method: 'POST',
        body: JSON.stringify({ player_id: player.id, price: Number(value) }),
      }).then(() => undefined),
    );
  }

  const currentPlayer = useMemo<Player | null>(
    () => data?.players.find((player) => player.id === data.auction?.current_player_id) || null,
    [data],
  );

  const pendingPlayers = data?.players.filter((player) => player.approval_status === 'Pending') || [];
  const rejectedPlayers = data?.players.filter((player) => player.approval_status === 'Rejected') || [];
  const approvedPending =
    data?.players.filter(
      (player) =>
        player.approval_status === 'Approved' &&
        player.status === 'Available' &&
        player.auction_status !== 'SOLD' &&
        player.auction_status !== 'UNSOLD',
    ) || [];
  const unsoldPlayers = data?.players.filter((player) => player.auction_status === 'UNSOLD' || player.status === 'Unsold') || [];
  const canStart = Boolean(data && data.teams.length >= 4 && data.captains.length >= 4 && approvedPending.length > 0);
  const soldDisabled = !currentPlayer || !data?.auction?.highest_bidder_id;
  const unsoldDisabled = !currentPlayer || Boolean(data?.auction?.highest_bidder_id);
  const showManualPicker = Boolean(data?.auction?.auction_status === 'LIVE' && !data.auction.manual_picker_hidden && !currentPlayer);

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-white/70">Loading admin dashboard...</div>;
  }

  if (!data) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-red-200">Admin data could not load.</div>;
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 text-white sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.09] to-apl-green/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <span className="inline-flex rounded-full border border-apl-gold/25 bg-apl-gold/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-apl-gold">
          Admin Control
        </span>
        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">APL Auction Command Center</h1>
        <p className="mt-2 text-sm text-white/60">
          Status: {data.auction?.auction_status || 'NOT_STARTED'} • Teams: {data.teams.length} • Captains: {data.captains.length}
        </p>
        <button onClick={() => void load()} className="btn-ghost mt-5 w-full" disabled={busy}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>

        {!canStart && data.auction?.auction_status === 'NOT_STARTED' && (
          <div className="mt-4 flex gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
            <span>Need at least 4 teams, 4 captains, one captain per team, and approved players before starting auction.</span>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button disabled={!canStart || busy} onClick={() => void status('start')} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
            <Play className="h-4 w-4" /> Start Auction
          </button>
          <button disabled={busy} onClick={() => void status('pause')} className="btn-ghost disabled:opacity-50">
            <Pause className="h-4 w-4" /> Pause
          </button>
          <button disabled={busy} onClick={() => void status('resume')} className="btn-ghost disabled:opacity-50">
            <Play className="h-4 w-4" /> Resume
          </button>
          <button disabled={busy} onClick={() => void status('end')} className="btn-ghost disabled:opacity-50">
            <Trophy className="h-4 w-4" /> End
          </button>
          <button disabled={busy} onClick={() => void status('reset')} className="btn-ghost disabled:opacity-50">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          <button disabled={busy} onClick={() => void undo()} className="btn-ghost disabled:opacity-50">
            Undo Last Action
          </button>
        </div>
      </section>

      <ReportCard title="Add Team + Captain Login" icon={<UserPlus className="h-5 w-5 text-apl-gold" />}>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-white/45">Team name</span>
            <input
              className={inputClass}
              value={teamForm.team_name}
              onChange={(event) => setTeamForm({ ...teamForm, team_name: event.target.value })}
              placeholder="Team Ashoka"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-white/45">Captain name</span>
            <input
              className={inputClass}
              value={teamForm.captain_name}
              onChange={(event) => setTeamForm({ ...teamForm, captain_name: event.target.value })}
              placeholder="Faiz"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-white/45">Captain password</span>
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={teamForm.password}
                onChange={(event) => setTeamForm({ ...teamForm, password: event.target.value })}
                placeholder="Login password"
              />
              <button
                type="button"
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-white/80 hover:border-apl-gold/50"
                onClick={() => setTeamForm({ ...teamForm, password: makePassword() })}
                title="Generate password"
              >
                <KeyRound className="h-4 w-4" />
              </button>
            </div>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-white/45">Budget</span>
            <input
              className={inputClass}
              type="number"
              min="1"
              value={teamForm.budget}
              onChange={(event) => setTeamForm({ ...teamForm, budget: event.target.value })}
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-white/45">Max players</span>
            <input
              className={inputClass}
              type="number"
              min="1"
              max="20"
              value={teamForm.max_players}
              onChange={(event) => setTeamForm({ ...teamForm, max_players: event.target.value })}
            />
          </label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <ImagePicker
            title="Team logo"
            description="Visible on live auction, teams list, and captain dashboard."
            file={teamLogoFile}
            onChange={(file) => void chooseTeamImage(file, 'team-logo')}
            onRemove={() => setTeamLogoFile(null)}
          />
          <ImagePicker
            title="Captain photo"
            description="Visible on captain dashboard and team cards."
            file={captainPhotoFile}
            onChange={(file) => void chooseTeamImage(file, 'captain-photo')}
            onRemove={() => setCaptainPhotoFile(null)}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/60">
            Password is hashed on the server with bcrypt before storing in Supabase. The plain password is only visible here before saving.
          </p>
          <button disabled={busy} onClick={() => void addTeamCaptain()} className="btn-primary shrink-0 disabled:opacity-50">
            <PlusCircle className="h-4 w-4" /> Add Team + Captain
          </button>
        </div>
      </ReportCard>

      <ReportCard title="Pending Player Requests" icon={<ShieldCheck className="h-5 w-5 text-apl-gold" />}>
        {pendingPlayers.length === 0 ? (
          <MiniEmpty title="No pending players" description="New registrations will appear here for approve, approve/edit, or reject." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {pendingPlayers.map((player) => {
              const edit = editingPlayers[player.id] || makePlayerEdit(player);
              return (
                <div key={player.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex gap-4">
                    {player.photo_url ? (
                      <img src={player.photo_url} alt={player.name} className="h-20 w-20 rounded-2xl object-cover" />
                    ) : (
                      <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white/10 text-xs text-white/45">No photo</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xl font-black">{player.name}</p>
                      <p className="text-sm text-white/50">{player.phone}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {player.role} • {player.batting_style} • {player.bowling_style}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <input className={inputClass} value={edit.name} onChange={(event) => setEditingPlayers({ ...editingPlayers, [player.id]: { ...edit, name: event.target.value } })} placeholder="Player name" />
                    <input className={inputClass} value={edit.phone} onChange={(event) => setEditingPlayers({ ...editingPlayers, [player.id]: { ...edit, phone: event.target.value } })} placeholder="Phone" />
                    <select className={selectClass} value={edit.role} onChange={(event) => setEditingPlayers({ ...editingPlayers, [player.id]: { ...edit, role: event.target.value } })}>
                      <option>Batter</option>
                      <option>Bowler</option>
                      <option>All-rounder</option>
                      <option>Wicketkeeper</option>
                    </select>
                    <input className={inputClass} type="number" min="1" value={edit.base_price} onChange={(event) => setEditingPlayers({ ...editingPlayers, [player.id]: { ...edit, base_price: event.target.value } })} placeholder="Base price" />
                    <select className={selectClass} value={edit.batting_style} onChange={(event) => setEditingPlayers({ ...editingPlayers, [player.id]: { ...edit, batting_style: event.target.value } })}>
                      <option>Right Hand</option>
                      <option>Left Hand</option>
                    </select>
                    <select className={selectClass} value={edit.bowling_style} onChange={(event) => setEditingPlayers({ ...editingPlayers, [player.id]: { ...edit, bowling_style: event.target.value } })}>
                      <option>Fast</option>
                      <option>Medium</option>
                      <option>Spin</option>
                      <option>None</option>
                    </select>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button disabled={busy} onClick={() => void playerAction(player, 'approve')} className="btn-primary disabled:opacity-50">
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </button>
                    <button disabled={busy} onClick={() => void playerAction(player, 'approve-update')} className="btn-ghost disabled:opacity-50">
                      <Edit3 className="h-4 w-4" /> Approve & Edit
                    </button>
                    <button disabled={busy} onClick={() => void playerAction(player, 'update')} className="btn-ghost disabled:opacity-50">
                      <Save className="h-4 w-4" /> Save Only
                    </button>
                    <button disabled={busy} onClick={() => void playerAction(player, 'reject')} className="btn-ghost text-red-200 disabled:opacity-50">
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ReportCard>

      {showManualPicker && (
        <ReportCard title="Select First Player" icon={<UserPlus className="h-5 w-5 text-apl-gold" />}>
          <p className="mb-3 text-sm text-white/50">This sidebar hides after the first player is selected.</p>
          {approvedPending.length === 0 ? (
            <MiniEmpty title="No approved players" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {approvedPending.map((player) => (
                <button
                  key={player.id}
                  disabled={busy}
                  onClick={() => void selectPlayer(player.id)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left hover:border-apl-gold/50 disabled:opacity-50"
                >
                  <p className="font-bold">{player.name}</p>
                  <p className="text-sm text-white/50">
                    {player.role} • Base {formatMoney(player.base_price)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ReportCard>
      )}

      <ReportCard title="Current Player Control" icon={<Gavel className="h-5 w-5 text-apl-gold" />}>
        {currentPlayer ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-apl-gold">{currentPlayer.auction_status}</p>
            <h3 className="mt-1 text-3xl font-black">{currentPlayer.name}</h3>
            <p className="text-white/60">
              {currentPlayer.role} • {currentPlayer.batting_style} • {currentPlayer.bowling_style}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MiniStat label="Current bid" value={formatMoney(data.auction?.highest_bid || currentPlayer.current_bid || currentPlayer.base_price)} />
              <MiniStat label="Highest bidder" value={data.auction?.highest_team_name || 'No bid yet'} />
              <MiniStat label="Base price" value={formatMoney(currentPlayer.base_price)} />
            </div>
          </div>
        ) : (
          <MiniEmpty title="No current player selected" description="Select the first player or press next random." />
        )}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <button disabled={busy || soldDisabled} onClick={() => void sold()} className="btn-primary disabled:cursor-not-allowed disabled:grayscale disabled:opacity-45">
            <CheckCircle2 className="h-4 w-4" /> Sold to Current Bidder
          </button>
          <button disabled={busy || unsoldDisabled} onClick={() => void unsold()} className="btn-ghost disabled:cursor-not-allowed disabled:opacity-45">
            <XCircle className="h-4 w-4" /> Unsold
          </button>
          <button disabled={busy} onClick={() => void nextRandom()} className="btn-ghost disabled:cursor-not-allowed disabled:opacity-45">
            <Shuffle className="h-4 w-4" /> Next Player Random
          </button>
        </div>
      </ReportCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportCard title="Bid History" icon={<Gavel className="h-5 w-5 text-apl-gold" />}>
          {data.bids.length === 0 ? (
            <MiniEmpty title="No bids yet" />
          ) : (
            <div className="space-y-2">
              {data.bids.slice(0, 10).map((bid) => (
                <div key={bid.id} className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
                  <span>{bid.team_name}</span>
                  <b>{formatMoney(bid.bid_amount)}</b>
                </div>
              ))}
            </div>
          )}
        </ReportCard>

        <ReportCard title="Unsold Players" icon={<Users className="h-5 w-5 text-apl-green" />}>
          {unsoldPlayers.length === 0 ? (
            <MiniEmpty title="No unsold players yet" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {unsoldPlayers.map((player) => (
                <span key={player.id} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-sm">
                  {player.name}
                </span>
              ))}
            </div>
          )}
        </ReportCard>
      </div>

      <ReportCard title="Manual Team Fixes" icon={<UserPlus className="h-5 w-5 text-apl-gold" />}>
        <p className="mb-4 text-sm text-white/50">Assign unsold player, remove player from team, or edit sold price.</p>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_140px_auto]">
          <select className={selectClass} value={manual.player_id} onChange={(event) => setManual({ ...manual, player_id: event.target.value })}>
            <option value="">Choose unsold/available player</option>
            {[...unsoldPlayers, ...approvedPending].map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
          <select className={selectClass} value={manual.team_id} onChange={(event) => setManual({ ...manual, team_id: event.target.value })}>
            <option value="">Choose team</option>
            {data.teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.team_name}
              </option>
            ))}
          </select>
          <input className={inputClass} value={manual.price} onChange={(event) => setManual({ ...manual, price: event.target.value })} type="number" min="0" placeholder="Price" />
          <button disabled={busy} onClick={() => void manualAssign()} className="btn-primary disabled:opacity-50">
            Assign
          </button>
        </div>
      </ReportCard>

      <ReportCard title="Teams" icon={<WalletCards className="h-5 w-5 text-apl-gold" />}>
        {data.teams.length === 0 ? (
          <MiniEmpty title="No teams created yet" description="Use the Add Team + Captain form above." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.teams.map((team) => {
              const bought = boughtPlayersForTeam(data.players, team);
              const full = bought.length >= (team.max_players || 4);
              const captain = data.captains.find(
                (item) => item.id === team.captain_id || item.team_id === team.id || item.captain_name === team.captain_name,
              );
              return (
                <div key={team.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <LogoAvatar src={team.logo_url} label={team.team_name} size="lg" />
                      <div className="min-w-0">
                        <h3 className="truncate text-2xl font-black">{team.team_name}</h3>
                        <div className="mt-1 flex items-center gap-2 text-sm text-white/50">
                          <LogoAvatar src={captain?.photo_url} label={team.captain_name} size="sm" />
                          <span>Captain: {team.captain_name}</span>
                        </div>
                      </div>
                    </div>
                    {full && <span className="rounded-full bg-apl-green/20 px-3 py-1 text-xs font-bold text-apl-green">Team Full</span>}
                  </div>
                  <p className="mt-3 text-sm text-white/60">
                    Remaining: {formatMoney(team.remaining_budget)} • Spent: {formatMoney(computeTeamSpent(data.players, team))} • Players: {bought.length}/{team.max_players || 4}
                  </p>
                  <div className="mt-4 space-y-2">
                    {bought.map((player) => (
                      <div key={player.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-black/20 px-3 py-2 text-sm">
                        <span>{player.name}</span>
                        <span className="font-bold text-apl-gold">{formatMoney(player.sold_price)}</span>
                        <button onClick={() => void editPrice(player)} className="text-apl-gold">
                          Edit price
                        </button>
                        <button onClick={() => void removePlayer(player.id)} className="inline-flex items-center gap-1 text-red-200">
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ReportCard>

      <ReportCard title="Auction Summary" icon={<Trophy className="h-5 w-5 text-apl-gold" />}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat label="Approved" value={data.summary.totalApprovedPlayers} />
          <MiniStat label="Sold" value={data.summary.totalSoldPlayers} />
          <MiniStat label="Unsold" value={data.summary.totalUnsoldPlayers} />
          <MiniStat label="Full squads" value={data.summary.teamsFull.length} />
          <MiniStat label="Less than 4" value={data.summary.teamsLessThanFour.length} />
          <MiniStat label="Most expensive" value={`${data.summary.mostExpensivePlayer?.name || 'None'} (${formatMoney(data.summary.mostExpensivePlayer?.sold_price)})`} />
          <MiniStat label="Cheapest sold" value={`${data.summary.cheapestSoldPlayer?.name || 'None'} (${formatMoney(data.summary.cheapestSoldPlayer?.sold_price)})`} />
          <MiniStat label="Rejected" value={rejectedPlayers.length} />
        </div>
      </ReportCard>

      <ReportCard title="Live Events" icon={<AlertTriangle className="h-5 w-5 text-apl-green" />}>
        {data.events.length === 0 ? (
          <MiniEmpty title="No events yet" />
        ) : (
          <div className="space-y-2">
            {data.events.slice(0, 8).map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
                {event.message}
              </div>
            ))}
          </div>
        )}
      </ReportCard>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-1 font-black text-white">{value}</p>
    </div>
  );
}

function MiniEmpty({ title, description }: { title: string; description?: string }) {
  return (
    <div className="grid min-h-28 place-items-center rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center">
      <div>
        <p className="font-black text-white/85">{title}</p>
        {description && <p className="mt-1 text-sm text-white/45">{description}</p>}
      </div>
    </div>
  );
}

function LogoAvatar({ src, label, size = 'md' }: { src?: string | null; label: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-7 w-7 text-[10px] rounded-xl',
    md: 'h-11 w-11 text-sm rounded-2xl',
    lg: 'h-14 w-14 text-base rounded-2xl',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={label}
        loading="lazy"
        decoding="async"
        className={`${sizes[size]} shrink-0 border border-white/10 object-cover bg-white/10`}
      />
    );
  }

  return (
    <div className={`${sizes[size]} grid shrink-0 place-items-center border border-white/10 bg-apl-gold/15 font-black text-apl-gold`}>
      {initials(label)}
    </div>
  );
}

function ImagePicker({
  title,
  description,
  file,
  onChange,
  onRemove,
}: {
  title: string;
  description: string;
  file: File | null;
  onChange: (file: File | null) => void;
  onRemove: () => void;
}) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-4">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id={`picker-${title.replace(/\s+/g, '-').toLowerCase()}`}
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
      <div className="flex items-center gap-3">
        {preview ? (
          <img src={preview} alt={title} className="h-16 w-16 rounded-2xl border border-white/10 object-cover" />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-apl-gold">
            <ImagePlus className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-black">{title}</p>
          <p className="text-xs text-white/45">{file ? `${file.name} • ${fileSizeLabel(file.size)}` : description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <label htmlFor={`picker-${title.replace(/\s+/g, '-').toLowerCase()}`} className="cursor-pointer rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-bold text-white hover:bg-white/[0.12]">
              Choose Image
            </label>
            {file && (
              <button type="button" onClick={onRemove} className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-200 hover:bg-red-500/20">
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}
