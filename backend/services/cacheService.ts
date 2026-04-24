import { eachDayOfInterval, format } from "date-fns";
import { adminSupabase } from "../db/database";
import { fetchDailyInsights, NormalizedInsightRow } from "./metaAdsService";

export async function getOrHydrateDailyInsights(adAccountId: string, dateStart: string, dateEnd: string) {
  const requestedDates = eachDayOfInterval({
    start: new Date(`${dateStart}T00:00:00`),
    end: new Date(`${dateEnd}T00:00:00`),
  }).map((date) => format(date, "yyyy-MM-dd"));

  const { data: rows, error } = await adminSupabase
    .from("insights_cache")
    .select("data,dados_json")
    .eq("ad_account_id", adAccountId)
    .gte("data", dateStart)
    .lte("data", dateEnd)
    .order("data", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const existingMap = new Map(
    (rows || []).map((row: any) => [format(new Date(row.data), "yyyy-MM-dd"), row.dados_json as NormalizedInsightRow]),
  );

  const missingDates = requestedDates.filter((date) => !existingMap.has(date));

  if (missingDates.length > 0) {
    const freshRows = await fetchDailyInsights(adAccountId, dateStart, dateEnd);

    for (const row of freshRows) {
      const { error: upsertError } = await adminSupabase
        .from("insights_cache")
        .upsert(
          {
            ad_account_id: adAccountId,
            data: row.date,
            dados_json: row,
          },
          { onConflict: "ad_account_id,data" },
        );

      if (upsertError) {
        throw new Error(upsertError.message);
      }
      existingMap.set(row.date, row);
    }
  }

  return requestedDates
    .map((date) => existingMap.get(date))
    .filter((row): row is NormalizedInsightRow => Boolean(row));
}
