import { format, subDays, startOfDay } from "date-fns";
import { adminSupabase } from "../db/database";
import { NormalizedInsightRow } from "./metaAdsService";
import { aggregateMetrics } from "./metricsService";
import { ClientRecord } from "./agencyService";

interface CachedRow {
  data: string;
  dados_json: NormalizedInsightRow;
  ad_account_id: string;
}

async function getCachedInsights(adAccountIds: string[], dateStart: string, dateEnd: string): Promise<CachedRow[]> {
  if (adAccountIds.length === 0) return [];

  const { data, error } = await adminSupabase
    .from("insights_cache")
    .select("ad_account_id,data,dados_json")
    .in("ad_account_id", adAccountIds)
    .gte("data", dateStart)
    .lte("data", dateEnd)
    .order("data", { ascending: true });

  if (error) {
    console.warn("Erro ao buscar cache:", error.message);
    return [];
  }

  return (data || []) as CachedRow[];
}

async function loadClientsWithAccounts() {
  // Try with new columns first, fall back to base
  let clientsData: any[];
  const { data: full, error: fullError } = await adminSupabase
    .from("clients")
    .select("id,name,username,plataforma,orcamento,status")
    .order("created_at", { ascending: true });

  if (!fullError) {
    clientsData = full || [];
  } else {
    const { data: base, error: baseError } = await adminSupabase
      .from("clients")
      .select("id,name")
      .order("created_at", { ascending: true });
    if (baseError) throw new Error(baseError.message);
    clientsData = (base || []).map((c) => ({ ...c, username: null, plataforma: "instagram", orcamento: 0, status: "ativo" }));
  }

  const accountsResult = await adminSupabase.from("ad_accounts").select("client_id,ad_account_id");
  const accountsData = accountsResult.error ? [] : (accountsResult.data || []);

  const accountsByClient = new Map<string, { ad_account_id: string }[]>();
  for (const acc of accountsData) {
    const list = accountsByClient.get((acc as any).client_id) || [];
    list.push({ ad_account_id: (acc as any).ad_account_id });
    accountsByClient.set((acc as any).client_id, list);
  }

  return clientsData.map((c: any) => ({
    ...c,
    ad_accounts: accountsByClient.get(c.id) || [],
  })) as (ClientRecord & { ad_accounts: { ad_account_id: string }[] })[];
}

export async function buildSummary(dateStart: string, dateEnd: string) {
  const allClients = await loadClientsWithAccounts();
  const clientesAtivos = allClients.filter((c) => c.status === "ativo").length;

  const adAccountIds = allClients.flatMap((c) => c.ad_accounts.map((a) => a.ad_account_id));
  const cachedRows = await getCachedInsights(adAccountIds, dateStart, dateEnd);
  const normalizedRows = cachedRows.map((r) => r.dados_json);

  const metrics = aggregateMetrics(normalizedRows);

  const alertas = buildAlerts(allClients, metrics);

  const chartMap = new Map<string, { impressoes: number; cliques: number; conversoes: number }>();
  for (const row of normalizedRows) {
    const date = row.date;
    const existing = chartMap.get(date) || { impressoes: 0, cliques: 0, conversoes: 0 };
    chartMap.set(date, {
      impressoes: existing.impressoes + row.impressions,
      cliques: existing.cliques + row.clicks,
      conversoes: existing.conversoes + (row.leads + row.purchases),
    });
  }

  const grafico = Array.from(chartMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, ...values }));

  return {
    clientes_ativos: clientesAtivos,
    impressoes: metrics.impressions,
    cliques: metrics.clicks,
    conversoes: metrics.leads + metrics.purchases,
    gasto: metrics.spend,
    alertas,
    grafico,
  };
}

function buildAlerts(clients: (ClientRecord & { ad_accounts: { ad_account_id: string }[] })[], metrics: ReturnType<typeof aggregateMetrics>) {
  const alertas: {
    id: string;
    tipo: "critico" | "info" | "aviso";
    titulo: string;
    descricao: string;
    acao: string;
    clienteNome: string;
  }[] = [];

  for (const client of clients) {
    if (client.status !== "ativo") continue;

    if (client.ad_accounts.length === 0) {
      alertas.push({
        id: `no-account-${client.id}`,
        tipo: "info",
        titulo: "Sem Conta Vinculada",
        descricao: `${client.name} esta ativo mas nao tem conta Meta vinculada.`,
        acao: "Vincular conta na aba API Meta",
        clienteNome: client.name,
      });
      continue;
    }

    if (client.orcamento > 0 && metrics.spend === 0) {
      alertas.push({
        id: `budget-${client.id}`,
        tipo: "critico",
        titulo: "Orçamento Subutilizado",
        descricao: `${client.name} usou apenas 0.0% do orçamento mensal (R$ 0,00 de R$ ${client.orcamento.toFixed(2)})`,
        acao: "Aumentar investimento ou revisar segmentação",
        clienteNome: client.name,
      });
    }

    if (client.ad_accounts.length > 0 && metrics.impressions === 0) {
      alertas.push({
        id: `no-data-${client.id}`,
        tipo: "info",
        titulo: "Sem Dados de Performance",
        descricao: `${client.name} está ativo mas sem dados de impressões ou gastos registrados`,
        acao: "Adicionar métricas ou sincronizar via API Meta",
        clienteNome: client.name,
      });
    }
  }

  return alertas;
}

export async function buildRelatorios(dateStart: string, dateEnd: string, plataformaFilter?: string, statusFilter?: string) {
  let allClients = await loadClientsWithAccounts();

  if (statusFilter && statusFilter !== "todos") {
    allClients = allClients.filter((c) => c.status === statusFilter);
  }
  if (plataformaFilter && plataformaFilter !== "todas") {
    allClients = allClients.filter((c) => c.plataforma === plataformaFilter);
  }

  const adAccountIds = allClients.flatMap((c) => c.ad_accounts.map((a) => a.ad_account_id));
  const cachedRows = await getCachedInsights(adAccountIds, dateStart, dateEnd);

  const accountMetricsMap = new Map<string, NormalizedInsightRow[]>();
  for (const row of cachedRows) {
    const existing = accountMetricsMap.get(row.ad_account_id) || [];
    existing.push(row.dados_json);
    accountMetricsMap.set(row.ad_account_id, existing);
  }

  const tabela = allClients.map((client) => {
    const rows = client.ad_accounts.flatMap((a) => accountMetricsMap.get(a.ad_account_id) || []);
    const m = aggregateMetrics(rows);
    return {
      id: client.id,
      cliente: client.name,
      status: client.status,
      plataforma: client.plataforma,
      impressoes: m.impressions,
      alcance: m.reach,
      cliques: m.clicks,
      conversoes: m.leads + m.purchases,
      investido: m.spend,
      cpc: m.cpc,
      cpl: m.cpl,
    };
  });

  const allRows = cachedRows.map((r) => r.dados_json);
  const totais = aggregateMetrics(allRows);

  const porPlataforma = Object.entries(
    allClients.reduce(
      (acc, c) => {
        const key = c.plataforma === "facebook" ? "Facebook" : "Instagram";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  ).map(([plataforma, count]) => ({ plataforma, count }));

  const porStatus = Object.entries(
    allClients.reduce(
      (acc, c) => {
        const key = c.status === "ativo" ? "Ativo" : "Inativo";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  ).map(([status, count]) => ({ status, count }));

  return {
    total_clientes: allClients.length,
    totais: {
      investido: totais.spend,
      conversoes: totais.leads + totais.purchases,
      impressoes: totais.impressions,
      alcance: totais.reach,
      cliques: totais.clicks,
      cpl_medio: totais.cpl,
      cpc_medio: totais.cpc,
      ctr_medio: totais.ctr,
    },
    por_plataforma: porPlataforma,
    por_status: porStatus,
    tabela,
  };
}
