# TrafficPro

Dashboard SaaS para gestores de tráfego — Next.js 15 + Supabase + Meta Ads.

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions)
- **Supabase** (PostgreSQL + Auth + Storage)
- **Tailwind CSS v4** (glassmorphism dark theme · roxo + rosa)
- **Framer Motion** · **Recharts** · **@react-pdf/renderer**

## Setup

```bash
# 1) Instalar deps
npm install

# 2) Copiar env
cp .env.example .env.local
# Preencher SUPABASE_SERVICE_ROLE_KEY, META_*, CRON_SECRET

# 3) Aplicar schema
# Cole supabase/schema.sql no SQL Editor do Supabase

# 4) Criar bucket "reports" no Supabase Storage (público)

# 5) Promover seu usuário a admin (após signup):
# update public.profiles set role='admin' where email='admin@cromiacomunicacao.com';

# 6) Dev
npm run dev
```

## Estrutura

```
app/
  (auth)/login, signup           — login/signup
  (admin)/dashboard, clientes, relatorios, api-meta
  (client)/meu-relatorio
  actions/                       — Server Actions
  api/meta/callback              — OAuth callback
  api/cron/sync                  — cron diário (Bearer CRON_SECRET)
components/  ui/, sidebar, kpi-card, client-card, report-view, report-chart
lib/
  supabase/                      — server, client, admin, middleware
  meta/api.ts                    — Graph API + OAuth
  pdf/report.tsx
middleware.ts                    — auth + role routing
supabase/schema.sql              — schema completo + RLS
```

## Fluxos

### Cadastro de cliente
1. Cliente acessa `/signup` → `/aguardando-aprovacao`
2. Admin em `/clientes` → seção "Aprovações pendentes" → vincula a um cliente → aprova
3. Cliente loga → vê apenas o próprio relatório (RLS)

### Meta OAuth (por cliente, estilo mLabs)
1. Admin entra na página do cliente → "Conectar Meta"
2. Cliente faz login no Facebook com a própria conta
3. Callback: code → short-lived → long-lived (~60 dias) → `clients.meta_access_token`
4. Admin vincula contas de anúncio manualmente por ID

### Sync (manual + automático)
- Manual: botão "Sincronizar" — últimos 30 dias
- Automático: cron Railway diário em `/api/cron/sync` — últimos 7 dias

## Deploy (Railway + redirect htaccess)

1. Push pro GitHub
2. Railway → conectar repo, env vars
3. Railway expõe `https://trafficpro.up.railway.app`
4. `.htaccess` na hospedagem compartilhada:
   ```apache
   RewriteEngine On
   RewriteRule ^dashboard/?(.*)$ https://trafficpro.up.railway.app/$1 [P,L]
   ```
5. `META_REDIRECT_URI=https://trafficpro.up.railway.app/api/meta/callback`

### Cron Railway
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://trafficpro.up.railway.app/api/cron/sync
```
Schedule: `0 3 * * *`

## Roles

- `admin` — gerencia tudo
- `client` — vê apenas os próprios dados (RLS via `my_client_id()`)
- `pending` — aguardando aprovação

## Segurança

- Service role só em arquivos com `import "server-only"`
- RLS habilitado em todas as tabelas
- Token Meta nunca exposto no client
- OAuth state com nonce em cookie httpOnly
- Cron protegido por bearer
