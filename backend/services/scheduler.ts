import cron from "node-cron";
import { format, subDays } from "date-fns";
import { listAdAccounts } from "./agencyService";
import { getOrHydrateDailyInsights } from "./cacheService";
import { generatePdfReport } from "./reportService";

async function runDailySync() {
  const accounts = await listAdAccounts();
  const targetDate = format(subDays(new Date(), 1), "yyyy-MM-dd");
  for (const account of accounts) {
    await getOrHydrateDailyInsights(account.ad_account_id, targetDate, targetDate);
  }
}

async function runWeeklyReports() {
  const accounts = await listAdAccounts();
  const end = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const start = format(subDays(new Date(), 7), "yyyy-MM-dd");
  for (const account of accounts) {
    await generatePdfReport(account.ad_account_id, start, end);
  }
}

export function startScheduler() {
  cron.schedule("0 2 * * *", () => {
    runDailySync().catch((error) => {
      console.error("Falha no cron diario:", error);
    });
  });

  cron.schedule("0 8 * * 1", () => {
    runWeeklyReports().catch((error) => {
      console.error("Falha no cron semanal:", error);
    });
  });
}

