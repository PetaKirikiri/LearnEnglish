begin;
create table if not exists public.english_success_members (
 learner_id uuid primary key references public.profiles(id) on delete cascade,
 joined_at timestamptz not null default now()
);
alter table public.english_success_members enable row level security;
revoke all on public.english_success_members from anon, authenticated;
create or replace function public.join_english_success() returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 insert into public.english_success_members(learner_id) values(auth.uid()) on conflict do nothing;
end;$$;
insert into public.english_success_members(learner_id)
select distinct learner_id from public.english_word_attempts
where question_id like 'tonight-%' or question_id like 'l2-%'
on conflict do nothing;
create or replace function public.english_success_leaderboard() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from public.english_success_members where learner_id=auth.uid()) then
  raise exception 'English Success membership required' using errcode='42501';
 end if;
 with scores as (
  select m.learner_id,coalesce(nullif(p.display_name,''),'Learner') as name,
   count(a.id) filter(where a.correct)*10 as points
  from public.english_success_members m join public.profiles p on p.id=m.learner_id
  left join public.english_word_attempts a on a.learner_id=m.learner_id
    and (a.question_id like 'tonight-%' or a.question_id like 'l2-%')
  where m.learner_id<>'7bdc33ac-7f21-4ebf-bfbf-343080724890'::uuid
  group by m.learner_id,p.display_name
 ), ranked as (select *,rank() over(order by points desc) as rank from scores)
 select coalesce(jsonb_agg(jsonb_build_object('id',learner_id,'name',name,'points',points,'rank',rank)
 order by points desc,lower(name),learner_id),'[]'::jsonb) into result from ranked;
 return result;
end;$$;
revoke all on function public.join_english_success(),public.english_success_leaderboard() from public,anon;
grant execute on function public.join_english_success(),public.english_success_leaderboard() to authenticated;
commit;
