import { eachDayOfInterval, format, subDays } from "date-fns";
import { NormalizedInsightRow } from "./metaAdsService";

export interface AggregateMetrics {
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  frequency: number;
  leads: number;
  purchases: number;
  revenue: number;
  ctr: number;
  cpc: number;
  roas: number;
  cpl: number;
  conversion: number;
}

export interface DashboardKpi {
  id: string;
  label: string;
  value: number;
  change: number;
  trend: "up" | "down" | "neutral";
  format: "number" | "currency" | "percentage";
}

function safeDivide(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

export function aggregateMetrics(rows: NormalizedInsightRow[]): AggregateMetrics {
  const totals = rows.reduce(
    (acc, row) => {
      acc.impressions += row.impressions;
      acc.reach += row.reach;
      acc.clicks += row.clicks;
      acc.spend += row.spend;
      acc.frequency += row.frequency;
      acc.leads += row.leads;
      acc.purchases += row.purchases;
      acc.revenue += row.revenue;
      return acc;
    },
    {
      impressions: 0,
      reach: 0,
      clicks: 0,
      spend: 0,
      frequency: 0,
      leads: 0,
      purchases: 0,
      revenue: 0,
    },
  );

  const conversions = totals.purchases || totals.leads;

  return {
    ...totals,
    ctr: safeDivide(totals.clicks, totals.impressions) * 100,
    cpc: safeDivide(totals.spend, totals.clicks),
    roas: safeDivide(totals.revenue, totals.spend),
    cpl: safeDivide(totals.spend, totals.leads),
    conversion: safeDivide(conversions, totals.clicks) * 100,
    frequency: rows.length > 0 ? totals.frequency / rows.length : 0,
  };
}

export function calculateGrowth(current: number, previous: number) {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

export function buildGrowthMap(current: AggregateMetrics, previous: AggregateMetrics) {
  return {
    impressions: calculateGrowth(current.impressions, previous.impressions),
    reach: calculateGrowth(current.reach, previous.reach),
    clicks: calculateGrowth(current.clicks, previous.clicks),
    spend: calculateGrowth(current.spend, previous.spend),
    leads: calculateGrowth(current.leads, previous.leads),
    purchases: calculateGrowth(current.purchases, previous.purchases),
    revenue: calculateGrowth(current.revenue, previous.revenue),
    ctr: calculateGrowth(current.ctr, previous.ctr),
    cpc: calculateGrowth(current.cpc, previous.cpc),
    roas: calculateGrowth(current.roas, previous.roas),
    cpl: calculateGrowth(current.cpl, previous.cpl),
    conversion: calculateGrowth(current.conversion, previous.conversion),
    frequency: calculateGrowth(current.frequency, previous.frequency),
  };
}

function trendFromGrowth(growth: number, reverse = false): "up" | "down" | "neutral" {
  if (growth === 0) return "neutral";
  if (reverse) {
    return growth < 0 ? "up" : "down";
  }
  return growth > 0 ? "up" : "down";
}

export function buildKpis(current: AggregateMetrics, growth: ReturnType<typeof buildGrowthMap>): DashboardKpi[] {
  return [
    { id: "impressions", label: "Impressões", value: current.impressions, change: growth.impressions, trend: trendFromGrowth(growth.impressions), format: "number" },
    { id: "reach", label: "Alcance", value: current.reach, change: growth.reach, trend: trendFromGrowth(growth.reach), format: "number" },
    { id: "clicks", label: "Cliques", value: current.clicks, change: growth.clicks, trend: trendFromGrowth(growth.clicks), format: "number" },
    { id: "leads", label: "Leads", value: current.leads, change: growth.leads, trend: trendFromGrowth(growth.leads), format: "number" },
    { id: "purchases", label: "Compras", value: current.purchases, change: growth.purchases, trend: trendFromGrowth(growth.purchases), format: "number" },
    { id: "spend", label: "Investimento", value: current.spend, change: growth.spend, trend: trendFromGrowth(growth.spend, true), format: "currency" },
    { id: "cpl", label: "CPL", value: current.cpl, change: growth.cpl, trend: trendFromGrowth(growth.cpl, true), format: "currency" },
    { id: "ctr", label: "CTR", value: current.ctr, change: growth.ctr, trend: trendFromGrowth(growth.ctr), format: "percentage" },
    { id: "frequency", label: "Frequencia", value: current.frequency, change: growth.frequency, trend: trendFromGrowth(growth.frequency, true), format: "number" },
    { id: "conversion", label: "Conversao", value: current.conversion, change: growth.conversion, trend: trendFromGrowth(growth.conversion), format: "percentage" },
    { id: "revenue", label: "Receita", value: current.revenue, change: growth.revenue, trend: trendFromGrowth(growth.revenue), format: "currency" },
    { id: "roas", label: "ROAS", value: current.roas, change: growth.roas, trend: trendFromGrowth(growth.roas), format: "number" },
  ];
}

export function buildChartSeries(rows: NormalizedInsightRow[], dateStart: string, dateEnd: string) {
  const rowMap = new Map(rows.map((row) => [row.date, row]));
  return eachDayOfInterval({
    start: new Date(`${dateStart}T00:00:00`),
    end: new Date(`${dateEnd}T00:00:00`),
  }).map((date) => {
    const key = format(date, "yyyy-MM-dd");
    const row = rowMap.get(key);
    return {
      data: key,
      cliques: row?.clicks || 0,
      alcance: row?.reach || 0,
      impressoes: row?.impressions || 0,
      gasto: row?.spend || 0,
      leads: row?.leads || 0,
      compras: row?.purchases || 0,
      receita: row?.revenue || 0,
    };
  });
}

export function buildPreviousPeriod(dateStart: string, dateEnd: string) {
  const start = new Date(`${dateStart}T00:00:00`);
  const end = new Date(`${dateEnd}T00:00:00`);
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return {
    start: format(subDays(start, diffDays), "yyyy-MM-dd"),
    end: format(subDays(start, 1), "yyyy-MM-dd"),
  };
}

