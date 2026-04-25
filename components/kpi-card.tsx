import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface KpiProps {
  label: string;
  value: string;
  delta?: number; // percent vs previous
  icon?: LucideIcon;
  accent?: "violet" | "pink" | "emerald" | "amber";
}

const accents = {
  violet: "from-violet-500/40 to-violet-500/5 text-violet-100 glow-violet",
  pink: "from-pink-500/40 to-pink-500/5 text-pink-100 glow-pink",
  emerald: "from-emerald-500/40 to-emerald-500/5 text-emerald-100 glow-emerald",
  amber: "from-amber-500/40 to-amber-500/5 text-amber-100 glow-amber",
};

export function KpiCard({ label, value, delta, icon: Icon, accent = "violet" }: KpiProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <GlassCard className={cn("relative overflow-hidden p-6 transition-all duration-300", accents[accent])}>
        <div
          className={cn(
            "absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br blur-3xl opacity-30",
            accents[accent]
          )}
        />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white drop-shadow-sm">{value}</p>
          </div>
          {Icon && (
            <div className={cn("rounded-2xl bg-white/5 p-3 backdrop-blur-md border border-white/10", accents[accent])}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
        {typeof delta === "number" && (
          <p
            className={cn(
              "relative mt-4 text-[11px] font-semibold flex items-center gap-1",
              positive ? "text-emerald-400" : "text-rose-400"
            )}
          >
            <span className="text-lg leading-none">{positive ? "▲" : "▼"}</span>
            {Math.abs(delta).toFixed(1)}% <span className="opacity-50 font-normal">vs período anterior</span>
          </p>
        )}
      </GlassCard>
    </motion.div>
  );
}
