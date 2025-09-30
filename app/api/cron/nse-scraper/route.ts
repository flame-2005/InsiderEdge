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
  xbrlLink?: string;
};

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[CRON] Starting NSE scraper...");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = new URL(`${baseUrl}/api/scrape/nse`);

    // forward any query params (e.g. ?symbol=INFY)
    const incoming = new URL(req.url);
    incoming.searchParams.forEach((v, k) => url.searchParams.set(k, v));

    const scrapeRes = await fetch(url.toString(), { method: "GET" });
    if (!scrapeRes.ok) {
      throw new Error(`Scraper failed: ${scrapeRes.status}`);
    }

    const data = await scrapeRes.json();

    console.log(data);
    const rows: Array<{
      symbol: string | null;
      companyName: string | null;
      acquirerOrDisposer: string | null;
      regulation: string | null;
      securityType: string | null;
      quantity: number | null;
      transactionType: string | null;
      disclosedAt: string | null;
      xbrlLink: string | null;
    }> = data.rows || [];

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

    await convex.mutation(api.nseInsiderTrading.insertTrades, { trades });

    for (const row of rows) {
      const exists = await convex.query(api.unifiedInsiderTrading.checkExists, {
        exchange: "NSE",
        scripCode: row.symbol!,
        transactionDate: row.disclosedAt!,
        numberOfSecurities: row.quantity!,
      });

      if (!exists) {
        await convex.mutation(api.unifiedInsiderTrading.insertFromNse, {
          symbol: row.symbol!,
          companyName: row.companyName!,
          acquirerOrDisposer: row.acquirerOrDisposer!,
          regulation: row.regulation!,
          securityType: row.securityType!,
          quantity: row.quantity!,
          transactionType: row.transactionType!,
          transactionDate: row.disclosedAt!,
          xbrlLink: row.xbrlLink,
        });
      }
    }

    console.log(
      `[CRON] Sent ${trades.length} trades to Convex (server de-dupes).`
    );

    return NextResponse.json({
      success: true,
      totalScraped: rows.length,
      sentToInsert: trades.length,
      // inserted/skipped are unknown unless the mutation returns them; see note below.
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
