"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi-card";
import { fetchDirectMetaAction } from "@/app/actions/direct-meta";
import { DollarSign, Users, MousePointerClick, TrendingUp, Search } from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { toast } from "sonner";

export function DirectMetaViewer() {
  const [act, setAct] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  async function handleSearch() {
    if (!act.trim()) return toast.error("Digite o ACT ID");
    setLoading(true);
    setData(null);
    const res = await fetchDirectMetaAction(act.trim());
    setLoading(false);
    
    if (res.error) {
      toast.error(res.error);
    } else {
      setData(res.data);
      toast.success("Dados carregados com sucesso!");
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <GlassCard className="p-6">
        <h2 className="mb-4 text-lg font-medium text-white/90">Consulta Direta do Meta Ads (via .env)</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input 
            value={act} 
            onChange={e => setAct(e.target.value)} 
            placeholder="Cole o ID da Conta (ex: act_1234567890)" 
            className="flex-1 text-lg py-6"
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading} className="py-6 px-8 text-md">
            <Search className="mr-2 h-5 w-5" />
            {loading ? "Buscando..." : "Puxar Dados"}
          </Button>
        </div>
      </GlassCard>

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Investimento (30d)" value={formatCurrency(data.spend)} icon={DollarSign} accent="violet" />
            <KpiCard label="Leads" value={formatNumber(data.leads)} icon={Users} accent="pink" />
            <KpiCard label="Cliques" value={formatNumber(data.clicks)} icon={MousePointerClick} accent="emerald" />
            <KpiCard label="CTR" value={formatPercent(data.ctr)} icon={TrendingUp} accent="amber" />
            <KpiCard label="CPC" value={formatCurrency(data.cpc)} icon={TrendingUp} accent="violet" />
            <KpiCard label="Custo por Lead" value={formatCurrency(data.cpl)} icon={Users} accent="pink" />
          </div>

          <GlassCard className="p-6">
            <h3 className="mb-4 text-md font-medium text-white/80">Desempenho das Campanhas (Últimos 30 dias)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-white/70">
                <thead className="text-xs uppercase text-white/40 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Campanha</th>
                    <th className="px-4 py-3 text-right">Gasto</th>
                    <th className="px-4 py-3 text-right">Leads</th>
                    <th className="px-4 py-3 text-right">Cliques</th>
                    <th className="px-4 py-3 text-right">CPL</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaigns.map((c: any, i: number) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-4 font-medium text-white/90">{c.campaign_name || c.campaign_id}</td>
                      <td className="px-4 py-4 text-right">{formatCurrency(c.spend)}</td>
                      <td className="px-4 py-4 text-right">{formatNumber(c.leads)}</td>
                      <td className="px-4 py-4 text-right">{formatNumber(c.clicks)}</td>
                      <td className="px-4 py-4 text-right">{formatCurrency(c.cpl)}</td>
                    </tr>
                  ))}
                  {data.campaigns.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-white/40">
                        Nenhuma campanha com dados nesses últimos 30 dias.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
