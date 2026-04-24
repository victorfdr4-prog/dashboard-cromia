-- ============================================================
-- EXECUTE NO SUPABASE SQL EDITOR:
-- https://supabase.com/dashboard/project/djsaltiyzhzjgrvxsnde/sql/new
-- Cole tudo de uma vez e clique em "Run"
-- ============================================================

-- 1. Novas colunas na tabela clients
alter table if exists clients add column if not exists username text;
alter table if exists clients add column if not exists plataforma text not null default 'instagram';
alter table if exists clients add column if not exists orcamento numeric not null default 0;
alter table if exists clients add column if not exists inicio_contrato date;
alter table if exists clients add column if not exists fim_contrato date;
alter table if exists clients add column if not exists observacoes text;
alter table if exists clients add column if not exists status text not null default 'ativo';

-- 2. Tabela de contas de anúncio Meta
create table if not exists ad_accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  ad_account_id text not null unique,
  nome_conta text not null default '',
  created_at timestamptz not null default now()
);

-- 3. Tabela de contas sociais (Instagram orgânico + Facebook Page)
create table if not exists social_accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references clients(id) on delete cascade,
  ig_user_id text,
  fb_page_id text,
  ig_nome text,
  fb_nome text,
  created_at timestamptz not null default now()
);

-- 4. Cache de insights
create table if not exists insights_cache (
  id uuid primary key default gen_random_uuid(),
  ad_account_id text not null,
  data date not null,
  dados_json jsonb not null,
  created_at timestamptz not null default now(),
  unique (ad_account_id, data)
);
create index if not exists idx_insights_cache_account_date on insights_cache (ad_account_id, data);

-- 5. Cache de dados orgânicos
create table if not exists organico_cache (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,       -- 'instagram' | 'facebook'
  ref_id text not null,     -- ig_user_id ou fb_page_id
  data date not null,
  dados_json jsonb not null,
  created_at timestamptz not null default now(),
  unique (tipo, ref_id, data)
);
create index if not exists idx_organico_cache on organico_cache (tipo, ref_id, data);

-- 6. Relatórios gerados
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  pdf_url text not null,
  created_at timestamptz not null default now()
);

-- 7. Configurações do sistema (token Meta, etc.)
create table if not exists settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- 8. Token OAuth por cliente (login individual estilo mLabs)
alter table if exists clients add column if not exists meta_access_token text;
alter table if exists clients add column if not exists meta_token_expires_at timestamptz;
alter table if exists clients add column if not exists meta_connected_at timestamptz;
