import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { GlassCard } from "@/components/ui/glass-card";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { ClientActions } from "./client-actions";
import { LinkAdAccountForm } from "./link-ad-account";
import { SocialAccountForm } from "./social-account-form";
import { ConnectMetaButton } from "./connect-meta-button";
import { ArrowLeft, DollarSign, Users, MousePointerClick, TrendingUp } from "lucide-react";
import { formatCurrency, formatNumber, formatPercent, formatDate, dateRangePresets } from "@/lib/utils";
import type { AdAccount, Client, SocialAccount } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { last30 } = dateRangePresets();

  const [{ data: client }, { data: accounts }, { data: social }, { data: insights }] = await Promise.all([
    admin.from("clients").select("*").eq("id", id).single(),
    admin.from("ad_accounts").select("*").eq("client_id", id),
    admin.from("social_accounts").select("*").eq("client_id", id).maybeSingle(),
    admin
      .from("insights_cache")
      .select("spend, impressions, clicks, leads, campaign_name, date_start")
      .eq("client_id", id)
      .gte("date_start", last30.dateStart)
      .lte("date_start", last30.dateEnd),
  ]);

  if (!client) notFound();
  const c = client as Client;

  const totals = (insights ?? []).reduce(
    (acc, r: any) => ({
      spend: acc.spend + Number(r.spend ?? 0),
      impressions: acc.impressions + Number(r.impressions ?? 0),
      clicks: acc.clicks + Number(r.clicks ?? 0),
      leads: acc.leads + Number(r.leads ?? 0),
    }),
    { spend: 0, impressions: 0, clicks: 0, leads: 0 },
  );
  const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpl = totals.leads ? totals.spend / totals.leads : 0;

  return (
    <>
      <Link href="/clientes" className="mb-4 inline-flex items-center gap-1 text-sm text-white/50 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <PageHeader
        title={c.name}
        description={
          c.meta_connected_at
            ? `Meta conectada em ${formatDate(c.meta_connected_at)} · ${c.username ? `@${c.username}` : ""}`
            : "Meta não conectada"
        }
        action={
          <div className="flex gap-2">
            <ConnectMetaButton clientId={c.id} connected={!!c.meta_access_token} />
            <ClientActions client={c} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Investimento (30d)" value={formatCurrency(totals.spend)} icon={DollarSign} accent="violet" />
        <KpiCard label="Leads" value={formatNumber(totals.leads)} icon={Users} accent="pink" />
        <KpiCard label="CPL" value={formatCurrency(cpl)} icon={MousePointerClick} accent="emerald" />
        <KpiCard label="CTR" value={formatPercent(ctr)} icon={TrendingUp} accent="amber" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h3 className="mb-4 text-sm font-medium text-white/80">Contas de Anúncio</h3>
          <div className="space-y-2">
            {(accounts as AdAccount[] | null)?.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{a.nome_conta ?? "(sem nome)"}</p>
                  <p className="truncate text-xs text-white/40">{a.ad_account_id}</p>
                </div>
                {a.ultima_sync && (
                  <span className="text-xs text-white/40">{formatDate(a.ultima_sync)}</span>
                )}
              </div>
            ))}
            {!accounts?.length && <p className="text-sm text-white/40">Nenhuma conta vinculada</p>}
          </div>
          <div className="mt-4">
            <LinkAdAccountForm clientId={c.id} />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="mb-4 text-sm font-medium text-white/80">Contas Orgânicas</h3>
          <SocialAccountForm clientId={c.id} initial={social as SocialAccount | null} />
        </GlassCard>
      </div>

      {c.observacoes && (
        <GlassCard className="mt-6 p-6">
          <h3 className="mb-2 text-sm font-medium text-white/80">Observações</h3>
          <p className="text-sm text-white/60">{c.observacoes}</p>
        </GlassCard>
      )}
    </>
  );
}
