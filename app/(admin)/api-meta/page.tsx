import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { ConnectMetaButton } from "../clientes/[id]/connect-meta-button";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Client } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ApiMetaPage() {
  const admin = createAdminClient();
  const { data: clients } = await admin.from("clients").select("*").order("name");

  return (
    <>
      <PageHeader
        title="API Meta"
        description="Status do token Meta de cada cliente. O token é renovado a cada 60 dias via OAuth."
      />

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-white/[0.02]">
              <tr className="text-left text-xs uppercase tracking-wider text-white/50">
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Conectado em</th>
                <th className="px-5 py-3">Expira em</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(clients as Client[] | null)?.map((c) => {
                const connected = !!c.meta_access_token;
                const expSoon =
                  c.meta_token_expires_at &&
                  new Date(c.meta_token_expires_at).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
                return (
                  <tr key={c.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3 font-medium">{c.name}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs",
                          connected
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-300 border border-rose-500/20",
                        )}
                      >
                        {connected ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {connected ? "Conectada" : "Desconectada"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-white/60">
                      {c.meta_connected_at ? formatDate(c.meta_connected_at) : "—"}
                    </td>
                    <td className={cn("px-5 py-3", expSoon ? "text-amber-300" : "text-white/60")}>
                      {c.meta_token_expires_at ? formatDate(c.meta_token_expires_at) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ConnectMetaButton clientId={c.id} connected={connected} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </>
  );
}
