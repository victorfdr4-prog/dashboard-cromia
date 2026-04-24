import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart2, ChevronRight, Download, Eye, Link, LogOut, MessageCircle,
  MousePointer, Plus, RefreshCw, Search, Settings, Target, TrendingUp,
  Unlink, Users, X, Zap, CheckCircle, XCircle, DollarSign, Instagram,
  AlertTriangle, Key, ArrowLeft, Heart, ExternalLink,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar,
} from 'recharts';
import {
  createClient, deleteClient, disconnectClientToken, exchangeMetaToken,
  fetchClients, fetchMetaAccounts, fetchMetaAuthUrl, fetchSocialAccounts,
  linkAdAccount, saveSetting, saveSocialAccount, removeSocialAccount,
  syncAdAccount, unlinkAdAccount, updateClient, validateMetaAccount, fetchBusinessAccounts,
} from './services/aiService';
import { ClientRecord, MetaAccountOption, SocialAccountRecord } from './types';

// ─── UTILS ────────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('pt-BR');
const fmtBrl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtPct = (n: number) => `${n.toFixed(1)}%`;
const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : fmt(n);

function clientInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const AVATAR_COLORS = [
  'from-violet-500 to-purple-700',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
  'from-indigo-500 to-blue-700',
];
function avatarColor(name: string) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

type Screen = 'overview' | 'client' | 'settings' | 'novo-cliente';

export default function App() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>('overview');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadAll = async () => {
    try {
      const [c, s] = await Promise.all([fetchClients(), fetchSocialAccounts()]);
      setClients(c);
      setSocialAccounts(s);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const selectedClient = clients.find(c => c.id === selectedClientId) ?? null;

  const openClient = (id: string) => {
    setSelectedClientId(id);
    setScreen('client');
  };

  const filtered = clients.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.username || '').toLowerCase().includes(search.toLowerCase())
  );

  const connected = clients.filter(c => c.meta_access_token);
  const notConnected = clients.filter(c => !c.meta_access_token);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-xl shadow-purple-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex">
      {/* SIDEBAR */}
      <aside className="w-64 flex-shrink-0 bg-[#0a0d14] border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-white leading-none">TrafficPro</p>
              <p className="text-[10px] text-gray-600 mt-0.5">Cromia Comunicação</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="p-3 border-b border-white/5 space-y-0.5">
          <SidebarBtn active={screen === 'overview'} icon={BarChart2} label="Visão Geral" onClick={() => setScreen('overview')} />
          <SidebarBtn active={screen === 'settings'} icon={Settings} label="Configurações" onClick={() => setScreen('settings')} />
        </div>

        {/* Search + clients */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full bg-white/4 border border-white/5 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/40"
            />
          </div>

          {filtered.length === 0 && (
            <p className="text-xs text-gray-600 text-center py-4">Nenhum cliente</p>
          )}

          {filtered.map(client => {
            const isConnected = !!client.meta_access_token;
            const isSelected = selectedClientId === client.id && screen === 'client';
            return (
              <button
                key={client.id}
                onClick={() => openClient(client.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all group ${
                  isSelected ? 'bg-purple-600/15 border border-purple-500/20' : 'hover:bg-white/4 border border-transparent'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarColor(client.name)} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 relative`}>
                  {clientInitials(client.name)}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0d14] ${isConnected ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                    {client.name}
                  </p>
                  <p className="text-[10px] text-gray-600 truncate">
                    {isConnected ? 'Meta conectado' : 'Sem conexão'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Add + Logout */}
        <div className="p-3 border-t border-white/5 space-y-1">
          <button
            onClick={() => { setEditingClient(null); setShowForm(true); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Cliente
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-600 hover:text-gray-400 hover:bg-white/4 transition-all">
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto">
        {screen === 'overview' && (
          <OverviewScreen
            clients={clients}
            connected={connected}
            notConnected={notConnected}
            onOpenClient={openClient}
            onNewClient={() => { setEditingClient(null); setShowForm(true); }}
          />
        )}
        {screen === 'client' && selectedClient && (
          <ClientScreen
            client={selectedClient}
            social={socialAccounts.find(s => s.client_id === selectedClient.id) ?? null}
            onBack={() => setScreen('overview')}
            onRefresh={loadAll}
            onEdit={() => { setEditingClient(selectedClient); setShowForm(true); }}
            onDelete={async () => {
              if (!confirm(`Remover ${selectedClient.name}?`)) return;
              await deleteClient(selectedClient.id);
              setScreen('overview');
              await loadAll();
            }}
          />
        )}
        {screen === 'settings' && (
          <SettingsScreen clients={clients} socialAccounts={socialAccounts} onRefresh={loadAll} />
        )}
      </main>

      {showForm && (
        <ClientFormModal
          initial={editingClient}
          onClose={() => setShowForm(false)}
          onSave={async payload => {
            if (editingClient) await updateClient(editingClient.id, payload);
            else await createClient(payload);
            await loadAll();
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}

// ─── SIDEBAR BTN ──────────────────────────────────────────────────────────────

function SidebarBtn({ active, icon: Icon, label, onClick }: { active: boolean; icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
        active ? 'bg-white/8 text-white font-medium' : 'text-gray-500 hover:text-white hover:bg-white/4'
      }`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      {label}
    </button>
  );
}

// ─── OVERVIEW SCREEN ──────────────────────────────────────────────────────────

function OverviewScreen({ clients, connected, notConnected, onOpenClient, onNewClient }: {
  clients: ClientRecord[];
  connected: ClientRecord[];
  notConnected: ClientRecord[];
  onOpenClient: (id: string) => void;
  onNewClient: () => void;
}) {
  const stats = [
    { label: 'Total de Clientes', value: clients.length, sub: 'cadastrados', color: 'text-white', bg: 'bg-white/5', icon: Users },
    { label: 'Meta Conectado', value: connected.length, sub: 'com acesso ativo', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle },
    { label: 'Sem Conexão', value: notConnected.length, sub: 'aguardando login', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: AlertTriangle },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Visão Geral</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie todos os seus clientes em um só lugar</p>
        </div>
        <button onClick={onNewClient} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-semibold text-white transition-all shadow-lg shadow-purple-500/20">
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-[#151b28] border border-white/5 rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-600 mt-0.5">{s.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Clientes sem conexão */}
      {notConnected.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <h2 className="text-sm font-semibold text-white">Aguardando Conexão Meta</h2>
            <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{notConnected.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {notConnected.map(c => <ClientCard key={c.id} client={c} onClick={() => onOpenClient(c.id)} />)}
          </div>
        </div>
      )}

      {/* Clientes conectados */}
      {connected.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Clientes Conectados</h2>
            <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{connected.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {connected.map(c => <ClientCard key={c.id} client={c} onClick={() => onOpenClient(c.id)} />)}
          </div>
        </div>
      )}

      {clients.length === 0 && (
        <div className="bg-[#151b28] border border-dashed border-white/10 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-white font-semibold">Nenhum cliente ainda</p>
          <p className="text-gray-500 text-sm mt-1">Adicione seu primeiro cliente para começar</p>
          <button onClick={onNewClient} className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-semibold text-white transition-all mx-auto">
            <Plus className="w-4 h-4" /> Adicionar Cliente
          </button>
        </div>
      )}
    </div>
  );
}

function ClientCard({ client, onClick }: { client: ClientRecord; onClick: () => void; [k: string]: any }) {
  const isConnected = !!client.meta_access_token;
  const expiresAt = client.meta_token_expires_at ? new Date(client.meta_token_expires_at) : null;
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86400000) : null;

  return (
    <button
      onClick={onClick}
      className="w-full bg-[#151b28] border border-white/5 hover:border-purple-500/30 rounded-2xl p-5 text-left transition-all group hover:shadow-lg hover:shadow-purple-500/5"
    >
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarColor(client.name)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
          {clientInitials(client.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{client.name}</p>
          {client.username && <p className="text-xs text-gray-500 mt-0.5">@{client.username}</p>}
          <div className="flex items-center gap-1.5 mt-2">
            {isConnected ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="text-xs text-emerald-400">
                  Meta ativo{daysLeft !== null ? ` · ${daysLeft}d restantes` : ''}
                </span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600 flex-shrink-0" />
                <span className="text-xs text-gray-500">Sem conexão Meta</span>
              </>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors flex-shrink-0 mt-0.5" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="bg-white/3 rounded-xl px-3 py-2">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider">Plataforma</p>
          <p className="text-xs font-medium text-gray-300 mt-0.5 capitalize">{client.plataforma || 'Instagram'}</p>
        </div>
        <div className="bg-white/3 rounded-xl px-3 py-2">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider">Status</p>
          <p className={`text-xs font-medium mt-0.5 ${client.status === 'ativo' ? 'text-emerald-400' : 'text-gray-400'}`}>
            {client.status === 'ativo' ? 'Ativo' : 'Inativo'}
          </p>
        </div>
      </div>
    </button>
  );
}

// ─── CLIENT SCREEN ────────────────────────────────────────────────────────────

function ClientScreen({ client, social, onBack, onRefresh, onEdit, onDelete }: {
  client: ClientRecord;
  social: SocialAccountRecord | null;
  onBack: () => void;
  onRefresh: () => Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [tab, setTab] = useState<'overview' | 'pago' | 'organico' | 'configurar'>('overview');
  const [connecting, setConnecting] = useState(false);
  const [connectMsg, setConnectMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [dash, setDash] = useState<any>(null);
  const [dashLoading, setDashLoading] = useState(false);

  const isConnected = !!client.meta_access_token;
  const expiresAt = client.meta_token_expires_at ? new Date(client.meta_token_expires_at) : null;
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86400000) : null;
  const acc = client.ad_accounts[0];

  useEffect(() => {
    if (tab === 'pago' && acc) loadDash();
  }, [tab, acc?.ad_account_id]);

  const loadDash = async () => {
    if (!acc) return;
    setDashLoading(true);
    try {
      const end = new Date().toISOString().split('T')[0];
      const start = new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0];
      const r = await fetch(`/api/dashboard/${acc.ad_account_id}?dateStart=${start}&dateEnd=${end}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setDash(d);
    } catch { setDash(null); }
    finally { setDashLoading(false); }
  };

  const handleConnect = () => {
    setConnecting(true);
    setConnectMsg(null);
    fetchMetaAuthUrl(client.id).then(({ url }) => {
      const popup = window.open(url, 'meta-oauth', 'width=620,height=720,scrollbars=yes');
      if (!popup) { setConnectMsg({ ok: false, text: 'Popup bloqueado.' }); setConnecting(false); return; }
      const handler = (e: MessageEvent) => {
        if (e.data?.clientId !== client.id) return;
        if (e.data?.type === 'META_AUTH_SUCCESS' || e.data?.type === 'META_AUTH_ERROR') {
          window.removeEventListener('message', handler);
          setConnecting(false);
          if (e.data.type === 'META_AUTH_SUCCESS') {
            setConnectMsg({ ok: true, text: `Conectado! Token válido por ~${e.data.expires_in_days} dias.` });
            onRefresh();
          } else {
            setConnectMsg({ ok: false, text: e.data.error });
          }
        }
      };
      window.addEventListener('message', handler);
      const t = setInterval(() => { if (popup.closed) { clearInterval(t); window.removeEventListener('message', handler); setConnecting(false); } }, 500);
    }).catch(e => { setConnectMsg({ ok: false, text: e.message }); setConnecting(false); });
  };

  const handleSync = async () => {
    if (!acc) return;
    setSyncing(true);
    try {
      await syncAdAccount(acc.ad_account_id, client.id);
      await loadDash();
    } catch (e) { alert((e as Error).message); }
    finally { setSyncing(false); }
  };

  const tabs = [
    { id: 'overview', label: 'Resumo' },
    { id: 'pago', label: 'Meta Ads' },
    { id: 'organico', label: 'Orgânico' },
    { id: 'configurar', label: 'Configurações' },
  ] as const;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-[#0a0d14] border-b border-white/5 px-8 py-5">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar para clientes
        </button>

        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarColor(client.name)} flex items-center justify-center text-white text-lg font-bold shadow-lg flex-shrink-0`}>
            {clientInitials(client.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">{client.name}</h1>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${client.status === 'ativo' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-500/15 text-gray-400'}`}>
                {client.status === 'ativo' ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            {client.username && <p className="text-sm text-gray-500 mt-0.5">@{client.username}</p>}
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium">
                  Meta conectado{daysLeft !== null ? ` · ${daysLeft}d` : ''}
                </span>
              </div>
            ) : null}
            <button
              onClick={handleConnect}
              disabled={connecting}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${
                isConnected
                  ? 'bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
                  : 'bg-[#1877F2] hover:bg-[#166FE5] text-white shadow-lg shadow-blue-500/20'
              }`}
            >
              {connecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              )}
              {connecting ? 'Aguardando...' : isConnected ? 'Reconectar' : 'Conectar Meta'}
            </button>
          </div>
        </div>

        {connectMsg && (
          <div className={`mt-3 text-xs px-4 py-2.5 rounded-xl ${connectMsg.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {connectMsg.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-5 bg-white/4 rounded-xl p-1 w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t.id ? 'bg-white/10 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
        {tab === 'overview' && <ClientOverviewTab client={client} social={social} isConnected={isConnected} onConnectClick={handleConnect} />}
        {tab === 'pago' && <ClientPagoTab client={client} acc={acc} dash={dash} loading={dashLoading} syncing={syncing} onSync={handleSync} isConnected={isConnected} onConnect={handleConnect} />}
        {tab === 'organico' && <ClientOrganicoTab client={client} social={social} />}
        {tab === 'configurar' && (
          <ClientConfigTab
            client={client}
            social={social}
            isConnected={isConnected}
            onEdit={onEdit}
            onDelete={onDelete}
            onRefresh={onRefresh}
            onDisconnect={async () => {
              await disconnectClientToken(client.id);
              await onRefresh();
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─── CLIENT OVERVIEW TAB ──────────────────────────────────────────────────────

function ClientOverviewTab({ client, social, isConnected, onConnectClick }: {
  client: ClientRecord; social: SocialAccountRecord | null;
  isConnected: boolean; onConnectClick: () => void;
}) {
  const acc = client.ad_accounts[0];
  const infos = [
    { label: 'Plataforma', value: client.plataforma || 'Instagram' },
    { label: 'Orçamento', value: client.orcamento ? fmtBrl(client.orcamento) + '/mês' : '—' },
    { label: 'Início Contrato', value: client.inicio_contrato ? new Date(client.inicio_contrato).toLocaleDateString('pt-BR') : '—' },
    { label: 'Fim Contrato', value: client.fim_contrato ? new Date(client.fim_contrato).toLocaleDateString('pt-BR') : '—' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Connect CTA */}
      {!isConnected && (
        <div className="bg-gradient-to-r from-blue-600/10 to-violet-600/10 border border-blue-500/20 rounded-2xl p-6 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-[#1877F2]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white text-sm">Conectar conta Meta de {client.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">O cliente faz login com a conta Facebook dele e você terá acesso total às campanhas</p>
          </div>
          <button onClick={onConnectClick} className="px-5 py-2.5 bg-[#1877F2] hover:bg-[#166FE5] rounded-xl text-sm font-semibold text-white transition-all whitespace-nowrap shadow-lg shadow-blue-500/20">
            Conectar agora
          </button>
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-3">
        {infos.map(i => (
          <div key={i.label} className="bg-[#151b28] border border-white/5 rounded-2xl px-5 py-4">
            <p className="text-xs text-gray-500">{i.label}</p>
            <p className="text-sm font-semibold text-white mt-1">{i.value}</p>
          </div>
        ))}
      </div>

      {/* Contas vinculadas */}
      <div className="bg-[#151b28] border border-white/5 rounded-2xl p-5 space-y-3">
        <p className="text-sm font-semibold text-white">Contas Meta Ads</p>
        {client.ad_accounts.length === 0 ? (
          <p className="text-xs text-gray-600">Nenhuma conta vinculada. Acesse a aba <span className="text-purple-400">Configurações</span> para vincular.</p>
        ) : (
          client.ad_accounts.map(a => (
            <div key={a.id} className="flex items-center gap-3 bg-white/3 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <BarChart2 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{a.nome_conta || 'Conta de Anúncio'}</p>
                <p className="text-xs text-gray-500">act_{a.ad_account_id}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {client.observacoes && (
        <div className="bg-[#151b28] border border-white/5 rounded-2xl px-5 py-4">
          <p className="text-xs text-gray-500 mb-1">Observações</p>
          <p className="text-sm text-gray-300 leading-relaxed">{client.observacoes}</p>
        </div>
      )}
    </div>
  );
}

// ─── CLIENT PAGO TAB ──────────────────────────────────────────────────────────

function ClientPagoTab({ client, acc, dash, loading, syncing, onSync, isConnected, onConnect }: {
  client: ClientRecord; acc: any; dash: any; loading: boolean; syncing: boolean;
  onSync: () => void; isConnected: boolean; onConnect: () => void;
}) {
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
        <p className="text-white font-semibold">Conta não conectada</p>
        <p className="text-gray-500 text-sm mt-1">Conecte a conta Meta de {client.name} para ver os dados de anúncios</p>
        <button onClick={onConnect} className="mt-4 px-5 py-2.5 bg-[#1877F2] hover:bg-[#166FE5] rounded-xl text-sm font-semibold text-white transition-all">
          Conectar Meta
        </button>
      </div>
    );
  }

  if (!acc) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
          <Link className="w-8 h-8 text-purple-400" />
        </div>
        <p className="text-white font-semibold">Nenhuma conta de anúncio vinculada</p>
        <p className="text-gray-500 text-sm mt-1">Acesse a aba Configurações para vincular uma conta de anúncio</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">{acc.nome_conta || 'Meta Ads'}</h2>
          <p className="text-xs text-gray-500 mt-0.5">act_{acc.ad_account_id} · Últimos 30 dias</p>
        </div>
        <button onClick={onSync} disabled={syncing} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-medium text-gray-300 transition-all disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex gap-1.5">
            {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
          </div>
        </div>
      )}

      {!loading && dash && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(dash.kpis || []).slice(0, 8).map((kpi: any) => (
              <div key={kpi.id} className="bg-[#151b28] border border-white/5 rounded-2xl p-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{kpi.label}</p>
                <p className="text-xl font-bold text-white mt-1.5">
                  {kpi.format === 'currency' ? fmtBrl(kpi.value) : kpi.format === 'percentage' ? fmtPct(kpi.value) : fmtK(kpi.value)}
                </p>
                <p className={`text-xs mt-1 ${kpi.trend === 'up' ? 'text-emerald-400' : kpi.trend === 'down' ? 'text-red-400' : 'text-gray-600'}`}>
                  {kpi.change > 0 ? '+' : ''}{kpi.change?.toFixed(1)}% vs anterior
                </p>
              </div>
            ))}
          </div>

          {dash.narrativa && (
            <div className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-500/10 rounded-2xl p-6">
              <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-2">Leitura Estratégica</p>
              <p className="text-sm text-gray-300 leading-relaxed">{dash.narrativa}</p>
            </div>
          )}

          {(dash.dados_grafico || []).length > 0 && (
            <div className="bg-[#151b28] border border-white/5 rounded-2xl p-6">
              <p className="text-sm font-semibold text-white mb-4">Evolução Diária</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dash.dados_grafico}>
                  <defs>
                    <linearGradient id="gCliques" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="data" tick={{ fill: '#4b5563', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#f9fafb', fontSize: 12 }} />
                  <Area type="monotone" dataKey="cliques" stroke="#8b5cf6" strokeWidth={2} fill="url(#gCliques)" name="Cliques" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {!loading && !dash && (
        <div className="bg-[#151b28] border border-white/5 rounded-2xl p-12 text-center">
          <p className="text-gray-500 text-sm">Nenhum dado encontrado. Clique em <span className="text-purple-400">Sincronizar</span> para buscar os dados.</p>
        </div>
      )}
    </div>
  );
}

// ─── CLIENT ORGANICO TAB ──────────────────────────────────────────────────────

function ClientOrganicoTab({ client, social }: { client: ClientRecord; social: SocialAccountRecord | null }) {
  const [igData, setIgData] = useState<any>(null);
  const [fbData, setFbData] = useState<any>(null);
  const [igLoading, setIgLoading] = useState(false);
  const [fbLoading, setFbLoading] = useState(false);

  useEffect(() => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0];
    if (social?.ig_user_id) {
      setIgLoading(true);
      fetch(`/api/organico/instagram/${social.ig_user_id}?dateStart=${start}&dateEnd=${end}`)
        .then(r => r.json()).then(d => !d.error && setIgData(d)).finally(() => setIgLoading(false));
    }
    if (social?.fb_page_id) {
      setFbLoading(true);
      fetch(`/api/organico/facebook/${social.fb_page_id}?dateStart=${start}&dateEnd=${end}`)
        .then(r => r.json()).then(d => !d.error && setFbData(d)).finally(() => setFbLoading(false));
    }
  }, [social]);

  if (!social) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-4">
          <Instagram className="w-8 h-8 text-pink-400" />
        </div>
        <p className="text-white font-semibold">Conta social não configurada</p>
        <p className="text-gray-500 text-sm mt-1">Acesse a aba Configurações para vincular o Instagram ou Facebook Page deste cliente</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instagram */}
      {social.ig_user_id && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Instagram className="w-4 h-4 text-pink-400" />
            <h2 className="text-sm font-semibold text-white">Instagram Orgânico</h2>
            {social.ig_nome && <span className="text-xs text-gray-500">@{social.ig_nome}</span>}
          </div>
          {igLoading ? (
            <div className="bg-[#151b28] border border-white/5 rounded-2xl p-8 text-center">
              <div className="flex gap-1.5 justify-center">
                {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
              </div>
            </div>
          ) : igData ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Impressões', value: fmtK(igData.kpis.impressoes), icon: Eye, color: 'text-blue-400' },
                { label: 'Alcance', value: fmtK(igData.kpis.alcance), icon: Users, color: 'text-purple-400' },
                { label: 'Engajamento', value: fmtK(igData.kpis.engajamento), icon: Heart, color: 'text-pink-400' },
                { label: 'Taxa Eng.', value: fmtPct(igData.kpis.taxa_engajamento), icon: TrendingUp, color: 'text-emerald-400' },
                { label: 'Posts', value: igData.kpis.total_posts, icon: BarChart2, color: 'text-cyan-400' },
                { label: 'Curtidas', value: fmtK(igData.kpis.total_likes), icon: Heart, color: 'text-rose-400' },
                { label: 'Comentários', value: fmtK(igData.kpis.total_comentarios), icon: MessageCircle, color: 'text-amber-400' },
              ].map(k => (
                <div key={k.label} className="bg-[#151b28] border border-white/5 rounded-2xl p-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{k.label}</p>
                  <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#151b28] border border-white/5 rounded-2xl p-8 text-center text-gray-600 text-sm">Sem dados disponíveis</div>
          )}
        </div>
      )}

      {/* Facebook */}
      {social.fb_page_id && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4">
              <svg viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-white">Facebook Page</h2>
            {social.fb_nome && <span className="text-xs text-gray-500">{social.fb_nome}</span>}
          </div>
          {fbLoading ? (
            <div className="bg-[#151b28] border border-white/5 rounded-2xl p-8 text-center">
              <div className="flex gap-1.5 justify-center">
                {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
              </div>
            </div>
          ) : fbData ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Impressões', value: fmtK(fbData.kpis.impressoes), color: 'text-blue-400' },
                { label: 'Usuários Eng.', value: fmtK(fbData.kpis.usuarios_engajados), color: 'text-purple-400' },
                { label: 'Eng. Posts', value: fmtK(fbData.kpis.engajamento_posts), color: 'text-pink-400' },
                { label: 'Taxa Eng.', value: fmtPct(fbData.kpis.taxa_engajamento), color: 'text-emerald-400' },
              ].map(k => (
                <div key={k.label} className="bg-[#151b28] border border-white/5 rounded-2xl p-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{k.label}</p>
                  <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#151b28] border border-white/5 rounded-2xl p-8 text-center text-gray-600 text-sm">Sem dados disponíveis</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CLIENT CONFIG TAB ────────────────────────────────────────────────────────

function ClientConfigTab({ client, social, isConnected, onEdit, onDelete, onRefresh, onDisconnect }: {
  client: ClientRecord; social: SocialAccountRecord | null; isConnected: boolean;
  onEdit: () => void; onDelete: () => void; onRefresh: () => Promise<void>; onDisconnect: () => Promise<void>;
}) {
  const [manualId, setManualId] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualClientId] = useState(client.id);
  const [linking, setLinking] = useState(false);
  const [linkMsg, setLinkMsg] = useState<string | null>(null);
  const [socialForm, setSocialForm] = useState({ igUserId: social?.ig_user_id || '', fbPageId: social?.fb_page_id || '', igNome: social?.ig_nome || '', fbNome: social?.fb_nome || '' });
  const [socialSaving, setSocialSaving] = useState(false);

  const handleLink = async () => {
    if (!manualId.trim()) return;
    setLinking(true); setLinkMsg(null);
    try {
      await linkAdAccount(client.id, manualId.trim(), manualName.trim() || manualId.trim());
      setManualId(''); setManualName(''); setLinkMsg('Conta vinculada com sucesso!');
      await onRefresh();
    } catch (e) { setLinkMsg((e as Error).message); }
    finally { setLinking(false); }
  };

  const handleSaveSocial = async () => {
    setSocialSaving(true);
    try {
      await saveSocialAccount({ client_id: client.id, ig_user_id: socialForm.igUserId || undefined, fb_page_id: socialForm.fbPageId || undefined, ig_nome: socialForm.igNome || undefined, fb_nome: socialForm.fbNome || undefined });
      await onRefresh();
    } finally { setSocialSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Client info */}
      <Section title="Dados do Cliente">
        <div className="flex items-center gap-3">
          <button onClick={onEdit} className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm text-gray-300 transition-all">
            Editar informações
          </button>
          <button onClick={onDelete} className="py-2.5 px-4 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-sm text-red-400 transition-all">
            Remover cliente
          </button>
        </div>
      </Section>

      {/* Meta connection */}
      <Section title="Conexão Meta">
        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/15 rounded-xl p-4">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Conta conectada</p>
                {client.meta_connected_at && (
                  <p className="text-xs text-gray-500 mt-0.5">Conectado em {new Date(client.meta_connected_at).toLocaleDateString('pt-BR')}</p>
                )}
              </div>
              <button onClick={onDisconnect} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5">
                <Unlink className="w-3.5 h-3.5" /> Desconectar
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Clique em <span className="text-blue-400">"Conectar Meta"</span> no topo da página.</p>
        )}
      </Section>

      {/* Ad Account link */}
      <Section title="Conta de Anúncios Meta Ads">
        {client.ad_accounts.length > 0 && (
          <div className="space-y-2 mb-4">
            {client.ad_accounts.map(a => (
              <div key={a.id} className="flex items-center gap-3 bg-white/3 rounded-xl px-4 py-3">
                <BarChart2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{a.nome_conta || 'Conta de Anúncio'}</p>
                  <p className="text-xs text-gray-500">act_{a.ad_account_id}</p>
                </div>
                <button onClick={async () => { await unlinkAdAccount(a.ad_account_id); await onRefresh(); }} className="text-xs text-red-400 hover:text-red-300">Remover</button>
              </div>
            ))}
          </div>
        )}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input value={manualId} onChange={e => setManualId(e.target.value)} placeholder="ID da conta (ex: 2240703...)" className="bg-[#0a0d14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-purple-500/40 font-mono" />
            <input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Nome da conta (opcional)" className="bg-[#0a0d14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-purple-500/40" />
          </div>
          <button onClick={handleLink} disabled={linking || !manualId.trim()} className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all">
            {linking ? 'Vinculando...' : 'Vincular conta de anúncio'}
          </button>
          {linkMsg && <p className={`text-xs text-center ${linkMsg.includes('sucesso') ? 'text-emerald-400' : 'text-red-400'}`}>{linkMsg}</p>}
        </div>
      </Section>

      {/* Social accounts */}
      <Section title="Contas Sociais (Orgânico)">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500 flex items-center gap-1"><Instagram className="w-3 h-3" /> Instagram User ID</label>
              <input value={socialForm.igUserId} onChange={e => setSocialForm(f => ({...f, igUserId: e.target.value}))} placeholder="Ex: 17841400..." className="w-full bg-[#0a0d14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-purple-500/40 font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">Nome do perfil</label>
              <input value={socialForm.igNome} onChange={e => setSocialForm(f => ({...f, igNome: e.target.value}))} placeholder="@usuario" className="w-full bg-[#0a0d14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-purple-500/40" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500 flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-blue-400"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook Page ID
              </label>
              <input value={socialForm.fbPageId} onChange={e => setSocialForm(f => ({...f, fbPageId: e.target.value}))} placeholder="Ex: 123456789" className="w-full bg-[#0a0d14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-purple-500/40 font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">Nome da página</label>
              <input value={socialForm.fbNome} onChange={e => setSocialForm(f => ({...f, fbNome: e.target.value}))} placeholder="Nome da página" className="w-full bg-[#0a0d14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-purple-500/40" />
            </div>
          </div>
          <button onClick={handleSaveSocial} disabled={socialSaving} className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm text-gray-300 disabled:opacity-50 transition-all">
            {socialSaving ? 'Salvando...' : 'Salvar contas sociais'}
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#151b28] border border-white/5 rounded-2xl p-5 space-y-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      {children}
    </div>
  );
}

// ─── SETTINGS SCREEN ─────────────────────────────────────────────────────────

function SettingsScreen({ clients, socialAccounts, onRefresh }: {
  clients: ClientRecord[]; socialAccounts: SocialAccountRecord[]; onRefresh: () => Promise<void>;
}) {
  const [token, setToken] = useState('');
  const [tokenSaving, setTokenSaving] = useState(false);
  const [tokenMsg, setTokenMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleSaveToken = async () => {
    if (!token.trim()) return;
    setTokenSaving(true); setTokenMsg(null);
    try {
      const result = await exchangeMetaToken(token.trim());
      setTokenMsg({ ok: true, text: `Token permanente salvo! Válido por ~${result.expires_in_days} dias.` });
      setToken('');
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.toLowerCase().includes('session') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('logged')) {
        setTokenMsg({ ok: false, text: 'Token inválido ou expirado. Gere um novo no Graph API Explorer.' });
      } else {
        try { await saveSetting('META_ACCESS_TOKEN', token.trim()); setTokenMsg({ ok: true, text: 'Token salvo.' }); setToken(''); }
        catch (e2) { setTokenMsg({ ok: false, text: (e2 as Error).message }); }
      }
    } finally { setTokenSaving(false); }
  };

  const openSystemOAuth = () => {
    setOauthLoading(true); setTokenMsg(null);
    fetchMetaAuthUrl().then(({ url }) => {
      const popup = window.open(url, 'meta-oauth', 'width=620,height=720,scrollbars=yes');
      if (!popup) { setTokenMsg({ ok: false, text: 'Popup bloqueado.' }); setOauthLoading(false); return; }
      const handler = (e: MessageEvent) => {
        if (e.data?.type === 'META_AUTH_SUCCESS' && e.data?.clientId === '') {
          window.removeEventListener('message', handler);
          setOauthLoading(false);
          setTokenMsg({ ok: true, text: `Token do sistema salvo! Válido por ~${e.data.expires_in_days} dias.` });
        } else if (e.data?.type === 'META_AUTH_ERROR' && e.data?.clientId === '') {
          window.removeEventListener('message', handler);
          setOauthLoading(false);
          setTokenMsg({ ok: false, text: e.data.error });
        }
      };
      window.addEventListener('message', handler);
      const t = setInterval(() => { if (popup.closed) { clearInterval(t); window.removeEventListener('message', handler); setOauthLoading(false); } }, 500);
    }).catch(e => { setTokenMsg({ ok: false, text: e.message }); setOauthLoading(false); });
  };

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">Token global e configurações do sistema</p>
      </div>

      {/* Token global */}
      <div className="bg-[#151b28] border border-white/5 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
            <Key className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Token Global do Sistema</p>
            <p className="text-xs text-gray-500 mt-0.5">Usado como fallback quando o cliente não tem token próprio</p>
          </div>
        </div>

        <button
          onClick={openSystemOAuth}
          disabled={oauthLoading}
          className="w-full flex items-center justify-center gap-2.5 py-3 bg-[#1877F2] hover:bg-[#166FE5] rounded-xl text-white text-sm font-bold transition-all disabled:opacity-60"
        >
          {oauthLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          )}
          {oauthLoading ? 'Aguardando...' : 'Login com Facebook'}
        </button>

        <details className="group">
          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400 select-none">Ou cole o token manualmente →</summary>
          <div className="mt-3 space-y-2">
            <textarea value={token} onChange={e => { setToken(e.target.value); setTokenMsg(null); }} placeholder="EAAxxxxxxx..." rows={3} className="w-full bg-[#0a0d14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-purple-500/40 resize-none font-mono" />
            <button onClick={handleSaveToken} disabled={tokenSaving || !token.trim()} className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all">
              {tokenSaving ? 'Salvando...' : 'Salvar Token'}
            </button>
          </div>
        </details>

        {tokenMsg && (
          <p className={`text-xs px-4 py-2.5 rounded-xl ${tokenMsg.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{tokenMsg.text}</p>
        )}

        <div className="bg-white/3 rounded-xl px-4 py-3 text-xs text-gray-600 space-y-1">
          <p>1. Acesse <a href="https://developers.facebook.com/tools/explorer/" target="_blank" className="text-purple-400">developers.facebook.com/tools/explorer</a></p>
          <p>2. Selecione o App <span className="font-mono text-gray-400">1489037992848704</span></p>
          <p>3. Clique em Generate Access Token e cole acima</p>
        </div>
      </div>

      {/* Clientes resumo */}
      <div className="bg-[#151b28] border border-white/5 rounded-2xl p-6 space-y-3">
        <p className="text-sm font-semibold text-white">Status dos Clientes</p>
        <div className="space-y-2">
          {clients.map(c => {
            const isConn = !!c.meta_access_token;
            const exp = c.meta_token_expires_at ? Math.ceil((new Date(c.meta_token_expires_at).getTime() - Date.now()) / 86400000) : null;
            return (
              <div key={c.id} className="flex items-center gap-3 py-2 border-b border-white/4 last:border-0">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${avatarColor(c.name)} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                  {clientInitials(c.name)}
                </div>
                <p className="flex-1 text-sm text-gray-300 truncate">{c.name}</p>
                {isConn ? (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {exp !== null ? `${exp}d` : 'Ativo'}
                  </span>
                ) : (
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                    Sem conexão
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── CLIENT FORM MODAL ────────────────────────────────────────────────────────

function ClientFormModal({ initial, onClose, onSave }: {
  initial: ClientRecord | null;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    username: initial?.username || '',
    plataforma: initial?.plataforma || 'instagram',
    orcamento: initial?.orcamento?.toString() || '',
    inicio_contrato: initial?.inicio_contrato || '',
    fim_contrato: initial?.fim_contrato || '',
    observacoes: initial?.observacoes || '',
    status: initial?.status || 'ativo',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...form, orcamento: form.orcamento ? parseFloat(form.orcamento) : 0, username: form.username || undefined, inicio_contrato: form.inicio_contrato || undefined, fim_contrato: form.fim_contrato || undefined, observacoes: form.observacoes || undefined });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b28] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="font-bold text-white">{initial ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome *" colSpan={2}>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome do cliente" required className={inputCls} />
            </Field>
            <Field label="@ do Perfil">
              <input value={form.username} onChange={e => set('username', e.target.value)} placeholder="username" className={inputCls} />
            </Field>
            <Field label="Plataforma">
              <select value={form.plataforma} onChange={e => set('plataforma', e.target.value)} className={inputCls}>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="ambos">Ambos</option>
              </select>
            </Field>
            <Field label="Orçamento Mensal (R$)">
              <input type="number" value={form.orcamento} onChange={e => set('orcamento', e.target.value)} placeholder="0,00" min={0} step={0.01} className={inputCls} />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </Field>
            <Field label="Início do Contrato">
              <input type="date" value={form.inicio_contrato} onChange={e => set('inicio_contrato', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Fim do Contrato">
              <input type="date" value={form.fim_contrato} onChange={e => set('fim_contrato', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Observações" colSpan={2}>
              <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)} rows={2} placeholder="Notas sobre o cliente..." className={inputCls + ' resize-none'} />
            </Field>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-gray-400 transition-all">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children, colSpan }: { label: string; children: React.ReactNode; colSpan?: number }) {
  return (
    <div className={`space-y-1.5 ${colSpan === 2 ? 'col-span-2' : ''}`}>
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full bg-[#0a0d14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-purple-500/40 transition-colors';
