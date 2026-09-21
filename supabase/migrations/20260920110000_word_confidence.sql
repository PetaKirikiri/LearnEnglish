begin;
create table if not exists public.fifa_english_word_confidence (
  learner_id uuid not null references public.profiles(id) on delete cascade,
  word text not null check (word ~ '^[a-z]+(''[a-z]+)*$' and length(word)<=100),
  confidence smallint not null check (confidence between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (learner_id,word)
);
alter table public.fifa_english_word_confidence enable row level security;
revoke all on public.fifa_english_word_confidence from public, anon, authenticated;
grant select,insert,update on public.fifa_english_word_confidence to authenticated;
drop policy if exists word_confidence_read on public.fifa_english_word_confidence;
create policy word_confidence_read on public.fifa_english_word_confidence for select to authenticated using (learner_id=auth.uid());
drop policy if exists word_confidence_insert on public.fifa_english_word_confidence;
create policy word_confidence_insert on public.fifa_english_word_confidence for insert to authenticated with check (learner_id=auth.uid());
drop policy if exists word_confidence_update on public.fifa_english_word_confidence;
create policy word_confidence_update on public.fifa_english_word_confidence for update to authenticated using (learner_id=auth.uid()) with check (learner_id=auth.uid());
create or replace function public.fifa_word_confidence_timestamp() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now();return new;end; $$;
drop trigger if exists word_confidence_timestamp on public.fifa_english_word_confidence;
create trigger word_confidence_timestamp before insert or update on public.fifa_english_word_confidence for each row execute function public.fifa_word_confidence_timestamp();
commit;
