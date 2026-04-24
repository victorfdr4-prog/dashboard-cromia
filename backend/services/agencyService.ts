import { adminSupabase } from "../db/database";

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
}

const NEW_CLIENT_COLS = "username,plataforma,orcamento,inicio_contrato,fim_contrato,observacoes,status,meta_access_token,meta_token_expires_at,meta_connected_at";

const CLIENT_DEFAULTS = {
  username: null,
  plataforma: "instagram",
  orcamento: 0,
  inicio_contrato: null,
  fim_contrato: null,
  observacoes: null,
  status: "ativo",
  segmento: null,
};

async function selectClients(): Promise<any[]> {
  // Try progressively simpler queries until one works
  const attempts = [
    `id,name,created_at,${NEW_CLIENT_COLS},segmento`,
    `id,name,created_at,${NEW_CLIENT_COLS}`,
    "id,name,created_at",
  ];

  for (const cols of attempts) {
    const { data, error } = await adminSupabase
      .from("clients")
      .select(cols)
      .order("created_at", { ascending: true });
    if (!error) {
      return (data || []).map((c: any) => ({ ...CLIENT_DEFAULTS, ...c }));
    }
  }
  return [];
}

async function selectAdAccounts(): Promise<any[]> {
  const { data, error } = await adminSupabase
    .from("ad_accounts")
    .select("id,client_id,ad_account_id,nome_conta,created_at");
  if (error) return [];
  return data || [];
}

export async function listClients(): Promise<ClientRecord[]> {
  const [clientsData, accountsData] = await Promise.all([
    selectClients(),
    selectAdAccounts(),
  ]);

  const accountsByClient = new Map<string, AdAccountRecord[]>();
  for (const acc of accountsData) {
    const list = accountsByClient.get(acc.client_id) || [];
    list.push(acc as AdAccountRecord);
    accountsByClient.set(acc.client_id, list);
  }

  return clientsData.map((c: any) => ({
    ...c,
    ad_accounts: accountsByClient.get(c.id) || [],
  })) as ClientRecord[];
}

async function insertClientResilient(fields: Record<string, any>): Promise<any> {
  // Try with all new columns first
  const { data, error } = await adminSupabase.from("clients").insert(fields).select("*").single();
  if (!error) return data;

  // If column not found, strip new columns and retry with base only
  if (error.message.includes("column") || error.message.includes("schema cache")) {
    const base = { name: fields.name, segmento: fields.segmento || null };
    const { data: d2, error: e2 } = await adminSupabase.from("clients").insert(base).select("*").single();
    if (!e2) return { ...CLIENT_DEFAULTS, ...d2 };
    throw new Error(e2.message);
  }
  throw new Error(error.message);
}

async function updateClientResilient(clientId: string, fields: Record<string, any>): Promise<any> {
  const { data, error } = await adminSupabase.from("clients").update(fields).eq("id", clientId).select("*").single();
  if (!error) return data;

  if (error.code === "PGRST116") return null;
  if (error.message.includes("column") || error.message.includes("schema cache")) {
    const base = { name: fields.name, segmento: fields.segmento || null };
    const { data: d2, error: e2 } = await adminSupabase.from("clients").update(base).eq("id", clientId).select("*").single();
    if (!e2) return { ...CLIENT_DEFAULTS, ...d2 };
    if (e2.code === "PGRST116") return null;
    throw new Error(e2.message);
  }
  throw new Error(error.message);
}

export async function createClient(payload: {
  name: string;
  username?: string;
  plataforma?: string;
  orcamento?: number;
  inicio_contrato?: string;
  fim_contrato?: string;
  observacoes?: string;
  adAccountId?: string;
  nomeConta?: string;
}) {
  const client = await insertClientResilient({
    name: payload.name,
    username: payload.username || null,
    plataforma: payload.plataforma || "instagram",
    orcamento: payload.orcamento || 0,
    inicio_contrato: payload.inicio_contrato || null,
    fim_contrato: payload.fim_contrato || null,
    observacoes: payload.observacoes || null,
    status: "ativo",
  });

  if (!client) throw new Error("Falha ao criar cliente.");

  if (payload.adAccountId) {
    const { error: accountError } = await adminSupabase
      .from("ad_accounts")
      .upsert(
        {
          client_id: client.id,
          ad_account_id: payload.adAccountId,
          nome_conta: payload.nomeConta || payload.adAccountId,
        },
        { onConflict: "ad_account_id" },
      );

    if (accountError) {
      throw new Error(accountError.message);
    }
  }

  return client;
}

export async function updateClient(
  clientId: string,
  payload: {
    name: string;
    username?: string;
    plataforma?: string;
    orcamento?: number;
    inicio_contrato?: string;
    fim_contrato?: string;
    observacoes?: string;
    status?: string;
    adAccountId?: string;
    nomeConta?: string;
  },
) {
  const client = await updateClientResilient(clientId, {
    name: payload.name,
    username: payload.username ?? null,
    plataforma: payload.plataforma || "instagram",
    orcamento: payload.orcamento ?? 0,
    inicio_contrato: payload.inicio_contrato || null,
    fim_contrato: payload.fim_contrato || null,
    observacoes: payload.observacoes || null,
    status: payload.status || "ativo",
  });

  if (client === null) return null;
  if (!client) throw new Error("Falha ao atualizar cliente.");

  if (payload.adAccountId) {
    const { error: accountError } = await adminSupabase
      .from("ad_accounts")
      .upsert(
        {
          client_id: clientId,
          ad_account_id: payload.adAccountId,
          nome_conta: payload.nomeConta || payload.adAccountId,
        },
        { onConflict: "ad_account_id" },
      );

    if (accountError) {
      throw new Error(accountError.message);
    }
  }

  return client;
}

export async function deleteClient(clientId: string) {
  const { error } = await adminSupabase.from("clients").delete().eq("id", clientId);
  if (error) {
    throw new Error(error.message);
  }
  return true;
}

export async function listAdAccounts() {
  const [accountsData, clientsResult] = await Promise.all([
    selectAdAccounts(),
    adminSupabase.from("clients").select("id,name"),
  ]);

  const clientMap = new Map(((clientsResult.data || []) as any[]).map((c) => [c.id, c.name]));

  return accountsData.map((row: any) => ({
    id: row.id,
    client_id: row.client_id,
    ad_account_id: row.ad_account_id,
    nome_conta: row.nome_conta,
    created_at: row.created_at,
    client_name: clientMap.get(row.client_id) || "",
  }));
}

export async function linkAdAccount(clientId: string, adAccountId: string, nomeConta?: string) {
  const { error } = await adminSupabase
    .from("ad_accounts")
    .upsert(
      {
        client_id: clientId,
        ad_account_id: adAccountId,
        nome_conta: nomeConta || adAccountId,
      },
      { onConflict: "ad_account_id" },
    );

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function unlinkAdAccount(adAccountId: string) {
  const { error } = await adminSupabase
    .from("ad_accounts")
    .delete()
    .eq("ad_account_id", adAccountId);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function getAdAccountContext(adAccountId: string) {
  const { data: acc, error: accError } = await adminSupabase
    .from("ad_accounts")
    .select("id,client_id,ad_account_id,nome_conta")
    .eq("ad_account_id", adAccountId)
    .maybeSingle();

  if (accError) throw new Error(accError.message);
  if (!acc) return null;

  let client: any = null;
  const colSets = [`name,segmento,${NEW_CLIENT_COLS}`, "name,segmento", "name"];
  for (const cols of colSets) {
    const { data, error } = await adminSupabase
      .from("clients")
      .select(cols)
      .eq("id", acc.client_id)
      .maybeSingle();
    if (!error) { client = { ...CLIENT_DEFAULTS, ...(data as any) }; break; }
  }

  if (!client) return null;

  return {
    id: acc.id,
    client_id: acc.client_id,
    ad_account_id: acc.ad_account_id,
    nome_conta: acc.nome_conta,
    client_name: client.name,
    username: client.username,
    plataforma: client.plataforma,
    orcamento: client.orcamento,
    status: client.status,
    segmento: client.segmento,
  };
}

export async function listReports(clientId: string) {
  const { data, error } = await adminSupabase
    .from("reports")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function saveReport(clientId: string, pdfUrl: string) {
  const { data, error } = await adminSupabase
    .from("reports")
    .insert({ client_id: clientId, pdf_url: pdfUrl })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Falha ao salvar relatorio.");
  }

  return data;
}

// ── Social Accounts ───────────────────────────────────────────────────────────

export interface SocialAccountRecord {
  id: string;
  client_id: string;
  ig_user_id: string | null;
  fb_page_id: string | null;
  ig_nome: string | null;
  fb_nome: string | null;
  created_at: string;
}

export async function listSocialAccounts(): Promise<SocialAccountRecord[]> {
  const { data, error } = await adminSupabase
    .from("social_accounts")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data || []) as SocialAccountRecord[];
}

export async function upsertSocialAccount(payload: {
  client_id: string;
  ig_user_id?: string;
  fb_page_id?: string;
  ig_nome?: string;
  fb_nome?: string;
}) {
  const { data, error } = await adminSupabase
    .from("social_accounts")
    .upsert(
      {
        client_id: payload.client_id,
        ig_user_id: payload.ig_user_id || null,
        fb_page_id: payload.fb_page_id || null,
        ig_nome: payload.ig_nome || null,
        fb_nome: payload.fb_nome || null,
      },
      { onConflict: "client_id" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteSocialAccount(clientId: string) {
  const { error } = await adminSupabase.from("social_accounts").delete().eq("client_id", clientId);
  if (error) throw new Error(error.message);
  return { success: true };
}

// ── Settings (token Meta, etc.) ───────────────────────────────────────────────

export async function saveClientToken(clientId: string, accessToken: string, expiresAt: Date | null) {
  const { error } = await adminSupabase
    .from("clients")
    .update({
      meta_access_token: accessToken,
      meta_token_expires_at: expiresAt?.toISOString() ?? null,
      meta_connected_at: new Date().toISOString(),
    })
    .eq("id", clientId);
  if (error) throw new Error(error.message);
}

export async function disconnectClientToken(clientId: string) {
  const { error } = await adminSupabase
    .from("clients")
    .update({ meta_access_token: null, meta_token_expires_at: null, meta_connected_at: null })
    .eq("id", clientId);
  if (error) throw new Error(error.message);
}

export async function getClientToken(clientId: string): Promise<string | null> {
  const { data, error } = await adminSupabase
    .from("clients")
    .select("meta_access_token")
    .eq("id", clientId)
    .single();
  if (error || !data) return null;
  return (data as any).meta_access_token ?? null;
}

export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await adminSupabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error || !data) return null;
  return (data as any).value as string;
}

export async function setSetting(key: string, value: string) {
  const { error } = await adminSupabase
    .from("settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  return { success: true };
}
