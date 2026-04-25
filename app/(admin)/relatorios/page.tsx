import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { formatCurrency, formatNumber, formatPercent, dateRangePresets } from "@/lib/utils";
import Link from "next/link";
import type { Client } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const admin = createAdminClient();
  const { last30 } = dateRangePresets();

  const { data: clients } = await admin.from("clients").select("*").order("name");
  const { data: insights } = await admin
    .from("insights_cache")
    .select("client_id, spend, impressions, clicks, leads")
    .gte("date_start", last30.dateStart)
    .lte("date_start", last30.dateEnd);

  // Agrega por cliente
  const byClient = new Map<string, { spend: number; impressions: number; clicks: number; leads: number }>();
  for (const r of insights ?? []) {
    const cid = (r as any).client_id;
    if (!cid) continue;
    const cur = byClient.get(cid) ?? { spend: 0, impressions: 0, clicks: 0, leads: 0 };
    cur.spend += Number((r as any).spend ?? 0);
    cur.impressions += Number((r as any).impressions ?? 0);
    cur.clicks += Number((r as any).clicks ?? 0);
    cur.leads += Number((r as any).leads ?? 0);
    byClient.set(cid, cur);
  }

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Performance consolidada dos últimos 30 dias por cliente"
      />

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-white/[0.02]">
              <tr className="text-left text-xs uppercase tracking-wider text-white/50">
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3 text-right">Investimento</th>
                <th className="px-5 py-3 text-right">Impressões</th>
                <th className="px-5 py-3 text-right">Cliques</th>
                <th className="px-5 py-3 text-right">CTR</th>
                <th className="px-5 py-3 text-right">Leads</th>
                <th className="px-5 py-3 text-right">CPL</th>
                <th className="px-5 py-3 text-right">CPC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(clients as Client[] | null)?.map((c) => {
                const m = byClient.get(c.id) ?? { spend: 0, impressions: 0, clicks: 0, leads: 0 };
                const ctr = m.impressions ? (m.clicks / m.impressions) * 100 : 0;
                const cpl = m.leads ? m.spend / m.leads : 0;
                const cpc = m.clicks ? m.spend / m.clicks : 0;
                return (
                  <tr key={c.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <Link href={`/relatorios/${c.id}`} className="font-medium text-white hover:text-violet-300">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-right text-white/80">{formatCurrency(m.spend)}</td>
                    <td className="px-5 py-3 text-right text-white/60">{formatNumber(m.impressions)}</td>
                    <td className="px-5 py-3 text-right text-white/60">{formatNumber(m.clicks)}</td>
                    <td className="px-5 py-3 text-right text-white/60">{formatPercent(ctr)}</td>
                    <td className="px-5 py-3 text-right text-white/80">{formatNumber(m.leads)}</td>
                    <td className="px-5 py-3 text-right text-white/60">{formatCurrency(cpl)}</td>
                    <td className="px-5 py-3 text-right text-white/60">{formatCurrency(cpc)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </>
  );
}
