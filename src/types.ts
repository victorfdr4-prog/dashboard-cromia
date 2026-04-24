export interface AdAccountRecord {
  id: string;
  client_id: string;
  ad_account_id: string;
  nome_conta: string;
  created_at: string;
}

export interface ClientRecord {
  id: string;
  name: string;
  username: string | null;
  plataforma: string;
  orcamento: number;
  inicio_contrato: string | null;
  fim_contrato: string | null;
  observacoes: string | null;
  status: string;
  segmento: string | null;
  created_at: string;
  ad_accounts: AdAccountRecord[];
  meta_access_token: string | null;
  meta_token_expires_at: string | null;
  meta_connected_at: string | null;
}

export interface SummaryAlerta {
  id: string;
  tipo: "critico" | "info" | "aviso";
  titulo: string;
  descricao: string;
  acao: string;
  clienteNome: string;
}

export interface SummaryGraficoPoint {
  date: string;
  impressoes: number;
  cliques: number;
  conversoes: number;
}

export interface SummaryPayload {
  clientes_ativos: number;
  impressoes: number;
  cliques: number;
  conversoes: number;
  gasto: number;
  alertas: SummaryAlerta[];
  grafico: SummaryGraficoPoint[];
}

export interface RelatoriosTotais {
  investido: number;
  conversoes: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  cpl_medio: number;
  cpc_medio: number;
  ctr_medio: number;
}

export interface RelatoriosRow {
  id: string;
  cliente: string;
  status: string;
  plataforma: string;
  impressoes: number;
  alcance: number;
  cliques: number;
  conversoes: number;
  investido: number;
  cpc: number;
  cpl: number;
}

export interface RelatoriosPayload {
  total_clientes: number;
  totais: RelatoriosTotais;
  por_plataforma: { plataforma: string; count: number }[];
  por_status: { status: string; count: number }[];
  tabela: RelatoriosRow[];
}

export interface SocialAccountRecord {
  id: string;
  client_id: string;
  ig_user_id: string | null;
  fb_page_id: string | null;
  ig_nome: string | null;
  fb_nome: string | null;
  created_at: string;
}

export interface OrganicoInstagramPayload {
  kpis: {
    impressoes: number;
    alcance: number;
    engajamento: number;
    taxa_engajamento: number;
    total_posts: number;
    total_likes: number;
    total_comentarios: number;
  };
  posts_top: { id: string; caption: string; like_count: number; comments_count: number; timestamp: string }[];
  grafico: { date: string; impressions: number; reach: number; profile_views: number }[];
}

export interface OrganicoFacebookPayload {
  kpis: {
    impressoes: number;
    usuarios_engajados: number;
    engajamento_posts: number;
    taxa_engajamento: number;
  };
  grafico: { date: string; page_impressions: number; page_engaged_users: number; page_post_engagements: number }[];
}

export interface MetaAccountOption {
  id: string;
  account_id: string;
  name: string;
  currency?: string;
  account_status?: number;
}

// Tipos do dashboard por conta (mantidos para Relatório Cliente)
export interface Metric {
  id: string;
  label: string;
  value: number;
  change: number;
  trend: "up" | "down" | "neutral";
  format: "number" | "currency" | "percentage";
}

export interface DailyData {
  data: string;
  cliques: number;
  alcance: number;
  impressoes: number;
  gasto: number;
  leads: number;
  compras: number;
  receita: number;
}

export interface PlatformData {
  platform: "Facebook" | "Instagram";
  clicks: number;
  reach: number;
  impressions: number;
  spend: number;
  roas: number;
  leads: number;
}

export interface Campaign {
  id: string;
  name: string;
  clicks: number;
  cpc: number;
  reach: number;
  frequency: number;
  spend: number;
  leads: number;
  cpl: number;
  ctr: number;
  conversionRate: number;
  roas: number;
  status: "active" | "paused" | "completed";
}

export interface DashboardPayload {
  cliente: { id: string; nome: string; segmento: string | null };
  conta: { id: string; ad_account_id: string; nome_conta: string };
  periodo: { atual: { inicio: string; fim: string }; comparativo: { start: string; end: string } };
  kpis: Metric[];
  crescimento: Record<string, number>;
  insights: string[];
  narrativa: string;
  dados_grafico: DailyData[];
  ranking_anuncios: Campaign[];
  plataformas: PlatformData[];
  instagram: PlatformData;
  funil: { impressions: number; clicks: number; conversions: number };
}
