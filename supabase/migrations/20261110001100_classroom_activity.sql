begin;
alter table public.english_class_sessions add column if not exists activity text not null default 'board' check(activity in ('join','board','test','race'));
alter table public.english_class_sessions add column if not exists activity_lesson integer not null default 3 check(activity_lesson between 1 and 6);
create or replace function public.english_class_activity(p_session uuid,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.english_class_sessions; host boolean; uid uuid:=auth.uid(); selected text; lesson integer;
begin
 select * into s from public.english_class_sessions where id=p_session and created_at>now()-interval '18 hours' for update;
 if not found then raise exception 'Class has ended. Scan the current code.';end if;
 host:=coalesce(s.host_secret_hash=md5(p_payload->>'hostSecret'),false);
 if not host and (uid is null or not exists(select 1 from public.english_class_members where session_id=s.id and learner_id=uid and active)) then raise exception 'Join this class first';end if;
 if p_payload ? 'activity' then
  if not host then raise exception 'Teacher controls only';end if;
  selected:=p_payload->>'activity';lesson:=(p_payload->>'lesson')::integer;
  if selected is null or selected not in ('join','board','test','race') or lesson is null or lesson not between 1 and 6 then raise exception 'Choose a classroom activity and lesson';end if;
  update public.english_class_sessions set activity=selected,activity_lesson=lesson where id=s.id returning * into s;
  -- One atomic activity switch controls phones and the existing game session.
  perform public.english_drawing_game(case when selected='race' then 'open' else 'close' end,s.id,jsonb_build_object('hostSecret',p_payload->>'hostSecret'));
 end if;
 return jsonb_build_object('activity',s.activity,'lesson',s.activity_lesson);
end;$$;
revoke all on function public.english_class_activity(uuid,jsonb) from public;
grant execute on function public.english_class_activity(uuid,jsonb) to anon,authenticated;
commit;
