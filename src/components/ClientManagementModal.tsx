import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Edit2, User, Briefcase } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import { ClientRecord, MetaAccountOption } from '../types';

interface ClientManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientRecord[];
  metaAccounts: MetaAccountOption[];
  onAddClient: (client: { name: string; segmento?: string; adAccountId?: string; nomeConta?: string }) => void;
  onUpdateClient: (clientId: string, payload: { name: string; segmento?: string; adAccountId?: string; nomeConta?: string }) => void;
  onDeleteClient: (id: string) => void;
}

export const ClientManagementModal: React.FC<ClientManagementModalProps> = ({
  isOpen,
  onClose,
  clients,
  metaAccounts,
  onAddClient,
  onUpdateClient,
  onDeleteClient
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [formData, setFormData] = useState({ name: '', segmento: '', adAccountId: '' });

  const resetForm = () => {
    setIsAdding(false);
    setEditingClient(null);
    setFormData({ name: '', segmento: '', adAccountId: '' });
  };

  const selectedMetaAccount = metaAccounts.find((account) => account.account_id === formData.adAccountId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      segmento: formData.segmento,
      adAccountId: formData.adAccountId || undefined,
      nomeConta: selectedMetaAccount?.name,
    };
    if (editingClient) {
      onUpdateClient(editingClient.id, payload);
      trackEvent('Client Management', 'Edit Client', formData.name);
    } else {
      onAddClient(payload);
      trackEvent('Client Management', 'Add Client', formData.name);
    }
    resetForm();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-[#020617] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl"
          >
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest italic">Gerenciar Clientes</h2>
              <button onClick={onClose} className="p-1 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              {(isAdding || editingClient) ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 uppercase font-black px-1">Nome do Cliente</label>
                      <input
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-[#020617] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                        placeholder="Ex: E-commerce Moda"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 uppercase font-black px-1">Segmento</label>
                      <input
                        value={formData.segmento}
                        onChange={(e) => setFormData({ ...formData, segmento: e.target.value })}
                        className="w-full bg-[#020617] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                        placeholder="Ex: Infoproduto, E-commerce, Lead Gen"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-black px-1">Conta de Anúncio Meta</label>
                    <select
                      value={formData.adAccountId}
                      onChange={(e) => setFormData({ ...formData, adAccountId: e.target.value })}
                      className="w-full bg-[#020617] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    >
                      <option value="">Selecione uma conta real da Meta</option>
                      {metaAccounts.map((account) => (
                        <option key={account.id} value={account.account_id}>
                          {account.name} • {account.account_id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button type="button" onClick={resetForm} className="flex-1 bg-white/5 text-slate-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                      Cancelar
                    </button>
                    <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all">
                      {editingClient ? 'Salvar Alterações' : 'Adicionar Cliente'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="space-y-2">
                    {clients.map((client) => (
                      <div key={client.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-100">{client.name}</p>
                            <div className="flex flex-wrap gap-x-2 gap-y-1 mt-0.5">
                              {client.segmento && <span className="text-[9px] text-slate-500 flex items-center gap-1"><Briefcase className="w-2.5 h-2.5" /> {client.segmento}</span>}
                              {client.ad_accounts[0] && <span className="text-[9px] text-blue-400 font-bold">{client.ad_accounts[0].nome_conta} • {client.ad_accounts[0].ad_account_id}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingClient(client);
                              setFormData({
                                name: client.name,
                                segmento: client.segmento || '',
                                adAccountId: client.ad_accounts[0]?.ad_account_id || '',
                              });
                            }}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              onDeleteClient(client.id);
                              trackEvent('Client Management', 'Delete Client', client.name);
                            }}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setIsAdding(true)} className="w-full mt-4 flex items-center justify-center gap-2 p-4 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all shadow-xl shadow-white/5">
                    <Plus className="w-4 h-4" />
                    Novo Cliente
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

