"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { getMetaAuthUrlAction } from "@/app/actions/meta";
import { disconnectClientTokenAction } from "@/app/actions/clients";
import { toast } from "sonner";
import { Plug, PlugZap } from "lucide-react";
import { useRouter } from "next/navigation";

export function ConnectMetaButton({ clientId, connected }: { clientId: string; connected: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  if (connected) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          start(async () => {
            const r = await disconnectClientTokenAction(clientId);
            if ("error" in r && r.error) toast.error(r.error);
            else {
              toast.success("Token desconectado");
              router.refresh();
            }
          })
        }
        disabled={pending}
      >
        <PlugZap className="h-4 w-4 text-emerald-300" />
        Conectado · desconectar
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      onClick={() =>
        start(async () => {
          const r = await getMetaAuthUrlAction(clientId);
          if ("url" in r) window.location.href = r.url;
          else toast.error("Falha ao gerar URL");
        })
      }
      disabled={pending}
    >
      <Plug className="h-4 w-4" />
      Conectar Meta
    </Button>
  );
}
