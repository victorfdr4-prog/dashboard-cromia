"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { linkAdAccountAction } from "@/app/actions/clients";
import { toast } from "sonner";

export function LinkAdAccountForm({ clientId }: { clientId: string }) {
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    const adAccountId = String(formData.get("ad_account_id") ?? "").trim();
    const nome = String(formData.get("nome") ?? "").trim();
    if (!adAccountId) return toast.error("Informe o ID da conta");
    start(async () => {
      const r = await linkAdAccountAction(clientId, adAccountId, nome || undefined);
      if ("error" in r && r.error) toast.error(r.error);
      else toast.success("Conta vinculada");
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <Input name="ad_account_id" placeholder="act_1234567890" className="flex-1" />
      <Input name="nome" placeholder="Nome (opcional)" className="flex-1" />
      <Button type="submit" disabled={pending}>
        {pending ? "Vinculando…" : "Vincular"}
      </Button>
    </form>
  );
}
