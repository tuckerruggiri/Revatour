-- Run once in Supabase → SQL Editor, AFTER social4.sql. Lets people see the posts (with pictures) in your PUBLIC channels.
-- Only channels with Private switched off are copied here. Private channels stay private.
create table if not exists public.ss_channel_posts (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.ss_channels(id) on delete cascade,
  post_key text not null,
  text text not null default '' check (char_length(text) <= 4000),
  imgs jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique (channel_id, post_key)
);
create index if not exists ss_channel_posts_idx on public.ss_channel_posts (channel_id, created_at desc);
alter table public.ss_channel_posts enable row level security;
drop policy if exists "cposts read" on public.ss_channel_posts;
create policy "cposts read" on public.ss_channel_posts for select to authenticated using (true);
drop policy if exists "cposts insert" on public.ss_channel_posts;
create policy "cposts insert" on public.ss_channel_posts for insert to authenticated
  with check (exists (select 1 from public.ss_channels c where c.id = channel_id and c.owner_id = auth.uid()));
drop policy if exists "cposts delete" on public.ss_channel_posts;
create policy "cposts delete" on public.ss_channel_posts for delete to authenticated
  using (exists (select 1 from public.ss_channels c where c.id = channel_id and c.owner_id = auth.uid()));
drop policy if exists "cposts update" on public.ss_channel_posts;
create policy "cposts update" on public.ss_channel_posts for update to authenticated
  using (exists (select 1 from public.ss_channels c where c.id = channel_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from public.ss_channels c where c.id = channel_id and c.owner_id = auth.uid()));
