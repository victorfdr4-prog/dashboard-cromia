import React, { useState } from 'react';
import { Table as TableIcon, Sparkles, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { trackEvent } from '../lib/analytics';
import { generatePdfReport } from '../services/aiService';

interface ExportControlsProps {
  campaigns: any[];
  clientName: string;
  adAccountId: string;
  dateStart: string;
  dateEnd: string;
}

export const ExportControls: React.FC<ExportControlsProps> = ({ campaigns, clientName, adAccountId, dateStart, dateEnd }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const exportCSV = () => {
    trackEvent('Export', 'CSV', clientName);
    const csvData = Papa.unparse(campaigns);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ranking_criativos_${clientName.replace(/\s+/g, '_').toLowerCase()}_${dateEnd}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePdf = async () => {
    trackEvent('Export', 'PDF', clientName);
    setIsGenerating(true);
    try {
      const result = await generatePdfReport(adAccountId, dateStart, dateEnd);
      window.open(result.pdfUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex gap-3">
      <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] hover:bg-white/10 transition-all active:scale-95">
        <TableIcon className="w-3.5 h-3.5" />
        CSV
      </button>
      <button
        onClick={handlePdf}
        disabled={isGenerating || !adAccountId}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all relative overflow-hidden active:scale-95",
          isGenerating
            ? "bg-slate-800 text-slate-500 cursor-wait"
            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Gerando PDF...
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5" />
            Relatório Premium
          </>
        )}
        {isGenerating && (
          <motion.div className="absolute bottom-0 left-0 h-1 bg-white/20" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 5 }} />
        )}
      </button>
    </div>
  );
};
