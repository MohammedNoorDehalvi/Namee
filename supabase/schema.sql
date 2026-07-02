-- APL Online Auction Supabase schema
-- Run this inside Supabase Dashboard > SQL Editor.
-- Test captain: Faiz / apl123
-- Test admin: admin@apl.com / admin123

create extension if not exists pgcrypto;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  normalized_phone text,
  role text not null check (role in ('Batter','Bowler','All-rounder','Wicketkeeper')),
  batting_style text not null check (batting_style in ('Right Hand','Left Hand')),
  bowling_style text not null check (bowling_style in ('Fast','Medium','Spin','None')),
  base_price integer,
  photo_url text,
  status text not null default 'Available' check (status in ('Available','Sold','Unsold')),
  auction_status text not null default 'PENDING' check (auction_status in ('PENDING','CURRENT','SOLD','UNSOLD')),
  approval_status text not null default 'Pending' check (approval_status in ('Pending','Approved','Rejected')),
  current_bid integer default 0,
  sold_to_team text,
  sold_to_team_id uuid,
  sold_to_captain_id uuid,
  sold_price integer,
  assigned_by_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.players add column if not exists normalized_phone text;
alter table public.players add column if not exists auction_status text not null default 'PENDING';
alter table public.players add column if not exists sold_to_team_id uuid;
alter table public.players add column if not exists assigned_by_admin boolean not null default false;
alter table public.players add column if not exists updated_at timestamptz not null default now();

do $$ begin
  alter table public.players add constraint players_auction_status_check check (auction_status in ('PENDING','CURRENT','SOLD','UNSOLD'));
exception when duplicate_object then null;
end $$;

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

alter table public.captains add column if not exists team_id uuid;

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

alter table public.teams add column if not exists max_players integer not null default 4;
alter table public.teams add column if not exists updated_at timestamptz not null default now();

do $$ begin
  alter table public.players add constraint players_sold_team_fk foreign key (sold_to_team_id) references public.teams(id) on delete set null;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.players add constraint players_sold_captain_fk foreign key (sold_to_captain_id) references public.captains(id) on delete set null;
exception when duplicate_object then null;
end $$;

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  captain_id uuid not null references public.captains(id) on delete cascade,
  captain_name text,
  team_id uuid references public.teams(id) on delete set null,
  team_name text not null,
  bid_amount integer not null check (bid_amount > 0),
  created_at timestamptz not null default now()
);

alter table public.bids add column if not exists captain_name text;
alter table public.bids add column if not exists team_id uuid references public.teams(id) on delete set null;

create table if not exists public.auction (
  id integer primary key default 1 check (id = 1),
  current_player_id uuid references public.players(id) on delete set null,
  auction_status text not null default 'NOT_STARTED' check (auction_status in ('NOT_STARTED','LIVE','PAUSED','ENDED')),
  highest_bid integer not null default 0,
  highest_bidder_id uuid references public.captains(id) on delete set null,
  highest_bidder_team_id uuid references public.teams(id) on delete set null,
  highest_bidder_captain_name text,
  highest_team_name text,
  manual_picker_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz
);

alter table public.auction add column if not exists highest_bidder_team_id uuid references public.teams(id) on delete set null;
alter table public.auction add column if not exists highest_bidder_captain_name text;
alter table public.auction add column if not exists manual_picker_hidden boolean not null default false;
alter table public.auction add column if not exists started_at timestamptz;
alter table public.auction add column if not exists ended_at timestamptz;

-- Convert old status names if your old schema used them.
do $$ begin
  alter table public.auction drop constraint if exists auction_auction_status_check;
end $$;

update public.auction set auction_status = 'NOT_STARTED' where auction_status in ('Not Started','Sold','Unsold');
update public.auction set auction_status = 'LIVE' where auction_status = 'Live';

do $$ begin
  alter table public.auction add constraint auction_auction_status_check check (auction_status in ('NOT_STARTED','LIVE','PAUSED','ENDED'));
exception when duplicate_object then null;
end $$;

create table if not exists public.auction_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('BID','SOLD','UNSOLD','NEW_PLAYER','TEAM_FULL','ADMIN_ASSIGNED','STATUS','RESET','UNDO')),
  message text not null,
  player_id uuid references public.players(id) on delete set null,
  team_id uuid references public.teams(id) on delete set null,
  captain_id uuid references public.captains(id) on delete set null,
  amount integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.auction_action_history (
  id uuid primary key default gen_random_uuid(),
  action_type text not null,
  player_id uuid,
  previous_player jsonb,
  previous_auction jsonb,
  previous_team jsonb,
  event_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin (
  id uuid primary key default gen_random_uuid(),
  admin_name text not null unique,
  email text unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_players_updated_at on public.players;
create trigger touch_players_updated_at before update on public.players for each row execute function public.touch_updated_at();

drop trigger if exists touch_teams_updated_at on public.teams;
create trigger touch_teams_updated_at before update on public.teams for each row execute function public.touch_updated_at();

drop trigger if exists touch_auction_updated_at on public.auction;
create trigger touch_auction_updated_at before update on public.auction for each row execute function public.touch_updated_at();

update public.players
set normalized_phone = regexp_replace(coalesce(phone, ''), '[^0-9+]', '', 'g')
where normalized_phone is null;

create or replace function public.normalize_and_limit_player_phone()
returns trigger language plpgsql security definer as $$
declare
  clean_phone text;
  phone_count integer;
begin
  clean_phone := regexp_replace(coalesce(new.phone, ''), '[^0-9+]', '', 'g');
  if left(clean_phone, 1) = '+' then
    if length(regexp_replace(clean_phone, '[^0-9]', '', 'g')) < 10 or length(regexp_replace(clean_phone, '[^0-9]', '', 'g')) > 15 then
      raise exception 'Invalid phone number format.';
    end if;
  else
    if length(clean_phone) < 10 or length(clean_phone) > 15 then
      raise exception 'Invalid phone number format.';
    end if;
  end if;

  new.phone := clean_phone;
  new.normalized_phone := clean_phone;

  select count(*) into phone_count
  from public.players
  where normalized_phone = clean_phone
    and id <> coalesce(new.id, gen_random_uuid());

  if tg_op = 'INSERT' and phone_count >= 2 then
    raise exception 'This phone number has already registered 2 players.';
  end if;

  return new;
end;
$$;

drop trigger if exists normalize_and_limit_player_phone on public.players;
create trigger normalize_and_limit_player_phone before insert or update of phone on public.players for each row execute function public.normalize_and_limit_player_phone();

create or replace function public.sync_team_from_captain()
returns trigger language plpgsql security definer as $$
declare
  synced_team_id uuid;
begin
  insert into public.teams (team_name, captain_id, captain_name, budget, remaining_budget, max_players)
  values (new.team_name, new.id, new.captain_name, new.budget, new.remaining_budget, 4)
  on conflict (team_name) do update set
    captain_id = excluded.captain_id,
    captain_name = excluded.captain_name,
    budget = excluded.budget,
    remaining_budget = excluded.remaining_budget,
    updated_at = now()
  returning id into synced_team_id;

  update public.captains set team_id = synced_team_id where id = new.id and team_id is distinct from synced_team_id;
  return new;
end;
$$;

drop trigger if exists captains_sync_team on public.captains;
create trigger captains_sync_team after insert or update of captain_name, team_name, budget, remaining_budget on public.captains for each row execute function public.sync_team_from_captain();

insert into public.auction (id, auction_status, highest_bid)
values (1, 'NOT_STARTED', 0)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do update set public = true;

alter table public.players enable row level security;
alter table public.captains enable row level security;
alter table public.teams enable row level security;
alter table public.bids enable row level security;
alter table public.auction enable row level security;
alter table public.auction_events enable row level security;
alter table public.auction_action_history enable row level security;
alter table public.admin enable row level security;

drop policy if exists "Public can read approved players" on public.players;
create policy "Public can read approved players" on public.players for select using (approval_status = 'Approved');

drop policy if exists "Public can read auction" on public.auction;
create policy "Public can read auction" on public.auction for select using (true);

drop policy if exists "Public can read bids" on public.bids;
create policy "Public can read bids" on public.bids for select using (true);

drop policy if exists "Public can read teams" on public.teams;
create policy "Public can read teams" on public.teams for select using (true);

drop policy if exists "Public can read auction events" on public.auction_events;
create policy "Public can read auction events" on public.auction_events for select using (true);

-- Player registration now uses /api/players/register with service role.
-- Keep no anon insert policy on players so the server can enforce phone limit safely.
drop policy if exists "Anyone can register pending players" on public.players;

drop policy if exists "Public can read player photos" on storage.objects;
create policy "Public can read player photos" on storage.objects for select using (bucket_id = 'player-photos');

drop policy if exists "Anyone can upload player photos" on storage.objects;
create policy "Anyone can upload player photos" on storage.objects for insert with check (bucket_id = 'player-photos');

do $$ begin alter publication supabase_realtime add table public.players; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.auction; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.bids; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.teams; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.auction_events; exception when duplicate_object then null; end $$;

insert into public.players (name, phone, role, batting_style, bowling_style, base_price, status, auction_status, approval_status, current_bid)
values ('Kabir', '9999999999', 'Batter', 'Right Hand', 'None', 100, 'Available', 'PENDING', 'Approved', 100)
on conflict do nothing;

insert into public.captains (captain_name, team_name, password_hash, budget, remaining_budget)
values ('Faiz', 'Faiz XI', crypt('apl123', gen_salt('bf')), 50000, 50000)
on conflict (captain_name) do nothing;

insert into public.admin (admin_name, email, password_hash)
values ('APL Admin', 'admin@apl.com', crypt('admin123', gen_salt('bf')))
on conflict (admin_name) do nothing;
