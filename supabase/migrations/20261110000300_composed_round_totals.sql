begin;
-- Find the shape constraint by its definition, leaving the passing-score check intact.
do $$ declare constraint_name text; begin
 for constraint_name in select conname from pg_constraint where conrelid='public.english_journey_clears'::regclass and contype='c' and pg_get_constraintdef(oid) like '%level%' and pg_get_constraintdef(oid) like '%total%'
 loop execute format('alter table public.english_journey_clears drop constraint %I',constraint_name); end loop;
end $$;
alter table public.english_journey_clears add constraint english_journey_clears_round_shape check(
 (level between 1 and 3 and total=30) or (level=4 and total in (9,10,30)) or
 (level=5 and total=30) or (level=6 and total in (90,150))
);
commit;
