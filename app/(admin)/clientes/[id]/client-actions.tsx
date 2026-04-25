"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { syncClientAction } from "@/app/actions/sync";
import { generatePdfReportAction } from "@/app/actions/reports";
import { toast } from "sonner";
import { RefreshCw, FileDown } from "lucide-react";
import type { Client } from "@/types/database";

export function ClientActions({ client }: { client: Client }) {
  const [pending, start] = useTransition();
  const [pdfPending, startPdf] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          start(async () => {
            const r = await syncClientAction(client.id, 30);
            if ("error" in r && r.error) toast.error(r.error);
            else toast.success(`${r.synced} linhas sincronizadas`);
          })
        }
        disabled={pending || !client.meta_access_token}
      >
        <RefreshCw className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        Sincronizar
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          startPdf(async () => {
            const r = await generatePdfReportAction(client.id, 30);
            if ("error" in r && r.error) toast.error(r.error);
            else if ("pdfUrl" in r) {
              window.open(r.pdfUrl, "_blank");
              toast.success("PDF gerado");
            }
          })
        }
        disabled={pdfPending}
      >
        <FileDown className="h-4 w-4" />
        {pdfPending ? "Gerando…" : "Exportar PDF"}
      </Button>
    </div>
  );
}
