-- PATH: supabase/season_import_current_data_fix.sql
-- Fix old-season import, current-season player list, and duplicate team/captain names across seasons.
-- Safe: does not delete old data.

create extension if not exists pgcrypto;

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  season_number integer not null unique,
  name text not null,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

insert into public.seasons (season_number, name, status, started_at)
select 5, 'APL 5', 'active', now()
where not exists (select 1 from public.seasons);

alter table public.players add column if not exists season_id uuid references public.seasons(id) on delete set null;
alter table public.teams add column if not exists season_id uuid references public.seasons(id) on delete set null;
alter table public.captains add column if not exists season_id uuid references public.seasons(id) on delete set null;
alter table public.bids add column if not exists season_id uuid references public.seasons(id) on delete set null;
alter table public.auction add column if not exists season_id uuid references public.seasons(id) on delete set null;

do $$
declare
  active_id uuid;
begin
  select id
  into active_id
  from public.seasons
  where status = 'active'
  order by started_at desc, created_at desc
  limit 1;

  if active_id is not null then
    update public.players set season_id = active_id where season_id is null;
    update public.teams set season_id = active_id where season_id is null;
    update public.captains set season_id = active_id where season_id is null;
    update public.bids set season_id = active_id where season_id is null;
    update public.auction set season_id = active_id where season_id is null;
  end if;
end $$;

-- Old schema had global unique constraints. That blocks copying the same team/captain into APL 6.
alter table if exists public.teams drop constraint if exists teams_team_name_key;
alter table if exists public.captains drop constraint if exists captains_captain_name_key;
alter table if exists public.captains drop constraint if exists captains_team_name_key;

drop index if exists public.teams_team_name_key;
drop index if exists public.captains_captain_name_key;
drop index if exists public.captains_team_name_key;

do $$
declare
  r record;
begin
  for r in
    select conrelid::regclass::text as table_name, conname
    from pg_constraint
    where contype = 'u'
      and conrelid in ('public.teams'::regclass, 'public.captains'::regclass)
      and (
        pg_get_constraintdef(oid) ilike '%team_name%'
        or pg_get_constraintdef(oid) ilike '%captain_name%'
      )
  loop
    execute format('alter table %s drop constraint if exists %I', r.table_name, r.conname);
  end loop;
end $$;

select pg_notify('pgrst', 'reload schema');
