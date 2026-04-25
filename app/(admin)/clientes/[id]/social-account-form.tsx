"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { saveSocialAccountAction } from "@/app/actions/clients";
import { toast } from "sonner";
import type { SocialAccount } from "@/types/database";

export function SocialAccountForm({
  clientId,
  initial,
}: {
  clientId: string;
  initial: SocialAccount | null;
}) {
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    formData.set("client_id", clientId);
    start(async () => {
      const r = await saveSocialAccountAction(formData);
      if ("error" in r && r.error) toast.error(r.error);
      else toast.success("Salvo");
    });
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Instagram User ID</Label>
          <Input name="ig_user_id" defaultValue={initial?.ig_user_id ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label>Instagram nome</Label>
          <Input name="ig_nome" defaultValue={initial?.ig_nome ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label>Facebook Page ID</Label>
          <Input name="fb_page_id" defaultValue={initial?.fb_page_id ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label>Facebook nome</Label>
          <Input name="fb_nome" defaultValue={initial?.fb_nome ?? ""} />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Salvando…" : "Salvar orgânico"}
      </Button>
    </form>
  );
}
