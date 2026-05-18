-- APL TEAM + CAPTAIN SAVING SYSTEM REPAIR
-- Run this once in Supabase SQL Editor.
-- It does NOT delete admin login.

create extension if not exists pgcrypto;

create table if not exists public.captains (
  id uuid primary key default gen_random_uuid(),
  captain_name text,
  team_name text,
  team_id uuid,
  password_hash text,
  budget integer not null default 50000,
  remaining_budget integer not null default 50000,
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  team_name text,
  captain_id uuid,
  captain_name text,
  budget integer not null default 50000,
  remaining_budget integer not null default 50000,
  max_players integer not null default 4,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.captains add column if not exists captain_name text;
alter table public.captains add column if not exists team_name text;
alter table public.captains add column if not exists team_id uuid;
alter table public.captains add column if not exists password_hash text;
alter table public.captains add column if not exists budget integer not null default 50000;
alter table public.captains add column if not exists remaining_budget integer not null default 50000;
alter table public.captains add column if not exists created_at timestamptz not null default now();

alter table public.teams add column if not exists team_name text;
alter table public.teams add column if not exists captain_id uuid;
alter table public.teams add column if not exists captain_name text;
alter table public.teams add column if not exists budget integer not null default 50000;
alter table public.teams add column if not exists remaining_budget integer not null default 50000;
alter table public.teams add column if not exists max_players integer not null default 4;
alter table public.teams add column if not exists created_at timestamptz not null default now();
alter table public.teams add column if not exists updated_at timestamptz not null default now();

update public.captains
set
  captain_name = trim(captain_name),
  team_name = trim(team_name),
  budget = coalesce(budget, 50000),
  remaining_budget = coalesce(remaining_budget, budget, 50000)
where true;

update public.teams
set
  team_name = trim(team_name),
  captain_name = trim(captain_name),
  budget = coalesce(budget, 50000),
  remaining_budget = coalesce(remaining_budget, budget, 50000),
  max_players = coalesce(max_players, 4),
  updated_at = coalesce(updated_at, now())
where true;

-- Add unique constraints only if they are missing.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.teams'::regclass
      and conname = 'teams_team_name_key'
  ) then
    alter table public.teams add constraint teams_team_name_key unique (team_name);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.captains'::regclass
      and conname = 'captains_captain_name_key'
  ) then
    alter table public.captains add constraint captains_captain_name_key unique (captain_name);
  end if;
end $$;

select pg_notify('pgrst', 'reload schema');
