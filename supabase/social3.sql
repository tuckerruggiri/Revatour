-- Run once in Supabase → SQL Editor, AFTER social.sql and social2.sql. Adds following.
create table if not exists public.ss_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followee_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index if not exists ss_follows_followee_idx on public.ss_follows (followee_id);
alter table public.ss_follows enable row level security;
drop policy if exists "follows read" on public.ss_follows;
create policy "follows read" on public.ss_follows for select to authenticated using (true);
drop policy if exists "follows write" on public.ss_follows;
create policy "follows write" on public.ss_follows for insert to authenticated with check (
  follower_id = auth.uid()
  and not exists (select 1 from public.ss_blocks b where b.user_id = followee_id and b.target_id = auth.uid()));
drop policy if exists "follows delete" on public.ss_follows;
create policy "follows delete" on public.ss_follows for delete to authenticated using (follower_id = auth.uid());

create or replace function public.ss_notify_follow() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.ss_notifications (user_id, actor_id, type) values (new.followee_id, new.follower_id, 'follow');
  return new;
end $$;
drop trigger if exists on_ss_follow on public.ss_follows;
create trigger on_ss_follow after insert on public.ss_follows for each row execute function public.ss_notify_follow();
