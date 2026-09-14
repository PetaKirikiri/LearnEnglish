-- Read/write checks run inside a transaction; no test events are retained.
begin;
insert into public.fifa_english_events(id, learner_id, kind)
values ('fafa0000-0000-4000-a000-000000000001', '7bdc33ac-7f21-4ebf-bfbf-343080724890', 'visit');
set local role authenticated;
set local request.jwt.claims = '{"sub":"165c5880-cf88-4e19-96e3-2353a500388d","role":"authenticated"}';
insert into public.fifa_english_events(id, learner_id, kind)
values ('fafa0000-0000-4000-a000-000000000002', auth.uid(), 'visit')
on conflict(id) do nothing;
insert into public.fifa_english_events(id, learner_id, kind)
values ('fafa0000-0000-4000-a000-000000000002', auth.uid(), 'visit')
on conflict(id) do nothing;
do $$ begin
  if (select count(*) from public.fifa_english_events where id in ('fafa0000-0000-4000-a000-000000000001', 'fafa0000-0000-4000-a000-000000000002')) <> 1 then
    raise exception 'Learner read isolation failed';
  end if;
  if exists(select 1 from public.fifa_english_learners()) then raise exception 'Learner can read admin roster'; end if;
  begin
    insert into public.fifa_english_events(id, learner_id, kind)
    values ('fafa0000-0000-4000-a000-000000000003', '7bdc33ac-7f21-4ebf-bfbf-343080724890', 'visit');
    raise exception 'Learner write isolation failed';
  exception when insufficient_privilege then null;
  end;
end $$;
set local request.jwt.claims = '{"sub":"7bdc33ac-7f21-4ebf-bfbf-343080724890","role":"authenticated"}';
do $$ begin
  if (select count(*) from public.fifa_english_events where id in ('fafa0000-0000-4000-a000-000000000001', 'fafa0000-0000-4000-a000-000000000002')) <> 2 then
    raise exception 'Admin cannot read learner activity';
  end if;
  if not exists(select 1 from public.fifa_english_learners() where id = '165c5880-cf88-4e19-96e3-2353a500388d') then raise exception 'Admin roster omits FIFA'; end if;
end $$;
select 'PASS: own writes, idempotent retries, learner isolation, admin reads' as result;
rollback;
