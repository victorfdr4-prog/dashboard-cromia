import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Client, InsightRow } from "@/types/database";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: "#1a1a1f", fontFamily: "Helvetica" },
  header: { borderBottom: "2px solid #8b5cf6", paddingBottom: 12, marginBottom: 16 },
  brand: { fontSize: 18, color: "#7c3aed", fontWeight: 700 },
  title: { fontSize: 22, marginTop: 6, fontWeight: 700 },
  subtitle: { fontSize: 10, color: "#666", marginTop: 4 },
  kpiRow: { flexDirection: "row", gap: 8, marginVertical: 16 },
  kpi: {
    flex: 1,
    backgroundColor: "#f5f3ff",
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ede9fe",
  },
  kpiLabel: { fontSize: 8, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.5 },
  kpiValue: { fontSize: 16, fontWeight: 700, marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 18, marginBottom: 8 },
  table: { borderTop: "1px solid #e5e5e5" },
  row: { flexDirection: "row", borderBottom: "1px solid #f0f0f0", paddingVertical: 6 },
  th: { fontWeight: 700, color: "#7c3aed", backgroundColor: "#fafafa" },
  cell: { flex: 1, paddingHorizontal: 4 },
  cellNum: { flex: 1, paddingHorizontal: 4, textAlign: "right" },
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, fontSize: 8, color: "#999", textAlign: "center" },
});

const fmtBRL = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtNum = (v: number) => v.toLocaleString("pt-BR");
const fmtPct = (v: number) => `${v.toFixed(2)}%`;

export function ReportPdf({
  client,
  insights,
  dateStart,
  dateEnd,
}: {
  client: Client;
  insights: InsightRow[];
  dateStart: string;
  dateEnd: string;
}) {
  const totals = insights.reduce(
    (a, r) => ({
      spend: a.spend + Number(r.spend),
      impressions: a.impressions + Number(r.impressions),
      clicks: a.clicks + Number(r.clicks),
      leads: a.leads + Number(r.leads),
    }),
    { spend: 0, impressions: 0, clicks: 0, leads: 0 },
  );
  const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpl = totals.leads ? totals.spend / totals.leads : 0;

  const byCampaign = new Map<string, { name: string; spend: number; impressions: number; clicks: number; leads: number }>();
  for (const r of insights) {
    const k = r.campaign_id ?? "—";
    const cur = byCampaign.get(k) ?? { name: r.campaign_name ?? "—", spend: 0, impressions: 0, clicks: 0, leads: 0 };
    cur.spend += Number(r.spend);
    cur.impressions += Number(r.impressions);
    cur.clicks += Number(r.clicks);
    cur.leads += Number(r.leads);
    byCampaign.set(k, cur);
  }
  const campaigns = Array.from(byCampaign.values()).sort((a, b) => b.spend - a.spend);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>TrafficPro</Text>
          <Text style={styles.title}>{client.name}</Text>
          <Text style={styles.subtitle}>
            Período: {dateStart} até {dateEnd}
          </Text>
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Investimento</Text>
            <Text style={styles.kpiValue}>{fmtBRL(totals.spend)}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Leads</Text>
            <Text style={styles.kpiValue}>{fmtNum(totals.leads)}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>CPL</Text>
            <Text style={styles.kpiValue}>{fmtBRL(cpl)}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>CTR</Text>
            <Text style={styles.kpiValue}>{fmtPct(ctr)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Campanhas</Text>
        <View style={styles.table}>
          <View style={[styles.row, styles.th]}>
            <Text style={styles.cell}>Campanha</Text>
            <Text style={styles.cellNum}>Investimento</Text>
            <Text style={styles.cellNum}>Impressões</Text>
            <Text style={styles.cellNum}>Cliques</Text>
            <Text style={styles.cellNum}>CTR</Text>
            <Text style={styles.cellNum}>Leads</Text>
            <Text style={styles.cellNum}>CPL</Text>
          </View>
          {campaigns.map((c) => {
            const cctr = c.impressions ? (c.clicks / c.impressions) * 100 : 0;
            const ccpl = c.leads ? c.spend / c.leads : 0;
            return (
              <View key={c.name} style={styles.row}>
                <Text style={styles.cell}>{c.name}</Text>
                <Text style={styles.cellNum}>{fmtBRL(c.spend)}</Text>
                <Text style={styles.cellNum}>{fmtNum(c.impressions)}</Text>
                <Text style={styles.cellNum}>{fmtNum(c.clicks)}</Text>
                <Text style={styles.cellNum}>{fmtPct(cctr)}</Text>
                <Text style={styles.cellNum}>{fmtNum(c.leads)}</Text>
                <Text style={styles.cellNum}>{fmtBRL(ccpl)}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.footer}>
          Gerado por TrafficPro · {new Date().toLocaleDateString("pt-BR")}
        </Text>
      </Page>
    </Document>
  );
}
