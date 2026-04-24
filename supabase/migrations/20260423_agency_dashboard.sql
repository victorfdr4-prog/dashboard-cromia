create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  segmento text,
  created_at timestamptz not null default now()
);

create table if not exists public.ad_accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  ad_account_id text not null unique,
  nome_conta text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.insights_cache (
  id uuid primary key default gen_random_uuid(),
  ad_account_id text not null,
  data date not null,
  dados_json jsonb not null,
  created_at timestamptz not null default now(),
  unique (ad_account_id, data)
);

create index if not exists idx_insights_cache_account_date
  on public.insights_cache (ad_account_id, data);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  pdf_url text not null,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;
alter table public.ad_accounts enable row level security;
alter table public.insights_cache enable row level security;
alter table public.reports enable row level security;

create policy "service role full access clients"
on public.clients
for all
to service_role
using (true)
with check (true);

create policy "service role full access ad_accounts"
on public.ad_accounts
for all
to service_role
using (true)
with check (true);

create policy "service role full access insights_cache"
on public.insights_cache
for all
to service_role
using (true)
with check (true);

create policy "service role full access reports"
on public.reports
for all
to service_role
using (true)
with check (true);
