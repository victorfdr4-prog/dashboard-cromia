-- =========================================================
-- TrafficPro — schema completo (Next.js 15 + Supabase Auth)
-- Aplicar via Supabase SQL Editor
-- =========================================================

-- =========================================================
-- 1) PROFILES — vincula auth.users a um papel (admin | client)
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'client' check (role in ('admin','client','pending')),
  client_id uuid,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger: cria profile automaticamente após signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'pending')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- 2) CLIENTS
-- =========================================================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text,
  plataforma text default 'meta',
  orcamento numeric,
  inicio_contrato date,
  fim_contrato date,
  observacoes text,
  status text default 'ativo' check (status in ('ativo','pausado','encerrado')),
  -- Meta OAuth por cliente
  meta_access_token text,
  meta_token_expires_at timestamptz,
  meta_connected_at timestamptz,
  -- Vinculo com auth (preenchido quando admin aprova um pending)
  user_id uuid unique references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Garantir colunas novas em tabelas existentes (caso o banco já tenha clients antigo)
alter table public.clients add column if not exists meta_access_token text;
alter table public.clients add column if not exists meta_token_expires_at timestamptz;
alter table public.clients add column if not exists meta_connected_at timestamptz;
alter table public.clients add column if not exists user_id uuid;
alter table public.clients add column if not exists status text default 'ativo';
alter table public.clients add column if not exists username text;
alter table public.clients add column if not exists plataforma text default 'meta';
alter table public.clients add column if not exists orcamento numeric;
alter table public.clients add column if not exists inicio_contrato date;
alter table public.clients add column if not exists fim_contrato date;
alter table public.clients add column if not exists observacoes text;
alter table public.clients add column if not exists updated_at timestamptz default now();

-- FK clients.user_id → auth.users
do $$ begin
  alter table public.clients
    add constraint clients_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.clients add constraint clients_user_id_unique unique (user_id);
exception when duplicate_object then null; end $$;

-- FK profiles.client_id → clients.id
alter table public.profiles
  drop constraint if exists profiles_client_id_fkey,
  add constraint profiles_client_id_fkey
    foreign key (client_id) references public.clients(id) on delete set null;

create index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists clients_status_idx on public.clients(status);

-- =========================================================
-- 3) AD_ACCOUNTS
-- =========================================================
create table if not exists public.ad_accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  ad_account_id text not null,
  nome_conta text,
  ativo boolean default true,
  ultima_sync timestamptz,
  created_at timestamptz not null default now(),
  unique (client_id, ad_account_id)
);

-- Garantir colunas em ad_accounts existente
alter table public.ad_accounts add column if not exists nome_conta text;
alter table public.ad_accounts add column if not exists ativo boolean default true;
alter table public.ad_accounts add column if not exists ultima_sync timestamptz;

create index if not exists ad_accounts_client_idx on public.ad_accounts(client_id);

-- =========================================================
-- 4) INSIGHTS_CACHE — métricas diárias por campanha
-- =========================================================
create table if not exists public.insights_cache (
  id bigserial primary key,
  ad_account_id text not null,
  client_id uuid references public.clients(id) on delete cascade,
  date_start date not null,
  date_stop date not null,
  campaign_id text,
  campaign_name text,
  spend numeric default 0,
  impressions bigint default 0,
  clicks bigint default 0,
  reach bigint default 0,
  ctr numeric default 0,
  cpc numeric default 0,
  cpm numeric default 0,
  leads bigint default 0,
  cpl numeric default 0,
  conversions bigint default 0,
  raw_data jsonb,
  synced_at timestamptz not null default now(),
  unique (ad_account_id, date_start, campaign_id)
);

-- Garantir colunas em insights_cache existente
alter table public.insights_cache add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.insights_cache add column if not exists campaign_id text;
alter table public.insights_cache add column if not exists campaign_name text;
alter table public.insights_cache add column if not exists leads bigint default 0;
alter table public.insights_cache add column if not exists cpl numeric default 0;
alter table public.insights_cache add column if not exists conversions bigint default 0;
alter table public.insights_cache add column if not exists reach bigint default 0;
alter table public.insights_cache add column if not exists raw_data jsonb;

create index if not exists insights_client_date_idx on public.insights_cache(client_id, date_start desc);
create index if not exists insights_account_date_idx on public.insights_cache(ad_account_id, date_start desc);

-- =========================================================
-- 5) SOCIAL_ACCOUNTS (Instagram + Facebook orgânico)
-- =========================================================
create table if not exists public.social_accounts (
  client_id uuid primary key references public.clients(id) on delete cascade,
  ig_user_id text,
  ig_nome text,
  fb_page_id text,
  fb_nome text,
  fb_page_access_token text,
  updated_at timestamptz not null default now()
);

-- =========================================================
-- 6) ORGANICO_CACHE
-- =========================================================
create table if not exists public.organico_cache (
  id bigserial primary key,
  client_id uuid not null references public.clients(id) on delete cascade,
  source text not null check (source in ('instagram','facebook')),
  date date not null,
  followers bigint,
  reach bigint,
  impressions bigint,
  profile_views bigint,
  posts_count bigint,
  raw_data jsonb,
  synced_at timestamptz not null default now(),
  unique (client_id, source, date)
);

create index if not exists organico_client_idx on public.organico_cache(client_id, source, date desc);

-- =========================================================
-- 7) REPORTS — PDFs gerados
-- =========================================================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  date_start date not null,
  date_stop date not null,
  pdf_url text,
  generated_by uuid references auth.users(id),
  generated_at timestamptz not null default now()
);

-- =========================================================
-- 8) SETTINGS — chave/valor genérico
-- =========================================================
create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

-- =========================================================
-- RLS POLICIES
-- =========================================================
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.ad_accounts enable row level security;
alter table public.insights_cache enable row level security;
alter table public.social_accounts enable row level security;
alter table public.organico_cache enable row level security;
alter table public.reports enable row level security;
alter table public.settings enable row level security;

-- Helper: is_admin()
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper: my_client_id()
create or replace function public.my_client_id()
returns uuid language sql stable security definer set search_path = public as $$
  select client_id from public.profiles where id = auth.uid();
$$;

-- ── PROFILES ──
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- ── CLIENTS ──
drop policy if exists clients_admin_all on public.clients;
create policy clients_admin_all on public.clients for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists clients_self_read on public.clients;
create policy clients_self_read on public.clients for select
  using (id = public.my_client_id());

-- ── AD_ACCOUNTS ──
drop policy if exists ad_accounts_admin_all on public.ad_accounts;
create policy ad_accounts_admin_all on public.ad_accounts for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists ad_accounts_client_read on public.ad_accounts;
create policy ad_accounts_client_read on public.ad_accounts for select
  using (client_id = public.my_client_id());

-- ── INSIGHTS_CACHE ──
drop policy if exists insights_admin_all on public.insights_cache;
create policy insights_admin_all on public.insights_cache for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists insights_client_read on public.insights_cache;
create policy insights_client_read on public.insights_cache for select
  using (client_id = public.my_client_id());

-- ── SOCIAL_ACCOUNTS ──
drop policy if exists social_admin_all on public.social_accounts;
create policy social_admin_all on public.social_accounts for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists social_client_read on public.social_accounts;
create policy social_client_read on public.social_accounts for select
  using (client_id = public.my_client_id());

-- ── ORGANICO_CACHE ──
drop policy if exists organico_admin_all on public.organico_cache;
create policy organico_admin_all on public.organico_cache for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists organico_client_read on public.organico_cache;
create policy organico_client_read on public.organico_cache for select
  using (client_id = public.my_client_id());

-- ── REPORTS ──
drop policy if exists reports_admin_all on public.reports;
create policy reports_admin_all on public.reports for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists reports_client_read on public.reports;
create policy reports_client_read on public.reports for select
  using (client_id = public.my_client_id());

-- ── SETTINGS (admin only) ──
drop policy if exists settings_admin on public.settings;
create policy settings_admin on public.settings for all
  using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- updated_at triggers
-- =========================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists touch_profiles on public.profiles;
create trigger touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_clients on public.clients;
create trigger touch_clients before update on public.clients
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_social on public.social_accounts;
create trigger touch_social before update on public.social_accounts
  for each row execute function public.touch_updated_at();
