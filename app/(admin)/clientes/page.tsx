import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/page-header";
import { ClientCard } from "@/components/client-card";
import { GlassCard } from "@/components/ui/glass-card";
import { NewClientButton } from "./new-client-button";
import { PendingApprovals } from "./pending-approvals";
import type { Client, Profile } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const admin = createAdminClient();
  const [{ data: clients }, { data: pending }] = await Promise.all([
    admin.from("clients").select("*").order("name"),
    admin.from("profiles").select("*").eq("role", "pending"),
  ]);

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Gerencie clientes, vínculos de contas e aprovação de acessos"
        action={<NewClientButton />}
      />

      {pending && pending.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-medium text-white/70">
            Aprovações pendentes ({pending.length})
          </h2>
          <PendingApprovals
            pending={pending as Profile[]}
            clients={(clients as Client[]) ?? []}
          />
        </div>
      )}

      {!clients?.length ? (
        <GlassCard className="p-10 text-center text-sm text-white/50">
          Nenhum cliente cadastrado.
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(clients as Client[]).map((c) => (
            <ClientCard key={c.id} client={c} href={`/clientes/${c.id}`} />
          ))}
        </div>
      )}
    </>
  );
}
