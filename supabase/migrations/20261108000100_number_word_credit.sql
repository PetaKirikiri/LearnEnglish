-- Number practice already awards gold. Credit its vocabulary as well, once per
-- saved attempt, including genuine historical practice. Do not create answers.
begin;
insert into public.english_number_items(word,plural,lesson,allows_at)
values('water',false,3,false) on conflict(word) do nothing;

create table public.english_number_word_credits (
 learner_id uuid not null,
 attempt_id uuid not null,
 tokens text[] not null,
 primary key(learner_id,attempt_id),
 foreign key(learner_id,attempt_id) references public.english_number_attempts(learner_id,id) on delete cascade
);
alter table public.english_number_word_credits enable row level security;
revoke all on public.english_number_word_credits from public,anon,authenticated;

create function public.credit_english_number_words(a public.english_number_attempts)
returns void language plpgsql security definer set search_path='' as $$
declare
 plural boolean; actual_verb text; sentence text; tokens text[]; noun_tokens text[];
 token text; credited boolean; inserted integer; recent boolean[];
begin
 if a.module not in (1,2,3) then return; end if;
 select i.plural into strict plural from public.english_number_items i where i.word=a.word;
 actual_verb:=coalesce(a.presented_verb,case when plural then 'are' else 'is' end);
 sentence:=case when a.module=1 then 'the '||a.word else 'Where '||actual_verb||' the '||a.word||'?' end;
 -- A correct rejection of "Where is the keys?" earns gold for the judgement,
 -- but must not increase proficiency for the incorrect sentence.
 credited:=a.correct and (a.module<>3 or actual_verb=case when plural then 'are' else 'is' end);
 select array_agg(distinct lower(m[1])) into tokens from regexp_matches(sentence,'([A-Za-z]+(?:''[A-Za-z]+)*)','g') m;
 select array_agg(distinct lower(m[1])) into noun_tokens from regexp_matches(a.word,'([A-Za-z]+(?:''[A-Za-z]+)*)','g') m;
 insert into public.english_number_word_credits(learner_id,attempt_id,tokens) values(a.learner_id,a.id,tokens) on conflict do nothing;
 get diagnostics inserted=row_count;
 if inserted=0 then return; end if;
 foreach token in array tokens loop
  insert into public.english_word_forms(id,form) values('en:'||token,token) on conflict do nothing;
  insert into public.english_word_progress(learner_id,word_id,correct,attempts,listening_correct,direct_correct,last_practised,recent_results)
  values(a.learner_id,'en:'||token,credited::integer,1,
   (credited and a.heard and not a.assisted and a.support=3 and token=any(noun_tokens))::integer,
   (credited and a.module=1 and token=any(noun_tokens))::integer,a.occurred_at,array[a.correct])
  on conflict(learner_id,word_id) do update set
   correct=english_word_progress.correct+excluded.correct,
   attempts=english_word_progress.attempts+1,
   listening_correct=english_word_progress.listening_correct+excluded.listening_correct,
   direct_correct=english_word_progress.direct_correct+excluded.direct_correct,
   last_practised=greatest(english_word_progress.last_practised,excluded.last_practised);
  -- Offline uploads and the backfill can be older than existing word answers.
  -- Keep the latest twenty judgements in practice-time order, not upload order.
  select coalesce(array_agg(r.correct order by r.occurred_at,r.source,r.id),'{}') into recent from (
   select h.* from (
    select n.correct,n.occurred_at,n.id,'number'::text source
    from public.english_number_word_credits c join public.english_number_attempts n on n.learner_id=c.learner_id and n.id=c.attempt_id
    where c.learner_id=a.learner_id and token=any(c.tokens)
    union all
    select w.correct,w.occurred_at,w.id,'word'::text
    from public.english_word_attempts w join public.english_word_questions q on q.id=w.question_id and q.version=w.question_version
    where w.learner_id=a.learner_id and exists(
     select 1 from regexp_matches(replace(coalesce(q.credit_sentence,q.sentence),'’',''''),'([A-Za-z]+(?:''[A-Za-z]+)*)','g') m where lower(m[1])=token
    )
   ) h order by h.occurred_at desc,h.source desc,h.id desc limit 20
  ) r;
  update public.english_word_progress set recent_results=recent where learner_id=a.learner_id and word_id='en:'||token;
 end loop;
end;$$;
revoke all on function public.credit_english_number_words(public.english_number_attempts) from public,anon,authenticated;

create function public.english_number_words_after_insert()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform public.credit_english_number_words(new);
 return new;
end;$$;
revoke all on function public.english_number_words_after_insert() from public,anon,authenticated;
create trigger english_number_words_after_insert after insert on public.english_number_attempts
for each row execute function public.english_number_words_after_insert();

do $$
declare a public.english_number_attempts;
begin
 for a in select * from public.english_number_attempts where module in (1,2,3) order by occurred_at,id loop
  perform public.credit_english_number_words(a);
 end loop;
end;$$;
notify pgrst,'reload schema';
commit;
