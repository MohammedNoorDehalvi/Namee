-- PATH: supabase/reset_current_season_team_budgets.sql
-- Use once if imported teams show old remaining budget/spent in the new active season.
-- Safe: does not delete old seasons.

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

  if active_id is null then
    raise notice 'No active season found.';
    return;
  end if;

  update public.teams
  set
    budget = case when coalesce(budget, 0) <= 0 then 50000 else budget end,
    remaining_budget = case when coalesce(budget, 0) <= 0 then 50000 else budget end,
    max_players = case when coalesce(max_players, 0) <= 0 then 4 else max_players end,
    updated_at = now()
  where season_id = active_id;

  update public.captains
  set
    budget = case when coalesce(budget, 0) <= 0 then 50000 else budget end,
    remaining_budget = case when coalesce(budget, 0) <= 0 then 50000 else budget end
  where season_id = active_id;
end $$;

select pg_notify('pgrst', 'reload schema');
