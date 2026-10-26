-- TARGET: language database gbsopnbovsxlstnmaaga. Guest races have no user accounts.
create table if not exists public.english_classroom_rooms (
  id text primary key check (id ~ '^[A-F0-9]{10}$'),
  revision bigint not null default 0,
  state jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.english_classroom_rooms enable row level security;
revoke all on public.english_classroom_rooms from public, anon, authenticated;
grant select, insert, update, delete on public.english_classroom_rooms to service_role;
create index if not exists english_classroom_rooms_created_at on public.english_classroom_rooms (created_at);
notify pgrst, 'reload schema';
