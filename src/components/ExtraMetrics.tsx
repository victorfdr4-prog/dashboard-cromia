import React from 'react';
import { formatNumber, formatCurrency, cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { Instagram, Users, MousePointerClick, Wallet, BarChart3, Target } from 'lucide-react';
import { PlatformData } from '../types';

interface PerformanceFunnelProps {
  impressions: number;
  clicks: number;
  conversions: number;
}

export const PerformanceFunnel: React.FC<PerformanceFunnelProps> = ({ impressions, clicks, conversions }) => {
  const steps = [
    { label: 'Impressões', value: impressions, color: 'bg-blue-500', width: '100%', opacity: 'opacity-40' },
    { label: 'Cliques', value: clicks, color: 'bg-blue-500', width: impressions > 0 ? `${Math.max((clicks / impressions) * 100, 12)}%` : '0%', opacity: 'opacity-60' },
    { label: 'Conversões', value: conversions, color: 'bg-blue-500', width: clicks > 0 ? `${Math.max((conversions / clicks) * 100, 8)}%` : '0%', opacity: 'opacity-100' },
  ];

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 backdrop-blur-md p-6 h-full flex flex-col">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Funil de Desempenho</h3>
      <div className="space-y-6 flex-1 flex flex-col justify-center">
        {steps.map((step, index) => (
          <div key={step.label} className="relative">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{step.label}</span>
              <span className="text-sm font-bold text-slate-100 tabular-nums leading-none">{formatNumber(step.value)}</span>
            </div>
            <div className="h-6 w-full bg-white/5 border border-white/5 rounded relative overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: step.width }}
                transition={{ duration: 1, delay: index * 0.2 }}
                className={cn(`${step.color} ${step.opacity} h-full absolute left-0 top-0`)}
              />
            </div>
            {index < steps.length - 1 && (
              <div className="absolute -bottom-5 left-4 z-10 text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                {step.value > 0 ? ((steps[index + 1].value / step.value) * 100).toFixed(1) : 0}% Taxa
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const InstagramPerformance: React.FC<{ data: PlatformData }> = ({ data }) => {
  const stats = [
    { label: 'Alcance', value: formatNumber(data.reach), icon: Users, color: 'text-blue-400' },
    { label: 'Cliques', value: formatNumber(data.clicks), icon: MousePointerClick, color: 'text-rose-400' },
    { label: 'Leads', value: formatNumber(data.leads), icon: Target, color: 'text-teal-400' },
    { label: 'ROAS', value: `${data.roas.toFixed(2)}x`, icon: BarChart3, color: 'text-amber-400' },
    { label: 'Investimento', value: formatCurrency(data.spend), icon: Wallet, color: 'text-purple-400' },
  ];

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 backdrop-blur-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Instagram className="w-5 h-5 text-pink-500" />
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Performance no Instagram Ads</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
            <div className={cn("w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-3 shadow-sm", stat.color)}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-slate-100 leading-none">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

