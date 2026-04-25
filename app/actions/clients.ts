"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

const clientSchema = z.object({
  name: z.string().min(2),
  username: z.string().optional().nullable(),
  plataforma: z.string().optional().nullable(),
  orcamento: z.coerce.number().optional().nullable(),
  inicio_contrato: z.string().optional().nullable(),
  fim_contrato: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  status: z.enum(["ativo", "pausado", "encerrado"]).optional(),
});

export async function createClientAction(formData: FormData) {
  await requireAdmin();
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("clients")
    .insert({ ...parsed.data, status: parsed.data.status ?? "ativo" })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/clientes");
  return { id: data.id };
}

export async function updateClientAction(id: string, formData: FormData) {
  await requireAdmin();
  const parsed = clientSchema.partial().safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const admin = createAdminClient();
  const { error } = await admin.from("clients").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { ok: true };
}

export async function deleteClientAction(id: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("clients").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/clientes");
  return { ok: true };
}

/** Aprova um profile pending e vincula a um client_id (cria papel client) */
export async function approveProfileAction(profileId: string, clientId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error: pErr } = await admin
    .from("profiles")
    .update({ role: "client", client_id: clientId })
    .eq("id", profileId);
  if (pErr) return { error: pErr.message };
  const { error: cErr } = await admin.from("clients").update({ user_id: profileId }).eq("id", clientId);
  if (cErr) return { error: cErr.message };
  revalidatePath("/clientes");
  return { ok: true };
}

export async function linkAdAccountAction(clientId: string, adAccountId: string, nomeConta?: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("ad_accounts")
    .upsert({ client_id: clientId, ad_account_id: adAccountId, nome_conta: nomeConta ?? null });
  if (error) return { error: error.message };
  revalidatePath(`/clientes/${clientId}`);
  return { ok: true };
}

export async function unlinkAdAccountAction(adAccountRowId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("ad_accounts").delete().eq("id", adAccountRowId);
  if (error) return { error: error.message };
  revalidatePath("/clientes");
  return { ok: true };
}

export async function disconnectClientTokenAction(clientId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("clients")
    .update({ meta_access_token: null, meta_token_expires_at: null, meta_connected_at: null })
    .eq("id", clientId);
  if (error) return { error: error.message };
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/api-meta");
  return { ok: true };
}

export async function saveSocialAccountAction(formData: FormData) {
  await requireAdmin();
  const schema = z.object({
    client_id: z.string().uuid(),
    ig_user_id: z.string().optional().nullable(),
    ig_nome: z.string().optional().nullable(),
    fb_page_id: z.string().optional().nullable(),
    fb_nome: z.string().optional().nullable(),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const admin = createAdminClient();
  const { error } = await admin.from("social_accounts").upsert(parsed.data);
  if (error) return { error: error.message };
  revalidatePath(`/clientes/${parsed.data.client_id}`);
  return { ok: true };
}
