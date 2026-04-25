"use client";

import { useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi-card";
import { fetchDirectMetaAction } from "@/app/actions/direct-meta";
import { DollarSign, Users, MousePointerClick, TrendingUp, Search, BarChart3 } from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";

export function DirectMetaViewer() {
  const [act, setAct] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const tableRef = useRef<HTMLTableSectionElement>(null);

  async function handleSearch() {
    if (!act.trim()) return toast.error("Digite o ACT ID");
    setLoading(true);
    const res = await fetchDirectMetaAction(act.trim());
    setLoading(false);
    
    if (res.error) {
      toast.error(res.error);
    } else {
      setData(res.data);
      toast.success("Dados carregados com sucesso!");
    }
  }

  useEffect(() => {
    if (data && tableRef.current) {
      gsap.fromTo(
        tableRef.current.querySelectorAll("tr"),
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }
      );
    }
  }, [data]);

  return (
    <div className="mt-8 flex flex-col gap-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <GlassCard className="p-8 border-violet-500/20 glow-violet overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <BarChart3 size={120} />
          </div>
          <h2 className="mb-6 text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="h-8 w-1 bg-gradient-brand rounded-full" />
            Auditoria Instantânea Meta Ads
          </h2>
          <div className="flex flex-col gap-4 sm:flex-row relative z-10">
            <div className="relative flex-1 group">
              <Input 
                value={act} 
                onChange={e => setAct(e.target.value)} 
                placeholder="Cole o ID da Conta (act_xxxxxxxx)" 
                className="flex-1 text-lg py-7 bg-white/5 border-white/10 focus:border-violet-500/50 transition-all pl-12"
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={loading} 
              className="py-7 px-10 text-md bg-gradient-brand hover:brightness-110 transition-all font-bold shadow-lg shadow-violet-500/20"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                  Sincronizando...
                </div>
              ) : (
                "Puxar Inteligência"
              )}
            </Button>
          </div>
          <p className="mt-3 text-[11px] text-white/30 font-medium tracking-wide">
            Utilizando token global de alta performance configurado em .env
          </p>
        </GlassCard>
      </motion.div>

      <AnimatePresence mode="wait">
        {data && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <KpiCard label="Investimento" value={formatCurrency(data.spend)} icon={DollarSign} accent="violet" />
              <KpiCard label="Leads" value={formatNumber(data.leads)} icon={Users} accent="pink" />
              <KpiCard label="Cliques" value={formatNumber(data.clicks)} icon={MousePointerClick} accent="emerald" />
              <KpiCard label="CTR" value={formatPercent(data.ctr)} icon={TrendingUp} accent="amber" />
              <KpiCard label="CPC" value={formatCurrency(data.cpc)} icon={TrendingUp} accent="violet" />
              <KpiCard label="CPA / CPL" value={formatCurrency(data.cpl)} icon={Users} accent="pink" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard className="p-8">
                <h3 className="mb-6 text-lg font-bold text-white/90 flex items-center gap-2">
                  <span className="h-2 w-2 bg-pink-500 rounded-full animate-pulse" />
                  Métricas por Campanha
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[11px] font-bold uppercase tracking-widest text-white/30 border-b border-white/5">
                      <tr>
                        <th className="px-4 py-4 pb-6">Campanha</th>
                        <th className="px-4 py-4 pb-6 text-right">Gasto</th>
                        <th className="px-4 py-4 pb-6 text-right">Leads</th>
                        <th className="px-4 py-4 pb-6 text-right">Cliques</th>
                        <th className="px-4 py-4 pb-6 text-right">CPL</th>
                      </tr>
                    </thead>
                    <tbody ref={tableRef}>
                      {data.campaigns.map((c: any, i: number) => (
                        <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-5 font-bold text-white/90">{c.campaign_name || c.campaign_id}</td>
                          <td className="px-4 py-5 text-right font-mono text-white/70">{formatCurrency(c.spend)}</td>
                          <td className="px-4 py-5 text-right font-mono text-white/70">{formatNumber(c.leads)}</td>
                          <td className="px-4 py-5 text-right font-mono text-white/70">{formatNumber(c.clicks)}</td>
                          <td className="px-4 py-5 text-right font-bold text-pink-400">{formatCurrency(c.cpl)}</td>
                        </tr>
                      ))}
                      {data.campaigns.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-white/20 italic">
                            Nenhum dado encontrado para as campanhas neste período.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
