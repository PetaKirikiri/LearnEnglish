begin;
-- Membership is teacher-controlled. Presence expires independently and never erases work.
create or replace function public.english_class_member_online(seen timestamptz)
returns boolean language sql stable set search_path='' as $$
 select coalesce(seen > now()-interval '20 seconds',false)
$$;
revoke all on function public.english_class_member_online(timestamptz) from public;

-- Patch only presence in the current functions, retaining the taught-question selection,
-- scoring and drawing rules introduced by earlier migrations.
do $migration$
declare definition text; original text;
begin
 select pg_get_functiondef('public.english_classroom(text,uuid,jsonb)'::regprocedure) into definition;
 original:=definition;
 definition:=replace(definition,
  'where session_id=s.id and active'||chr(10)||'   order by turns',
  'where session_id=s.id and active and public.english_class_member_online(last_seen)'||chr(10)||'   order by turns');
 if definition=original then raise exception 'Classroom turn selection changed; review presence migration';end if;
 original:=definition;
 definition:=replace(definition,
  'update public.english_class_members set last_seen=now() where session_id=s.id and learner_id=uid;',
  'if not host then update public.english_class_members set last_seen=now() where session_id=s.id and learner_id=uid;end if;');
 if definition=original then raise exception 'Classroom heartbeat changed; review presence migration';end if;
 original:=definition;
 definition:=replace(definition,'''host'',host,''me'',uid,''members''','''host'',host,''me'',uid,''serverNow'',now(),''members''');
 if definition=original then raise exception 'Classroom response changed; review presence migration';end if;
 definition:=replace(definition,'Wait for a student to join','Wait for a student to come online');
 execute definition;

 select pg_get_functiondef('public.english_drawing_game(text,uuid,jsonb)'::regprocedure) into definition;
 original:=definition;
 definition:=replace(definition,
  'where session_id=s.id and active)<1',
  'where session_id=s.id and active and public.english_class_member_online(last_seen))<1');
 if definition=original then raise exception 'Drawing start guard changed; review presence migration';end if;
 original:=definition;
 definition:=replace(definition,
  'where session_id=s.id and active order by random() loop',
  'where session_id=s.id and active and public.english_class_member_online(last_seen) order by random() loop');
 if definition=original then raise exception 'Drawing roster changed; review presence migration';end if;
 definition:=replace(definition,'At least one student must join','At least one student must be online');
 execute definition;
end $migration$;
commit;
