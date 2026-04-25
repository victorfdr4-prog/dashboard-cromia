"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { fetchInsights, normalizeInsight } from "@/lib/meta/api";

function lastNDays(n: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - n);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { dateStart: fmt(start), dateEnd: fmt(end) };
}

export async function syncClientAction(clientId: string, days = 30) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: client, error: cErr } = await admin
    .from("clients")
    .select("id, meta_access_token")
    .eq("id", clientId)
    .single();
  if (cErr || !client) return { error: "Cliente não encontrado" };
  if (!client.meta_access_token) return { error: "Cliente sem token Meta. Peça para conectar." };

  const { data: accounts } = await admin
    .from("ad_accounts")
    .select("id, ad_account_id")
    .eq("client_id", clientId)
    .eq("ativo", true);

  if (!accounts?.length) return { error: "Nenhuma conta de anúncios vinculada" };

  const { dateStart, dateEnd } = lastNDays(days);
  let totalRows = 0;

  for (const acc of accounts) {
    try {
      const insights = await fetchInsights(acc.ad_account_id, client.meta_access_token, dateStart, dateEnd);
      const rows = insights.map((row) => ({
        ...normalizeInsight(row),
        ad_account_id: acc.ad_account_id,
        client_id: clientId,
      }));
      if (rows.length) {
        const { error } = await admin
          .from("insights_cache")
          .upsert(rows, { onConflict: "ad_account_id,date_start,campaign_id" });
        if (!error) totalRows += rows.length;
      }
      await admin.from("ad_accounts").update({ ultima_sync: new Date().toISOString() }).eq("id", acc.id);
    } catch (e: any) {
      return { error: `Falha ao sincronizar ${acc.ad_account_id}: ${e.message}` };
    }
  }

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");
  return { ok: true, synced: totalRows, dateStart, dateEnd };
}

export async function syncAllAction(days = 30) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: clients } = await admin
    .from("clients")
    .select("id")
    .not("meta_access_token", "is", null);
  if (!clients?.length) return { ok: true, synced: 0 };

  let total = 0;
  for (const c of clients) {
    const r = await syncClientAction(c.id, days);
    if ("synced" in r) total += r.synced ?? 0;
  }
  return { ok: true, synced: total };
}
