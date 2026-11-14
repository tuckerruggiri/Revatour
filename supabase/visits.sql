-- Site traffic: counts visitors and sign-ups, readable only by site admins.
create table if not exists public.ss_visits (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz not null default now(),
  vid text not null,
  path text not null,
  ref text,
  dev text
);
create index if not exists ss_visits_ts_idx on public.ss_visits (ts desc);
alter table public.ss_visits enable row level security;

drop policy if exists "visit insert" on public.ss_visits;
create policy "visit insert" on public.ss_visits for insert to anon, authenticated
  with check (char_length(vid) <= 40 and char_length(path) <= 200 and char_length(coalesce(ref, '')) <= 200 and char_length(coalesce(dev, '')) <= 12);
grant insert on public.ss_visits to anon, authenticated;
-- No select policy on purpose: nobody can read rows directly. Admins use ss_traffic() below.

create table if not exists public.ss_admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.ss_admins enable row level security;

create or replace function public.ss_is_admin() returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.ss_admins where user_id = auth.uid());
$$;
grant execute on function public.ss_is_admin() to authenticated;

create or replace function public.ss_traffic(days int default 30) returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare n int := greatest(1, least(coalesce(days, 30), 365)); since timestamptz := now() - make_interval(days => n); out jsonb;
begin
  if not exists (select 1 from public.ss_admins where user_id = auth.uid()) then raise exception 'not allowed'; end if;
  select jsonb_build_object(
    'days', n,
    'daily', coalesce((select jsonb_agg(jsonb_build_object('d', d, 'views', v, 'visitors', u) order by d) from (
        select to_char(ts at time zone 'America/New_York', 'YYYY-MM-DD') d, count(*) v, count(distinct vid) u from public.ss_visits where ts >= since group by 1) q), '[]'::jsonb),
    'totals', (select jsonb_build_object('views', count(*), 'visitors', count(distinct vid)) from public.ss_visits where ts >= since),
    'today', (select jsonb_build_object('views', count(*), 'visitors', count(distinct vid)) from public.ss_visits where (ts at time zone 'America/New_York')::date = (now() at time zone 'America/New_York')::date),
    'pages', coalesce((select jsonb_agg(jsonb_build_object('k', k, 'views', v, 'visitors', u) order by v desc) from (
        select path k, count(*) v, count(distinct vid) u from public.ss_visits where ts >= since group by 1 order by 2 desc limit 10) q), '[]'::jsonb),
    'refs', coalesce((select jsonb_agg(jsonb_build_object('k', k, 'views', v, 'visitors', u) order by v desc) from (
        select coalesce(nullif(ref, ''), 'Direct') k, count(*) v, count(distinct vid) u from public.ss_visits where ts >= since group by 1 order by 2 desc limit 10) q), '[]'::jsonb),
    'devs', coalesce((select jsonb_agg(jsonb_build_object('k', k, 'views', v, 'visitors', u)) from (
        select coalesce(nullif(dev, ''), 'unknown') k, count(*) v, count(distinct vid) u from public.ss_visits where ts >= since group by 1) q), '[]'::jsonb),
    'signups', jsonb_build_object(
      'total', (select count(*) from auth.users),
      'period', (select count(*) from auth.users where created_at >= since),
      'daily', coalesce((select jsonb_agg(jsonb_build_object('d', d, 'n', c) order by d) from (
          select to_char(created_at at time zone 'America/New_York', 'YYYY-MM-DD') d, count(*) c from auth.users where created_at >= since group by 1) q), '[]'::jsonb),
      'recent', coalesce((select jsonb_agg(jsonb_build_object('who', w, 'at', at)) from (
          select left(split_part(email, '@', 1), 2) || '***@' || split_part(email, '@', 2) w, created_at at from auth.users order by created_at desc limit 10) q), '[]'::jsonb))
  ) into out;
  return out;
end $$;
grant execute on function public.ss_traffic(int) to authenticated;
