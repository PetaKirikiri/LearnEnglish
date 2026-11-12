-- A deliberately configured household link, resolved only after authentication.
-- No browser role can create, discover, or edit account links.
create table if not exists public.english_learner_account_links (
 source_user_id uuid primary key references auth.users(id),
 learner_user_id uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 check (source_user_id <> learner_user_id)
);
alter table public.english_learner_account_links enable row level security;
revoke all on public.english_learner_account_links from public, anon, authenticated, service_role;
grant select on public.english_learner_account_links to service_role;

-- Old open tabs must reconnect rather than recreate the retired learner's scores.
create or replace function public.english_require_linked_learner() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.english_learner_account_links where source_user_id=new.learner_id) then
  raise exception 'This learner profile has been linked. Reopen English Success to continue.' using errcode='42501';
 end if;
 return new;
end;
$$;
revoke all on function public.english_require_linked_learner() from public, anon, authenticated;
do $$ declare t text; begin
 foreach t in array array['english_word_attempts','english_number_attempts','english_word_progress','english_number_word_credits','english_attempt_inbox','english_success_members','english_class_members','english_class_turns','english_journey_clears'] loop
  execute format('drop trigger if exists english_linked_learner_guard on public.%I',t);
  execute format('create trigger english_linked_learner_guard before insert or update of learner_id on public.%I for each row execute function public.english_require_linked_learner()',t);
 end loop;
end $$;

-- Learner portraits are private objects, signed briefly for classroom members.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('english-learner-avatars','english-learner-avatars',false,5242880,array['image/png','image/jpeg','image/webp'])
on conflict(id) do nothing;
drop policy if exists english_learner_avatar_read on storage.objects;
create policy english_learner_avatar_read on storage.objects for select to authenticated
using(bucket_id='english-learner-avatars' and (
 exists(select 1 from public.english_success_members where learner_id=(select auth.uid()))
 or public.fifa_english_is_admin()
));
