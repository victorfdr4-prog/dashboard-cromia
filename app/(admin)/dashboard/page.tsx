import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { GlassCard } from "@/components/ui/glass-card";
import { ClientCard } from "@/components/client-card";
import { Users, DollarSign, MousePointerClick, TrendingUp } from "lucide-react";
import { formatCurrency, formatNumber, formatPercent, dateRangePresets } from "@/lib/utils";
import { SyncAllButton } from "./sync-all-button";
import { DirectMetaViewer } from "./direct-meta-viewer";
import type { Client } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const admin = createAdminClient();
  const { last30 } = dateRangePresets();

  const [{ data: clients }, { data: insights }] = await Promise.all([
    admin.from("clients").select("*").order("created_at", { ascending: false }),
    admin
      .from("insights_cache")
      .select("spend, impressions, clicks, leads")
      .gte("date_start", last30.dateStart)
      .lte("date_start", last30.dateEnd),
  ]);

  const clientsList = (clients as Client[]) ?? [];
  const totals = (insights ?? []).reduce(
    (acc, r: any) => ({
      spend: acc.spend + Number(r.spend ?? 0),
      impressions: acc.impressions + Number(r.impressions ?? 0),
      clicks: acc.clicks + Number(r.clicks ?? 0),
      leads: acc.leads + Number(r.leads ?? 0),
    }),
    { spend: 0, impressions: 0, clicks: 0, leads: 0 },
  );
  const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
  const activeCount = clientsList.filter((c) => c.status === "ativo").length;
  const connectedCount = clientsList.filter((c) => !!c.meta_access_token).length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Visão geral dos últimos 30 dias — ${activeCount} ativos · ${connectedCount} conectados`}
        action={<SyncAllButton />}
      />

      <DirectMetaViewer />

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Investimento" value={formatCurrency(totals.spend)} icon={DollarSign} accent="violet" />
        <KpiCard label="Leads" value={formatNumber(totals.leads)} icon={Users} accent="pink" />
        <KpiCard label="Cliques" value={formatNumber(totals.clicks)} icon={MousePointerClick} accent="emerald" />
        <KpiCard label="CTR" value={formatPercent(ctr)} icon={TrendingUp} accent="amber" />
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-medium text-white/80">Clientes</h2>
        {clientsList.length === 0 ? (
          <GlassCard className="p-10 text-center text-sm text-white/50">
            Nenhum cliente cadastrado ainda. Vá em <span className="text-white">Clientes</span> para
            começar.
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clientsList.map((c) => (
              <ClientCard key={c.id} client={c} href={`/clientes/${c.id}`} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
