import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Metric } from '../types';
import { cn, formatCurrency, formatNumber, formatPercent } from '../lib/utils';
import { motion } from 'framer-motion';

interface KPICardProps {
  metric: Metric;
}

const KPICard: React.FC<KPICardProps> = ({ metric }) => {
  const isPositive = metric.trend === 'up';
  const isNegative = metric.trend === 'down';
  
  const displayValue = () => {
    if (typeof metric.value === 'string') return metric.value;
    if (metric.format === 'currency') return formatCurrency(metric.value);
    if (metric.format === 'percentage') return formatPercent(metric.value);
    return formatNumber(metric.value);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md transition-all hover:bg-white/[0.08] relative group overflow-hidden",
        metric.id === 'roas' && "border-blue-500/30 ring-1 ring-blue-500/20 shadow-[0_0_30px_-15px_rgba(59,130,246,0.3)]"
      )}
    >
      {/* Decorative accent */}
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity",
        isPositive ? "bg-emerald-500" : isNegative ? "bg-rose-500" : "bg-blue-500"
      )} />

      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">{metric.label}</p>
        <div className={cn(
          "flex items-center px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-sm",
          isPositive ? "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20" : 
          isNegative ? "text-rose-400 bg-rose-400/10 border border-rose-400/20" : 
          "text-slate-400 bg-white/5 border border-white/10"
        )}>
          {isPositive && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
          {isNegative && <ArrowDownRight className="w-3 h-3 mr-0.5" />}
          {Math.abs(metric.change)}%
        </div>
      </div>
      <h2 className="text-3xl font-black text-white tracking-tighter leading-none group-hover:text-blue-500 transition-colors uppercase italic">{displayValue()}</h2>
    </motion.div>
  );
};

export const KPIOverview: React.FC<{ metrics: Metric[] }> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <KPICard key={metric.id} metric={metric} />
      ))}
    </div>
  );
};
