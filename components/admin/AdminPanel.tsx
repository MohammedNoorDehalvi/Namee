"use client";

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeDollarSign,
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
import { battingStyles, bowlingStyles, playerRoles } from '@/lib/constants';
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
  const number = Math.floor(1000 + Math.random() * 9000);
  const tail = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `APL${number}${tail}`;
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
    const headers = new Headers(options.headers);

    if (!isFormData) headers.set('Content-Type', 'application/json');
    if (session?.token) headers.set('Authorization', `Bearer ${session.token}`);

    const res = await fetch(path, {
      ...options,
      headers,
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
        const firstUnsold = json.players.find((player) => player.auction_status === 'UNSOLD' || player.status === 'Unsold');
        if (firstUnsold) setManual((old) => ({ ...old, player_id: firstUnsold.id }));
      }

      if (!manual.team_id && json.teams?.length) {
        setManual((old) => ({ ...old, team_id: json.teams[0].id }));
      }
    } catch (err) {
      if (!silent) toast(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void load();

    const softRefresh = () => void load(true);
    const intervalId = window.setInterval(softRefresh, 900);
    const focusRefresh = () => softRefresh();
    const visibilityRefresh = () => {
      if (document.visibilityState === 'visible') softRefresh();
    };

    window.addEventListener('focus', focusRefresh);
    document.addEventListener('visibilitychange', visibilityRefresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', focusRefresh);
      document.removeEventListener('visibilitychange', visibilityRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(true);

    try {
      await fn();
      toast(label);
      await load(true);
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
      api('/api/admin/auction/status', {
        method: 'POST',
        body: JSON.stringify({ action }),
      }).then(() => undefined),
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

    await run('Team and captain saved', () =>
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

  function updateEdit(player: Player, patch: Partial<PlayerEdit>) {
    setEditingPlayers((old) => ({
      ...old,
      [player.id]: {
        ...(old[player.id] || makePlayerEdit(player)),
        ...patch,
      },
    }));
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
      api('/api/admin/auction/select-player', {
        method: 'POST',
        body: JSON.stringify({ player_id: playerId }),
      }).then(() => undefined),
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

  const currentPlayer = useMemo(() => data?.players.find((player) => player.id === data.auction?.current_player_id) || null, [data]);
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
  const soldPlayers = data?.players.filter((player) => player.auction_status === 'SOLD' || player.status === 'Sold') || [];
  const unsoldPlayers = data?.players.filter((player) => player.auction_status === 'UNSOLD' || player.status === 'Unsold') || [];

  const everyTeamHasCaptain = Boolean(data?.teams.every((team) => team.captain_id || team.captain_name));
  const canStart = Boolean(data && data.teams.length >= 4 && data.captains.length >= 4 && everyTeamHasCaptain && approvedPending.length > 0);
  const soldDisabled = !currentPlayer || !data?.auction?.highest_bidder_id;
  const unsoldDisabled = !currentPlayer || Boolean(data?.auction?.highest_bidder_id);
  const showManualPicker = Boolean(data?.auction?.auction_status === 'LIVE' && !data.auction.manual_picker_hidden && !currentPlayer);

  if (loading) {
    return <div className="py-20 text-center text-white/70">Loading admin dashboard...</div>;
  }

  if (!data) {
    return (
      <div className="glass-card rounded-[2rem] p-8 text-center">
        <p className="text-white/70">Admin data could not load.</p>
        <button onClick={() => void load()} className="btn-primary mt-5" type="button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section className="glass-card relative overflow-hidden rounded-[2.3rem] p-5 sm:p-7">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-green-300/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="badge border-yellow-300/20 bg-yellow-300/10 text-yellow-200">
              <ShieldCheck size={15} /> Admin Control
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">APL Command Center</h1>
            <p className="mt-3 text-sm text-white/60">
              Status: {data.auction?.auction_status || 'NOT_STARTED'} • Teams: {data.teams.length} • Captains: {data.captains.length} • Approved:{' '}
              {approvedPending.length}
            </p>
          </div>

          <button onClick={() => void load()} className="btn-ghost w-full xl:w-auto" disabled={busy} type="button">
            <RefreshCw size={18} /> Refresh
          </button>
        </div>

        {!canStart && data.auction?.auction_status === 'NOT_STARTED' && (
          <div className="relative mt-5 flex gap-3 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4 text-sm font-bold text-yellow-100">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>Need at least 4 teams, 4 captains, one captain per team, and approved players before starting auction.</span>
          </div>
        )}

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <button disabled={!canStart || busy || data.auction?.auction_status === 'LIVE'} onClick={() => void status('start')} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50" type="button">
            <Play size={18} /> Start Auction
          </button>
          <button disabled={busy || data.auction?.auction_status !== 'LIVE'} onClick={() => void status('pause')} className="btn-ghost disabled:opacity-50" type="button">
            <Pause size={18} /> Pause
          </button>
          <button disabled={busy || data.auction?.auction_status !== 'PAUSED'} onClick={() => void status('resume')} className="btn-ghost disabled:opacity-50" type="button">
            <Play size={18} /> Resume
          </button>
          <button disabled={busy || data.auction?.auction_status === 'ENDED'} onClick={() => void status('end')} className="btn-ghost disabled:opacity-50" type="button">
            <Trophy size={18} /> End
          </button>
          <button disabled={busy} onClick={() => void status('reset')} className="btn-danger disabled:opacity-50" type="button">
            <RotateCcw size={18} /> Reset
          </button>
          <button disabled={busy} onClick={() => void undo()} className="btn-ghost disabled:opacity-50" type="button">
            <RefreshCw size={18} /> Undo
          </button>
        </div>
      </section>

      <div className="grid gap-7 xl:grid-cols-[420px_1fr]">
        <div className="space-y-7 xl:sticky xl:top-24 xl:self-start">
          <Panel title="Add Team + Captain" icon={<UserPlus className="text-green-300" />}>
            <div className="grid gap-3">
              <Field label="Team name">
                <input className="input" value={teamForm.team_name} onChange={(event) => setTeamForm({ ...teamForm, team_name: event.target.value })} placeholder="Team Ashoka" />
              </Field>
              <Field label="Captain name">
                <input className="input" value={teamForm.captain_name} onChange={(event) => setTeamForm({ ...teamForm, captain_name: event.target.value })} placeholder="Faiz" />
              </Field>
              <Field label="Captain password">
                <div className="flex gap-2">
                  <input className="input" value={teamForm.password} onChange={(event) => setTeamForm({ ...teamForm, password: event.target.value })} placeholder="Login password" />
                  <button type="button" onClick={() => setTeamForm({ ...teamForm, password: makePassword() })} className="btn-ghost aspect-square px-3" title="Generate password">
                    <KeyRound size={18} />
                  </button>
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Budget">
                  <input className="input" type="number" min="0" value={teamForm.budget} onChange={(event) => setTeamForm({ ...teamForm, budget: event.target.value })} />
                </Field>
                <Field label="Max players">
                  <input className="input" type="number" min="1" value={teamForm.max_players} onChange={(event) => setTeamForm({ ...teamForm, max_players: event.target.value })} />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <ImagePicker title="Team Logo" description="Upload logo" file={teamLogoFile} onChange={(file) => void chooseTeamImage(file, 'team-logo')} onRemove={() => setTeamLogoFile(null)} />
                <ImagePicker title="Captain Photo" description="Upload captain" file={captainPhotoFile} onChange={(file) => void chooseTeamImage(file, 'captain-photo')} onRemove={() => setCaptainPhotoFile(null)} />
              </div>

              <p className="text-xs leading-5 text-white/45">Password is hashed on the server before saving in Supabase.</p>

              <button disabled={busy} onClick={() => void addTeamCaptain()} className="btn-primary w-full disabled:opacity-50" type="button">
                <PlusCircle size={18} /> Add Team + Captain
              </button>
            </div>
          </Panel>

          {showManualPicker && (
            <Panel title="Select First Player" icon={<Gavel className="text-yellow-300" />}>
              <p className="mb-4 text-sm text-white/55">This selector hides after the first player is selected.</p>
              <div className="grid max-h-[420px] gap-3 overflow-y-auto pr-1 soft-scrollbar">
                {approvedPending.length === 0 ? (
                  <MiniEmpty title="No approved players" />
                ) : (
                  approvedPending.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => void selectPlayer(player.id)}
                      disabled={busy}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-yellow-300/45 disabled:opacity-50"
                      type="button"
                    >
                      <p className="font-black text-white">{player.name}</p>
                      <p className="mt-1 text-xs text-white/50">
                        {player.role} • Base {formatMoney(player.base_price)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </Panel>
          )}
        </div>

        <main className="space-y-7">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MiniStat label="Teams" value={data.teams.length} icon={<Users size={18} />} />
            <MiniStat label="Captains" value={data.captains.length} icon={<ShieldCheck size={18} />} />
            <MiniStat label="Sold Players" value={soldPlayers.length} icon={<CheckCircle2 size={18} />} />
            <MiniStat label="Unsold" value={unsoldPlayers.length} icon={<XCircle size={18} />} />
          </div>

          <Panel title="Player Approval" icon={<ShieldCheck className="text-green-300" />}>
            {pendingPlayers.length === 0 ? (
              <MiniEmpty title="No pending players" description="New registrations will appear here." />
            ) : (
              <div className="grid gap-4">
                {pendingPlayers.map((player) => {
                  const edit = editingPlayers[player.id] || makePlayerEdit(player);

                  return (
                    <article key={player.id} className="rounded-[1.7rem] border border-white/10 bg-black/18 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row">
                        <Avatar src={player.photo_url} label={player.name} size="xl" />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="badge border-yellow-300/20 bg-yellow-300/10 text-yellow-200">Pending</span>
                            <span className="text-sm text-white/50">{player.phone}</span>
                          </div>

                          <h3 className="mt-2 text-2xl font-black text-white">{player.name}</h3>
                          <p className="mt-1 text-sm text-white/55">
                            {player.role} • {player.batting_style} • {player.bowling_style}
                          </p>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <input className="input" value={edit.name} onChange={(event) => updateEdit(player, { name: event.target.value })} placeholder="Player name" />
                            <input className="input" value={edit.phone} onChange={(event) => updateEdit(player, { phone: event.target.value })} placeholder="Phone" />
                            <select className="input" value={edit.role} onChange={(event) => updateEdit(player, { role: event.target.value })}>
                              {playerRoles.map((role) => <option key={role}>{role}</option>)}
                            </select>
                            <select className="input" value={edit.batting_style} onChange={(event) => updateEdit(player, { batting_style: event.target.value })}>
                              {battingStyles.map((style) => <option key={style}>{style}</option>)}
                            </select>
                            <select className="input" value={edit.bowling_style} onChange={(event) => updateEdit(player, { bowling_style: event.target.value })}>
                              {bowlingStyles.map((style) => <option key={style}>{style}</option>)}
                            </select>
                            <input className="input" value={edit.base_price} onChange={(event) => updateEdit(player, { base_price: event.target.value })} placeholder="Base price" />
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            <button disabled={busy} onClick={() => void playerAction(player, 'approve')} className="btn-primary disabled:opacity-50" type="button">
                              <CheckCircle2 size={17} /> Approve
                            </button>
                            <button disabled={busy} onClick={() => void playerAction(player, 'approve-update')} className="btn-ghost disabled:opacity-50" type="button">
                              <Edit3 size={17} /> Approve & Edit
                            </button>
                            <button disabled={busy} onClick={() => void playerAction(player, 'update')} className="btn-ghost disabled:opacity-50" type="button">
                              <Save size={17} /> Save Only
                            </button>
                            <button disabled={busy} onClick={() => void playerAction(player, 'reject')} className="btn-danger disabled:opacity-50" type="button">
                              <XCircle size={17} /> Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </Panel>

          <div className="grid gap-7 xl:grid-cols-[1fr_360px]">
            <Panel title="Current Player Control" icon={<Gavel className="text-yellow-300" />}>
              {currentPlayer ? (
                <div className="flex flex-col gap-4 md:flex-row">
                  <Avatar src={currentPlayer.photo_url} label={currentPlayer.name} size="xxl" />
                  <div className="min-w-0 flex-1">
                    <p className="badge border-green-300/20 bg-green-300/10 text-green-200">{currentPlayer.auction_status}</p>
                    <h3 className="mt-3 break-words text-3xl font-black text-white">{currentPlayer.name}</h3>
                    <p className="mt-2 text-sm text-white/55">
                      {currentPlayer.role} • {currentPlayer.batting_style} • {currentPlayer.bowling_style}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Small label="Current Bid" value={formatMoney(data.auction?.highest_bid || currentPlayer.current_bid)} green />
                      <Small label="Highest Bidder" value={data.auction?.highest_team_name || 'No bids'} />
                    </div>
                  </div>
                </div>
              ) : (
                <MiniEmpty title="No current player" description="Select the first player or choose next random." />
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <button disabled={busy || soldDisabled} onClick={() => void sold()} className="btn-primary disabled:cursor-not-allowed disabled:grayscale disabled:opacity-45" type="button">
                  <Trophy size={17} /> Sold to Current Bidder
                </button>
                <button disabled={busy || unsoldDisabled} onClick={() => void unsold()} className="btn-ghost disabled:cursor-not-allowed disabled:opacity-45" type="button">
                  <XCircle size={17} /> Unsold
                </button>
                <button disabled={busy || data.auction?.auction_status !== 'LIVE'} onClick={() => void nextRandom()} className="btn-ghost disabled:cursor-not-allowed disabled:opacity-45" type="button">
                  <Shuffle size={17} /> Next Player Random
                </button>
              </div>
            </Panel>

            <Panel title="Bid History" icon={<BadgeDollarSign className="text-green-300" />}>
              {data.bids.length === 0 ? (
                <MiniEmpty title="No bids yet" />
              ) : (
                <div className="grid max-h-[350px] gap-2 overflow-y-auto pr-1 soft-scrollbar">
                  {data.bids.slice(0, 10).map((bid) => (
                    <div key={bid.id} className="flex items-center justify-between gap-3 rounded-2xl bg-black/20 p-3">
                      <span className="truncate font-bold text-white">{bid.team_name}</span>
                      <span className="shrink-0 font-black text-green-300">{formatMoney(bid.bid_amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <Panel title="Manual Team Fixes" icon={<Edit3 className="text-yellow-300" />}>
            <p className="mb-4 text-sm text-white/55">Assign unsold player, remove player from team, or edit sold price.</p>
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_160px_auto]">
              <select className="input" value={manual.player_id} onChange={(event) => setManual({ ...manual, player_id: event.target.value })}>
                <option value="">Choose unsold/available player</option>
                {[...unsoldPlayers, ...approvedPending].map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>

              <select className="input" value={manual.team_id} onChange={(event) => setManual({ ...manual, team_id: event.target.value })}>
                <option value="">Choose team</option>
                {data.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.team_name}
                  </option>
                ))}
              </select>

              <input className="input" value={manual.price} onChange={(event) => setManual({ ...manual, price: event.target.value })} type="number" min="0" placeholder="Price" />

              <button disabled={busy} onClick={() => void manualAssign()} className="btn-primary disabled:opacity-50" type="button">
                Assign
              </button>
            </div>
          </Panel>

          <Panel title="Teams & Budgets" icon={<WalletCards className="text-green-300" />}>
            {data.teams.length === 0 ? (
              <MiniEmpty title="No teams created yet" />
            ) : (
              <div className="grid gap-4">
                {data.teams.map((team) => {
                  const bought = boughtPlayersForTeam(data.players, team);
                  const full = bought.length >= (team.max_players || 4);
                  const captain = data.captains.find(
                    (item) => item.id === team.captain_id || item.team_id === team.id || item.captain_name === team.captain_name,
                  );

                  return (
                    <article key={team.id} className="rounded-[1.7rem] border border-white/10 bg-black/18 p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <Avatar src={team.logo_url} label={team.team_name} size="lg" />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-2xl font-black text-white">{team.team_name}</h3>
                          <div className="mt-2 flex items-center gap-2 text-sm text-white/55">
                            <Avatar src={captain?.photo_url || team.captain_photo_url} label={team.captain_name} size="xs" />
                            <span>Captain: {team.captain_name}</span>
                          </div>
                        </div>
                        {full && <span className="badge border-green-300/20 bg-green-300/10 text-green-200">Team Full</span>}
                      </div>

                      <p className="mt-4 text-sm text-white/55">
                        Remaining: {formatMoney(team.remaining_budget)} • Spent: {formatMoney(computeTeamSpent(data.players, team))} • Players:{' '}
                        {bought.length}/{team.max_players || 4}
                      </p>

                      <div className="mt-4 grid gap-2">
                        {bought.length === 0 && <p className="text-sm text-white/45">No bought players.</p>}
                        {bought.map((player) => (
                          <div key={player.id} className="flex flex-col gap-2 rounded-2xl bg-black/22 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                              <Avatar src={player.photo_url} label={player.name} size="sm" />
                              <div className="min-w-0">
                                <p className="truncate font-bold text-white">{player.name}</p>
                                <p className="text-xs text-white/50">{formatMoney(player.sold_price)}</p>
                              </div>
                            </div>
                            <div className="flex gap-3 text-sm">
                              <button onClick={() => void editPrice(player)} className="font-bold text-yellow-300" type="button">
                                Edit price
                              </button>
                              <button onClick={() => void removePlayer(player.id)} className="inline-flex items-center gap-1 font-bold text-red-200" type="button">
                                <Trash2 size={14} /> Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </Panel>

          <div className="grid gap-7 lg:grid-cols-2">
            <Panel title="Sold / Unsold" icon={<Trophy className="text-yellow-300" />}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Small label="Sold" value={soldPlayers.length} green />
                <Small label="Unsold" value={unsoldPlayers.length} />
              </div>
              <div className="mt-4 grid gap-2">
                {unsoldPlayers.length === 0 ? (
                  <MiniEmpty title="No unsold players yet" />
                ) : (
                  unsoldPlayers.map((player) => (
                    <p key={player.id} className="rounded-2xl bg-black/20 p-3 text-sm text-white/65">
                      {player.name}
                    </p>
                  ))
                )}
              </div>
            </Panel>

            <Panel title="Auction Reports" icon={<Trophy className="text-green-300" />}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Small label="Total approved" value={data.summary?.totalApprovedPlayers ?? approvedPending.length + soldPlayers.length + unsoldPlayers.length} />
                <Small label="Total sold" value={data.summary?.totalSoldPlayers ?? soldPlayers.length} green />
                <Small label="Most expensive" value={data.summary?.mostExpensivePlayer?.name || 'None'} />
                <Small label="Cheapest sold" value={data.summary?.cheapestSoldPlayer?.name || 'None'} />
              </div>
            </Panel>
          </div>

          <Panel title="Rejected Players" icon={<XCircle className="text-red-200" />}>
            {rejectedPlayers.length === 0 ? (
              <MiniEmpty title="No rejected players" />
            ) : (
              <div className="grid gap-2">
                {rejectedPlayers.map((player) => (
                  <div key={player.id} className="flex items-center gap-3 rounded-2xl bg-black/20 p-3">
                    <Avatar src={player.photo_url} label={player.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-white">{player.name}</p>
                      <p className="text-xs text-white/50">{player.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Live Events" icon={<Users className="text-green-300" />}>
            {data.events.length === 0 ? (
              <MiniEmpty title="No events yet" />
            ) : (
              <div className="grid max-h-[360px] gap-2 overflow-y-auto pr-1 soft-scrollbar">
                {data.events.slice(0, 12).map((event) => (
                  <p key={event.id} className="rounded-2xl bg-black/20 p-3 text-sm leading-5 text-white/65">
                    {event.message}
                  </p>
                ))}
              </div>
            )}
          </Panel>
        </main>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-bold text-white/80">
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="premium-card rounded-[2rem] p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.06]">{icon}</div>
        <h2 className="text-xl font-black text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: ReactNode; icon: ReactNode }) {
  return (
    <div className="premium-card rounded-[1.7rem] p-4">
      <div className="flex items-center gap-2 text-yellow-300">
        {icon}
        <p className="text-xs font-black uppercase tracking-wider text-white/42">{label}</p>
      </div>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function Small({ label, value, green }: { label: string; value: ReactNode; green?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${green ? 'border-green-300/25 bg-green-300/10' : 'border-white/10 bg-black/20'}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-white/42">{label}</p>
      <p className={`mt-1 break-words text-xl font-black ${green ? 'text-green-300' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function MiniEmpty({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/12 bg-black/12 p-5 text-center">
      <p className="font-black text-white/80">{title}</p>
      {description && <p className="mt-1 text-sm text-white/45">{description}</p>}
    </div>
  );
}

function Avatar({
  src,
  label,
  size = 'md',
}: {
  src?: string | null;
  label: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
}) {
  const sizes = {
    xs: 'h-6 w-6 text-[9px] rounded-full',
    sm: 'h-9 w-9 text-[10px] rounded-xl',
    md: 'h-12 w-12 text-xs rounded-2xl',
    lg: 'h-16 w-16 text-sm rounded-2xl',
    xl: 'h-24 w-24 text-xl rounded-[1.4rem]',
    xxl: 'h-36 w-36 text-2xl rounded-[1.8rem]',
  };

  if (src) {
    return <img src={src} alt={label} loading="lazy" className={`${sizes[size]} shrink-0 border border-white/10 object-cover shadow-lg shadow-black/30`} />;
  }

  return (
    <div className={`${sizes[size]} flex shrink-0 items-center justify-center border border-yellow-300/20 bg-yellow-300/15 font-black text-yellow-300`}>
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
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/18 p-3">
      <input id={title} type="file" accept="image/*" className="hidden" onChange={(event) => onChange(event.target.files?.[0] || null)} />

      <div className="flex items-center gap-3">
        {preview ? (
          <img src={preview} alt={title} className="h-14 w-14 rounded-2xl object-cover" />
        ) : (
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-dashed border-yellow-300/35 text-yellow-300">
            <ImagePlus size={20} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-black text-white">{title}</p>
          <p className="truncate text-xs text-white/48">{file ? `${file.name} • ${fileSizeLabel(file.size)}` : description}</p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <label htmlFor={title} className="btn-ghost flex-1 cursor-pointer px-3 py-2 text-xs">
          Choose
        </label>
        {file && (
          <button type="button" onClick={onRemove} className="btn-danger px-3 py-2 text-xs">
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
