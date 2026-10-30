begin;
alter table public.english_number_attempts add column presented_verb text check(presented_verb in ('is','are'));
drop function public.record_english_number_answer(uuid,text,integer,integer,timestamptz,boolean,boolean,integer,integer);
create function public.record_english_number_answer(p_id uuid,p_word text,p_module integer,p_answer integer,p_at timestamptz,p_assisted boolean,p_heard boolean,p_replays integer,p_support integer,p_verb text default null)
returns void language plpgsql security definer set search_path='' as $$
declare expected boolean;uid uuid:=auth.uid();
begin
 if p_verb is not null and (p_module<>3 or p_verb not in ('is','are')) then raise exception 'Invalid presented verb';end if;
 if uid is null then raise exception 'Sign in required';end if;
 if p_at>now()+interval '5 minutes' or p_at<timestamp '2026-01-01' then raise exception 'Invalid attempt time';end if;
 select plural into expected from public.english_number_items where word=p_word;
 if not found then raise exception 'Unknown vocabulary';end if;
 insert into public.english_number_attempts(learner_id,id,word,module,answer,correct,occurred_at,assisted,heard,replays,support,presented_verb)
 values(uid,p_id,p_word,p_module,p_answer,case when p_verb is null then p_answer=expected::integer else p_answer=(case when (p_verb='are')=expected then 0 else 1 end) end,p_at,p_assisted,p_heard,p_replays,p_support,p_verb)
 on conflict(learner_id,id) do nothing;
end;$$;
revoke all on function public.record_english_number_answer(uuid,text,integer,integer,timestamptz,boolean,boolean,integer,integer,text) from public,anon;
grant execute on function public.record_english_number_answer(uuid,text,integer,integer,timestamptz,boolean,boolean,integer,integer,text) to authenticated;
commit;
