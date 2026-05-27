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

type ImportableItem = Team | Captain | Player;

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

    if (!res.ok) {
      throw new Error(json.error || 'Request failed.');
    }

    return json;
  }

  async function load() {
    const [currentRes, seasonsRes] = await Promise.all([
      fetch('/api/season/current', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/seasons', { cache: 'no-store' }).then((r) => r.json()),
    ]);

    const allSeasons = (seasonsRes.seasons || []) as Season[];

    setCurrent((currentRes.season || null) as Season | null);
    setSeasons(allSeasons);

    const nextNumber =
      allSeasons.reduce((max, season) => Math.max(max, Number(season.season_number || 0)), 5) + 1;

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

      if (alive && json?.season) {
        setDetails(json as SeasonDetails);
      }
    }

    void loadDetails();

    return () => {
      alive = false;
    };
  }, [sourceSeasonId]);

  async function endSeason() {
    if (!current) {
      toast('No active season to end.');
      return;
    }

    const ok = confirm(
      `Are you sure you want to end ${current.name}? This will stop the current season but will not delete any data.`,
    );

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

    if (!Number.isInteger(number) || number <= 0) {
      toast('Enter a valid season number.');
      return;
    }

    if (current) {
      toast(`${current.name} is still active. End it first.`);
      return;
    }

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
    if (!sourceSeasonId) {
      toast('Choose an old season first.');
      return;
    }

    if (!current) {
      toast('Start a new active season first.');
      return;
    }

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

  const selectable: ImportableItem[] =
    importType === 'teams'
      ? details?.teams || []
      : importType === 'captains'
        ? details?.captains || []
        : importType === 'players'
          ? details?.players || []
          : [];

  function itemLabel(item: ImportableItem) {
    if (importType === 'teams') {
      const team = item as Team;
      return `${team.team_name}${team.captain_name ? ` / ${team.captain_name}` : ''}`;
    }

    if (importType === 'captains') {
      const captain = item as Captain;
      return `${captain.team_name} / ${captain.captain_name}`;
    }

    const player = item as Player;
    return player.name;
  }

  return (
    <section className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur md:p-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-yellow-300">
            <History size={15} /> Season Management
          </p>
          <h2 className="mt-3 text-3xl font-black text-white">
            {current ? `Current Season: ${current.name}` : 'No Current Season Going'}
          </h2>
          <p className="mt-2 max-w-2xl text-white/55">
            End current season safely, start next APL season, and import old data without deleting anything.
          </p>
        </div>

        <button type="button" onClick={() => void load()} className="btn-ghost">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-red-300/15 bg-red-500/10 p-5">
          <h3 className="flex items-center gap-2 text-xl font-black text-white">
            <AlertTriangle className="text-red-300" /> End Season
          </h3>
          <p className="mt-2 text-sm text-white/55">
            Danger action. It will end the season but will not delete players, teams, bids, or auction data.
          </p>

          <button
            type="button"
            onClick={() => void endSeason()}
            disabled={!current || busy}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-500 px-5 py-3 font-black text-white shadow-lg shadow-red-500/20 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Square size={16} />
            {current ? `END SEASON ${current.name}` : 'NO ACTIVE SEASON'}
          </button>
        </div>

        <div className="rounded-3xl border border-green-300/15 bg-green-500/10 p-5">
          <h3 className="flex items-center gap-2 text-xl font-black text-white">
            <Play className="text-green-300" /> Start New Season
          </h3>
          <p className="mt-2 text-sm text-white/55">Disabled while a current season is active.</p>

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
            <button
              type="button"
              onClick={() => void startSeason()}
              disabled={Boolean(current) || busy}
              className="btn-primary justify-center disabled:opacity-45"
            >
              START SEASON APL {seasonNumber || '?'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-black/15 p-5">
        <h3 className="flex items-center gap-2 text-xl font-black text-white">
          <Import className="text-yellow-300" /> Import From Old Season
        </h3>
        <p className="mt-2 text-sm text-white/55">
          Copies data into the current season. Old season remains unchanged.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <select className="input" value={sourceSeasonId} onChange={(event) => setSourceSeasonId(event.target.value)}>
            <option value="">Choose old season</option>
            {oldSeasons.map((season) => (
              <option value={season.id} key={season.id}>
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

          <button
            type="button"
            onClick={() => void importSelected()}
            disabled={!current || !sourceSeasonId || busy}
            className="btn-primary justify-center disabled:opacity-45"
          >
            Import
          </button>
        </div>

        {importType !== 'all' && (
          <div className="mt-5 grid gap-2">
            {selectable.length === 0 ? (
              <p className="rounded-2xl bg-white/[0.04] p-4 text-sm text-white/50">
                Select an old season to choose records.
              </p>
            ) : (
              selectable.map((item) => {
                const label = itemLabel(item);

                return (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-white/75"
                  >
                    <input
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggle(item.id)}
                      type="checkbox"
                      className="h-5 w-5 accent-green-400"
                    />
                    <CheckSquare size={16} className="text-green-300" />
                    {label}
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
