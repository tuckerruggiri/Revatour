-- Run once in Supabase → SQL Editor, AFTER social7.sql (and social2–6).
-- Adds "request to connect": people ask to join a trader's server, the trader approves, and approved members can see
-- and chat in that trader's MEMBERS-ONLY channels.

-- FIX: the old "not blocked" checks in the policies could not see the owner's block list (blocks are private), so a
-- block never stopped anything. This security-definer helper can, and every write policy below now uses it.
create or replace function public.ss_blocked_by(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ss_blocks b where b.user_id = o and b.target_id = auth.uid());
$$;

create table if not exists public.ss_members (
  owner_id uuid not null references auth.users(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  primary key (owner_id, member_id),
  check (owner_id <> member_id)
);
create index if not exists ss_members_member_idx on public.ss_members (member_id);
alter table public.ss_members enable row level security;

drop policy if exists "members read" on public.ss_members;
create policy "members read" on public.ss_members for select to authenticated using (owner_id = auth.uid() or member_id = auth.uid());
drop policy if exists "members request" on public.ss_members;
create policy "members request" on public.ss_members for insert to authenticated with check (
  member_id = auth.uid() and status = 'pending'
  and not public.ss_blocked_by(owner_id));
drop policy if exists "members decide" on public.ss_members;
create policy "members decide" on public.ss_members for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "members delete" on public.ss_members;
create policy "members delete" on public.ss_members for delete to authenticated using (owner_id = auth.uid() or member_id = auth.uid());

-- true when the signed-in user is the owner or an approved member of that owner's server
create or replace function public.ss_can_enter(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select o = auth.uid() or exists (select 1 from public.ss_members m where m.owner_id = o and m.member_id = auth.uid() and m.status = 'approved');
$$;

create or replace function public.ss_notify_member() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.ss_notifications (user_id, actor_id, type) values (new.owner_id, new.member_id, 'member_request');
  elsif new.status = 'approved' and old.status <> 'approved' then
    new.decided_at := now();
    insert into public.ss_notifications (user_id, actor_id, type) values (new.member_id, new.owner_id, 'member_approved');
  end if;
  return new;
end $$;
drop trigger if exists on_ss_member_ins on public.ss_members;
create trigger on_ss_member_ins after insert on public.ss_members for each row execute function public.ss_notify_member();
drop trigger if exists on_ss_member_upd on public.ss_members;
create trigger on_ss_member_upd before update on public.ss_members for each row execute function public.ss_notify_member();

-- channels: public (default) or members-only
alter table public.ss_channels add column if not exists access text not null default 'public';
alter table public.ss_channels drop constraint if exists ss_channels_access_check;
alter table public.ss_channels add constraint ss_channels_access_check check (access in ('public','members'));

-- members-only content is readable only by the owner and approved members
drop policy if exists "cposts read" on public.ss_channel_posts;
create policy "cposts read" on public.ss_channel_posts for select to authenticated using (
  exists (select 1 from public.ss_channels c where c.id = channel_id and (c.access = 'public' or public.ss_can_enter(c.owner_id))));
drop policy if exists "msgs read" on public.ss_channel_msgs;
create policy "msgs read" on public.ss_channel_msgs for select to authenticated using (
  exists (select 1 from public.ss_channels c where c.id = channel_id and (c.access = 'public' or public.ss_can_enter(c.owner_id))));

-- chat: the owner always; approved members when the channel lets people post (replaces "followers can post")
drop policy if exists "msgs write" on public.ss_channel_msgs;
create policy "msgs write" on public.ss_channel_msgs for insert to authenticated with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.ss_channels c
    where c.id = channel_id
      and not public.ss_blocked_by(c.owner_id)
      and (c.owner_id = auth.uid() or (c.fpost and public.ss_can_enter(c.owner_id)))
  ));

-- apply the same fix to following and to the wall
drop policy if exists "follows write" on public.ss_follows;
create policy "follows write" on public.ss_follows for insert to authenticated with check (
  follower_id = auth.uid() and not public.ss_blocked_by(followee_id));
drop policy if exists "wall write" on public.ss_wall_posts;
create policy "wall write" on public.ss_wall_posts for insert to authenticated with check (
  author_id = auth.uid() and not public.ss_blocked_by(owner_id));
drop policy if exists "comments write" on public.ss_wall_comments;
create policy "comments write" on public.ss_wall_comments for insert to authenticated with check (
  author_id = auth.uid()
  and not exists (select 1 from public.ss_wall_posts p where p.id = post_id and public.ss_blocked_by(p.owner_id)));
