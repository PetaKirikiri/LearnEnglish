begin;
-- Drawing uses the existing class membership, including temporarily idle phones.
-- Only the teacher removing a student should remove them from the next round.
do $migration$
declare definition text;
begin
 select pg_get_functiondef('public.english_drawing_game(text,uuid,jsonb)'::regprocedure) into definition;
 definition:=replace(definition,
  'where session_id=s.id and active and public.english_class_member_online(last_seen)',
  'where session_id=s.id and active');
 definition:=replace(definition,'At least one student must be online','No students in this class');
 definition:=replace(definition,'At least one student must join','No students in this class');
 execute definition;
end $migration$;
commit;
