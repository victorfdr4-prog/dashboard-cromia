import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { avatarGradient, clientInitials, formatCurrency } from "@/lib/utils";
import type { Client } from "@/types/database";
import { CheckCircle2, AlertCircle, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

export function ClientCard({ client, href }: { client: Client; href?: string }) {
  const connected = !!client.meta_access_token;
  const StatusIcon =
    client.status === "ativo" ? CheckCircle2 : client.status === "pausado" ? Pause : AlertCircle;
  const statusColor =
    client.status === "ativo"
      ? "text-emerald-400"
      : client.status === "pausado"
        ? "text-amber-400"
        : "text-rose-400";

  const Wrapper: any = href ? Link : "div";
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper {...wrapperProps} className="group block">
      <GlassCard className="relative overflow-hidden p-5 transition-all hover:border-white/15 hover:bg-white/[0.06] hover:scale-[1.01]">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br font-semibold text-white shadow-lg",
              avatarGradient(client.name),
            )}
          >
            {clientInitials(client.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-medium text-white">{client.name}</h3>
              <StatusIcon className={cn("h-3.5 w-3.5 shrink-0", statusColor)} />
            </div>
            {client.username && (
              <p className="truncate text-xs text-white/40">@{client.username}</p>
            )}
            <div className="mt-3 flex items-center gap-3 text-xs">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5",
                  connected
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                    : "bg-white/5 text-white/40 border border-white/10",
                )}
              >
                {connected ? "Meta conectada" : "Não conectada"}
              </span>
              {client.orcamento != null && (
                <span className="text-white/40">{formatCurrency(client.orcamento)}/mês</span>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </Wrapper>
  );
}
