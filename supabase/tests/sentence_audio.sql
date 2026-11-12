begin;
do $$
declare owner1 uuid:=gen_random_uuid();owner2 uuid:=gen_random_uuid();learner uuid:=gen_random_uuid();result text;
begin
 result:=public.claim_sentence_audio('integration-test','A test.',owner1,learner);
 if result<>'claimed' then raise exception 'first claim: %',result;end if;
 result:=public.claim_sentence_audio('integration-test','A test.',owner2,learner);
 if result<>'pending' then raise exception 'duplicate: %',result;end if;
 perform public.finish_sentence_audio('integration-test',owner2,true,false);
 if (select status from public.english_sentence_audio where key='integration-test')='ready' then raise exception 'wrong owner completed job';end if;
 perform public.finish_sentence_audio('integration-test',owner1,true,false);
 result:=public.claim_sentence_audio('integration-test','A test.',owner2,gen_random_uuid());
 if result<>'ready' then raise exception 'shared cache: %',result;end if;
 if has_function_privilege('authenticated','public.claim_sentence_audio(text,text,uuid,uuid)','EXECUTE') then raise exception 'client can generate directly';end if;
end $$;
rollback;
