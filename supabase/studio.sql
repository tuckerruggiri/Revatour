-- Run once in Supabase → SQL Editor (after auth.sql).

-- One private "document" per row: entries, pages, posts, settings.
create table if not exists public.docs (
  user_id uuid not null references auth.users(id) on delete cascade,
  parent text not null,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, parent, id)
);

alter table public.docs enable row level security;

drop policy if exists "docs own" on public.docs;
create policy "docs own" on public.docs
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Chart screenshots. Stored in a folder named after the user's id.
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "images upload own" on storage.objects;
create policy "images upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "images delete own" on storage.objects;
create policy "images delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);
