import { ClientRecord, DashboardPayload, MetaAccountOption, OrganicoFacebookPayload, OrganicoInstagramPayload, RelatoriosPayload, SocialAccountRecord, SummaryPayload } from "../types";

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Falha na requisicao.");
  }
  return payload;
}

export async function fetchClients(): Promise<ClientRecord[]> {
  return parseResponse(await fetch("/api/clients"));
}

export async function createClient(payload: {
  name: string;
  username?: string;
  plataforma?: string;
  orcamento?: number;
  inicio_contrato?: string;
  fim_contrato?: string;
  observacoes?: string;
}) {
  return parseResponse(
    await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export async function updateClient(clientId: string, payload: {
  name: string;
  username?: string;
  plataforma?: string;
  orcamento?: number;
  inicio_contrato?: string;
  fim_contrato?: string;
  observacoes?: string;
  status?: string;
}) {
  return parseResponse(
    await fetch(`/api/clients/${clientId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export async function deleteClient(clientId: string) {
  const response = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
  if (!response.ok) {
    const payload = await response.json();
    throw new Error(payload.error || "Falha ao remover cliente.");
  }
}

export async function fetchMetaAccounts(): Promise<MetaAccountOption[]> {
  return parseResponse(await fetch("/api/meta/ad-accounts"));
}

export async function validateMetaAccount(adAccountId: string): Promise<MetaAccountOption> {
  return parseResponse(await fetch(`/api/meta/validate-account/${adAccountId}`));
}

export async function fetchBusinessAccounts(businessId: string): Promise<MetaAccountOption[]> {
  return parseResponse(await fetch(`/api/meta/business/${businessId}/accounts`));
}

export async function linkAdAccount(clientId: string, adAccountId: string, nomeConta?: string) {
  return parseResponse(
    await fetch("/api/ad-accounts/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, adAccountId, nomeConta }),
    }),
  );
}

export async function unlinkAdAccount(adAccountId: string) {
  return parseResponse(
    await fetch(`/api/ad-accounts/${adAccountId}`, { method: "DELETE" }),
  );
}

export async function syncAdAccount(adAccountId: string, clientId?: string) {
  return parseResponse<{ synced: number; dateStart: string; dateEnd: string }>(
    await fetch(`/api/sync/${adAccountId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clientId ? { clientId } : {}),
    }),
  );
}

export async function fetchSummary(dateStart?: string, dateEnd?: string): Promise<SummaryPayload> {
  const params = new URLSearchParams();
  if (dateStart) params.set("dateStart", dateStart);
  if (dateEnd) params.set("dateEnd", dateEnd);
  const qs = params.toString() ? `?${params}` : "";
  return parseResponse(await fetch(`/api/summary${qs}`));
}

export async function fetchRelatorios(dateStart?: string, dateEnd?: string, plataforma?: string, status?: string): Promise<RelatoriosPayload> {
  const params = new URLSearchParams();
  if (dateStart) params.set("dateStart", dateStart);
  if (dateEnd) params.set("dateEnd", dateEnd);
  if (plataforma) params.set("plataforma", plataforma);
  if (status) params.set("status", status);
  const qs = params.toString() ? `?${params}` : "";
  return parseResponse(await fetch(`/api/relatorios${qs}`));
}

// ── Meta Token Exchange ───────────────────────────────────────────────────────

export async function fetchMetaAuthUrl(clientId?: string): Promise<{ url: string }> {
  const qs = clientId ? `?clientId=${clientId}` : "";
  return parseResponse(await fetch(`/api/meta/auth-url${qs}`));
}

export async function disconnectClientToken(clientId: string): Promise<void> {
  await parseResponse(await fetch(`/api/meta/client/${clientId}/token`, { method: "DELETE" }));
}

export async function exchangeMetaToken(token: string): Promise<{ access_token: string; expires_in_days: number }> {
  return parseResponse(
    await fetch("/api/meta/exchange-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }),
  );
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function saveSetting(key: string, value: string) {
  return parseResponse(
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    }),
  );
}

export async function getSetting(key: string): Promise<string | null> {
  try {
    const d = await parseResponse<{ key: string; value: string | null }>(await fetch(`/api/settings/${key}`));
    return d.value;
  } catch {
    return null;
  }
}

// ── Social Accounts ───────────────────────────────────────────────────────────

export async function fetchSocialAccounts(): Promise<SocialAccountRecord[]> {
  return parseResponse(await fetch("/api/social-accounts"));
}

export async function saveSocialAccount(payload: {
  client_id: string;
  ig_user_id?: string;
  fb_page_id?: string;
  ig_nome?: string;
  fb_nome?: string;
}) {
  return parseResponse(
    await fetch("/api/social-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export async function removeSocialAccount(clientId: string) {
  return parseResponse(await fetch(`/api/social-accounts/${clientId}`, { method: "DELETE" }));
}

// ── Orgânico ──────────────────────────────────────────────────────────────────

export async function fetchOrganicoInstagram(igUserId: string, dateStart?: string, dateEnd?: string): Promise<OrganicoInstagramPayload> {
  const params = new URLSearchParams();
  if (dateStart) params.set("dateStart", dateStart);
  if (dateEnd) params.set("dateEnd", dateEnd);
  const qs = params.toString() ? `?${params}` : "";
  return parseResponse(await fetch(`/api/organico/instagram/${igUserId}${qs}`));
}

export async function fetchOrganicoFacebook(pageId: string, dateStart?: string, dateEnd?: string): Promise<OrganicoFacebookPayload> {
  const params = new URLSearchParams();
  if (dateStart) params.set("dateStart", dateStart);
  if (dateEnd) params.set("dateEnd", dateEnd);
  const qs = params.toString() ? `?${params}` : "";
  return parseResponse(await fetch(`/api/organico/facebook/${pageId}${qs}`));
}

// ─────────────────────────────────────────────────────────────────────────────

export async function fetchDashboard(adAccountId: string, dateStart: string, dateEnd: string): Promise<DashboardPayload> {
  return parseResponse(await fetch(`/api/dashboard/${adAccountId}?${new URLSearchParams({ dateStart, dateEnd })}`));
}

export async function generatePdfReport(adAccountId: string, dateStart: string, dateEnd: string) {
  return parseResponse<{ pdfUrl: string }>(
    await fetch(`/api/reports/${adAccountId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateStart, dateEnd }),
    }),
  );
}
