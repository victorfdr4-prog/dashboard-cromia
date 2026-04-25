import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/page-header";
import { ReportView } from "@/components/report-view";
import { ClientActions } from "../../clientes/[id]/client-actions";
import { dateRangePresets } from "@/lib/utils";
import type { Client, InsightRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ReportClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const admin = createAdminClient();
  const { last30 } = dateRangePresets();

  const [{ data: client }, { data: insights }] = await Promise.all([
    admin.from("clients").select("*").eq("id", clientId).single(),
    admin
      .from("insights_cache")
      .select("*")
      .eq("client_id", clientId)
      .gte("date_start", last30.dateStart)
      .lte("date_start", last30.dateEnd)
      .order("date_start"),
  ]);

  if (!client) notFound();
  const c = client as Client;

  return (
    <>
      <Link href="/relatorios" className="mb-4 inline-flex items-center gap-1 text-sm text-white/50 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <PageHeader
        title={`Relatório · ${c.name}`}
        description="Detalhamento por campanha"
        action={<ClientActions client={c} />}
      />
      <ReportView
        client={c}
        insights={(insights as InsightRow[]) ?? []}
        dateStart={last30.dateStart}
        dateEnd={last30.dateEnd}
      />
    </>
  );
}
