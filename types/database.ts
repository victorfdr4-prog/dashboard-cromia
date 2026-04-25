// Tipos do banco — gere com `npx supabase gen types typescript --project-id djsaltiyzhzjgrvxsnde`
// Por enquanto, tipos manuais alinhados com supabase/schema.sql

export type Role = "admin" | "client" | "pending";
export type ClientStatus = "ativo" | "pausado" | "encerrado";
export type SocialSource = "instagram" | "facebook";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  client_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  username: string | null;
  plataforma: string | null;
  orcamento: number | null;
  inicio_contrato: string | null;
  fim_contrato: string | null;
  observacoes: string | null;
  status: ClientStatus;
  meta_access_token: string | null;
  meta_token_expires_at: string | null;
  meta_connected_at: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdAccount {
  id: string;
  client_id: string;
  ad_account_id: string;
  nome_conta: string | null;
  ativo: boolean;
  ultima_sync: string | null;
  created_at: string;
}

export interface InsightRow {
  id: number;
  ad_account_id: string;
  client_id: string | null;
  date_start: string;
  date_stop: string;
  campaign_id: string | null;
  campaign_name: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  ctr: number;
  cpc: number;
  cpm: number;
  leads: number;
  cpl: number;
  conversions: number;
  raw_data: unknown;
  synced_at: string;
}

export interface SocialAccount {
  client_id: string;
  ig_user_id: string | null;
  ig_nome: string | null;
  fb_page_id: string | null;
  fb_nome: string | null;
  fb_page_access_token: string | null;
  updated_at: string;
}

export interface OrganicoRow {
  id: number;
  client_id: string;
  source: SocialSource;
  date: string;
  followers: number | null;
  reach: number | null;
  impressions: number | null;
  profile_views: number | null;
  posts_count: number | null;
  raw_data: unknown;
  synced_at: string;
}

export interface Report {
  id: string;
  client_id: string;
  date_start: string;
  date_stop: string;
  pdf_url: string | null;
  generated_by: string | null;
  generated_at: string;
}

export interface Setting {
  key: string;
  value: string | null;
  updated_at: string;
}
