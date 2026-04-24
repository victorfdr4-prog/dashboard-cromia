import React, { useState, useMemo } from 'react';
import { Campaign } from '../types';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Search as SearchIcon, X } from 'lucide-react';

interface CampaignTableProps {
  campaigns: Campaign[];
  selectedCampaignId: string | null;
  onSelectCampaign: (id: string) => void;
}

type SortField = keyof Pick<Campaign, 'clicks' | 'cpc' | 'reach' | 'frequency' | 'leads' | 'cpl' | 'ctr' | 'conversionRate' | 'roas' | 'spend'>;
type SortDirection = 'asc' | 'desc' | null;

export const CampaignTable: React.FC<CampaignTableProps> = ({ campaigns, selectedCampaignId, onSelectCampaign }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField | null>('ctr');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const itemsPerPage = 5;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'));
      if (sortDirection === 'desc') {
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [campaigns, searchTerm]);

  const sortedCampaigns = useMemo(() => {
    if (!sortField || !sortDirection) return filteredCampaigns;
    return [...filteredCampaigns].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredCampaigns, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedCampaigns.length / itemsPerPage));
  const paginatedCampaigns = sortedCampaigns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-20" />;
    if (sortDirection === 'asc') return <ArrowUp className="w-3 h-3 ml-1 text-blue-400" />;
    if (sortDirection === 'desc') return <ArrowDown className="w-3 h-3 ml-1 text-blue-400" />;
    return <ArrowUpDown className="w-3 h-3 ml-1 opacity-20" />;
  };

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 backdrop-blur-md overflow-hidden transition-all shadow-2xl shadow-black/20">
      <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">Ranking de Criativos</h3>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCampaignId || 'none'}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-2"
            >
              <div className={cn("w-1.5 h-1.5 rounded-full", selectedCampaignId ? "bg-blue-500 animate-pulse" : "bg-slate-700")} />
              <h4 className="text-sm font-bold text-slate-100 tracking-tight transition-all">
                {selectedCampaign ? selectedCampaign.name : 'Selecione um anúncio para detalhar o desempenho'}
              </h4>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar anúncio..."
              className="bg-[#020617] border border-white/10 rounded-lg py-1.5 pl-9 pr-8 text-[10px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600 w-32 sm:w-48"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-white transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg border border-white/5">
            <button onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-1 text-slate-400 hover:text-white disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-bold text-slate-300 w-12 text-center select-none">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-1 text-slate-400 hover:text-white disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto min-h-[350px]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/5 text-slate-500 font-bold uppercase tracking-tighter bg-white/[0.02]">
              <th className="px-6 py-4">Anúncio</th>
              <th className="px-6 py-4 text-right cursor-pointer hover:text-slate-300" onClick={() => handleSort('clicks')}><div className="flex items-center justify-end">Cliques <SortIndicator field="clicks" /></div></th>
              <th className="px-6 py-4 text-right cursor-pointer hover:text-slate-300" onClick={() => handleSort('ctr')}><div className="flex items-center justify-end">CTR <SortIndicator field="ctr" /></div></th>
              <th className="px-6 py-4 text-right cursor-pointer hover:text-slate-300" onClick={() => handleSort('cpc')}><div className="flex items-center justify-end">CPC <SortIndicator field="cpc" /></div></th>
              <th className="px-6 py-4 text-right cursor-pointer hover:text-slate-300" onClick={() => handleSort('reach')}><div className="flex items-center justify-end">Alcance <SortIndicator field="reach" /></div></th>
              <th className="px-6 py-4 text-right cursor-pointer hover:text-slate-300" onClick={() => handleSort('frequency')}><div className="flex items-center justify-end">Freq. <SortIndicator field="frequency" /></div></th>
              <th className="px-6 py-4 text-right cursor-pointer hover:text-slate-300" onClick={() => handleSort('leads')}><div className="flex items-center justify-end">Leads <SortIndicator field="leads" /></div></th>
              <th className="px-6 py-4 text-right cursor-pointer hover:text-slate-300" onClick={() => handleSort('conversionRate')}><div className="flex items-center justify-end">Conversão <SortIndicator field="conversionRate" /></div></th>
              <th className="px-6 py-4 text-right cursor-pointer hover:text-slate-300" onClick={() => handleSort('roas')}><div className="flex items-center justify-end">ROAS <SortIndicator field="roas" /></div></th>
              <th className="px-6 py-4 text-right cursor-pointer hover:text-slate-300" onClick={() => handleSort('spend')}><div className="flex items-center justify-end">Gasto <SortIndicator field="spend" /></div></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
            {paginatedCampaigns.map((campaign) => {
              const isSelected = selectedCampaignId === campaign.id;
              return (
                <tr key={campaign.id} onClick={() => onSelectCampaign(campaign.id)} className={cn("cursor-pointer transition-all duration-200 group", isSelected ? "bg-blue-500/10 text-blue-400" : "hover:bg-white/5")}>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={cn("transition-all", isSelected ? "text-blue-400 font-bold" : "text-slate-100 group-hover:text-white")}>{campaign.name}</span></td>
                  <td className="px-6 py-4 text-right tabular-nums">{formatNumber(campaign.clicks)}</td>
                  <td className="px-6 py-4 text-right tabular-nums text-blue-400">{campaign.ctr.toFixed(2)}%</td>
                  <td className="px-6 py-4 text-right tabular-nums text-slate-400">{formatCurrency(campaign.cpc)}</td>
                  <td className="px-6 py-4 text-right tabular-nums">{formatNumber(campaign.reach)}</td>
                  <td className="px-6 py-4 text-right tabular-nums">{campaign.frequency.toFixed(2)}x</td>
                  <td className="px-6 py-4 text-right tabular-nums text-emerald-400 font-bold">{formatNumber(campaign.leads)}</td>
                  <td className="px-6 py-4 text-right tabular-nums">{campaign.conversionRate.toFixed(2)}%</td>
                  <td className="px-6 py-4 text-right tabular-nums text-emerald-500/80">{campaign.roas.toFixed(2)}x</td>
                  <td className="px-6 py-4 text-right tabular-nums">{formatCurrency(campaign.spend)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

