-- Run once in Supabase → SQL Editor, AFTER social4.sql. Lets chat messages in channels include pictures.
alter table public.ss_channel_msgs add column if not exists imgs jsonb not null default '[]';
alter table public.ss_channel_msgs drop constraint if exists ss_channel_msgs_text_check;
alter table public.ss_channel_msgs drop constraint if exists ss_channel_msgs_body_check;
alter table public.ss_channel_msgs add constraint ss_channel_msgs_body_check
  check (char_length(text) <= 2000 and (char_length(text) > 0 or jsonb_array_length(imgs) > 0));

create or replace function public.ss_notify_channel_msg() returns trigger
language plpgsql security definer set search_path = public as $$
declare c record;
begin
  select owner_id into c from public.ss_channels where id = new.channel_id;
  if c.owner_id is not null and c.owner_id <> new.author_id then
    insert into public.ss_notifications (user_id, actor_id, type, post_id, snippet)
    values (c.owner_id, new.author_id, 'channel_msg', new.channel_id,
            case when char_length(new.text) > 0 then left(new.text, 120) else '[picture]' end);
  end if;
  return new;
end $$;
