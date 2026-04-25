"use server";

import { fetchInsights, normalizeInsight } from "@/lib/meta/api";
import { dateRangePresets } from "@/lib/utils";

export async function fetchDirectMetaAction(adAccountId: string) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return { error: "META_ACCESS_TOKEN não configurado no .env" };
  if (!adAccountId) return { error: "Informe o ID da conta de anúncios (ex: act_1234567)" };

  try {
    const { last30 } = dateRangePresets();
    const insights = await fetchInsights(adAccountId, token, last30.dateStart, last30.dateEnd);
    
    const totals = insights.reduce(
      (acc, r) => {
        const norm = normalizeInsight(r);
        return {
          spend: acc.spend + norm.spend,
          impressions: acc.impressions + norm.impressions,
          clicks: acc.clicks + norm.clicks,
          leads: acc.leads + norm.leads,
        };
      },
      { spend: 0, impressions: 0, clicks: 0, leads: 0 }
    );

    const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
    const cpc = totals.clicks ? totals.spend / totals.clicks : 0;
    const cpl = totals.leads ? totals.spend / totals.leads : 0;

    return { 
      data: {
        ...totals,
        ctr,
        cpc,
        cpl,
        campaigns: insights.map(r => normalizeInsight(r))
      }
    };
  } catch (e: any) {
    return { error: `Erro ao buscar dados do Meta: ${e.message}` };
  }
}
