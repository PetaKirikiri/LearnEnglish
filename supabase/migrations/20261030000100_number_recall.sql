begin;
create table public.english_number_items(word text primary key,plural boolean not null,lesson integer not null check(lesson>0));
create table public.english_number_attempts(
 learner_id uuid not null references public.profiles(id) on delete cascade,id uuid not null,
 word text not null references public.english_number_items(word),module integer not null check(module between 1 and 3),
 answer integer not null check(answer in (0,1)),correct boolean not null,
 occurred_at timestamptz not null,recorded_at timestamptz not null default now(),
 assisted boolean not null,heard boolean not null,replays integer not null check(replays between 0 and 10000),
 support integer not null check(support between 0 and 3),primary key(learner_id,id)
);
create index english_number_attempts_learner_time on public.english_number_attempts(learner_id,occurred_at,id);
alter table public.english_number_items enable row level security;
alter table public.english_number_attempts enable row level security;
revoke all on public.english_number_items,public.english_number_attempts from anon,authenticated;
grant select on public.english_number_items,public.english_number_attempts to authenticated;
create policy number_items_read on public.english_number_items for select to authenticated using(true);
create policy number_attempts_read on public.english_number_attempts for select to authenticated using(learner_id=auth.uid());
create function public.record_english_number_answer(p_id uuid,p_word text,p_module integer,p_answer integer,p_at timestamptz,p_assisted boolean,p_heard boolean,p_replays integer,p_support integer)
returns void language plpgsql security definer set search_path='' as $$
declare expected boolean;uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Sign in required';end if;
 if p_at>now()+interval '5 minutes' or p_at<timestamp '2026-01-01' then raise exception 'Invalid attempt time';end if;
 select plural into expected from public.english_number_items where word=p_word;
 if not found then raise exception 'Unknown vocabulary';end if;
 insert into public.english_number_attempts(learner_id,id,word,module,answer,correct,occurred_at,assisted,heard,replays,support)
 values(uid,p_id,p_word,p_module,p_answer,p_answer=expected::integer,p_at,p_assisted,p_heard,p_replays,p_support)
 on conflict(learner_id,id) do nothing;
end;$$;
revoke all on function public.record_english_number_answer(uuid,text,integer,integer,timestamptz,boolean,boolean,integer,integer) from public,anon;
grant execute on function public.record_english_number_answer(uuid,text,integer,integer,timestamptz,boolean,boolean,integer,integer) to authenticated;
commit;
