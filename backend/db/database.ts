import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import { env } from "../config/env";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!process.env.SUPABASE_URL || !serviceRoleKey) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios.");
}

const useSsl = env.databaseUrl.includes("supabase.co");

export const adminSupabase = createClient(process.env.SUPABASE_URL, serviceRoleKey, {
  auth: { persistSession: false },
});

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

export async function ensureDatabaseSchema() {
  try {
    await pool.query(`
      create extension if not exists pgcrypto;

      create table if not exists clients (
        id uuid primary key default gen_random_uuid(),
        name text not null,
        segmento text,
        created_at timestamptz not null default now()
      );

      alter table clients add column if not exists username text;
      alter table clients add column if not exists plataforma text not null default 'instagram';
      alter table clients add column if not exists orcamento numeric not null default 0;
      alter table clients add column if not exists inicio_contrato date;
      alter table clients add column if not exists fim_contrato date;
      alter table clients add column if not exists observacoes text;
      alter table clients add column if not exists status text not null default 'ativo';

      create table if not exists ad_accounts (
        id uuid primary key default gen_random_uuid(),
        client_id uuid not null references clients(id) on delete cascade,
        ad_account_id text not null unique,
        nome_conta text not null default '',
        created_at timestamptz not null default now()
      );

      alter table ad_accounts alter column nome_conta set default '';

      create table if not exists insights_cache (
        id uuid primary key default gen_random_uuid(),
        ad_account_id text not null,
        data date not null,
        dados_json jsonb not null,
        created_at timestamptz not null default now(),
        unique (ad_account_id, data)
      );

      create index if not exists idx_insights_cache_account_date
        on insights_cache (ad_account_id, data);

      create table if not exists reports (
        id uuid primary key default gen_random_uuid(),
        client_id uuid not null references clients(id) on delete cascade,
        pdf_url text not null,
        created_at timestamptz not null default now()
      );
    `);
  } catch (error) {
    console.warn("Nao foi possivel criar o schema automaticamente via Postgres direto:", (error as Error).message);
  }
}

