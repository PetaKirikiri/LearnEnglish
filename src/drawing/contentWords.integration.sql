-- Synthetic histories only, inside a transaction that always rolls back.
begin;
do $$
declare ids uuid[]; sid uuid; uid uuid; j jsonb; g jsonb; secret text:=repeat('9',64); expected text;
begin
 select array_agg(id) into ids from (select id from public.profiles order by id limit 3) profiles;
 if cardinality(ids)<>3 then raise exception 'Three profiles required';end if;
 foreach expected in array array['book','eating','big'] loop
  delete from public.english_word_progress where learner_id=any(ids);
  insert into public.english_word_progress(learner_id,word_id,attempts,correct,last_practised,exposure_count)
   select learner,'en:'||word,0,0,now(),1 from unnest(ids) learner cross join unnest(array['is','are','the','to','my','they']) word;
  j:=public.english_classroom('create',null,jsonb_build_object('hostSecret',secret));sid:=(j->>'id')::uuid;
  insert into public.english_class_members(session_id,learner_id) select sid,unnest(ids);
  begin
   perform public.english_drawing_game('start',sid,jsonb_build_object('hostSecret',secret,'round',0));
   raise exception 'Grammar-only pool was accepted';
  exception when others then if sqlerrm not like '%No shared seen%' then raise;end if;end;
  if exists(select 1 from public.english_drawings where session_id=sid) then raise exception 'Failed start left partial assignments';end if;
  insert into public.english_word_progress(learner_id,word_id,attempts,correct,last_practised,exposure_count)
   select learner,'en:'||expected,0,0,now(),1 from unnest(ids) learner;
  g:=public.english_drawing_game('start',sid,jsonb_build_object('hostSecret',secret,'round',0));
  if jsonb_array_length(g->'drawings')<>3 or exists(select 1 from public.english_drawings where session_id=sid and english<>expected) then raise exception 'Unseen or grammar word assigned';end if;
 end loop;
end $$;
rollback;
select 'PASS: nouns, verbs and adjectives from exposure-only histories; grammar-only pool rejected; no partial assignments or fallback' result;
