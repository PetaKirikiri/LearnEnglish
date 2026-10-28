-- Room capabilities and recovery checkpoints; gameplay travels over encrypted Realtime broadcast.
create table if not exists public.english_city_rooms (
 code text primary key check (code ~ '^[0-9]{6}$'), revision bigint not null default 0,
 data jsonb not null, created_at timestamptz not null default now()
);
alter table public.english_city_rooms enable row level security;
revoke all on public.english_city_rooms from anon, authenticated;
grant all on public.english_city_rooms to service_role;
comment on table public.english_city_rooms is 'City sessions. Service-only; expire after eight hours.';
