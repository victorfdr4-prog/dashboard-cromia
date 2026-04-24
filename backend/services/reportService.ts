import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import { env } from "../config/env";
import { getAdAccountContext, saveReport } from "./agencyService";
import { buildDashboard } from "./dashboardService";
import { buildReportHtml } from "../utils/reportTemplate";

export async function generatePdfReport(adAccountId: string, dateStart: string, dateEnd: string) {
  const context = await getAdAccountContext(adAccountId);
  if (!context) {
    throw new Error("Conta nao vinculada para gerar relatorio.");
  }

  const dashboardPayload = await buildDashboard(adAccountId, dateStart, dateEnd);
  const html = buildReportHtml(dashboardPayload);

  const accountDir = path.resolve(process.cwd(), env.reportsDir, context.client_id);
  await fs.mkdir(accountDir, { recursive: true });

  const filename = `relatorio-${context.ad_account_id}-${Date.now()}.pdf`;
  const fullPath = path.join(accountDir, filename);

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({
      path: fullPath,
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
    });
  } finally {
    await browser.close();
  }

  const pdfUrl = `/reports/${context.client_id}/${filename}`;
  const report = await saveReport(context.client_id, pdfUrl);
  return { report, pdfUrl, dashboardPayload };
}

