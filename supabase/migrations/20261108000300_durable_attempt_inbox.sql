begin;

-- Receipt storage is independent of the catalogue and scoring tables. An
-- authenticated answer survives missing vocabulary, stale IDs and bad metadata.
create table public.english_attempt_inbox (
 id uuid primary key default gen_random_uuid(),
 learner_id uuid not null references auth.users(id) on delete cascade,
 source text not null check(source in ('word','number')),
 client_id text,
 payload jsonb not null,
 payload_hash text not null,
 resolution_payload jsonb,
 status text not null default 'received' check(status in ('received','needs_review','scored')),
 received_at timestamptz not null default now(),
 last_attempt_at timestamptz,
 next_retry_at timestamptz not null default now(),
 scored_at timestamptz,
 processing_attempts integer not null default 0,
 error_code text,
 error_message text,
 unique(learner_id,source,payload_hash)
);
create index english_attempt_inbox_pending on public.english_attempt_inbox(next_retry_at)
 where status <> 'scored';
alter table public.english_attempt_inbox enable row level security;
revoke all on public.english_attempt_inbox from public,anon,authenticated;
grant select on public.english_attempt_inbox to authenticated;
create policy attempt_receipts_read on public.english_attempt_inbox for select to authenticated
 using(learner_id=auth.uid() or public.fifa_english_is_admin());

create table public.english_attempt_repairs (
 id bigint generated always as identity primary key,
 receipt_id uuid not null references public.english_attempt_inbox(id) on delete cascade,
 repaired_at timestamptz not null default now(),
 reason text not null,
 previous_payload jsonb not null,
 replacement_payload jsonb not null
);
alter table public.english_attempt_repairs enable row level security;
revoke all on public.english_attempt_repairs from public,anon,authenticated;

alter function public.record_english_number_answer(text,text,integer,integer,timestamptz,boolean,boolean,integer,integer,text,text)
 rename to score_english_number_answer;
alter function public.record_english_word_answer(uuid,text,integer,text,timestamptz,text,integer,integer,uuid)
 rename to score_english_word_answer;
revoke all on function public.score_english_number_answer(text,text,integer,integer,timestamptz,boolean,boolean,integer,integer,text,text) from public,anon,authenticated;
revoke all on function public.score_english_word_answer(uuid,text,integer,text,timestamptz,text,integer,integer,uuid) from public,anon,authenticated;

create function public.process_english_attempt(p_receipt uuid) returns void
language plpgsql security definer set search_path='' as $$
declare r public.english_attempt_inbox; p jsonb; code text; message text;
 old_claims text:=current_setting('request.jwt.claims',true);
 old_sub text:=current_setting('request.jwt.claim.sub',true);
begin
 select * into r from public.english_attempt_inbox where id=p_receipt for update;
 if not found or r.status='scored' then return; end if;
 p:=coalesce(r.resolution_payload,r.payload);
 -- Only this private worker can supply the stored learner identity to scorers.
 perform set_config('request.jwt.claims',jsonb_build_object('sub',r.learner_id,'role','authenticated')::text,true);
 perform set_config('request.jwt.claim.sub',r.learner_id::text,true);
 begin
  if r.source='number' then
   perform public.score_english_number_answer(p->>'p_id',p->>'p_word',(p->>'p_module')::integer,
    (p->>'p_answer')::integer,(p->>'p_at')::timestamptz,(p->>'p_assisted')::boolean,
    (p->>'p_heard')::boolean,(p->>'p_replays')::integer,(p->>'p_support')::integer,p->>'p_verb',p->>'p_subject');
  else
   perform public.score_english_word_answer((p->>'p_id')::uuid,p->>'p_question',(p->>'p_version')::integer,
    p->>'p_answer',(p->>'p_occurred')::timestamptz,p->>'p_modality',(p->>'p_replays')::integer,
    (p->>'p_rule')::integer,r.learner_id);
  end if;
  update public.english_attempt_inbox set status='scored',scored_at=now(),last_attempt_at=now(),
   processing_attempts=processing_attempts+1,error_code=null,error_message=null where id=r.id;
 exception when others then
  get stacked diagnostics code=returned_sqlstate,message=message_text;
  -- This subtransaction rolls back partial scoring, never the original receipt.
  update public.english_attempt_inbox set status='needs_review',last_attempt_at=now(),
   processing_attempts=processing_attempts+1,error_code=code,error_message=left(message,2000),
   next_retry_at=now()+make_interval(secs=>least(21600,60*power(2,least(r.processing_attempts,9)))::integer)
   where id=r.id;
 end;
 perform set_config('request.jwt.claims',coalesce(old_claims,''),true);
 perform set_config('request.jwt.claim.sub',coalesce(old_sub,''),true);
end;$$;
revoke all on function public.process_english_attempt(uuid) from public,anon,authenticated;

create function public.submit_english_attempt(p_source text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); receipt uuid; result jsonb;
begin
 if uid is null then raise exception 'Sign in required'; end if;
 if p_source is null or p_source not in ('word','number') or p_payload is null
  or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>65536 then
  raise exception 'Invalid receipt envelope';
 end if;
 insert into public.english_attempt_inbox(learner_id,source,client_id,payload,payload_hash)
 values(uid,p_source,p_payload->>'p_id',p_payload,encode(sha256(convert_to(p_payload::text,'UTF8')),'hex'))
 on conflict(learner_id,source,payload_hash) do nothing returning id into receipt;
 if receipt is null then
  select id into receipt from public.english_attempt_inbox where learner_id=uid and source=p_source
   and payload_hash=encode(sha256(convert_to(p_payload::text,'UTF8')),'hex');
 end if;
 perform public.process_english_attempt(receipt);
 select jsonb_build_object('accepted',true,'receipt_id',id,'client_id',client_id,'status',status)
 into result from public.english_attempt_inbox where id=receipt;
 return result;
end;$$;
revoke all on function public.submit_english_attempt(text,jsonb) from public,anon;
grant execute on function public.submit_english_attempt(text,jsonb) to authenticated;

-- Already-open app versions receive the same durable protection without reload.
create function public.record_english_number_answer(
 p_id text,p_word text,p_module integer,p_answer integer,p_at timestamptz,
 p_assisted boolean,p_heard boolean,p_replays integer,p_support integer,
 p_verb text default null,p_subject text default null
) returns void language plpgsql security definer set search_path='' as $$
begin
 perform public.submit_english_attempt('number',jsonb_build_object('p_id',p_id,'p_word',p_word,
 'p_module',p_module,'p_answer',p_answer,'p_at',p_at,'p_assisted',p_assisted,'p_heard',p_heard,
 'p_replays',p_replays,'p_support',p_support,'p_verb',p_verb,'p_subject',p_subject));
end;$$;
revoke all on function public.record_english_number_answer(text,text,integer,integer,timestamptz,boolean,boolean,integer,integer,text,text) from public,anon;
grant execute on function public.record_english_number_answer(text,text,integer,integer,timestamptz,boolean,boolean,integer,integer,text,text) to authenticated;

create function public.record_english_word_answer(p_id uuid,p_question text,p_version integer,p_answer text,
 p_occurred timestamptz,p_modality text,p_replays integer,p_rule integer,p_learner uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or auth.uid() is distinct from p_learner then raise exception 'Account mismatch'; end if;
 perform public.submit_english_attempt('word',jsonb_build_object('p_id',p_id,'p_question',p_question,
 'p_version',p_version,'p_answer',p_answer,'p_occurred',p_occurred,'p_modality',p_modality,
 'p_replays',p_replays,'p_rule',p_rule));
end;$$;
revoke all on function public.record_english_word_answer(uuid,text,integer,text,timestamptz,text,integer,integer,uuid) from public,anon;
grant execute on function public.record_english_word_answer(uuid,text,integer,text,timestamptz,text,integer,integer,uuid) to authenticated;

create function public.retry_english_attempts(p_limit integer default 50) returns integer
language plpgsql security definer set search_path='' as $$
declare r record; processed integer:=0;
begin
 for r in select id from public.english_attempt_inbox where status<>'scored' and next_retry_at<=now()
  order by next_retry_at limit greatest(1,least(p_limit,100)) for update skip locked loop
  perform public.process_english_attempt(r.id); processed:=processed+1;
 end loop;
 return processed;
end;$$;
revoke all on function public.retry_english_attempts(integer) from public,anon,authenticated;
grant execute on function public.retry_english_attempts(integer) to service_role;

-- Operator-only correction, with an immutable original and complete repair log.
create function public.repair_english_attempt(p_receipt uuid,p_payload jsonb,p_reason text) returns void
language plpgsql security definer set search_path='' as $$
declare r public.english_attempt_inbox;
begin
 if p_reason is null or length(trim(p_reason))=0 or p_payload is null
  or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>65536 then
  raise exception 'Repair requires a payload and reason'; end if;
 select * into r from public.english_attempt_inbox where id=p_receipt for update;
 if not found or r.status='scored' then raise exception 'Receipt missing or already scored'; end if;
 insert into public.english_attempt_repairs(receipt_id,reason,previous_payload,replacement_payload)
 values(r.id,p_reason,coalesce(r.resolution_payload,r.payload),p_payload);
 update public.english_attempt_inbox set resolution_payload=p_payload,next_retry_at=now() where id=r.id;
 perform public.process_english_attempt(r.id);
end;$$;
revoke all on function public.repair_english_attempt(uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.repair_english_attempt(uuid,jsonb,text) to service_role;

create extension if not exists pg_cron;
select cron.schedule('english-attempt-inbox-retry','* * * * *','select public.retry_english_attempts(50)');
notify pgrst,'reload schema';
commit;
