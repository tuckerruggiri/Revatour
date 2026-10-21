-- Run once in Supabase → SQL Editor, AFTER social.sql. Adds likes, reposts, pinning, mute, block and report for wall posts.

-- 1) Pinned + repost columns
alter table public.ss_wall_posts add column if not exists pinned boolean not null default false;
alter table public.ss_wall_posts add column if not exists repost_of uuid references public.ss_wall_posts(id) on delete cascade;
create index if not exists ss_wall_posts_repost_idx on public.ss_wall_posts (repost_of);

-- 2) Likes
create table if not exists public.ss_wall_likes (
  post_id uuid not null references public.ss_wall_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.ss_wall_likes enable row level security;
drop policy if exists "likes read" on public.ss_wall_likes;
create policy "likes read" on public.ss_wall_likes for select to authenticated using (true);
drop policy if exists "likes write" on public.ss_wall_likes;
create policy "likes write" on public.ss_wall_likes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "likes delete" on public.ss_wall_likes;
create policy "likes delete" on public.ss_wall_likes for delete to authenticated using (user_id = auth.uid());

-- 3) Mute and block (private to the person who sets them)
create table if not exists public.ss_mutes (
  user_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, target_id)
);
create table if not exists public.ss_blocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, target_id)
);
alter table public.ss_mutes enable row level security;
alter table public.ss_blocks enable row level security;
drop policy if exists "mutes own" on public.ss_mutes;
create policy "mutes own" on public.ss_mutes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "blocks own" on public.ss_blocks;
create policy "blocks own" on public.ss_blocks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 4) Reports (you can file one; only the site owner can read them in the dashboard)
create table if not exists public.ss_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.ss_wall_posts(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.ss_reports enable row level security;
drop policy if exists "reports write" on public.ss_reports;
create policy "reports write" on public.ss_reports for insert to authenticated with check (reporter_id = auth.uid());

-- 5) A blocked person can no longer write on, or comment under, your wall
drop policy if exists "wall write" on public.ss_wall_posts;
create policy "wall write" on public.ss_wall_posts for insert to authenticated with check (
  author_id = auth.uid()
  and not exists (select 1 from public.ss_blocks b where b.user_id = owner_id and b.target_id = auth.uid()));
drop policy if exists "comments write" on public.ss_wall_comments;
create policy "comments write" on public.ss_wall_comments for insert to authenticated with check (
  author_id = auth.uid()
  and not exists (select 1 from public.ss_wall_posts p join public.ss_blocks b on b.user_id = p.owner_id
                  where p.id = post_id and b.target_id = auth.uid()));

-- 6) Pin or unpin a post on your own wall
create or replace function public.ss_pin_post(pid uuid, pin boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if pin then update public.ss_wall_posts set pinned = false where owner_id = auth.uid() and pinned; end if;
  update public.ss_wall_posts set pinned = pin where id = pid and owner_id = auth.uid();
end $$;
grant execute on function public.ss_pin_post(uuid, boolean) to authenticated;

-- 7) Notifications for likes and reposts
create or replace function public.ss_notify_like() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record;
begin
  select author_id, left(text, 120) as t into p from public.ss_wall_posts where id = new.post_id;
  if p.author_id is not null and p.author_id <> new.user_id then
    insert into public.ss_notifications (user_id, actor_id, type, post_id, snippet) values (p.author_id, new.user_id, 'like', new.post_id, p.t);
  end if;
  return new;
end $$;
drop trigger if exists on_ss_wall_like on public.ss_wall_likes;
create trigger on_ss_wall_like after insert on public.ss_wall_likes for each row execute function public.ss_notify_like();

create or replace function public.ss_notify_repost() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record;
begin
  if new.repost_of is null then return new; end if;
  select author_id, left(text, 120) as t into p from public.ss_wall_posts where id = new.repost_of;
  if p.author_id is not null and p.author_id <> new.author_id then
    insert into public.ss_notifications (user_id, actor_id, type, post_id, snippet) values (p.author_id, new.author_id, 'repost', new.repost_of, p.t);
  end if;
  return new;
end $$;
drop trigger if exists on_ss_wall_repost on public.ss_wall_posts;
create trigger on_ss_wall_repost after insert on public.ss_wall_posts for each row execute function public.ss_notify_repost();
