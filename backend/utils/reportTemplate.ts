function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function buildLineSvg(
  data: Array<Record<string, any>>,
  valueKey: string,
  color: string,
  width = 720,
  height = 180,
) {
  const values = data.map((item) => Number(item[valueKey] || 0));
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - (value / max) * (height - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <polyline fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="${points}" />
    </svg>
  `;
}

export function buildReportHtml(payload: any) {
  const kpiCards = payload.kpis
    .slice(0, 8)
    .map(
      (kpi: any) => `
        <div class="card">
          <div class="label">${kpi.label}</div>
          <div class="value">${
            kpi.format === "currency"
              ? formatCurrency(kpi.value)
              : kpi.format === "percentage"
                ? `${kpi.value.toFixed(2)}%`
                : formatNumber(kpi.value)
          }</div>
          <div class="change ${kpi.trend}">${kpi.change.toFixed(2)}%</div>
        </div>
      `,
    )
    .join("");

  const insightItems = payload.insights.map((item: string) => `<li>${item}</li>`).join("");
  const rankingRows = payload.ranking_anuncios
    .slice(0, 5)
    .map(
      (row: any) => `
        <tr>
          <td>${row.name}</td>
          <td>${row.ctr.toFixed(2)}%</td>
          <td>${formatCurrency(row.cpc)}</td>
          <td>${row.conversionRate.toFixed(2)}%</td>
          <td>${row.roas.toFixed(2)}x</td>
        </tr>
      `,
    )
    .join("");

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Relatorio FlowMetrics</title>
        <style>
          body { font-family: Arial, sans-serif; background: #07111f; color: #e2e8f0; margin: 0; }
          .page { padding: 42px; min-height: 100vh; box-sizing: border-box; }
          .hero { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
          .eyebrow { color: #60a5fa; text-transform: uppercase; font-size: 12px; letter-spacing: 0.18em; font-weight: 700; }
          h1 { margin: 12px 0 8px; font-size: 34px; line-height: 1; }
          h2 { margin: 0 0 18px; font-size: 20px; color: #f8fafc; }
          p { color: #94a3b8; line-height: 1.55; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin: 26px 0 30px; }
          .card { background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(148, 163, 184, 0.12); border-radius: 18px; padding: 18px; }
          .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: #64748b; font-weight: 700; margin-bottom: 10px; }
          .value { font-size: 24px; font-weight: 800; color: #f8fafc; }
          .change { margin-top: 10px; font-size: 12px; font-weight: 700; }
          .up { color: #22c55e; }
          .down { color: #ef4444; }
          .neutral { color: #94a3b8; }
          .section { margin-top: 28px; }
          .chart-card, .table-card { background: rgba(15, 23, 42, 0.9); border-radius: 18px; border: 1px solid rgba(148, 163, 184, 0.12); padding: 20px; }
          ul { padding-left: 20px; }
          li { margin-bottom: 10px; color: #cbd5e1; }
          table { width: 100%; border-collapse: collapse; }
          th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid rgba(148, 163, 184, 0.1); font-size: 12px; }
          th { color: #60a5fa; text-transform: uppercase; letter-spacing: 0.12em; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="hero">
            <div>
              <div class="eyebrow">Relatorio de Performance</div>
              <h1>${payload.cliente.nome}</h1>
              <p>${payload.cliente.segmento || "Operacao de trafego"} • ${payload.conta.nome_conta}</p>
              <p>Periodo: ${payload.periodo.atual.inicio} ate ${payload.periodo.atual.fim}</p>
            </div>
            <div class="eyebrow">FlowMetrics Pro</div>
          </div>

          <div class="grid">${kpiCards}</div>

          <div class="section chart-card">
            <h2>Historico de Cliques</h2>
            ${buildLineSvg(payload.dados_grafico, "cliques", "#3b82f6")}
          </div>

          <div class="section chart-card">
            <h2>Historico de Impressoes</h2>
            ${buildLineSvg(payload.dados_grafico, "impressoes", "#ec4899")}
          </div>

          <div class="section">
            <h2>Analise Estrategica</h2>
            <p>${payload.narrativa}</p>
          </div>

          <div class="section table-card">
            <h2>Leitura de Gestao</h2>
            <ul>${insightItems}</ul>
          </div>

          <div class="section table-card">
            <h2>Top Anuncios</h2>
            <table>
              <thead>
                <tr>
                  <th>Anuncio</th>
                  <th>CTR</th>
                  <th>CPC</th>
                  <th>Conversao</th>
                  <th>ROAS</th>
                </tr>
              </thead>
              <tbody>${rankingRows}</tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
  `;
}

