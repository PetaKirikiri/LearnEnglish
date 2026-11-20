begin;
set local lock_timeout = '3s';
alter table public.english_journey_clears drop constraint english_journey_clears_level_check;
alter table public.english_journey_clears add constraint english_journey_clears_level_check check(level between 1 and 8);
alter table public.english_journey_clears drop constraint english_journey_clears_round_shape;
alter table public.english_journey_clears add constraint english_journey_clears_round_shape check(
 (level between 1 and 3 and total=30) or (level=4 and total in (9,10,30)) or
 (level=5 and total=30) or (level=6 and total in (90,150)) or
 (level=7 and total=17) or (level=8 and total=19)
);
commit;
