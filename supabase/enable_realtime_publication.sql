-- PATH: supabase/enable_realtime_publication.sql

-- Enable Supabase Realtime publication for auction tables.
-- Safe to run more than once.

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'auction')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'auction') then
    alter publication supabase_realtime add table public.auction;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'players')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'players') then
    alter publication supabase_realtime add table public.players;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'bids')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bids') then
    alter publication supabase_realtime add table public.bids;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'teams')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'teams') then
    alter publication supabase_realtime add table public.teams;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'captains')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'captains') then
    alter publication supabase_realtime add table public.captains;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'auction_events')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'auction_events') then
    alter publication supabase_realtime add table public.auction_events;
  end if;
end $$;

select pg_notify('pgrst', 'reload schema');
