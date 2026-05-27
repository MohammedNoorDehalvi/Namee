-- PATH: supabase/season_management_bid_lock.sql
-- APL Season Management + Bid Lock System
-- Safe migration: creates missing tables first and never deletes existing data.

create extension if not exists pgcrypto;

-- 1) Seasons
create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  season_number integer not null unique,
  name text not null,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint seasons_status_check check (status in ('active', 'ended'))
);

-- Prevent more than one active season. If old test data accidentally has many active
-- seasons, keep the latest one active and mark older ones ended before adding the index.
do $$
declare latest_active_id uuid;
begin
  select id
  into latest_active_id
  from public.seasons
  where status = 'active'
  order by started_at desc nulls last, created_at desc
  limit 1;

  if latest_active_id is not null then
    update public.seasons
    set status = 'ended', ended_at = coalesce(ended_at, now())
    where status = 'active'
      and id <> latest_active_id;
  end if;
end $$;

create unique index if not exists seasons_only_one_active_idx
on public.seasons ((status))
where status = 'active';

-- Create APL 5 as active if no season exists yet.
insert into public.seasons (season_number, name, status, started_at)
select 5, 'APL 5', 'active', now()
where not exists (select 1 from public.seasons);

-- 2) Ensure season-aware tables used by the routes exist before ALTER TABLE.
create table if not exists public.auction (
  id integer primary key default 1,
  current_player_id uuid,
  auction_status text not null default 'NOT_STARTED',
  highest_bid integer not null default 0,
  highest_bidder_id uuid,
  highest_bidder_team_id uuid,
  highest_bidder_captain_name text,
  highest_team_name text,
  manual_picker_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz
);

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  player_id uuid,
  captain_id uuid,
  captain_name text,
  team_id uuid,
  team_name text,
  bid_amount integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.auction_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null default 'STATUS',
  message text not null default '',
  player_id uuid,
  team_id uuid,
  captain_id uuid,
  amount integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.auction_action_history (
  id uuid primary key default gen_random_uuid(),
  action_type text not null default 'STATUS',
  player_id uuid,
  previous_player jsonb,
  previous_auction jsonb,
  previous_team jsonb,
  event_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons(id) on delete set null,
  team_a_id uuid,
  team_b_id uuid,
  venue text,
  match_date timestamptz,
  status text not null default 'upcoming',
  winner_team_id uuid,
  toss_winner_id uuid,
  created_by_ai boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.points_table (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons(id) on delete cascade,
  team_id uuid,
  matches_played integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  no_result integer not null default 0,
  points integer not null default 0,
  net_run_rate numeric not null default 0,
  runs_scored integer not null default 0,
  overs_faced numeric not null default 0,
  runs_conceded integer not null default 0,
  overs_bowled numeric not null default 0,
  created_at timestamptz not null default now()
);

-- 3) Add season_id safely to existing tables.
alter table public.players add column if not exists season_id uuid references public.seasons(id) on delete set null;
alter table public.teams add column if not exists season_id uuid references public.seasons(id) on delete set null;
alter table public.captains add column if not exists season_id uuid references public.seasons(id) on delete set null;
alter table public.bids add column if not exists season_id uuid references public.seasons(id) on delete set null;
alter table public.auction_events add column if not exists season_id uuid references public.seasons(id) on delete set null;
alter table public.auction_action_history add column if not exists season_id uuid references public.seasons(id) on delete set null;
alter table public.auction add column if not exists season_id uuid references public.seasons(id) on delete set null;

-- Keep existing current data connected to the active season.
do $$
declare active_id uuid;
begin
  select id into active_id
  from public.seasons
  where status = 'active'
  order by started_at desc
  limit 1;

  if active_id is not null then
    update public.players set season_id = active_id where season_id is null;
    update public.teams set season_id = active_id where season_id is null;
    update public.captains set season_id = active_id where season_id is null;
    update public.bids set season_id = active_id where season_id is null;
    update public.auction_events set season_id = active_id where season_id is null;
    update public.auction_action_history set season_id = active_id where season_id is null;
    update public.auction set season_id = active_id where season_id is null;
  end if;
end $$;

-- 4) Auction bid lock columns.
alter table public.auction add column if not exists bid_processing boolean not null default false;
alter table public.auction add column if not exists bid_lock_started_at timestamptz;
alter table public.auction add column if not exists bid_lock_player_id uuid;

update public.auction
set bid_processing = false
where bid_processing is null;

-- 5) Bid table missing columns used by newer routes.
alter table public.bids add column if not exists captain_name text;
alter table public.bids add column if not exists team_id uuid;
alter table public.bids add column if not exists team_name text;
alter table public.bids add column if not exists bid_amount integer not null default 0;
alter table public.bids add column if not exists created_at timestamptz not null default now();

-- 6) Atomic bid lock function.
create or replace function public.acquire_auction_bid_lock(p_player_id uuid, p_captain_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare changed_count integer;
begin
  update public.auction
  set
    bid_processing = true,
    bid_lock_started_at = now(),
    bid_lock_player_id = p_player_id,
    updated_at = now()
  where id = 1
    and current_player_id = p_player_id
    and (
      bid_processing = false
      or bid_processing is null
      or bid_lock_started_at is null
      or bid_lock_started_at < now() - interval '12 seconds'
    );

  get diagnostics changed_count = row_count;
  return changed_count = 1;
end;
$$;

-- 7) Helpful indexes.
create index if not exists players_season_id_idx on public.players(season_id);
create index if not exists teams_season_id_idx on public.teams(season_id);
create index if not exists captains_season_id_idx on public.captains(season_id);
create index if not exists bids_season_id_idx on public.bids(season_id);
create index if not exists bids_player_id_created_idx on public.bids(player_id, created_at desc);
create index if not exists auction_events_season_id_idx on public.auction_events(season_id);

select pg_notify('pgrst', 'reload schema');
