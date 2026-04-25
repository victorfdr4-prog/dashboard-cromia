import { GlassCard } from "@/components/ui/glass-card";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions/auth";
import { Clock } from "lucide-react";

export default function PendingPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size={40} />
        </div>
        <GlassCard strong className="p-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-pink-500/30">
            <Clock className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Aguardando aprovação</h1>
          <p className="mt-2 text-sm text-white/60">
            Seu cadastro foi recebido. O gestor da agência precisa aprovar sua conta antes que você
            possa acessar o painel. Entraremos em contato em breve.
          </p>
          <form action={logoutAction} className="mt-6">
            <Button type="submit" variant="secondary" className="w-full">
              Sair
            </Button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
