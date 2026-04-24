import { getAdAccountContext } from "./agencyService";
import { getOrHydrateDailyInsights } from "./cacheService";
import { fetchAdsRanking, fetchPlatformBreakdown } from "./metaAdsService";
import {
  aggregateMetrics,
  buildChartSeries,
  buildGrowthMap,
  buildKpis,
  buildPreviousPeriod,
} from "./metricsService";
import { buildAgencyInsights, buildNarrative } from "./insightsService";

export async function buildDashboard(adAccountId: string, dateStart: string, dateEnd: string) {
  const accountContext = await getAdAccountContext(adAccountId);
  if (!accountContext) {
    throw new Error("Conta de anuncios nao vinculada a nenhum cliente no Supabase.");
  }

  const currentRows = await getOrHydrateDailyInsights(adAccountId, dateStart, dateEnd);
  const previousPeriod = buildPreviousPeriod(dateStart, dateEnd);
  const previousRows = await getOrHydrateDailyInsights(adAccountId, previousPeriod.start, previousPeriod.end);

  const currentMetrics = aggregateMetrics(currentRows);
  const previousMetrics = aggregateMetrics(previousRows);
  const crescimento = buildGrowthMap(currentMetrics, previousMetrics);

  const platformRows = await fetchPlatformBreakdown(adAccountId, dateStart, dateEnd);
  const rankingRaw = await fetchAdsRanking(adAccountId, dateStart, dateEnd);
  const ranking = [...rankingRaw].sort((a, b) => {
    if (b.ctr !== a.ctr) return b.ctr - a.ctr;
    if (a.cpc !== b.cpc) return a.cpc - b.cpc;
    return b.conversionRate - a.conversionRate;
  });

  const plataformas = platformRows.map((platform) => ({
    platform: platform.platform,
    clicks: platform.clicks,
    reach: platform.reach,
    impressions: platform.impressions,
    spend: platform.spend,
    roas: platform.spend > 0 ? platform.revenue / platform.spend : 0,
    leads: platform.leads,
  }));

  const instagram = plataformas.find((item) => item.platform === "Instagram") || {
    platform: "Instagram",
    clicks: 0,
    reach: 0,
    impressions: 0,
    spend: 0,
    roas: 0,
    leads: 0,
  };

  return {
    cliente: {
      id: accountContext.client_id,
      nome: accountContext.client_name,
      segmento: accountContext.segmento,
    },
    conta: {
      id: accountContext.id,
      ad_account_id: accountContext.ad_account_id,
      nome_conta: accountContext.nome_conta,
    },
    periodo: {
      atual: { inicio: dateStart, fim: dateEnd },
      comparativo: previousPeriod,
    },
    kpis: buildKpis(currentMetrics, crescimento),
    crescimento,
    insights: buildAgencyInsights(currentMetrics),
    narrativa: buildNarrative(currentMetrics, crescimento),
    dados_grafico: buildChartSeries(currentRows, dateStart, dateEnd),
    ranking_anuncios: ranking.slice(0, 10),
    plataformas,
    instagram,
    funil: {
      impressions: currentMetrics.impressions,
      clicks: currentMetrics.clicks,
      conversions: currentMetrics.purchases || currentMetrics.leads,
    },
  };
}

