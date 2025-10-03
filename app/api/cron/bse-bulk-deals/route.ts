export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[CRON] Starting BSE Bulk Deals scraper...");

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const scrapeRes = await fetch(`${baseUrl}/api/scrape/bse-bulk-deals`, {
      method: "GET",
    });

    if (!scrapeRes.ok) {
      throw new Error(`Scraper failed: ${scrapeRes.status}`);
    }

    const data = await scrapeRes.json();
    const rows = data.rows || [];

    console.log(`[CRON] Scraped ${rows.length} bulk deals from BSE`);

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
        const exists = await convex.query(api.bseBulkDeals.checkExists, {
          scripCode: row.scripCode,
          clientName: row.clientName,
          date: row.date || row.dateText,
          quantity: row.quantity,
        });

        if (!exists) {
          await convex.mutation(api.bseBulkDeals.insert, {
            scripCode: row.scripCode,
            companyName: row.companyName,
            clientName: row.clientName,
            dealType: row.dealType,
            quantity: row.quantity,
            price: row.price,
            totalValue: row.totalValue,
            date: row.date,
            dateText: row.dateText,
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
