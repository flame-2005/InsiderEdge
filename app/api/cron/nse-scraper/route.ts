// /app/api/cron/nse/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

type Trade = {
  symbol: string;
  companyName: string;
  acquirerOrDisposer: string;
  regulation: string;
  securityType: string;
  quantity: number;
  transactionType: string;
  disclosedAt: string;
  xbrlLink: string;
};

type TradeWithTransaction = Trade & {
  transactionData?: string;
};

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[CRON] Starting NSE scraper...");

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const url = new URL(`${baseUrl}/api/scrape/nse`);

    const incoming = new URL(req.url);
    incoming.searchParams.forEach((v, k) => url.searchParams.set(k, v));

    const scrapeRes = await fetch(url.toString(), { method: "GET" });
    if (!scrapeRes.ok) {
      throw new Error(`Scraper failed: ${scrapeRes.status}`);
    }

    const data = await scrapeRes.json();

    const rows: Trade[] = data.rows || [];

    console.log(`[CRON] Scraped ${rows.length} rows from NSE`);

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No rows to process",
        totalScraped: 0,
        sentToInsert: 0,
        via: data.via || "page",
        timestamp: new Date().toISOString(),
      });
    }

    // Map to Convex mutation shape and filter out incomplete rows
    const trades: Trade[] = rows
      .map((r) => ({
        symbol: (r.symbol ?? "").trim(),
        companyName: (r.companyName ?? "").trim(),
        acquirerOrDisposer: (r.acquirerOrDisposer ?? "").trim(),
        regulation: (r.regulation ?? "").trim(),
        securityType: (r.securityType ?? "").trim(),
        quantity: Number.isFinite(r.quantity as number)
          ? (r.quantity as number)
          : 0,
        transactionType: (r.transactionType ?? "").trim(),
        disclosedAt: (r.disclosedAt ?? "").trim(),
        xbrlLink: r.xbrlLink ?? undefined,
      }))
      .filter(
        (t) =>
          t.symbol &&
          t.companyName &&
          t.acquirerOrDisposer &&
          t.disclosedAt &&
          Number.isFinite(t.quantity)
      );

    if (trades.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No valid trades after filtering",
        totalScraped: rows.length,
        sentToInsert: 0,
        via: data.via || "page",
        timestamp: new Date().toISOString(),
      });
    }

    const BATCH_SIZE = 25;
    let totalInserted = 0;
    const newRecord: TradeWithTransaction[] = [];

    for (let i = 0; i < trades.length; i += BATCH_SIZE) {
      const batch = trades.slice(i, i + BATCH_SIZE);
      console.log(
        `[CRON] Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(trades.length / BATCH_SIZE)}`
      );

      try {
        await convex.mutation(api.nseInsiderTrading.insertTrades, {
          trades: batch,
        });
        totalInserted += batch.length;
      } catch (batchError) {
        console.error(
          `[CRON] Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`,
          batchError
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    for (const row of rows) {
      const exists = await convex.query(api.unifiedInsiderTrading.checkExists, {
        exchange: "NSE",
        scripCode: row.symbol,
        transactionDate: row.disclosedAt,
        numberOfSecurities: row.quantity,
      });

      if (!exists) {
        const id = await convex.mutation(
          api.unifiedInsiderTrading.insertFromNse,
          {
            symbol: row.symbol,
            companyName: row.companyName,
            acquirerOrDisposer: row.acquirerOrDisposer,
            regulation: row.regulation,
            securityType: row.securityType,
            quantity: row.quantity,
            transactionType: row.transactionType,
            transactionDate: row.disclosedAt,
            xbrlLink: row.xbrlLink,
          }
        );

        newRecord.push({
          symbol: row.symbol,
          companyName: row.companyName,
          acquirerOrDisposer: row.acquirerOrDisposer,
          regulation: row.regulation,
          securityType: row.securityType,
          quantity: row.quantity,
          transactionType: row.transactionType,
          disclosedAt: row.disclosedAt,
          xbrlLink: row.xbrlLink,
        });
        await convex.action(api.notification.notifyInsiderInsert, { id });
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
      `[CRON] Sent ${trades.length} trades to Convex (server de-dupes).`
    );

    return NextResponse.json({
      success: true,
      totalScraped: rows.length,
      sentToInsert: trades.length,
      via: data.via || "page",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] NSE Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
