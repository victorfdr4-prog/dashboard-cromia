import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, subDays, startOfToday, startOfYesterday, endOfToday, isSameDay, isWithinInterval, startOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { trackEvent } from '../lib/analytics';

interface DateRangePickerProps {
  onRangeChange: (start: Date, end: Date, label: string) => void;
  currentLabel: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ onRangeChange, currentLabel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const presets = [
    { label: 'Hoje', range: [startOfToday(), endOfToday()] },
    { label: 'Ontem', range: [startOfYesterday(), startOfYesterday()] },
    { label: 'Últimos 7 dias', range: [subDays(startOfToday(), 6), endOfToday()] },
    { label: 'Últimos 30 dias', range: [subDays(startOfToday(), 29), endOfToday()] },
    { label: 'Este Mês', range: [startOfMonth(new Date()), endOfToday()] },
    { label: 'Esta Semana', range: [startOfWeek(new Date()), endOfWeek(new Date())] },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-slate-300 uppercase tracking-widest hover:bg-white/10 transition-all shadow-sm"
      >
        <CalendarIcon className="w-4 h-4 text-slate-500" />
        {currentLabel}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 bg-[#020617]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] z-50 overflow-hidden ring-1 ring-white/5"
          >
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selecionar Período</h4>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-slate-500 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-2 grid grid-cols-1 gap-1 max-h-[300px] overflow-y-auto">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    onRangeChange(preset.range[0] as Date, preset.range[1] as Date, preset.label);
                    trackEvent('Filter', 'Date Range Change', preset.label);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-xl text-xs font-medium transition-all group",
                    currentLabel === preset.label 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span>{preset.label}</span>
                    {currentLabel === preset.label && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
                  </div>
                  <span className={cn(
                    "block text-[9px] mt-0.5 transition-colors",
                    currentLabel === preset.label ? "text-blue-100/60" : "text-slate-600 group-hover:text-slate-400"
                  )}>
                    {format(preset.range[0] as Date, "dd/MM", { locale: ptBR })} — {format(preset.range[1] as Date, "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-4 bg-white/[0.02] border-t border-white/5">
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em] mb-4">Intervalo Personalizado</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] text-slate-500 uppercase font-black px-1">Início</label>
                  <input 
                    type="date" 
                    className="w-full bg-[#020617] border border-white/10 rounded-lg p-2 text-[10px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all [color-scheme:dark]" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] text-slate-500 uppercase font-black px-1">Fim</label>
                  <input 
                    type="date" 
                    className="w-full bg-[#020617] border border-white/10 rounded-lg p-2 text-[10px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all [color-scheme:dark]" 
                  />
                </div>
              </div>
              <button 
                className="w-full bg-slate-100 rounded-lg py-2.5 text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all active:scale-[0.98]"
              >
                Aplicar Período
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
