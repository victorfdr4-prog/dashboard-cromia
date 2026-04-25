import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";

export default async function Home() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/dashboard");
  if (profile.role === "client") redirect("/meu-relatorio");
  redirect("/aguardando-aprovacao");
}
