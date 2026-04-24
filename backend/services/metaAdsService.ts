import { env } from "../config/env";
import { getSetting } from "./agencyService";

export interface MetaActionMetric {
  action_type: string;
  value: string;
}

export interface NormalizedInsightRow {
  date: string;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  spend: number;
  frequency: number;
  leads: number;
  purchases: number;
  revenue: number;
  actions: MetaActionMetric[];
  action_values: MetaActionMetric[];
}

export interface OrganicoInstagramRow {
  date: string;
  impressions: number;
  reach: number;
  profile_views: number;
}

export interface OrganicoFacebookRow {
  date: string;
  page_impressions: number;
  page_engaged_users: number;
  page_post_engagements: number;
}

export interface MediaPost {
  id: string;
  caption: string;
  like_count: number;
  comments_count: number;
  impressions: number;
  reach: number;
  timestamp: string;
}

let cachedToken: string | null = null;
let tokenLoadedAt = 0;

async function getActiveToken(): Promise<string> {
  // Reload token from DB every 60 seconds
  if (!cachedToken || Date.now() - tokenLoadedAt > 60_000) {
    const dbToken = await getSetting("META_ACCESS_TOKEN").catch(() => null);
    cachedToken = dbToken || env.metaAccessToken || null;
    tokenLoadedAt = Date.now();
  }
  if (!cachedToken) {
    throw new Error("META_ACCESS_TOKEN não configurado. Adicione o token na aba API Meta.");
  }
  return cachedToken;
}

export function invalidateTokenCache() {
  cachedToken = null;
  tokenLoadedAt = 0;
}

function normalizeAccountId(adAccountId: string) {
  return adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
}

async function metaRequest<T>(path: string, params: Record<string, string>, tokenOverride?: string): Promise<T> {
  const token = tokenOverride ?? await getActiveToken();
  const url = new URL(`https://graph.facebook.com/${env.metaGraphVersion}/${path}`);
  url.search = new URLSearchParams({ access_token: token, ...params }).toString();

  const response = await fetch(url.toString());
  const payload = await response.json() as any;

  if (!response.ok || payload.error) {
    throw new Error(payload?.error?.message || "Falha ao consultar a API da Meta.");
  }

  return payload as T;
}

function readActionTotal(actions: MetaActionMetric[] = [], candidates: string[]) {
  return actions.reduce((total, action) => {
    return candidates.includes(action.action_type) ? total + Number(action.value || 0) : total;
  }, 0);
}

export function normalizeInsightRow(row: any): NormalizedInsightRow {
  const actions = Array.isArray(row.actions) ? row.actions : [];
  const actionValues = Array.isArray(row.action_values) ? row.action_values : [];

  return {
    date: row.date_start,
    impressions: Number(row.impressions || 0),
    reach: Number(row.reach || 0),
    clicks: Number(row.clicks || 0),
    ctr: Number(row.ctr || 0),
    cpc: Number(row.cpc || 0),
    spend: Number(row.spend || 0),
    frequency: Number(row.frequency || 0),
    leads: readActionTotal(actions, ["lead","omni_lead","onsite_conversion.lead_grouped","offsite_conversion.fb_pixel_lead","leadgen.other","complete_registration"]),
    purchases: readActionTotal(actions, ["purchase","omni_purchase","offsite_conversion.fb_pixel_purchase","onsite_web_purchase"]),
    revenue: readActionTotal(actionValues, ["purchase","omni_purchase","offsite_conversion.fb_pixel_purchase","onsite_web_purchase"]),
    actions,
    action_values: actionValues,
  };
}

export async function fetchAccessibleAdAccounts(tokenOverride?: string) {
  return metaRequest<{ data: any[] }>("me/adaccounts", {
    fields: "id,account_id,name,currency,account_status",
    limit: "200",
  }, tokenOverride);
}

export async function fetchClientAdAccounts(tokenOverride: string) {
  return metaRequest<{ data: any[] }>("me/adaccounts", {
    fields: "id,account_id,name,currency,account_status",
    limit: "200",
  }, tokenOverride);
}

// Valida e retorna info de uma conta específica pelo ID (sem precisar ser dono)
export async function fetchAdAccountById(adAccountId: string) {
  const accountId = normalizeAccountId(adAccountId);
  return metaRequest<{ id: string; account_id: string; name: string; currency: string; account_status: number }>(
    accountId,
    { fields: "id,account_id,name,currency,account_status" },
  );
}

// Lista contas de um Business Manager pelo business_id
export async function fetchBusinessAdAccounts(businessId: string) {
  const [owned, client] = await Promise.allSettled([
    metaRequest<{ data: any[] }>(`${businessId}/owned_ad_accounts`, {
      fields: "id,account_id,name,currency,account_status",
      limit: "200",
    }),
    metaRequest<{ data: any[] }>(`${businessId}/client_ad_accounts`, {
      fields: "id,account_id,name,currency,account_status",
      limit: "200",
    }),
  ]);
  const ownedData = owned.status === "fulfilled" ? owned.value.data : [];
  const clientData = client.status === "fulfilled" ? client.value.data : [];
  // Remove duplicatas
  const seen = new Set<string>();
  return [...ownedData, ...clientData].filter((a) => {
    if (seen.has(a.account_id)) return false;
    seen.add(a.account_id);
    return true;
  });
}

export async function fetchDailyInsights(adAccountId: string, dateStart: string, dateEnd: string, tokenOverride?: string) {
  const accountId = normalizeAccountId(adAccountId);
  const payload = await metaRequest<{ data: any[] }>(`${accountId}/insights`, {
    fields: "date_start,impressions,reach,clicks,ctr,cpc,spend,frequency,actions,action_values",
    time_range: JSON.stringify({ since: dateStart, until: dateEnd }),
    time_increment: "1",
    level: "account",
    limit: "500",
  }, tokenOverride);
  return payload.data.map(normalizeInsightRow);
}

export async function fetchPlatformBreakdown(adAccountId: string, dateStart: string, dateEnd: string) {
  const accountId = normalizeAccountId(adAccountId);
  const payload = await metaRequest<{ data: any[] }>(`${accountId}/insights`, {
    fields: "publisher_platform,impressions,reach,clicks,ctr,cpc,spend,frequency,actions,action_values",
    time_range: JSON.stringify({ since: dateStart, until: dateEnd }),
    breakdowns: "publisher_platform",
    level: "account",
    limit: "100",
  });
  return payload.data
    .filter((row) => ["facebook","instagram"].includes((row.publisher_platform || "").toLowerCase()))
    .map((row) => {
      const normalized = normalizeInsightRow(row);
      return {
        platform: row.publisher_platform.toLowerCase() === "instagram" ? "Instagram" : "Facebook",
        ...normalized,
      };
    });
}

export async function fetchAdsRanking(adAccountId: string, dateStart: string, dateEnd: string) {
  const accountId = normalizeAccountId(adAccountId);
  const payload = await metaRequest<{ data: any[] }>(`${accountId}/insights`, {
    fields: "ad_id,ad_name,impressions,reach,clicks,ctr,cpc,spend,frequency,actions,action_values",
    time_range: JSON.stringify({ since: dateStart, until: dateEnd }),
    level: "ad",
    limit: "200",
  });
  return payload.data.map((row) => {
    const normalized = normalizeInsightRow(row);
    return {
      id: row.ad_id,
      name: row.ad_name || `Anuncio ${row.ad_id}`,
      status: "active",
      impressions: normalized.impressions,
      reach: normalized.reach,
      clicks: normalized.clicks,
      ctr: normalized.ctr,
      cpc: normalized.cpc,
      spend: normalized.spend,
      frequency: normalized.frequency,
      leads: normalized.leads,
      purchases: normalized.purchases,
      revenue: normalized.revenue,
      cpl: normalized.leads > 0 ? normalized.spend / normalized.leads : 0,
      roas: normalized.spend > 0 ? normalized.revenue / normalized.spend : 0,
      conversionRate: normalized.clicks > 0 ? ((normalized.purchases || normalized.leads) / normalized.clicks) * 100 : 0,
    };
  });
}

// ── Instagram Orgânico ────────────────────────────────────────────────────────

export async function fetchInstagramInsights(igUserId: string, dateStart: string, dateEnd: string): Promise<OrganicoInstagramRow[]> {
  try {
    const payload = await metaRequest<{ data: any[] }>(`${igUserId}/insights`, {
      metric: "impressions,reach,profile_views",
      period: "day",
      since: dateStart,
      until: dateEnd,
    });

    const byDate = new Map<string, OrganicoInstagramRow>();
    for (const metric of payload.data) {
      for (const value of metric.values || []) {
        const date = value.end_time?.split("T")[0] || "";
        if (!date) continue;
        const existing = byDate.get(date) || { date, impressions: 0, reach: 0, profile_views: 0 };
        if (metric.name === "impressions") existing.impressions = value.value || 0;
        if (metric.name === "reach") existing.reach = value.value || 0;
        if (metric.name === "profile_views") existing.profile_views = value.value || 0;
        byDate.set(date, existing);
      }
    }
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

export async function fetchInstagramMedia(igUserId: string, dateStart: string, dateEnd: string): Promise<MediaPost[]> {
  try {
    const payload = await metaRequest<{ data: any[] }>(`${igUserId}/media`, {
      fields: "id,caption,like_count,comments_count,timestamp",
      since: dateStart,
      until: dateEnd,
      limit: "20",
    });

    return (payload.data || []).map((post) => ({
      id: post.id,
      caption: (post.caption || "").substring(0, 100),
      like_count: Number(post.like_count || 0),
      comments_count: Number(post.comments_count || 0),
      impressions: 0,
      reach: 0,
      timestamp: post.timestamp,
    }));
  } catch {
    return [];
  }
}

// ── Facebook Page Orgânico ────────────────────────────────────────────────────

export async function fetchFacebookPageInsights(pageId: string, dateStart: string, dateEnd: string): Promise<OrganicoFacebookRow[]> {
  try {
    const payload = await metaRequest<{ data: any[] }>(`${pageId}/insights`, {
      metric: "page_impressions,page_engaged_users,page_post_engagements",
      period: "day",
      since: dateStart,
      until: dateEnd,
    });

    const byDate = new Map<string, OrganicoFacebookRow>();
    for (const metric of payload.data) {
      for (const value of metric.values || []) {
        const date = value.end_time?.split("T")[0] || "";
        if (!date) continue;
        const existing = byDate.get(date) || { date, page_impressions: 0, page_engaged_users: 0, page_post_engagements: 0 };
        if (metric.name === "page_impressions") existing.page_impressions = value.value || 0;
        if (metric.name === "page_engaged_users") existing.page_engaged_users = value.value || 0;
        if (metric.name === "page_post_engagements") existing.page_post_engagements = value.value || 0;
        byDate.set(date, existing);
      }
    }
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}
