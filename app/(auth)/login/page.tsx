import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <GlassCard strong className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Entrar no TrafficPro</h1>
      <p className="mt-1 text-sm text-white/50">Acesse seu painel de tráfego.</p>
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-xs text-white/50">
        Não tem conta?{" "}
        <Link href="/signup" className="text-violet-300 hover:underline">
          Criar conta
        </Link>
      </p>
    </GlassCard>
  );
}
