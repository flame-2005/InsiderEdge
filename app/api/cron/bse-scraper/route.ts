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
    console.log("[CRON] Starting BSE scraper...");

     const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const scrapeRes = await fetch(`${baseUrl}/api/scrape/bse`, {
      method: "GET",
    });

    if (!scrapeRes.ok) {
      throw new Error(`Scraper failed: ${scrapeRes.status}`);
    }

    const data = await scrapeRes.json();
    const rows = data.rows || [];

    console.log(`[CRON] Scraped ${rows.length} rows from BSE`);

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No rows to process",
        inserted: 0,
      });
    }

    let insertedCount = 0;
    let skippedCount = 0;
    const newRecord = [];

    for (const row of rows) {
      try {
        const exists = await convex.query(api.bseInsiderTrading.checkExists, {
          scripCode: row.scripCode,
          personName: row.personName,
          dateOfIntimation: row.dateOfIntimation,
          numberOfSecurities: row.numberOfSecurities,
        });

        const existsUnion = await convex.query(
          api.unifiedInsiderTrading.checkExists,
          {
            exchange: "BSE",
            scripCode: row.scripCode,
            transactionDate: row.dateOfIntimation,
            numberOfSecurities: row.numberOfSecurities,
          }
        );

        if (!existsUnion) {
          const id = await convex.mutation(
            api.unifiedInsiderTrading.insertFromBse,
            {
              scripCode: row.scripCode,
              companyName: row.companyName,
              personName: row.personName,
              category: row.category,
              securityType: row.securityType,
              numberOfSecurities: row.numberOfSecurities,
              transactionType: row.transactionType,
              transactionDate: row.dateOfIntimation,
              transactionDateText: row.dateOfIntimationText,
              securitiesHeldPreTransaction: row.securitiesHeldPreTransaction,
              securitiesHeldPrePercentage: row.securitiesHeldPrePercentage,
              valuePerSecurity: row.valuePerSecurity,
              securitiesHeldPostTransaction: row.securitiesHeldPostTransaction,
              securitiesHeldPostPercentage: row.securitiesHeldPostPercentage,
              modeOfAcquisition: row.modeOfAcquisition,
              derivativeType: row.derivativeType,
              buyValueUnits: row.buyValueUnits,
              sellValueUnits: row.sellValueUnits,
            }
          );

          newRecord.push({
            scripCode: row.scripCode,
            companyName: row.companyName,
            personName: row.personName,
            category: row.category,
            securityType: row.securityType,
            numberOfSecurities: row.numberOfSecurities,
            transactionType: row.transactionType,
            transactionDate: row.dateOfIntimation,
            transactionDateText: row.dateOfIntimationText,
            securitiesHeldPreTransaction: row.securitiesHeldPreTransaction,
            securitiesHeldPrePercentage: row.securitiesHeldPrePercentage,
            valuePerSecurity: row.valuePerSecurity,
            securitiesHeldPostTransaction: row.securitiesHeldPostTransaction,
            securitiesHeldPostPercentage: row.securitiesHeldPostPercentage,
            modeOfAcquisition: row.modeOfAcquisition,
            derivativeType: row.derivativeType,
            buyValueUnits: row.buyValueUnits,
            sellValueUnits: row.sellValueUnits,
          });

          // await convex.action(api.notification.notifyInsiderInsert, { id });
        }

        if (!exists) {
          await convex.mutation(api.bseInsiderTrading.insert, {
            scripCode: row.scripCode,
            companyName: row.companyName,
            personName: row.personName,
            category: row.category,
            securitiesHeldPreTransaction: row.securitiesHeldPreTransaction,
            securitiesHeldPrePercentage: row.securitiesHeldPrePercentage,
            securityType: row.securityType,
            numberOfSecurities: row.numberOfSecurities,
            valuePerSecurity: row.valuePerSecurity,
            transactionType: row.transactionType,
            securitiesHeldPostTransaction: row.securitiesHeldPostTransaction,
            securitiesHeldPostPercentage: row.securitiesHeldPostPercentage,
            dateOfAllotmentOrTransaction: row.dateOfAllotmentOrTransaction,
            dateOfAllotmentOrTransactionText:
              row.dateOfAllotmentOrTransactionText,
            modeOfAcquisition: row.modeOfAcquisition,
            derivativeType: row.derivativeType,
            buyValueUnits: row.buyValueUnits,
            sellValueUnits: row.sellValueUnits,
            dateOfIntimation: row.dateOfIntimation,
            dateOfIntimationText: row.dateOfIntimationText,
          });
          insertedCount++;
        } else {
          skippedCount++;
        }
      } catch (err) {
        console.error(`[CRON] Error processing row:`, err);
      }
    }

    if (newRecord.length > 0) {
      await fetch(`${baseUrl}/api/ai/insert-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: newRecord }),
      });
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
