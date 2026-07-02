-- PATH: supabase/admin_team_captain_system.sql
-- Run this in Supabase SQL Editor if the Add Team + Captain form gives a missing-column/table error.

create extension if not exists pgcrypto;

create table if not exists public.captains (
  id uuid primary key default gen_random_uuid(),
  captain_name text not null unique,
  team_name text not null unique,
  team_id uuid,
  password_hash text not null,
  budget integer not null default 50000,
  remaining_budget integer not null default 50000,
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  team_name text not null unique,
  captain_id uuid not null references public.captains(id) on delete cascade,
  captain_name text not null,
  budget integer not null default 50000,
  remaining_budget integer not null default 50000,
  max_players integer not null default 4,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.captains add column if not exists team_id uuid;
alter table public.captains add column if not exists password_hash text;
alter table public.captains add column if not exists budget integer not null default 50000;
alter table public.captains add column if not exists remaining_budget integer not null default 50000;

alter table public.teams add column if not exists max_players integer not null default 4;
alter table public.teams add column if not exists updated_at timestamptz not null default now();

create unique index if not exists captains_captain_name_unique_idx on public.captains (lower(captain_name));
create unique index if not exists teams_team_name_unique_idx on public.teams (lower(team_name));

select pg_notify('pgrst', 'reload schema');
