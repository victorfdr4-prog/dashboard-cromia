"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { syncAllAction } from "@/app/actions/sync";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export function SyncAllButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="secondary"
      onClick={() =>
        start(async () => {
          const r = await syncAllAction(30);
          if ("error" in r && r.error) toast.error(r.error);
          else toast.success(`Sincronizado: ${r.synced ?? 0} linhas`);
        })
      }
      disabled={pending}
    >
      <RefreshCw className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
      {pending ? "Sincronizando..." : "Sincronizar tudo"}
    </Button>
  );
}
