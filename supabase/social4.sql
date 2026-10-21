-- Run once in Supabase → SQL Editor, AFTER social.sql, social2.sql and social3.sql. Adds public channels with follower chat.

create table if not exists public.ss_channels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  page_id text not null,
  name text not null,
  parent_name text,
  fpost boolean not null default false,
  created_at timestamptz not null default now(),
  unique (owner_id, page_id)
);
alter table public.ss_channels enable row level security;
drop policy if exists "channels read" on public.ss_channels;
create policy "channels read" on public.ss_channels for select to authenticated using (true);
drop policy if exists "channels insert" on public.ss_channels;
create policy "channels insert" on public.ss_channels for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "channels update" on public.ss_channels;
create policy "channels update" on public.ss_channels for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "channels delete" on public.ss_channels;
create policy "channels delete" on public.ss_channels for delete to authenticated using (owner_id = auth.uid());

create table if not exists public.ss_channel_msgs (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.ss_channels(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists ss_channel_msgs_idx on public.ss_channel_msgs (channel_id, created_at);
alter table public.ss_channel_msgs enable row level security;
drop policy if exists "msgs read" on public.ss_channel_msgs;
create policy "msgs read" on public.ss_channel_msgs for select to authenticated using (true);
-- the owner can always post; a follower can post only if the channel allows it, and not if blocked
drop policy if exists "msgs write" on public.ss_channel_msgs;
create policy "msgs write" on public.ss_channel_msgs for insert to authenticated with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.ss_channels c
    where c.id = channel_id
      and not exists (select 1 from public.ss_blocks b where b.user_id = c.owner_id and b.target_id = auth.uid())
      and (c.owner_id = auth.uid()
           or (c.fpost and exists (select 1 from public.ss_follows f where f.follower_id = auth.uid() and f.followee_id = c.owner_id)))
  ));
drop policy if exists "msgs delete" on public.ss_channel_msgs;
create policy "msgs delete" on public.ss_channel_msgs for delete to authenticated using (
  author_id = auth.uid()
  or exists (select 1 from public.ss_channels c where c.id = channel_id and c.owner_id = auth.uid()));

create or replace function public.ss_notify_channel_msg() returns trigger
language plpgsql security definer set search_path = public as $$
declare c record;
begin
  select owner_id from public.ss_channels where id = new.channel_id into c;
  if c.owner_id is not null and c.owner_id <> new.author_id then
    insert into public.ss_notifications (user_id, actor_id, type, post_id, snippet)
    values (c.owner_id, new.author_id, 'channel_msg', new.channel_id, left(new.text, 120));
  end if;
  return new;
end $$;
drop trigger if exists on_ss_channel_msg on public.ss_channel_msgs;
create trigger on_ss_channel_msg after insert on public.ss_channel_msgs for each row execute function public.ss_notify_channel_msg();
