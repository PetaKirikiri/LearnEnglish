begin;
create table if not exists public.english_sentence_audio (
 key text primary key, sentence text not null, status text not null default 'pending',
 owner uuid, lease_until timestamptz, retry_at timestamptz, attempts int not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.english_audio_requests(learner uuid not null, day date not null, count int not null default 0,primary key(learner,day));
create table if not exists public.english_audio_provider(id boolean primary key default true check(id),retry_at timestamptz);
insert into public.english_audio_provider(id) values(true) on conflict do nothing;
alter table public.english_sentence_audio enable row level security;
alter table public.english_audio_requests enable row level security;
alter table public.english_audio_provider enable row level security;
revoke all on public.english_sentence_audio,public.english_audio_requests,public.english_audio_provider from anon,authenticated;
insert into storage.buckets(id,name,public) values('sentence-audio','sentence-audio',true) on conflict(id) do nothing;
create or replace function public.claim_sentence_audio(p_key text,p_text text,p_owner uuid,p_learner uuid)
returns text language plpgsql security definer set search_path=public as $$
declare item public.english_sentence_audio; n int;
begin
 insert into english_sentence_audio(key,sentence) values(p_key,p_text) on conflict do nothing;
 select * into item from english_sentence_audio where key=p_key for update;
 if item.status='ready' then return 'ready';end if;
 if item.lease_until>now() or item.retry_at>now() or item.attempts>=3 then return 'pending';end if;
 if exists(select 1 from english_audio_provider where retry_at>now()) then return 'unavailable';end if;
 insert into english_audio_requests(learner,day,count) values(p_learner,current_date,0) on conflict do nothing;
 select count into n from english_audio_requests where learner=p_learner and day=current_date for update;
 if n>=100 then return 'limited';end if;
 update english_audio_requests set count=count+1 where learner=p_learner and day=current_date;
 update english_sentence_audio set status='generating',owner=p_owner,lease_until=now()+interval '2 minutes',attempts=attempts+1,updated_at=now() where key=p_key;
 return 'claimed';
end $$;
create or replace function public.finish_sentence_audio(p_key text,p_owner uuid,p_success boolean,p_quota boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
 update english_sentence_audio set status=case when p_success then 'ready' else 'pending' end,
 lease_until=null,retry_at=case when p_success then null else now()+interval '15 minutes' end,updated_at=now()
 where key=p_key and owner=p_owner;
 if p_quota then update english_audio_provider set retry_at=now()+interval '1 hour' where id;end if;
end $$;
revoke all on function public.claim_sentence_audio(text,text,uuid,uuid),public.finish_sentence_audio(text,uuid,boolean,boolean) from public,anon,authenticated;
grant execute on function public.claim_sentence_audio(text,text,uuid,uuid),public.finish_sentence_audio(text,uuid,boolean,boolean) to service_role;
commit;
