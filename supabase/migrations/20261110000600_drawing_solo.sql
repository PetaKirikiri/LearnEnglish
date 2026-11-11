begin;
create or replace function public.english_drawing_game(p_action text,p_session uuid,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); s public.english_class_sessions; g public.english_drawing_games; host boolean; member_row record; i integer:=0; words jsonb:='[["แมว","a cat"],["สุนัข","a dog"],["ปลา","a fish"],["นก","a bird"],["บ้าน","a house"],["รถยนต์","a car"],["ต้นไม้","a tree"],["ดอกไม้","a flower"],["กล้วย","a banana"],["แอปเปิล","an apple"],["ช้าง","an elephant"],["ร่ม","an umbrella"],["หมวก","a hat"],["รองเท้า","a shoe"],["เก้าอี้","a chair"],["โต๊ะ","a table"],["เตียง","a bed"],["หนังสือ","a book"],["โทรศัพท์","a phone"],["จักรยาน","a bicycle"],["เรือ","a boat"],["เครื่องบิน","a plane"],["นาฬิกา","a clock"],["เค้ก","a cake"]]'; offset_word integer; target uuid; n integer;
begin
 select * into s from public.english_class_sessions where id=p_session and created_at>now()-interval '18 hours' for update;
 if not found then raise exception 'Class has ended. Scan the current code.';end if;
 host:=coalesce(s.host_secret_hash=md5(p_payload->>'hostSecret'),false);
 if not host and (uid is null or not exists(select 1 from public.english_class_members where session_id=s.id and learner_id=uid and active)) then raise exception 'Join this class first';end if;
 insert into public.english_drawing_games(session_id) values(s.id) on conflict do nothing;
 select * into g from public.english_drawing_games where session_id=s.id;
 if p_action in ('open','close','start','next','reveal','finish') and not host then raise exception 'Teacher controls only';end if;
 if p_action not in ('state','open','close') and coalesce((p_payload->>'round')::integer,-1)<>g.round then raise exception 'The round changed. Try again.';end if;
 if g.phase='drawing' and now()>=g.deadline then
  select artist into target from public.english_drawings where session_id=s.id and round=g.round order by position limit 1;
  update public.english_drawing_games set phase='guessing',artist=target where session_id=s.id returning * into g;
 end if;
 if p_action='open' then update public.english_drawing_games set active=true where session_id=s.id;
 elsif p_action='close' then update public.english_drawing_games set active=false where session_id=s.id;
 elsif p_action='start' then
  if g.phase not in ('lobby','results') then raise exception 'Finish this round first';end if;
  if (select count(*) from public.english_class_members where session_id=s.id and active)<1 then raise exception 'At least one student must join';end if;
  n:=coalesce((p_payload->>'seconds')::integer,60);if n not in (30,60,90,120) then raise exception 'Choose a drawing time';end if;
  offset_word:=floor(random()*jsonb_array_length(words));
  for member_row in select learner_id from public.english_class_members where session_id=s.id and active order by random() loop
   insert into public.english_drawings(session_id,round,artist,position,thai,english) values(s.id,g.round+1,member_row.learner_id,i,(words->((i+offset_word)%jsonb_array_length(words)))->>0,(words->((i+offset_word)%jsonb_array_length(words)))->>1);i:=i+1;
  end loop;
  update public.english_drawing_games set active=true,round=round+1,phase='drawing',deadline=now()+make_interval(secs=>n),artist=null,revealed=false where session_id=s.id;
 elsif p_action='save' then
  if g.phase<>'drawing' then raise exception 'Drawing time has ended';end if;
  if length(coalesce(p_payload->>'picture',''))>150000 or (p_payload->>'picture') !~ '^data:image/png;base64,[A-Za-z0-9+/=]+$' then raise exception 'Invalid drawing';end if;
  update public.english_drawings set picture=p_payload->>'picture' where session_id=s.id and round=g.round and artist=uid;
 elsif p_action='award' then
  if g.phase<>'guessing' or g.artist is distinct from uid or g.revealed or g.artist::text is distinct from p_payload->>'artist' then raise exception 'Only the current artist can award this point';end if;
  target:=(p_payload->>'learner')::uuid;
  if target=uid or not exists(select 1 from public.english_drawings where session_id=s.id and round=g.round and artist=target) then raise exception 'Choose another player';end if;
  update public.english_drawings set awarded=target where session_id=s.id and round=g.round and artist=uid and awarded is null;
  update public.english_drawing_games set revealed=true where session_id=s.id;
 elsif p_action='reveal' then
  if g.phase<>'guessing' or g.artist::text is distinct from p_payload->>'artist' then raise exception 'Picture changed';end if;
  update public.english_drawing_games set revealed=true where session_id=s.id;
 elsif p_action='next' then
  if g.phase<>'guessing' or g.artist::text is distinct from p_payload->>'artist' then raise exception 'Picture changed';end if;
  update public.english_drawings set shown=true where session_id=s.id and round=g.round and artist=g.artist;
  select artist into target from public.english_drawings where session_id=s.id and round=g.round and not shown order by position limit 1;
  update public.english_drawing_games set artist=target,revealed=false,phase=case when target is null then 'voting' else 'guessing' end where session_id=s.id;
 elsif p_action='vote' then
  target:=(p_payload->>'artist')::uuid;
  if g.phase<>'voting' or target=uid or not exists(select 1 from public.english_drawings where session_id=s.id and round=g.round and artist=uid) or not exists(select 1 from public.english_drawings where session_id=s.id and round=g.round and artist=target and picture<>'') then raise exception 'Choose another picture';end if;
  insert into public.english_drawing_votes values(s.id,g.round,uid,target) on conflict do nothing;
 elsif p_action='finish' then
  if g.phase<>'voting' then raise exception 'Voting is not open';end if;
  insert into public.english_drawing_bonus select s.id,g.round,artist from public.english_drawing_votes where session_id=s.id and round=g.round group by artist having count(*)=(select max(v.c) from (select count(*) c from public.english_drawing_votes where session_id=s.id and round=g.round group by artist) v) on conflict do nothing;
  update public.english_drawing_games set phase='results' where session_id=s.id;
 elsif p_action<>'state' then raise exception 'Unknown game action';end if;
 select * into g from public.english_drawing_games where session_id=s.id;
 return jsonb_build_object('active',g.active,'round',g.round,'phase',g.phase,'deadline',g.deadline,'serverNow',now(),'artist',g.artist,'revealed',g.revealed,'vote',(select artist from public.english_drawing_votes where session_id=s.id and round=g.round and voter=uid),'voteCount',(select count(*) from public.english_drawing_votes where session_id=s.id and round=g.round),'drawings',coalesce((select jsonb_agg(jsonb_build_object('artist',d.artist,'name',coalesce(p.display_name,'Student'),'thai',case when d.artist=uid then d.thai end,'english',case when d.artist=uid or (g.revealed and g.artist=d.artist) or g.phase in ('voting','results') then d.english end,'picture',case when d.artist=uid or (g.phase='guessing' and d.artist=g.artist) or g.phase in ('voting','results') then d.picture else '' end,'submitted',d.picture<>'','awarded',d.awarded,'winner',exists(select 1 from public.english_drawing_bonus b where b.session_id=s.id and b.round=g.round and b.artist=d.artist)) order by d.position) from public.english_drawings d join public.profiles p on p.id=d.artist where d.session_id=s.id and d.round=g.round),'[]'::jsonb),'scores',coalesce((select jsonb_agg(jsonb_build_object('id',m.learner_id,'name',coalesce(p.display_name,'Student'),'points',(select count(*) from public.english_drawings d where d.session_id=s.id and d.awarded=m.learner_id)+3*(select count(*) from public.english_drawing_bonus b where b.session_id=s.id and b.artist=m.learner_id))) from public.english_class_members m join public.profiles p on p.id=m.learner_id where m.session_id=s.id),'[]'::jsonb));
end;$$;
commit;
