import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value || 0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value || 0);
}

export function formatPercent(value: number, digits = 2): string {
  return `${(value || 0).toFixed(digits)}%`;
}

export function formatDate(date: string | Date, format: "short" | "long" = "short"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: format === "short" ? "2-digit" : "long",
    year: "numeric",
  }).format(d);
}

export function clientInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function avatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const palettes = [
    "from-violet-500 to-fuchsia-500",
    "from-fuchsia-500 to-pink-500",
    "from-purple-500 to-violet-600",
    "from-pink-500 to-rose-500",
    "from-indigo-500 to-purple-500",
    "from-violet-600 to-pink-500",
  ];
  return palettes[Math.abs(hash) % palettes.length];
}

export function dateRangePresets() {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const offset = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return d;
  };
  return {
    today: { dateStart: fmt(today), dateEnd: fmt(today) },
    last7: { dateStart: fmt(offset(7)), dateEnd: fmt(today) },
    last30: { dateStart: fmt(offset(30)), dateEnd: fmt(today) },
    last90: { dateStart: fmt(offset(90)), dateEnd: fmt(today) },
  };
}
