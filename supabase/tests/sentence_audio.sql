begin;
-- Isolate quota-independent claim checks; the surrounding rollback preserves live cooldown.
update public.english_audio_provider set retry_at=null where id;
do $$
declare owner1 uuid:=gen_random_uuid();owner2 uuid:=gen_random_uuid();test_learner uuid:=gen_random_uuid();result text;
begin
 insert into public.english_audio_requests(learner,day,count) values(test_learner,current_date,10000);
 result:=public.claim_sentence_audio('integration-test','A test.',owner1,test_learner);
 if result<>'claimed' then raise exception 'daily count blocked generation: %',result;end if;
 if (select count from public.english_audio_requests where english_audio_requests.learner=test_learner and day=current_date)<>10001 then raise exception 'usage counter lost';end if;
 result:=public.claim_sentence_audio('integration-test','A test.',owner2,test_learner);
 if result<>'pending' then raise exception 'duplicate: %',result;end if;
 perform public.finish_sentence_audio('integration-test',owner2,true,false);
 if (select status from public.english_sentence_audio where key='integration-test')='ready' then raise exception 'wrong owner completed job';end if;
 perform public.finish_sentence_audio('integration-test',owner1,true,false);
 result:=public.claim_sentence_audio('integration-test','A test.',owner2,gen_random_uuid());
 if result<>'ready' then raise exception 'shared cache: %',result;end if;
 if has_function_privilege('authenticated','public.claim_sentence_audio(text,text,uuid,uuid)','EXECUTE') then raise exception 'client can generate directly';end if;
end $$;
rollback;
