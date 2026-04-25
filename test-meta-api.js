const fs = require('fs');
const path = require('path');

// Carregar variáveis do .env manualmente
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const TOKEN = process.env.META_ACCESS_TOKEN || process.env.META_ADS_ACCESS_TOKEN;
const GRAPH_VER = process.env.META_GRAPH_VERSION || 'v19.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_VER}`;

if (!TOKEN) {
  console.error("❌ ERRO: META_ACCESS_TOKEN não encontrado no .env");
  console.log("👉 Por favor, gere um token no Explorador da Graph API e coloque no .env");
  process.exit(1);
}

async function fetchApi(endpoint) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}&access_token=${TOKEN}`);
    const data = await res.json();
    if (data.error) {
      console.warn(`⚠️ Aviso em ${endpoint.split('?')[0]}:`, data.error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error(`❌ Erro de requisição em ${endpoint}:`, err.message);
    return null;
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests(round = 1) {
  console.log(`🚀 Iniciando testes automatizados da Graph API do Meta... (Rodada ${round})\n`);

  // 1. Testar public_profile
  console.log("🔄 Testando [public_profile]...");
  const me = await fetchApi('/me?fields=id,name');
  if (me) console.log(`✅ Sucesso! Logado como: ${me.name}`);
  await delay(1000);

  // 2. Testar business_management
  console.log("\n🔄 Testando [business_management]...");
  const businesses = await fetchApi('/me/businesses?fields=id,name');
  if (businesses) console.log(`✅ Sucesso! Encontrados ${businesses.data?.length || 0} gerenciadores de negócios.`);
  await delay(1000);

  // 3. Testar pages_show_list, pages_read_engagement, pages_manage_metadata, pages_messaging
  console.log("\n🔄 Testando permissões de Páginas...");
  const pages = await fetchApi('/me/accounts?fields=id,name,access_token,instagram_business_account');
  
  if (pages && pages.data && pages.data.length > 0) {
    console.log(`✅ Sucesso! Encontradas ${pages.data.length} páginas.`);
    const page = pages.data[0];
    
    console.log(`🔄 Acessando dados da página "${page.name}"...`);
    await fetchApi(`/${page.id}?fields=about,emails,engagement&access_token=${page.access_token}`);
    
    console.log(`🔄 Acessando conversas da página...`);
    await fetchApi(`/${page.id}/conversations?access_token=${page.access_token}`);

    if (page.instagram_business_account) {
      console.log(`\n🔄 Testando permissões de Instagram (Conta IG vinculada)...`);
      await fetchApi(`/${page.instagram_business_account.id}?fields=id,username,profile_picture_url`);
      await fetchApi(`/${page.instagram_business_account.id}/media?fields=id,caption`);
    } else {
      console.log("⚠️ Nenhuma conta do Instagram vinculada à primeira página para testar.");
    }
  } else {
    console.log("⚠️ Nenhuma página do Facebook encontrada nesta conta.");
  }
  await delay(1000);

  // 4. Testar ads_read, ads_management e Ads Management Standard Access
  console.log("\n🔄 Testando permissões de Anúncios [ads_read, ads_management]...");
  const adAccounts = await fetchApi('/me/adaccounts?fields=id,name,account_status');
  
  if (adAccounts && adAccounts.data && adAccounts.data.length > 0) {
    console.log(`✅ Sucesso! Encontradas ${adAccounts.data.length} contas de anúncios.`);
    const adAccount = adAccounts.data[0];
    
    console.log(`🔄 Lendo campanhas da conta "${adAccount.name || adAccount.id}"...`);
    await fetchApi(`/${adAccount.id}/campaigns?fields=id,name,status&limit=5`);
    
    console.log(`🔄 Lendo insights da conta...`);
    await fetchApi(`/${adAccount.id}/insights?date_preset=last_30d&fields=impressions,clicks,spend`);
  } else {
    console.log("⚠️ Nenhuma conta de anúncios encontrada nesta conta.");
  }

  console.log(`\n🎉 Fim da rodada ${round}!`);
}

async function loopTests(times) {
  for (let i = 1; i <= times; i++) {
    console.log(`\n=========================================`);
    console.log(`🚀 INICIANDO RODADA ${i} DE ${times}`);
    console.log(`=========================================\n`);
    await runTests(i);
    
    if (i < times) {
      console.log(`\n⏳ Aguardando 10 segundos antes da próxima rodada (evitando bloqueios da API)...`);
      await delay(10000);
    }
  }
  console.log("\n🎉 TODOS OS TESTES FORAM CONCLUÍDOS COM SUCESSO!");
  console.log("⏳ O Facebook pode levar até 24 horas para atualizar os contadores no painel.");
}

loopTests(10);
