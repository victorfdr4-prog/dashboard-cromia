import { GlassCard } from "@/components/ui/glass-card";
import { KpiCard } from "@/components/kpi-card";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
} from "@/lib/utils";
import { DollarSign, Users, MousePointerClick, TrendingUp } from "lucide-react";
import { ReportChart } from "./report-chart";
import type { Client, InsightRow } from "@/types/database";

export function ReportView({
  client,
  insights,
  dateStart,
  dateEnd,
}: {
  client: Client;
  insights: InsightRow[];
  dateStart: string;
  dateEnd: string;
}) {
  const totals = insights.reduce(
    (a, r) => ({
      spend: a.spend + Number(r.spend),
      impressions: a.impressions + Number(r.impressions),
      clicks: a.clicks + Number(r.clicks),
      leads: a.leads + Number(r.leads),
    }),
    { spend: 0, impressions: 0, clicks: 0, leads: 0 },
  );
  const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpl = totals.leads ? totals.spend / totals.leads : 0;

  // Daily aggregation for chart
  const byDay = new Map<string, { date: string; spend: number; leads: number; clicks: number }>();
  for (const r of insights) {
    const k = r.date_start;
    const cur = byDay.get(k) ?? { date: k, spend: 0, leads: 0, clicks: 0 };
    cur.spend += Number(r.spend);
    cur.leads += Number(r.leads);
    cur.clicks += Number(r.clicks);
    byDay.set(k, cur);
  }
  const chartData = Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Aggregate by campaign
  const byCampaign = new Map<string, { name: string; spend: number; impressions: number; clicks: number; leads: number }>();
  for (const r of insights) {
    const k = r.campaign_id ?? "—";
    const cur = byCampaign.get(k) ?? { name: r.campaign_name ?? "—", spend: 0, impressions: 0, clicks: 0, leads: 0 };
    cur.spend += Number(r.spend);
    cur.impressions += Number(r.impressions);
    cur.clicks += Number(r.clicks);
    cur.leads += Number(r.leads);
    byCampaign.set(k, cur);
  }
  const campaigns = Array.from(byCampaign.values()).sort((a, b) => b.spend - a.spend);

  return (
    <div className="space-y-8">
      <p className="text-sm text-white/50">
        Período: <span className="text-white/80">{formatDate(dateStart)}</span> →{" "}
        <span className="text-white/80">{formatDate(dateEnd)}</span>
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Investimento" value={formatCurrency(totals.spend)} icon={DollarSign} accent="violet" />
        <KpiCard label="Leads" value={formatNumber(totals.leads)} icon={Users} accent="pink" />
        <KpiCard label="CPL" value={formatCurrency(cpl)} icon={MousePointerClick} accent="emerald" />
        <KpiCard label="CTR" value={formatPercent(ctr)} icon={TrendingUp} accent="amber" />
      </div>

      <GlassCard className="p-6">
        <h3 className="mb-4 text-sm font-medium text-white/80">Evolução diária</h3>
        <ReportChart data={chartData} />
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <h3 className="px-6 py-4 text-sm font-medium text-white/80">Campanhas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y border-white/10 bg-white/[0.02]">
              <tr className="text-left text-xs uppercase tracking-wider text-white/50">
                <th className="px-5 py-3">Campanha</th>
                <th className="px-5 py-3 text-right">Investimento</th>
                <th className="px-5 py-3 text-right">Impressões</th>
                <th className="px-5 py-3 text-right">Cliques</th>
                <th className="px-5 py-3 text-right">CTR</th>
                <th className="px-5 py-3 text-right">Leads</th>
                <th className="px-5 py-3 text-right">CPL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {campaigns.map((c) => {
                const cctr = c.impressions ? (c.clicks / c.impressions) * 100 : 0;
                const ccpl = c.leads ? c.spend / c.leads : 0;
                return (
                  <tr key={c.name} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3 font-medium">{c.name}</td>
                    <td className="px-5 py-3 text-right">{formatCurrency(c.spend)}</td>
                    <td className="px-5 py-3 text-right text-white/60">{formatNumber(c.impressions)}</td>
                    <td className="px-5 py-3 text-right text-white/60">{formatNumber(c.clicks)}</td>
                    <td className="px-5 py-3 text-right text-white/60">{formatPercent(cctr)}</td>
                    <td className="px-5 py-3 text-right">{formatNumber(c.leads)}</td>
                    <td className="px-5 py-3 text-right text-white/60">{formatCurrency(ccpl)}</td>
                  </tr>
                );
              })}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-white/40">
                    Nenhum dado no período
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
