import React from 'react';
import { PlatformData } from '../types';
import { formatNumber, formatCurrency, cn } from '../lib/utils';
import { Facebook, Instagram } from 'lucide-react';

interface PlatformComparisonProps {
  data: PlatformData[];
}

export const PlatformComparison: React.FC<PlatformComparisonProps> = ({ data }) => {
  const totalImpressions = data.reduce((sum, item) => sum + item.impressions, 0);

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 backdrop-blur-md p-6 h-full flex flex-col uppercase">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Divisão de Plataforma</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
        {data.map((item) => {
          const share = totalImpressions > 0 ? (item.impressions / totalImpressions) * 100 : 0;
          return (
            <div key={item.platform} className="space-y-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
                  item.platform === 'Facebook' ? "bg-blue-600/20 text-blue-400" : "bg-gradient-to-tr from-pink-500/20 to-orange-400/20 text-pink-400"
                )}>
                  {item.platform === 'Facebook' ? <Facebook className="w-5 h-5" /> : <Instagram className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 tracking-tight">{item.platform}</h4>
                  <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Alcance: {formatNumber(item.reach)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 leading-none">Investimento</p>
                  <p className="text-lg font-bold text-slate-100 leading-none">{formatCurrency(item.spend)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 leading-none">Cliques</p>
                    <p className="text-sm font-bold text-slate-100 uppercase">{formatNumber(item.clicks)}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 leading-none">ROAS</p>
                    <p className="text-sm font-bold text-blue-400">{item.roas.toFixed(2)}x</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <span>Share de Impressões</span>
                  <span>{share.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]",
                      item.platform === 'Facebook' ? "bg-blue-500" : "bg-gradient-to-r from-pink-500 to-orange-400"
                    )}
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

