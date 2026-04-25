import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchInsights, normalizeInsight } from "@/lib/meta/api";

/** Cron diário do Railway. Chame com `Authorization: Bearer ${CRON_SECRET}`. */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: clients } = await admin
    .from("clients")
    .select("id, meta_access_token")
    .not("meta_access_token", "is", null);

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  const dateStart = start.toISOString().slice(0, 10);
  const dateEnd = end.toISOString().slice(0, 10);

  let totalRows = 0;
  const errors: string[] = [];

  for (const client of clients ?? []) {
    const { data: accounts } = await admin
      .from("ad_accounts")
      .select("id, ad_account_id")
      .eq("client_id", client.id)
      .eq("ativo", true);

    for (const acc of accounts ?? []) {
      try {
        const insights = await fetchInsights(
          acc.ad_account_id,
          client.meta_access_token!,
          dateStart,
          dateEnd,
        );
        const rows = insights.map((row) => ({
          ...normalizeInsight(row),
          ad_account_id: acc.ad_account_id,
          client_id: client.id,
        }));
        if (rows.length) {
          await admin
            .from("insights_cache")
            .upsert(rows, { onConflict: "ad_account_id,date_start,campaign_id" });
          totalRows += rows.length;
        }
        await admin
          .from("ad_accounts")
          .update({ ultima_sync: new Date().toISOString() })
          .eq("id", acc.id);
      } catch (e: any) {
        errors.push(`${client.id}/${acc.ad_account_id}: ${e.message}`);
      }
    }
  }

  return NextResponse.json({ ok: true, synced: totalRows, errors, dateStart, dateEnd });
}
