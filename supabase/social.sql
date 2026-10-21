-- Run once in Supabase → SQL Editor. Adds public profile fields, wall posts, comments and notifications.

-- 1) Public profile fields (bio, photo link, join date)
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists created_at timestamptz default now();
update public.profiles p set created_at = u.created_at from auth.users u where u.id = p.id;

drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- 2) Wall posts: anyone signed in can read a wall and write on it
create table if not exists public.ss_wall_posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  text text not null default '' check (char_length(text) <= 4000),
  imgs jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index if not exists ss_wall_posts_owner_idx on public.ss_wall_posts (owner_id, created_at desc);
alter table public.ss_wall_posts enable row level security;
drop policy if exists "wall read" on public.ss_wall_posts;
create policy "wall read" on public.ss_wall_posts for select to authenticated using (true);
drop policy if exists "wall write" on public.ss_wall_posts;
create policy "wall write" on public.ss_wall_posts for insert to authenticated with check (author_id = auth.uid());
drop policy if exists "wall delete" on public.ss_wall_posts;
create policy "wall delete" on public.ss_wall_posts for delete to authenticated
  using (author_id = auth.uid() or owner_id = auth.uid());

-- 3) Comments on wall posts
create table if not exists public.ss_wall_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.ss_wall_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists ss_wall_comments_post_idx on public.ss_wall_comments (post_id, created_at);
alter table public.ss_wall_comments enable row level security;
drop policy if exists "comments read" on public.ss_wall_comments;
create policy "comments read" on public.ss_wall_comments for select to authenticated using (true);
drop policy if exists "comments write" on public.ss_wall_comments;
create policy "comments write" on public.ss_wall_comments for insert to authenticated with check (author_id = auth.uid());
drop policy if exists "comments delete" on public.ss_wall_comments;
create policy "comments delete" on public.ss_wall_comments for delete to authenticated
  using (author_id = auth.uid() or exists (select 1 from public.ss_wall_posts p where p.id = post_id and p.owner_id = auth.uid()));

-- 4) Notifications (created automatically by the triggers below)
create table if not exists public.ss_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  post_id uuid,
  snippet text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ss_notifications_user_idx on public.ss_notifications (user_id, created_at desc);
alter table public.ss_notifications enable row level security;
drop policy if exists "notif read" on public.ss_notifications;
create policy "notif read" on public.ss_notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "notif update" on public.ss_notifications;
create policy "notif update" on public.ss_notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "notif delete" on public.ss_notifications;
create policy "notif delete" on public.ss_notifications for delete to authenticated using (user_id = auth.uid());

create or replace function public.ss_notify_wall_post() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.author_id <> new.owner_id then
    insert into public.ss_notifications (user_id, actor_id, type, post_id, snippet)
    values (new.owner_id, new.author_id, 'wall_post', new.id, left(new.text, 120));
  end if;
  return new;
end $$;
drop trigger if exists on_ss_wall_post on public.ss_wall_posts;
create trigger on_ss_wall_post after insert on public.ss_wall_posts for each row execute function public.ss_notify_wall_post();

create or replace function public.ss_notify_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record; r uuid;
begin
  select owner_id, author_id into p from public.ss_wall_posts where id = new.post_id;
  if p is null then return new; end if;
  for r in select distinct x from (values (p.owner_id), (p.author_id)) v(x) loop
    if r <> new.author_id then
      insert into public.ss_notifications (user_id, actor_id, type, post_id, snippet)
      values (r, new.author_id, 'comment', new.post_id, left(new.text, 120));
    end if;
  end loop;
  return new;
end $$;
drop trigger if exists on_ss_wall_comment on public.ss_wall_comments;
create trigger on_ss_wall_comment after insert on public.ss_wall_comments for each row execute function public.ss_notify_comment();
