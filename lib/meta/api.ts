import "server-only";

const GRAPH = "https://graph.facebook.com/v19.0";

export class MetaApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message);
  }
}

async function metaFetch<T>(path: string, params: Record<string, string>, token: string): Promise<T> {
  const qs = new URLSearchParams({ ...params, access_token: token }).toString();
  const res = await fetch(`${GRAPH}/${path}?${qs}`, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok || data?.error) {
    const msg = data?.error?.message ?? `Meta API error ${res.status}`;
    throw new MetaApiError(res.status, msg, data);
  }
  return data as T;
}

/** Troca short-lived → long-lived (~60 dias) */
export async function exchangeLongLived(shortToken: string): Promise<{ access_token: string; expires_in?: number }> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    fb_exchange_token: shortToken,
  });
  const res = await fetch(`${GRAPH}/oauth/access_token?${params}`, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok || data?.error) throw new MetaApiError(res.status, data?.error?.message ?? "exchange failed", data);
  return data;
}

/** Troca code OAuth → short-lived token */
export async function exchangeCode(code: string, redirectUri: string): Promise<{ access_token: string; expires_in?: number }> {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(`${GRAPH}/oauth/access_token?${params}`, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok || data?.error) throw new MetaApiError(res.status, data?.error?.message ?? "code exchange failed", data);
  return data;
}

export interface MetaInsight {
  date_start: string;
  date_stop: string;
  campaign_id?: string;
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  reach?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: Array<{ action_type: string; value: string }>;
}

export async function fetchInsights(
  adAccountId: string,
  token: string,
  dateStart: string,
  dateEnd: string,
): Promise<MetaInsight[]> {
  const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  const data = await metaFetch<{ data: MetaInsight[] }>(
    `${accountId}/insights`,
    {
      level: "campaign",
      time_range: JSON.stringify({ since: dateStart, until: dateEnd }),
      time_increment: "1",
      fields: "campaign_id,campaign_name,spend,impressions,clicks,reach,ctr,cpc,cpm,actions",
      limit: "500",
    },
    token,
  );
  return data.data ?? [];
}

export async function validateAdAccount(adAccountId: string, token: string) {
  const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  return metaFetch<{ id: string; name: string; account_status: number; currency: string }>(
    accountId,
    { fields: "id,name,account_status,currency" },
    token,
  );
}

export async function fetchInstagramInsights(igUserId: string, token: string) {
  return metaFetch<any>(
    `${igUserId}/insights`,
    { metric: "impressions,reach,profile_views,follower_count", period: "day" },
    token,
  );
}

export async function fetchFacebookPageInsights(pageId: string, token: string) {
  return metaFetch<any>(
    `${pageId}/insights`,
    { metric: "page_impressions,page_engaged_users,page_fans", period: "day" },
    token,
  );
}

export function buildAuthUrl(redirectUri: string, state: string) {
  const scopes = [
    "ads_read",
    "ads_management",
    "business_management",
    "pages_read_engagement",
    "pages_show_list",
    "instagram_basic",
    "instagram_manage_insights",
    "read_insights",
  ];
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: redirectUri,
    state,
    scope: scopes.join(","),
    response_type: "code",
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
}

/** Reduce raw insights into one row per (date, campaign) for our cache table */
export function normalizeInsight(row: MetaInsight) {
  const leadAction = row.actions?.find(
    (a) => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped",
  );
  const leads = leadAction ? Number(leadAction.value) : 0;
  const spend = Number(row.spend ?? 0);
  return {
    date_start: row.date_start,
    date_stop: row.date_stop,
    campaign_id: row.campaign_id ?? null,
    campaign_name: row.campaign_name ?? null,
    spend,
    impressions: Number(row.impressions ?? 0),
    clicks: Number(row.clicks ?? 0),
    reach: Number(row.reach ?? 0),
    ctr: Number(row.ctr ?? 0),
    cpc: Number(row.cpc ?? 0),
    cpm: Number(row.cpm ?? 0),
    leads,
    cpl: leads > 0 ? spend / leads : 0,
    conversions: leads,
    raw_data: row,
  };
}
