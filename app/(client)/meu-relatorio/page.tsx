import { createClient } from "@/lib/supabase/server";
import { requireClient } from "@/lib/auth";
import { GlassCard } from "@/components/ui/glass-card";
import { ReportView } from "@/components/report-view";
import { dateRangePresets } from "@/lib/utils";
import type { Client, InsightRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function MeuRelatorioPage() {
  const profile = await requireClient();
  const supabase = await createClient();
  const { last30 } = dateRangePresets();

  // RLS garante que cliente só vê os próprios dados
  const { data: clientData } = await supabase
    .from("clients")
    .select("*")
    .eq("id", profile.client_id!)
    .single();

  const { data: insights } = await supabase
    .from("insights_cache")
    .select("*")
    .eq("client_id", profile.client_id!)
    .gte("date_start", last30.dateStart)
    .lte("date_start", last30.dateEnd)
    .order("date_start");

  if (!clientData) {
    return (
      <GlassCard className="p-10 text-center text-sm text-white/60">
        Seu acesso ainda não foi vinculado a um cliente. Entre em contato com a agência.
      </GlassCard>
    );
  }

  const c = clientData as Client;
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Olá, {c.name}</h1>
        <p className="mt-1 text-sm text-white/50">Aqui está o resumo das suas campanhas Meta Ads.</p>
      </div>
      <ReportView
        client={c}
        insights={(insights as InsightRow[]) ?? []}
        dateStart={last30.dateStart}
        dateEnd={last30.dateEnd}
      />
    </>
  );
}
