"use client";

import { useTransition, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { approveProfileAction } from "@/app/actions/clients";
import { toast } from "sonner";
import type { Client, Profile } from "@/types/database";

export function PendingApprovals({ pending, clients }: { pending: Profile[]; clients: Client[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [, start] = useTransition();

  function approve(profileId: string) {
    const clientId = selected[profileId];
    if (!clientId) return toast.error("Selecione um cliente para vincular.");
    setPendingId(profileId);
    start(async () => {
      const r = await approveProfileAction(profileId, clientId);
      setPendingId(null);
      if ("error" in r && r.error) toast.error(r.error);
      else toast.success("Acesso aprovado");
    });
  }

  const unlinkedClients = clients.filter((c) => !c.user_id);

  return (
    <div className="space-y-2">
      {pending.map((p) => (
        <GlassCard key={p.id} className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{p.full_name ?? "(sem nome)"}</p>
            <p className="truncate text-xs text-white/50">{p.email}</p>
          </div>
          <select
            value={selected[p.id] ?? ""}
            onChange={(e) => setSelected((s) => ({ ...s, [p.id]: e.target.value }))}
            className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white"
          >
            <option value="">Vincular a cliente…</option>
            {unlinkedClients.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#12121b]">
                {c.name}
              </option>
            ))}
          </select>
          <Button size="sm" onClick={() => approve(p.id)} disabled={pendingId === p.id}>
            {pendingId === p.id ? "Aprovando…" : "Aprovar"}
          </Button>
        </GlassCard>
      ))}
    </div>
  );
}
