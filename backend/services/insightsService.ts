import { AggregateMetrics } from "./metricsService";

export function buildAgencyInsights(metrics: AggregateMetrics) {
  const insights: string[] = [];

  if (metrics.ctr >= 2) {
    insights.push("Aumento de CTR indica melhora na comunicacao dos criativos e maior aderencia da oferta.");
  } else {
    insights.push("CTR abaixo do ideal sugere revisar promessa, criativos e segmentacao para elevar a taxa de clique.");
  }

  if (metrics.cpc > 3) {
    insights.push("CPC elevado sugere baixa relevancia do anuncio ou concorrencia agressiva no leilao.");
  } else {
    insights.push("CPC controlado mostra eficiencia na compra de trafego e abre espaco para escalar.");
  }

  if (metrics.reach > 0 && metrics.clicks > 0 && metrics.leads === 0 && metrics.purchases === 0) {
    insights.push("Alcance alto sem conversao indica gargalo no funil, pagina ou oferta apos o clique.");
  }

  if (metrics.frequency >= 2.8) {
    insights.push("Frequencia alta indica fadiga de criativo. Vale rotacionar anuncios e abrir novos angulos de comunicacao.");
  }

  if (metrics.roas < 1) {
    insights.push("ROAS abaixo de 1 indica campanha nao lucrativa. Prioridade total em oferta, audiencia e pagina.");
  } else if (metrics.roas >= 3) {
    insights.push("ROAS acima de 3 sinaliza boa eficiencia comercial e potencial claro para ganho de escala.");
  }

  if (metrics.cpl > 0 && metrics.leads > 0) {
    insights.push("CPL deve ser monitorado junto da qualidade do lead para evitar volume sem fechamento.");
  }

  return insights.slice(0, 5);
}

export function buildNarrative(metrics: AggregateMetrics, growth: Record<string, number>) {
  const clicksSignal =
    growth.clicks >= 0
      ? `houve crescimento de ${growth.clicks.toFixed(1)}% nos cliques`
      : `houve queda de ${Math.abs(growth.clicks).toFixed(1)}% nos cliques`;

  const roasSignal =
    metrics.roas < 1
      ? "o ROAS permanece abaixo do ponto de equilibrio, exigindo ajuste rapido no funil e na oferta"
      : `o ROAS fechou em ${metrics.roas.toFixed(2)}x, indicando tracao comercial mais saudavel`;

  const conversionSource = metrics.purchases > 0 ? "compras" : "leads";
  const conversionVolume = metrics.purchases > 0 ? metrics.purchases : metrics.leads;

  return `Durante o periodo analisado, ${clicksSignal}, refletindo o comportamento atual da atracao dos anuncios. O investimento somou R$ ${metrics.spend.toFixed(2)}, com CTR de ${metrics.ctr.toFixed(2)}% e CPC medio de R$ ${metrics.cpc.toFixed(2)}. Foram gerados ${conversionVolume} ${conversionSource}, enquanto ${roasSignal}. A leitura de agencia aqui e simples: quando o volume de trafego cresce sem acompanhar a conversao, o gargalo costuma estar entre promessa, pagina e etapa final do funil.`;
}

