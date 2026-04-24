import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { env } from "./backend/config/env";
import { ensureDatabaseSchema } from "./backend/db/database";
import {
  createClient,
  deleteClient,
  disconnectClientToken,
  getClientToken,
  getSetting,
  linkAdAccount,
  listAdAccounts,
  listClients,
  listReports,
  listSocialAccounts,
  saveClientToken,
  setSetting,
  unlinkAdAccount,
  updateClient,
  upsertSocialAccount,
  deleteSocialAccount,
} from "./backend/services/agencyService";
import { buildDashboard } from "./backend/services/dashboardService";
import {
  fetchAccessibleAdAccounts,
  fetchAdAccountById,
  fetchBusinessAdAccounts,
  fetchDailyInsights,
  fetchInstagramInsights,
  fetchInstagramMedia,
  fetchFacebookPageInsights,
  invalidateTokenCache,
} from "./backend/services/metaAdsService";
import { generatePdfReport } from "./backend/services/reportService";
import { startScheduler } from "./backend/services/scheduler";
import { buildSummary, buildRelatorios } from "./backend/services/summaryService";
import { adminSupabase } from "./backend/db/database";

const app = express();

app.use(express.json());
app.use("/reports", express.static(path.resolve(process.cwd(), env.reportsDir)));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ── Clientes ──────────────────────────────────────────────────────────────────

app.get("/api/clients", async (_req, res) => {
  try {
    res.json(await listClients());
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/clients", async (req, res) => {
  try {
    const { name, username, plataforma, orcamento, inicio_contrato, fim_contrato, observacoes, adAccountId, nomeConta } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Nome do cliente é obrigatorio." });
    }
    const client = await createClient({ name, username, plataforma, orcamento, inicio_contrato, fim_contrato, observacoes, adAccountId, nomeConta });
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put("/api/clients/:clientId", async (req, res) => {
  try {
    const updated = await updateClient(req.params.clientId, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Cliente nao encontrado." });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete("/api/clients/:clientId", async (req, res) => {
  try {
    const deleted = await deleteClient(req.params.clientId);
    if (!deleted) {
      return res.status(404).json({ error: "Cliente nao encontrado." });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ── Contas Meta vinculadas ──────────────────────────────────────────────────

app.get("/api/ad-accounts", async (_req, res) => {
  try {
    res.json(await listAdAccounts());
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/ad-accounts/link", async (req, res) => {
  try {
    const { clientId, adAccountId, nomeConta } = req.body;
    if (!clientId || !adAccountId) {
      return res.status(400).json({ error: "clientId e adAccountId sao obrigatorios." });
    }
    res.json(await linkAdAccount(clientId, adAccountId, nomeConta));
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete("/api/ad-accounts/:adAccountId", async (req, res) => {
  try {
    res.json(await unlinkAdAccount(req.params.adAccountId));
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ── Settings / Token ──────────────────────────────────────────────────────────

app.get("/api/settings/:key", async (req, res) => {
  try {
    const value = await getSetting(req.params.key);
    res.json({ key: req.params.key, value });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/settings", async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: "key e value sao obrigatorios." });
    }
    await setSetting(key, value);
    if (key === "META_ACCESS_TOKEN") invalidateTokenCache();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ── Meta OAuth Login ──────────────────────────────────────────────────────────

// Retorna a URL de autorização do Meta para o frontend abrir em popup
// clientId no query param é codificado no state para identificar o cliente após callback
app.get("/api/meta/auth-url", (req, res) => {
  const { metaAppId, metaRedirectUri, metaGraphVersion } = env;
  if (!metaAppId) return res.status(500).json({ error: "META_APP_ID não configurado." });

  const clientId = (req.query.clientId as string) || "";
  const scopes = [
    "ads_read",
    "ads_management",
    "business_management",
    "pages_read_engagement",
    "instagram_basic",
    "read_insights",
  ].join(",");

  // state = clientId:randomNonce para identificar o cliente no callback
  const nonce = Math.random().toString(36).slice(2);
  const state = clientId ? `${clientId}:${nonce}` : nonce;

  const url = new URL(`https://www.facebook.com/${metaGraphVersion}/dialog/oauth`);
  url.searchParams.set("client_id", metaAppId);
  url.searchParams.set("redirect_uri", metaRedirectUri);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);

  res.json({ url: url.toString() });
});

// Callback do OAuth — Meta redireciona aqui com o código
app.get("/api/meta/callback", async (req, res) => {
  const { code, state, error: oauthError, error_description } = req.query as Record<string, string>;

  // Extrai clientId do state
  const clientId = state?.includes(":") ? state.split(":")[0] : null;

  if (oauthError || !code) {
    const errMsg = (error_description || oauthError || "Autorização negada").replace(/"/g, "'");
    return res.send(`<html><body><script>
      window.opener && window.opener.postMessage({ type: "META_AUTH_ERROR", clientId: "${clientId || ''}", error: "${errMsg}" }, "*");
      window.close();
    </script></body></html>`);
  }

  try {
    const { metaAppId, metaAppSecret, metaRedirectUri, metaGraphVersion } = env;

    // 1. Troca code por short-lived token
    const tokenUrl = new URL(`https://graph.facebook.com/${metaGraphVersion}/oauth/access_token`);
    tokenUrl.searchParams.set("client_id", metaAppId);
    tokenUrl.searchParams.set("client_secret", metaAppSecret);
    tokenUrl.searchParams.set("redirect_uri", metaRedirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenResp = await fetch(tokenUrl.toString());
    const tokenData = await tokenResp.json() as any;
    if (tokenData.error) throw new Error(tokenData.error.message);

    // 2. Troca por long-lived token (~60 dias)
    const llUrl = new URL(`https://graph.facebook.com/${metaGraphVersion}/oauth/access_token`);
    llUrl.searchParams.set("grant_type", "fb_exchange_token");
    llUrl.searchParams.set("client_id", metaAppId);
    llUrl.searchParams.set("client_secret", metaAppSecret);
    llUrl.searchParams.set("fb_exchange_token", tokenData.access_token);

    const llResp = await fetch(llUrl.toString());
    const llData = await llResp.json() as any;
    if (llData.error) throw new Error(llData.error.message);

    const finalToken = llData.access_token;
    const expiresInSeconds = llData.expires_in || 5184000; // 60 days default
    const expiresInDays = Math.floor(expiresInSeconds / 86400);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // 3a. Se tem clientId → salva token no cliente específico
    if (clientId) {
      await saveClientToken(clientId, finalToken, expiresAt);

      // Busca as contas de anúncio desse token e vincula automaticamente
      try {
        const { fetchClientAdAccounts } = await import("./backend/services/metaAdsService");
        const { linkAdAccount: link } = await import("./backend/services/agencyService");
        const accounts = await fetchClientAdAccounts(finalToken);
        for (const acc of accounts.data || []) {
          try { await link(clientId, acc.account_id, acc.name); } catch {}
        }
      } catch {}

      return res.send(`<html><body><script>
        window.opener && window.opener.postMessage({ type: "META_AUTH_SUCCESS", clientId: "${clientId}", expires_in_days: ${expiresInDays} }, "*");
        window.close();
      </script></body></html>`);
    }

    // 3b. Sem clientId → salva como token global do sistema
    await setSetting("META_ACCESS_TOKEN", finalToken);
    invalidateTokenCache();

    return res.send(`<html><body><script>
      window.opener && window.opener.postMessage({ type: "META_AUTH_SUCCESS", clientId: "", expires_in_days: ${expiresInDays} }, "*");
      window.close();
    </script></body></html>`);
  } catch (err) {
    const msg = (err as Error).message.replace(/"/g, "'");
    return res.send(`<html><body><script>
      window.opener && window.opener.postMessage({ type: "META_AUTH_ERROR", clientId: "${clientId || ''}", error: "${msg}" }, "*");
      window.close();
    </script></body></html>`);
  }
});

// Desconectar token de um cliente
app.delete("/api/meta/client/:clientId/token", async (req, res) => {
  try {
    await disconnectClientToken(req.params.clientId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ── Exchange token Meta (short-lived → long-lived 60 dias) ───────────────────

app.post("/api/meta/exchange-token", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "token obrigatorio." });

    const appId = env.metaAppId;
    const appSecret = env.metaAppSecret;
    if (!appId || !appSecret) {
      return res.status(500).json({ error: "META_APP_ID e META_APP_SECRET nao configurados no .env." });
    }

    const url = `https://graph.facebook.com/${env.metaGraphVersion}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${encodeURIComponent(token)}`;
    const r = await fetch(url);
    const data = await r.json() as any;

    if (data.error) {
      return res.status(400).json({ error: data.error.message || "Falha ao trocar token." });
    }

    await setSetting("META_ACCESS_TOKEN", data.access_token);
    invalidateTokenCache();

    const expiresInDays = data.expires_in ? Math.floor(data.expires_in / 86400) : 60;
    res.json({ access_token: data.access_token, expires_in_days: expiresInDays });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ── Meta API ──────────────────────────────────────────────────────────────────

app.get("/api/meta/ad-accounts", async (_req, res) => {
  try {
    const payload = await fetchAccessibleAdAccounts();
    res.json(payload.data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Valida conta pelo ID direto (act_XXXXX ou só o número)
app.get("/api/meta/validate-account/:adAccountId", async (req, res) => {
  try {
    const data = await fetchAdAccountById(req.params.adAccountId);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Lista contas de um Business Manager
app.get("/api/meta/business/:businessId/accounts", async (req, res) => {
  try {
    const accounts = await fetchBusinessAdAccounts(req.params.businessId);
    res.json(accounts);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// ── Sincronizar dados ─────────────────────────────────────────────────────────

app.post("/api/sync/:adAccountId", async (req, res) => {
  try {
    const defaultEnd = format(startOfDay(new Date()), "yyyy-MM-dd");
    const defaultStart = format(subDays(startOfDay(new Date()), 29), "yyyy-MM-dd");
    const dateStart = String(req.body.dateStart || defaultStart);
    const dateEnd = String(req.body.dateEnd || defaultEnd);

    // Usa token do cliente se disponível, senão usa token global
    const clientId = req.body.clientId as string | undefined;
    const clientToken = clientId ? await getClientToken(clientId) : null;

    const rows = await fetchDailyInsights(req.params.adAccountId, dateStart, dateEnd, clientToken ?? undefined);

    for (const row of rows) {
      await adminSupabase
        .from("insights_cache")
        .upsert(
          { ad_account_id: req.params.adAccountId, data: row.date, dados_json: row },
          { onConflict: "ad_account_id,data" },
        );
    }

    res.json({ synced: rows.length, dateStart, dateEnd });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ── Resumo do Dashboard ────────────────────────────────────────────────────────

app.get("/api/summary", async (req, res) => {
  try {
    const defaultEnd = format(startOfDay(new Date()), "yyyy-MM-dd");
    const defaultStart = format(subDays(startOfDay(new Date()), 29), "yyyy-MM-dd");
    const dateStart = String(req.query.dateStart || defaultStart);
    const dateEnd = String(req.query.dateEnd || defaultEnd);
    res.json(await buildSummary(dateStart, dateEnd));
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ── Relatórios ────────────────────────────────────────────────────────────────

app.get("/api/relatorios", async (req, res) => {
  try {
    const defaultEnd = format(startOfDay(new Date()), "yyyy-MM-dd");
    const defaultStart = format(subDays(startOfDay(new Date()), 29), "yyyy-MM-dd");
    const dateStart = String(req.query.dateStart || defaultStart);
    const dateEnd = String(req.query.dateEnd || defaultEnd);
    const plataforma = req.query.plataforma ? String(req.query.plataforma) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    res.json(await buildRelatorios(dateStart, dateEnd, plataforma, status));
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ── Dashboard por conta ───────────────────────────────────────────────────────

app.get("/api/dashboard/:adAccountId", async (req, res) => {
  try {
    const defaultEnd = format(startOfDay(new Date()), "yyyy-MM-dd");
    const defaultStart = format(subDays(startOfDay(new Date()), 6), "yyyy-MM-dd");
    const dateStart = String(req.query.dateStart || defaultStart);
    const dateEnd = String(req.query.dateEnd || defaultEnd);

    res.json(await buildDashboard(req.params.adAccountId, dateStart, dateEnd));
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ── Social Accounts ───────────────────────────────────────────────────────────

app.get("/api/social-accounts", async (_req, res) => {
  try {
    res.json(await listSocialAccounts());
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/social-accounts", async (req, res) => {
  try {
    const { client_id, ig_user_id, fb_page_id, ig_nome, fb_nome } = req.body;
    if (!client_id) return res.status(400).json({ error: "client_id obrigatorio." });
    res.json(await upsertSocialAccount({ client_id, ig_user_id, fb_page_id, ig_nome, fb_nome }));
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete("/api/social-accounts/:clientId", async (req, res) => {
  try {
    res.json(await deleteSocialAccount(req.params.clientId));
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ── Dados Orgânicos ───────────────────────────────────────────────────────────

app.get("/api/organico/instagram/:igUserId", async (req, res) => {
  try {
    const defaultEnd = format(startOfDay(new Date()), "yyyy-MM-dd");
    const defaultStart = format(subDays(startOfDay(new Date()), 29), "yyyy-MM-dd");
    const dateStart = String(req.query.dateStart || defaultStart);
    const dateEnd = String(req.query.dateEnd || defaultEnd);

    const [insights, media] = await Promise.all([
      fetchInstagramInsights(req.params.igUserId, dateStart, dateEnd),
      fetchInstagramMedia(req.params.igUserId, dateStart, dateEnd),
    ]);

    const totalLikes = media.reduce((s, p) => s + p.like_count, 0);
    const totalComments = media.reduce((s, p) => s + p.comments_count, 0);
    const totalImpressoes = insights.reduce((s, r) => s + r.impressions, 0);
    const totalAlcance = insights.reduce((s, r) => s + r.reach, 0);
    const engajamento = totalLikes + totalComments;
    const taxaEngajamento = totalAlcance > 0 ? (engajamento / totalAlcance) * 100 : 0;

    res.json({
      kpis: {
        impressoes: totalImpressoes,
        alcance: totalAlcance,
        engajamento,
        taxa_engajamento: taxaEngajamento,
        total_posts: media.length,
        total_likes: totalLikes,
        total_comentarios: totalComments,
      },
      posts_top: [...media].sort((a, b) => (b.like_count + b.comments_count) - (a.like_count + a.comments_count)).slice(0, 5),
      grafico: insights,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/api/organico/facebook/:pageId", async (req, res) => {
  try {
    const defaultEnd = format(startOfDay(new Date()), "yyyy-MM-dd");
    const defaultStart = format(subDays(startOfDay(new Date()), 29), "yyyy-MM-dd");
    const dateStart = String(req.query.dateStart || defaultStart);
    const dateEnd = String(req.query.dateEnd || defaultEnd);

    const insights = await fetchFacebookPageInsights(req.params.pageId, dateStart, dateEnd);

    const totalImpressoes = insights.reduce((s, r) => s + r.page_impressions, 0);
    const totalEngajados = insights.reduce((s, r) => s + r.page_engaged_users, 0);
    const totalEngajamento = insights.reduce((s, r) => s + r.page_post_engagements, 0);

    res.json({
      kpis: {
        impressoes: totalImpressoes,
        usuarios_engajados: totalEngajados,
        engajamento_posts: totalEngajamento,
        taxa_engajamento: totalImpressoes > 0 ? (totalEngajados / totalImpressoes) * 100 : 0,
      },
      grafico: insights,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ── Relatórios PDF ────────────────────────────────────────────────────────────

app.post("/api/reports/:adAccountId", async (req, res) => {
  try {
    const defaultEnd = format(subDays(endOfDay(new Date()), 1), "yyyy-MM-dd");
    const defaultStart = format(subDays(startOfDay(new Date()), 7), "yyyy-MM-dd");
    const dateStart = String(req.body.dateStart || defaultStart);
    const dateEnd = String(req.body.dateEnd || defaultEnd);
    const result = await generatePdfReport(req.params.adAccountId, dateStart, dateEnd);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/api/reports/client/:clientId", async (req, res) => {
  try {
    res.json(await listReports(req.params.clientId));
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ── Start ──────────────────────────────────────────────────────────────────────

async function startServer() {
  await ensureDatabaseSchema();
  startScheduler();

  if (env.nodeEnv !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const basePath = (process.env.VITE_BASE_PATH || "/").replace(/\/$/, ""); // ex: "/dashboard"
    // Serve arquivos estáticos
    app.use(basePath || "/", express.static(distPath));
    // Qualquer rota que não seja /api retorna o index.html (SPA)
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api")) return res.status(404).json({ error: "Not found" });
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(env.port, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://localhost:${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Falha ao iniciar o servidor:", error);
  process.exit(1);
});
