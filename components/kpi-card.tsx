import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiProps {
  label: string;
  value: string;
  delta?: number; // percent vs previous
  icon?: LucideIcon;
  accent?: "violet" | "pink" | "emerald" | "amber";
}

const accents = {
  violet: "from-violet-500/30 to-violet-500/5 text-violet-300",
  pink: "from-pink-500/30 to-pink-500/5 text-pink-300",
  emerald: "from-emerald-500/30 to-emerald-500/5 text-emerald-300",
  amber: "from-amber-500/30 to-amber-500/5 text-amber-300",
};

export function KpiCard({ label, value, delta, icon: Icon, accent = "violet" }: KpiProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <GlassCard className="relative overflow-hidden p-5">
      <div
        className={cn("absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br blur-2xl opacity-60", accents[accent])}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/50">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
        </div>
        {Icon && (
          <div className={cn("rounded-xl bg-gradient-to-br p-2", accents[accent])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      {typeof delta === "number" && (
        <p
          className={cn(
            "relative mt-3 text-xs font-medium",
            positive ? "text-emerald-300" : "text-rose-300",
          )}
        >
          {positive ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% vs período anterior
        </p>
      )}
    </GlassCard>
  );
}
