begin;
do $$
declare sid uuid; uid uuid; j jsonb; a jsonb; secret text:=repeat('a',64); count_before integer;
begin
 select id into uid from public.profiles order by id limit 1;
 j:=public.english_classroom('create',null,jsonb_build_object('hostSecret',secret));sid:=(j->>'id')::uuid;
 insert into public.english_class_members(session_id,learner_id) values(sid,uid);
 select count(*) into count_before from public.english_class_members where session_id=sid;
 perform public.english_class_activity(sid,jsonb_build_object('hostSecret',secret,'activity','test','lesson',6));
 perform set_config('request.jwt.claim.sub',uid::text,true);
 a:=public.english_class_activity(sid);
 if a<>jsonb_build_object('activity','test','lesson',6) then raise exception 'Joined phone did not receive lesson 6';end if;
 begin
  perform public.english_class_activity(sid,jsonb_build_object('activity','race','lesson',6));
  raise exception 'Student changed activity';
 exception when others then if sqlerrm<>'Teacher controls only' then raise;end if;end;
 perform public.english_class_activity(sid,jsonb_build_object('hostSecret',secret,'activity','race','lesson',6));
 a:=public.english_class_activity(sid);
 if a->>'activity'<>'race' or not (select active from public.english_drawing_games where session_id=sid) then raise exception 'Game did not open for the same student';end if;
 perform public.english_class_activity(sid,jsonb_build_object('hostSecret',secret,'activity','board','lesson',5));
 a:=public.english_class_activity(sid);
 if a->>'activity'<>'board' or (select active from public.english_drawing_games where session_id=sid) then raise exception 'Game remained active on whiteboard';end if;
 perform public.english_class_activity(sid,jsonb_build_object('hostSecret',secret,'activity','test','lesson',6));
 if (select count(*) from public.english_class_members where session_id=sid)<>count_before then raise exception 'Activity change changed membership';end if;
 update public.english_class_members set active=false where session_id=sid and learner_id=uid;
 begin perform public.english_class_activity(sid);raise exception 'Removed member still has access';exception when others then if sqlerrm<>'Join this class first' then raise;end if;end;
end $$;
rollback;
select 'PASS: one join, lesson-6 testing, game, whiteboard and testing again; shared membership, atomic game routing and teacher-only control' result;
