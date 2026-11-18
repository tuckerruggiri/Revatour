-- Launch waitlist: visitors leave their email on the coming-soon page.
-- Anyone can add an email. Nobody can read the list except site admins (through ss_waitlist_list).
create table if not exists public.ss_waitlist (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz not null default now(),
  email text not null,
  ref text
);
create unique index if not exists ss_waitlist_email_idx on public.ss_waitlist (lower(email));
alter table public.ss_waitlist enable row level security;

drop policy if exists "waitlist insert" on public.ss_waitlist;
create policy "waitlist insert" on public.ss_waitlist for insert to anon, authenticated
  with check (char_length(email) between 5 and 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(coalesce(ref, '')) <= 200);
grant insert on public.ss_waitlist to anon, authenticated;
-- No select policy on purpose.

create or replace function public.ss_waitlist_list() returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.ss_admins where user_id = auth.uid()) then raise exception 'not allowed'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('email', email, 'at', ts, 'ref', ref) order by ts desc) from public.ss_waitlist), '[]'::jsonb);
end $$;
revoke all on function public.ss_waitlist_list() from public, anon;
grant execute on function public.ss_waitlist_list() to authenticated;
