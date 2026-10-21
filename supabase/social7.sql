-- Run once in Supabase → SQL Editor. Stores each user's (encrypted) Schwab connection.
-- The refresh token is encrypted by the server with a key only Vercel has, so the browser cannot read it.
create table if not exists public.ss_broker (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enc text not null,
  updated_at timestamptz not null default now()
);
alter table public.ss_broker enable row level security;
drop policy if exists ss_broker_own on public.ss_broker;
create policy ss_broker_own on public.ss_broker for all using (user_id = auth.uid()) with check (user_id = auth.uid());
