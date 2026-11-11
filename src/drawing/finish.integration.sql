begin;
do $$
declare sid uuid; ids uuid[]; uid uuid; j jsonb; g jsonb; secret text:=repeat('f',64); pic text:='data:image/png;base64,iVBORw0KGgo='; idx integer:=0;
begin
 select array_agg(id) into ids from (select id from public.profiles order by id limit 4) p;
 if array_length(ids,1)<>4 then raise exception 'Four test profiles needed';end if;
 insert into public.english_word_progress(learner_id,word_id,attempts,last_practised) select unnest(ids),'en:book',1,now() on conflict(learner_id,word_id) do update set attempts=greatest(english_word_progress.attempts,1);
 j:=public.english_classroom('create',null,jsonb_build_object('hostSecret',secret));sid:=(j->>'id')::uuid;
 insert into public.english_class_members(session_id,learner_id) select sid,unnest(ids);
 perform public.english_drawing_game('start',sid,jsonb_build_object('hostSecret',secret,'round',0,'seconds',60));
 foreach uid in array ids loop
  idx:=idx+1;perform set_config('request.jwt.claim.sub',uid::text,true);
  perform public.english_drawing_game('save',sid,jsonb_build_object('round',1,'picture',pic));
  if exists(select 1 from public.english_drawings where session_id=sid and artist=uid and finish_rank is not null) then raise exception 'Autosave counted as finish';end if;
  g:=public.english_drawing_game('complete',sid,jsonb_build_object('round',1,'picture',pic));
  if (select finish_rank from public.english_drawings where session_id=sid and artist=uid)<>idx then raise exception 'Wrong finish rank';end if;
  if (select (v->>'points')::integer from jsonb_array_elements(g->'scores') v where v->>'id'=uid::text)<>greatest(0,4-idx) then raise exception 'Wrong finish bonus';end if;
  perform public.english_drawing_game('complete',sid,jsonb_build_object('round',1,'picture','data:image/png;base64,AAAA'));
  perform public.english_drawing_game('save',sid,jsonb_build_object('round',1,'picture','data:image/png;base64,AAAA'));
  if (select picture from public.english_drawings where session_id=sid and artist=uid)<>pic then raise exception 'Finished drawing changed';end if;
 end loop;
 if g->>'phase'<>'guessing' then raise exception 'All finished must advance';end if;
 if (select sum(finish_bonus) from public.english_drawings where session_id=sid)<>6 then raise exception 'Duplicate bonus';end if;
 -- New game: finishing after the deadline must not earn any bonus.
 j:=public.english_classroom('create',null,jsonb_build_object('hostSecret',secret));sid:=(j->>'id')::uuid;
 insert into public.english_class_members(session_id,learner_id) values(sid,uid);
 perform public.english_drawing_game('start',sid,jsonb_build_object('hostSecret',secret,'round',0,'seconds',30));
 update public.english_drawing_games set deadline=now()-interval '1 second' where session_id=sid;
 begin perform public.english_drawing_game('complete',sid,jsonb_build_object('round',1,'picture',pic));raise exception 'Late finish accepted';exception when others then if sqlerrm='Late finish accepted' then raise;end if;end;
 if exists(select 1 from public.english_drawings where session_id=sid and finish_rank is not null) then raise exception 'Late bonus awarded';end if;
end $$;
rollback;
select 'PASS: finish ranks 1/2/3/4, bonuses 3/2/1/0, retries, frozen pictures, autosave, all-done advancement and late submissions; rolled back' result;
