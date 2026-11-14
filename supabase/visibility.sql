-- Lets the site owner choose which sidebar pages brand-new users can see.
create table if not exists public.ss_site_config (
  key text primary key,
  value jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.ss_site_config enable row level security;
-- No direct access; the two functions below are the only way in or out.

create or replace function public.ss_get_hidden() returns jsonb language sql security definer set search_path = public as $$
  select coalesce((select value from public.ss_site_config where key = 'hidden_pages'), '[]'::jsonb);
$$;
grant execute on function public.ss_get_hidden() to authenticated;

create or replace function public.ss_set_hidden(ids jsonb) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.ss_admins where user_id = auth.uid()) then raise exception 'not allowed'; end if;
  if jsonb_typeof(ids) <> 'array' or jsonb_array_length(ids) > 60 then raise exception 'bad list'; end if;
  insert into public.ss_site_config (key, value, updated_at) values ('hidden_pages', ids, now())
    on conflict (key) do update set value = excluded.value, updated_at = now();
  return ids;
end $$;
grant execute on function public.ss_set_hidden(jsonb) to authenticated;
