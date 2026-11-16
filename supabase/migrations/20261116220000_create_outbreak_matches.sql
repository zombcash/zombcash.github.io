create table if not exists public.outbreak_matches (
  id text primary key,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.outbreak_matches enable row level security;
revoke all on table public.outbreak_matches from anon, authenticated;
grant all on table public.outbreak_matches to service_role;
create index if not exists outbreak_matches_updated_at_idx on public.outbreak_matches (updated_at desc);