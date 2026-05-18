-- APL Online Auction Supabase schema
-- Run this inside Supabase Dashboard > SQL Editor.
-- Dummy logins created at bottom:
-- Captain: Faiz / apl123
-- Admin: admin@apl.com / admin123

create extension if not exists pgcrypto;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  role text not null check (role in ('Batter','Bowler','All-rounder','Wicketkeeper')),
  batting_style text not null check (batting_style in ('Right Hand','Left Hand')),
  bowling_style text not null check (bowling_style in ('Fast','Medium','Spin','None')),
  base_price integer,
  photo_url text,
  status text not null default 'Available' check (status in ('Available','Sold','Unsold')),
  approval_status text not null default 'Pending' check (approval_status in ('Pending','Approved','Rejected')),
  current_bid integer default 0,
  sold_to_team text,
  sold_to_captain_id uuid,
  sold_price integer,
  created_at timestamptz not null default now()
);

create table if not exists public.captains (
  id uuid primary key default gen_random_uuid(),
  captain_name text not null unique,
  team_name text not null unique,
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
  created_at timestamptz not null default now()
);

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  captain_id uuid not null references public.captains(id) on delete cascade,
  team_name text not null,
  bid_amount integer not null check (bid_amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.auction (
  id integer primary key default 1 check (id = 1),
  current_player_id uuid references public.players(id) on delete set null,
  auction_status text not null default 'Not Started' check (auction_status in ('Not Started','Live','Sold','Unsold')),
  highest_bid integer not null default 0,
  highest_bidder_id uuid references public.captains(id) on delete set null,
  highest_team_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin (
  id uuid primary key default gen_random_uuid(),
  admin_name text not null unique,
  email text unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create or replace function public.sync_team_from_captain()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.teams (team_name, captain_id, captain_name, budget, remaining_budget)
  values (new.team_name, new.id, new.captain_name, new.budget, new.remaining_budget)
  on conflict (team_name) do update
  set captain_id = excluded.captain_id,
      captain_name = excluded.captain_name,
      budget = excluded.budget,
      remaining_budget = excluded.remaining_budget;
  return new;
end;
$$;

drop trigger if exists captains_sync_team on public.captains;
create trigger captains_sync_team
after insert or update of captain_name, team_name, budget, remaining_budget
on public.captains
for each row execute function public.sync_team_from_captain();

insert into public.auction (id, auction_status, highest_bid)
values (1, 'Not Started', 0)
on conflict (id) do nothing;

-- Storage bucket for player photos.
insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do update set public = true;

alter table public.players enable row level security;
alter table public.captains enable row level security;
alter table public.teams enable row level security;
alter table public.bids enable row level security;
alter table public.auction enable row level security;
alter table public.admin enable row level security;

drop policy if exists "Public can read approved players" on public.players;
create policy "Public can read approved players"
on public.players for select
using (approval_status = 'Approved');

drop policy if exists "Anyone can register pending players" on public.players;
create policy "Anyone can register pending players"
on public.players for insert
with check (
  approval_status = 'Pending'
  and status = 'Available'
  and base_price is null
);

drop policy if exists "Public can read auction" on public.auction;
create policy "Public can read auction"
on public.auction for select
using (true);

drop policy if exists "Public can read bids" on public.bids;
create policy "Public can read bids"
on public.bids for select
using (true);

drop policy if exists "Public can read teams" on public.teams;
create policy "Public can read teams"
on public.teams for select
using (true);

-- No anon policies for captains or admin tables. Server API uses SUPABASE_SERVICE_ROLE_KEY only.
-- This keeps password_hash hidden from frontend users.

drop policy if exists "Public can read player photos" on storage.objects;
create policy "Public can read player photos"
on storage.objects for select
using (bucket_id = 'player-photos');

drop policy if exists "Anyone can upload player photos" on storage.objects;
create policy "Anyone can upload player photos"
on storage.objects for insert
with check (bucket_id = 'player-photos');

-- Realtime publication for live updates.
do $$
begin
  alter publication supabase_realtime add table public.players;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.auction;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.bids;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.teams;
exception when duplicate_object then null;
end $$;

-- Dummy data
insert into public.players
(name, phone, role, batting_style, bowling_style, base_price, status, approval_status, current_bid)
values
('Kabir', '9999999999', 'Batter', 'Right Hand', 'None', 100, 'Available', 'Approved', 100)
on conflict do nothing;

insert into public.captains
(captain_name, team_name, password_hash, budget, remaining_budget)
values
('Faiz', 'Faiz XI', crypt('apl123', gen_salt('bf')), 50000, 50000)
on conflict (captain_name) do nothing;

insert into public.admin
(admin_name, email, password_hash)
values
('APL Admin', 'admin@apl.com', crypt('admin123', gen_salt('bf')))
on conflict (admin_name) do nothing;
