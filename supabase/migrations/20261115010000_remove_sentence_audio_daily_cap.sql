-- Audio usage is counted for observation, never used as a per-learner daily limit.
begin;
create or replace function public.claim_sentence_audio(p_key text,p_text text,p_owner uuid,p_learner uuid)
returns text language plpgsql security definer set search_path=public as $$
declare item public.english_sentence_audio;
begin
 insert into english_sentence_audio(key,sentence) values(p_key,p_text) on conflict do nothing;
 select * into item from english_sentence_audio where key=p_key for update;
 if item.status='ready' then return 'ready';end if;
 if item.lease_until>now() or item.retry_at>now() or item.attempts>=3 then return 'pending';end if;
 if exists(select 1 from english_audio_provider where retry_at>now()) then return 'unavailable';end if;
 insert into english_audio_requests(learner,day,count) values(p_learner,current_date,0) on conflict do nothing;
 update english_audio_requests set count=count+1 where learner=p_learner and day=current_date;
 update english_sentence_audio set status='generating',owner=p_owner,lease_until=now()+interval '2 minutes',attempts=attempts+1,updated_at=now() where key=p_key;
 return 'claimed';
end $$;
commit;
