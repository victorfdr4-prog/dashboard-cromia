import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <GlassCard strong className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
      <p className="mt-1 text-sm text-white/50">
        Após o cadastro, aguarde aprovação do gestor para acessar seu painel.
      </p>
      <div className="mt-6">
        <SignupForm />
      </div>
      <p className="mt-6 text-center text-xs text-white/50">
        Já tem conta?{" "}
        <Link href="/login" className="text-violet-300 hover:underline">
          Entrar
        </Link>
      </p>
    </GlassCard>
  );
}
