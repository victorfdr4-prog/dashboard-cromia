"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { createClientAction } from "@/app/actions/clients";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function NewClientButton() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(formData: FormData) {
    start(async () => {
      const r = await createClientAction(formData);
      if ("error" in r && r.error) {
        toast.error(r.error);
      } else if ("id" in r) {
        toast.success("Cliente criado");
        setOpen(false);
        router.push(`/clientes/${r.id}`);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Novo cliente
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#12121b] p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">Novo cliente</Dialog.Title>
            <Dialog.Close className="text-white/60 hover:text-white">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <form action={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="orcamento">Orçamento (R$)</Label>
                <Input id="orcamento" name="orcamento" type="number" step="0.01" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="inicio_contrato">Início</Label>
                <Input id="inicio_contrato" name="inicio_contrato" type="date" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fim_contrato">Fim</Label>
                <Input id="fim_contrato" name="fim_contrato" type="date" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea id="observacoes" name="observacoes" rows={3} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={pending}>
                {pending ? "Criando..." : "Criar"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
