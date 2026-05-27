'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckSquare, History, Import, Play, RefreshCw, Square } from 'lucide-react';
import { readSession } from '@/hooks/useSession';
import type { Captain, Player, Season, Team } from '@/lib/types';
import { toast } from '@/components/ui/AppToaster';

type SeasonDetails = {
  season: Season;
  teams: Team[];
  captains: Captain[];
  players: Player[];
};

type ImportType = 'teams' | 'captains' | 'players' | 'all';

export function SeasonManagementPanel() {
  const [current, setCurrent] = useState<Season | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonNumber, setSeasonNumber] = useState('6');
  const [busy, setBusy] = useState(false);
  const [sourceSeasonId, setSourceSeasonId] = useState('');
  const [importType, setImportType] = useState<ImportType>('all');
  const [details, setDetails] = useState<SeasonDetails | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const oldSeasons = useMemo(() => seasons.filter((season) => season.status === 'ended'), [seasons]);

  async function authFetch(path: string, options: RequestInit = {}) {
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

    if (!res.ok) throw new Error(json.error || 'Request failed.');

    return json;
  }

  async function load() {
    const [currentRes, seasonsRes] = await Promise.all([
      fetch('/api/season/current', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/seasons', { cache: 'no-store' }).then((r) => r.json()),
    ]);

    setCurrent(currentRes.season || null);
    setSeasons(seasonsRes.seasons || []);

    const nextNumber =
      (seasonsRes.seasons || []).reduce((max: number, season: Season) => Math.max(max, Number(season.season_number || 0)), 5) + 1;
    setSeasonNumber(String(nextNumber));
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!sourceSeasonId) {
      setDetails(null);
      setSelectedIds([]);
      return;
    }

    let alive = true;

    async function loadDetails() {
      const res = await fetch(`/api/seasons/${sourceSeasonId}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);

      if (alive && json?.season) setDetails(json);
    }

    void loadDetails();

    return () => {
      alive = false;
    };
  }, [sourceSeasonId]);

  async function endSeason() {
    if (!current) return toast('No active season to end.');

    const ok = confirm(`Are you sure you want to end ${current.name}? This will stop the current season but will not delete any data.`);
    if (!ok) return;

    setBusy(true);
    try {
      await authFetch('/api/admin/seasons/end', { method: 'POST', body: '{}' });
      toast(`${current.name} ended. Old data is saved.`);
      await load();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not end season.');
    } finally {
      setBusy(false);
    }
  }

  async function startSeason() {
    const number = Number(seasonNumber);

    if (!Number.isInteger(number) || number <= 0) return toast('Enter a valid season number.');
    if (current) return toast(`${current.name} is still active. End it first.`);

    setBusy(true);
    try {
      await authFetch('/api/admin/seasons/start', {
        method: 'POST',
        body: JSON.stringify({ season_number: number }),
      });
      toast(`APL ${number} started.`);
      await load();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not start season.');
    } finally {
      setBusy(false);
    }
  }

  function toggle(id: string) {
    setSelectedIds((old) => (old.includes(id) ? old.filter((item) => item !== id) : [...old, id]));
  }

  async function importSelected() {
    if (!sourceSeasonId) return toast('Choose an old season first.');
    if (!current) return toast('Start a new active season first.');

    setBusy(true);
    try {
      await authFetch('/api/admin/seasons/import', {
        method: 'POST',
        body: JSON.stringify({
          source_season_id: sourceSeasonId,
          import_type: importType,
          ids: selectedIds,
        }),
      });
      toast('Old season data imported into current season.');
      setSelectedIds([]);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not import old season data.');
    } finally {
      setBusy(false);
    }
  }

  const selectable =
    importType === 'teams'
      ? details?.teams || []
      : importType === 'captains'
        ? details?.captains || []
        : importType === 'players'
          ? details?.players || []
          : [];

  return (
    <section className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur md:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-yellow-300">
            <History size={15} /> Season Management
          </p>
          <h2 className="mt-4 text-3xl font-black text-white md:text-4xl">{current ? `Current Season: ${current.name}` : 'No Current Season Going'}</h2>
          <p className="mt-2 text-white/55">End current season safely, start next APL season, and import old data without deleting anything.</p>
        </div>

        <button type="button" onClick={() => void load()} className="btn-ghost">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-red-300/20 bg-red-400/10 p-5">
          <h3 className="flex items-center gap-2 text-xl font-black text-red-100">
            <AlertTriangle size={20} /> End Season
          </h3>
          <p className="mt-2 text-sm text-red-100/75">Danger action. It will end the season but will not delete players, teams, bids, or auction data.</p>
          <button
            type="button"
            onClick={() => void endSeason()}
            disabled={!current || busy}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-500 px-5 py-3 font-black text-white shadow-lg shadow-red-500/20 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Square size={17} /> {current ? `END SEASON ${current.name}` : 'NO ACTIVE SEASON'}
          </button>
        </div>

        <div className="rounded-3xl border border-green-300/20 bg-green-300/10 p-5">
          <h3 className="flex items-center gap-2 text-xl font-black text-green-100">
            <Play size={20} /> Start New Season
          </h3>
          <p className="mt-2 text-sm text-green-100/75">Disabled while a current season is active.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              value={seasonNumber}
              onChange={(event) => setSeasonNumber(event.target.value)}
              type="number"
              min="1"
              className="input flex-1"
              placeholder="6"
              disabled={Boolean(current) || busy}
            />
            <button type="button" onClick={() => void startSeason()} disabled={Boolean(current) || busy} className="btn-primary justify-center disabled:opacity-45">
              START SEASON APL {seasonNumber || '?'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-7 rounded-3xl border border-white/10 bg-black/20 p-5">
        <h3 className="flex items-center gap-2 text-xl font-black text-white">
          <Import size={20} className="text-yellow-300" /> Import From Old Season
        </h3>
        <p className="mt-2 text-sm text-white/55">Copies data into the current season. Old season remains unchanged.</p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <select className="input" value={sourceSeasonId} onChange={(event) => setSourceSeasonId(event.target.value)}>
            <option value="">Choose old season</option>
            {oldSeasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={importType}
            onChange={(event) => {
              setImportType(event.target.value as ImportType);
              setSelectedIds([]);
            }}
          >
            <option value="all">Import all</option>
            <option value="teams">Specific teams</option>
            <option value="captains">Specific captains</option>
            <option value="players">Specific players</option>
          </select>

          <button type="button" onClick={() => void importSelected()} disabled={!current || !sourceSeasonId || busy} className="btn-primary justify-center disabled:opacity-45">
            <CheckSquare size={16} /> Import
          </button>
        </div>

        {importType !== 'all' && (
          <div className="mt-5 grid max-h-72 gap-2 overflow-y-auto pr-1">
            {selectable.length === 0 ? (
              <p className="rounded-2xl bg-white/[0.04] p-4 text-sm text-white/55">Select an old season to choose records.</p>
            ) : (
              selectable.map((item: Team | Captain | Player) => {
                const label =
                  'team_name' in item
                    ? 'captain_name' in item
                      ? `${item.team_name} / ${item.captain_name}`
                      : item.team_name
                    : item.name;

                return (
                  <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <input checked={selectedIds.includes(item.id)} onChange={() => toggle(item.id)} type="checkbox" className="h-5 w-5 accent-green-400" />
                    <span className="font-bold text-white">{label}</span>
                  </label>
                );
              })
            )}
          </div>
        )}
      </div>
    </section>
  );
}
