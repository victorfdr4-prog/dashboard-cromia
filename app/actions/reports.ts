"use server";

import { renderToBuffer } from "@react-pdf/renderer";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { ReportPdf } from "@/lib/pdf/report";
import type { Client, InsightRow } from "@/types/database";

function lastNDays(n: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - n);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { dateStart: fmt(start), dateEnd: fmt(end) };
}

export async function generatePdfReportAction(clientId: string, days = 30) {
  const profile = await requireAdmin();
  const admin = createAdminClient();
  const { dateStart, dateEnd } = lastNDays(days);

  const { data: client } = await admin.from("clients").select("*").eq("id", clientId).single();
  const { data: insights } = await admin
    .from("insights_cache")
    .select("*")
    .eq("client_id", clientId)
    .gte("date_start", dateStart)
    .lte("date_start", dateEnd);

  if (!client) return { error: "Cliente não encontrado" };

  const buffer = await renderToBuffer(
    ReportPdf({
      client: client as Client,
      insights: (insights as InsightRow[]) ?? [],
      dateStart,
      dateEnd,
    }),
  );

  // Upload pro Storage
  const fileName = `reports/${clientId}/${dateStart}_${dateEnd}_${Date.now()}.pdf`;
  const { error: upErr } = await admin.storage
    .from("reports")
    .upload(fileName, buffer, { contentType: "application/pdf", upsert: true });
  if (upErr) return { error: `Storage: ${upErr.message}` };

  const { data: pub } = admin.storage.from("reports").getPublicUrl(fileName);

  await admin.from("reports").insert({
    client_id: clientId,
    date_start: dateStart,
    date_stop: dateEnd,
    pdf_url: pub.publicUrl,
    generated_by: profile.id,
  });

  return { pdfUrl: pub.publicUrl };
}
