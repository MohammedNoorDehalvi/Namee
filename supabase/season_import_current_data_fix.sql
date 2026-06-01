-- PATH: supabase/season_import_current_data_fix.sql
-- FINAL OLD SEASON IMPORT FIX
-- Safe: does not delete data.

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
  order by started_at desc nulls last, created_at desc
  limit 1;

  if active_id is not null then
    update public.players set season_id = active_id where season_id is null;
    update public.teams set season_id = active_id where season_id is null;
    update public.captains set season_id = active_id where season_id is null;
    update public.bids set season_id = active_id where season_id is null;
    update public.auction set season_id = active_id where season_id is null;
  end if;
end $$;

-- Drop old global unique constraints. These stopped importing the same names into APL 6.
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
    select
      conrelid::regclass::text as table_name,
      conname
    from pg_constraint
    where contype = 'u'
      and conrelid in ('public.teams'::regclass, 'public.captains'::regclass)
      and exists (
        select 1
        from unnest(conkey) as cols(attnum)
        join pg_attribute a
          on a.attrelid = conrelid
         and a.attnum = cols.attnum
        where a.attname in ('team_name', 'captain_name')
      )
  loop
    execute format('alter table %s drop constraint if exists %I', r.table_name, r.conname);
  end loop;
end $$;

do $$
declare
  r record;
begin
  for r in
    select
      n.nspname as schema_name,
      idx.relname as index_name
    from pg_index i
    join pg_class idx on idx.oid = i.indexrelid
    join pg_namespace n on n.oid = idx.relnamespace
    join pg_class tbl on tbl.oid = i.indrelid
    where tbl.oid in ('public.teams'::regclass, 'public.captains'::regclass)
      and i.indisunique = true
      and i.indisprimary = false
      and pg_get_indexdef(idx.oid) ilike any (array['%team_name%', '%captain_name%'])
  loop
    execute format('drop index if exists %I.%I', r.schema_name, r.index_name);
  end loop;
end $$;

create index if not exists teams_season_team_name_lookup_idx
on public.teams (season_id, lower(team_name));

create index if not exists captains_season_captain_name_lookup_idx
on public.captains (season_id, lower(captain_name));

create index if not exists captains_season_team_name_lookup_idx
on public.captains (season_id, lower(team_name));

create index if not exists players_season_name_lookup_idx
on public.players (season_id, lower(name));

select pg_notify('pgrst', 'reload schema');

select
  conrelid::regclass::text as table_name,
  conname,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where contype = 'u'
  and conrelid in ('public.teams'::regclass, 'public.captains'::regclass)
  and pg_get_constraintdef(oid) ilike any (array['%team_name%', '%captain_name%']);
