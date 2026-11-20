begin;
set local lock_timeout = '3s';
-- Preserve existing clears while allowing the progressive question type totals.
alter table public.english_journey_clears
 drop constraint english_journey_clears_round_shape,
 add constraint english_journey_clears_round_shape check(
  (level between 1 and 3 and total=30) or (level=4 and total in (9,10,30)) or
  (level=5 and total=30) or (level=6 and total in (90,150)) or
  (level=7 and total in (17,20)) or (level=8 and total in (17,19))
 );
commit;
