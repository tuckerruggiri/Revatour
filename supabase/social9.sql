-- Let people edit the text of their own wall posts.
alter table public.ss_wall_posts add column if not exists edited_at timestamptz;

drop policy if exists "wall edit" on public.ss_wall_posts;
create policy "wall edit" on public.ss_wall_posts for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

-- Only the text and edited_at may change on an update (not owner, author, images, pins).
create or replace function public.ss_wall_edit_guard() returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and auth.uid() = old.author_id and new.author_id = old.author_id and new.owner_id = old.owner_id
     and new.text is distinct from old.text then
    new.imgs := old.imgs; new.pinned := old.pinned; new.repost_of := old.repost_of; new.created_at := old.created_at;
    new.edited_at := now();
  end if;
  return new;
end $$;
drop trigger if exists ss_wall_edit_guard on public.ss_wall_posts;
create trigger ss_wall_edit_guard before update on public.ss_wall_posts for each row execute function public.ss_wall_edit_guard();
