begin;
-- Earned gold derives from immutable, server-validated attempts. No client balance writes.
create or replace function public.english_practice_gold(p_pending uuid[] default '{}') returns jsonb
language sql stable security definer set search_path=public as $$
 with awards as (
  select id,case when correct then 10 else 0 end amount from english_number_attempts where learner_id=auth.uid()
  union all
  select id,case when correct then 10 else 0 end from english_word_attempts where learner_id=auth.uid()
 ) select jsonb_build_object('earned',coalesce(sum(amount),0),'settled',coalesce(jsonb_agg(id) filter(where id=any(p_pending)),'[]'::jsonb)) from awards;
$$;
revoke all on function public.english_practice_gold(uuid[]) from public,anon;
grant execute on function public.english_practice_gold(uuid[]) to authenticated;
commit;
