import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrafficPro — Gestão de Tráfego",
  description: "Dashboard SaaS para gestores de tráfego — Meta Ads, relatórios e clientes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            className: "glass !bg-white/5 !text-white !border-white/10",
          }}
        />
      </body>
    </html>
  );
}
