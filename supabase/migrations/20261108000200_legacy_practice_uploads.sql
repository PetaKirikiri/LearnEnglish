-- Older phones queued IDs such as "0-hotel". Accept them without discarding
-- answers or blocking the queue; preserve the validated UUID scoring function.
begin;

alter table public.english_number_attempts add column legacy_id text;

alter function public.record_english_number_answer(uuid,text,integer,integer,timestamptz,boolean,boolean,integer,integer,text,text)
 rename to record_english_number_answer_uuid;
revoke all on function public.record_english_number_answer_uuid(uuid,text,integer,integer,timestamptz,boolean,boolean,integer,integer,text,text)
 from public,anon,authenticated;

create function public.record_english_number_answer(
 p_id text,p_word text,p_module integer,p_answer integer,p_at timestamptz,
 p_assisted boolean,p_heard boolean,p_replays integer,p_support integer,
 p_verb text default null,p_subject text default null
) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); attempt_id uuid; legacy boolean:=false;
begin
 if uid is null then raise exception 'Sign in required'; end if;
 if p_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
  attempt_id:=p_id::uuid;
 elsif p_id ~ '^[0-2]-' and substring(p_id from 3)=p_word and length(p_id)<=162 then
  legacy:=true;
  -- A retry retains its ID; another repetition at a different time is distinct.
  -- Include learner and module because legacy question IDs were reused.
  attempt_id:=md5(jsonb_build_array(uid,p_id,p_module,extract(epoch from p_at))::text)::uuid;
 else
  raise exception 'Invalid attempt ID';
 end if;
 perform public.record_english_number_answer_uuid(attempt_id,p_word,p_module,p_answer,p_at,
  p_assisted,p_heard,p_replays,p_support,p_verb,p_subject);
 if legacy then
  update public.english_number_attempts set legacy_id=p_id where learner_id=uid and id=attempt_id;
 end if;
end;$$;
revoke all on function public.record_english_number_answer(text,text,integer,integer,timestamptz,boolean,boolean,integer,integer,text,text) from public,anon;
grant execute on function public.record_english_number_answer(text,text,integer,integer,timestamptz,boolean,boolean,integer,integer,text,text) to authenticated;

-- Match the client's original IDs when reconciling optimistic coins. Using a
-- text array also prevents a legacy pending ID from rejecting the entire read.
drop function public.english_practice_gold(uuid[]);
create function public.english_practice_gold(p_pending text[] default '{}') returns jsonb
language sql stable security definer set search_path='' as $$
 with awards as (
  select id::text,legacy_id,case when correct then 10 else 0 end amount
  from public.english_number_attempts where learner_id=auth.uid()
  union all
  select id::text,null::text,case when correct then 10 else 0 end
  from public.english_word_attempts where learner_id=auth.uid()
 ), settled as (
  select distinct pending.id from unnest(p_pending) pending(id)
  where exists(select 1 from awards a where a.id=pending.id or a.legacy_id=pending.id)
 )
 select jsonb_build_object(
  'earned',coalesce((select sum(amount) from awards),0),
  'settled',coalesce((select jsonb_agg(id) from settled),'[]'::jsonb)
 );
$$;
revoke all on function public.english_practice_gold(text[]) from public,anon;
grant execute on function public.english_practice_gold(text[]) to authenticated;

notify pgrst,'reload schema';
commit;
