"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, FileBarChart, Plug, LogOut } from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/relatorios", label: "Relatórios", icon: FileBarChart },
  { href: "/api-meta", label: "API Meta", icon: Plug },
];

export function Sidebar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/5 bg-black/40 px-4 py-6 backdrop-blur-xl lg:flex">
      <Link href="/dashboard" className="mb-10 px-2">
        <Logo />
      </Link>

      <nav className="flex flex-col gap-1">
        {items.map((it) => {
          const active = pathname.startsWith(it.href);
          return (
            <Link key={it.href} href={it.href} className="relative">
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/20 to-pink-500/10 ring-1 ring-violet-500/30"
                  transition={{ type: "spring", bounce: 0.18, duration: 0.5 }}
                />
              )}
              <span
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active ? "text-white" : "text-white/60 hover:text-white hover:bg-white/5",
                )}
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2">
        {userEmail && (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 text-xs">
            <div className="text-white/40">Logado como</div>
            <div className="truncate text-white/80">{userEmail}</div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
