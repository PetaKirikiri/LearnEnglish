-- Run in a transaction; fixtures and progress changes are always rolled back.
begin;
do $$
declare ids uuid[]; sid uuid; j jsonb; g jsonb; uid uuid; artist uuid; other uuid; idx integer:=0; secret text:=repeat('e',64); pic text:='data:image/png;base64,iVBORw0KGgo=';
begin
 select array_agg(id) into ids from (select id from public.profiles order by id limit 3) p;
 if coalesce(array_length(ids,1),0)<>3 then raise exception 'Three profiles required';end if;
 -- Isolate each learner's evidence inside this rollback-only transaction.
 delete from public.english_word_progress where learner_id=any(ids);
 insert into public.english_word_progress(learner_id,word_id,attempts,correct,last_practised) values(ids[1],'en:book',1,1,now()),(ids[2],'en:phone',1,1,now());
 j:=public.english_classroom('create',null,jsonb_build_object('hostSecret',secret));sid:=(j->>'id')::uuid;
 insert into public.english_class_members(session_id,learner_id) select sid,unnest(ids);
 begin
  perform public.english_drawing_game('start',sid,jsonb_build_object('hostSecret',secret,'round',0,'seconds',60));
  raise exception 'Unscored fallback accepted';
 exception when others then
  if sqlerrm not like '%no scored drawing vocabulary%' then raise;end if;
 end;
 if exists(select 1 from public.english_drawings where session_id=sid) then raise exception 'Failed start left partial assignments';end if;
 insert into public.english_word_progress(learner_id,word_id,attempts,correct,last_practised) values(ids[3],'en:key',1,1,now());
 g:=public.english_drawing_game('start',sid,jsonb_build_object('hostSecret',secret,'round',0,'seconds',60));
 if g->>'phase'<>'drawing' or not (g->>'active')::boolean then raise exception 'Start did not activate phones';end if;
 if exists(select 1 from public.english_drawings d where session_id=sid and english<>case d.artist when ids[1] then 'a book' when ids[2] then 'a phone' else 'a key' end) then raise exception 'Assigned another learner vocabulary';end if;
 foreach uid in array ids loop
  idx:=idx+1;perform set_config('request.jwt.claim.sub',uid::text,true);
  g:=public.english_drawing_game('state',sid);
  if (select count(*) from jsonb_array_elements(g->'drawings') d where d->>'thai' is not null)<>1 then raise exception 'Private Thai prompt leaked';end if;
  g:=public.english_drawing_game('complete',sid,jsonb_build_object('round',1,'picture',pic));
  if idx<3 and g->>'phase'<>'drawing' then raise exception 'Advanced before all ready';end if;
 end loop;
 if g->>'phase'<>'guessing' then raise exception 'All ready did not advance';end if;
 for idx in 1..3 loop
  artist:=(g->>'artist')::uuid;other:=case when artist=ids[1] then ids[2] else ids[1] end;
  perform set_config('request.jwt.claim.sub',other::text,true);
  begin
   perform public.english_drawing_game('award',sid,jsonb_build_object('round',1,'artist',artist,'learner',artist));
   raise exception 'Nonartist award accepted';
  exception when others then if sqlerrm not like 'Only the current artist%' then raise;end if;end;
  perform set_config('request.jwt.claim.sub',artist::text,true);
  g:=public.english_drawing_game('award',sid,jsonb_build_object('round',1,'artist',artist,'learner',other));
  if not (g->>'revealed')::boolean then raise exception 'Award did not reveal answer';end if;
  if (select awarded from public.english_drawings d where session_id=sid and d.artist=(g->>'artist')::uuid) is distinct from other then raise exception 'Wrong recipient';end if;
  g:=public.english_drawing_game('next',sid,jsonb_build_object('hostSecret',secret,'round',1,'artist',artist));
  if idx<3 and g->>'phase'<>'guessing' then raise exception 'Skipped pictures';end if;
 end loop;
 if g->>'phase'<>'voting' or (select count(*) from jsonb_array_elements(g->'drawings') d where d->>'picture'=pic)<>3 then raise exception 'Final gallery incomplete';end if;
 foreach uid in array ids loop
  perform set_config('request.jwt.claim.sub',uid::text,true);other:=case when uid=ids[1] then ids[2] else ids[1] end;
  g:=public.english_drawing_game('vote',sid,jsonb_build_object('round',1,'artist',other));
  perform public.english_drawing_game('vote',sid,jsonb_build_object('round',1,'artist',other));
 end loop;
 if (g->>'voteCount')::integer<>3 then raise exception 'Vote not counted once';end if;
 g:=public.english_drawing_game('finish',sid,jsonb_build_object('hostSecret',secret,'round',1));
 if g->>'phase'<>'results' then raise exception 'Missing results';end if;
 if (select sum((v->>'points')::integer) from jsonb_array_elements(g->'scores') v)<>12 then raise exception 'Wrong total points';end if;
end $$;
rollback;
select 'PASS: personal scored vocabulary, no fallback, atomic start, private Thai prompts, all-ready transition, all pictures, artist-only points, full gallery, one vote per person and final scores' result;
