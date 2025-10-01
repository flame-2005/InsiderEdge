export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[CRON] Starting BSE Corporate Actions scraper...");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const scrapeRes = await fetch(
      `${baseUrl}/api/scrape/bse-corporate-actions`,
      {
        method: "GET",
      }
    );

    if (!scrapeRes.ok) {
      throw new Error(`Scraper failed: ${scrapeRes.status}`);
    }

    const data = await scrapeRes.json();
    const rows = data.rows || [];

    console.log(`[CRON] Scraped ${rows.length} corporate actions from BSE`);

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No rows to process",
        inserted: 0,
      });
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      try {
        // Check if record already exists
        const exists = await convex.query(api.bseCorporateActions.checkExists, {
          scripCode: row.scripCode,
          purpose: row.purpose,
          exDateText: row.exDateText,
        });

        if (!exists) {
          // Insert new record
          await convex.mutation(api.bseCorporateActions.insert, {
            scripCode: row.scripCode,
            companyName: row.companyName,
            purpose: row.purpose,
            exDate: row.exDate,
            exDateText: row.exDateText,
            recordDate: row.recordDate,
            bcStartDate: row.bcStartDate,
            bcEndDate: row.bcEndDate,
            ndStartDate: row.ndStartDate,
            ndEndDate: row.ndEndDate,
          });
          insertedCount++;
        } else {
          skippedCount++;
        }
      } catch (err) {
        console.error(`[CRON] Error processing row:`, err);
      }
    }

    console.log(
      `[CRON] Completed: ${insertedCount} inserted, ${skippedCount} skipped`
    );

    return NextResponse.json({
      success: true,
      totalScraped: rows.length,
      inserted: insertedCount,
      skipped: skippedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
