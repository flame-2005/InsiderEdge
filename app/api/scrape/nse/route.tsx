export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

import { NextRequest, NextResponse } from "next/server";
import { chromium, firefox, devices, request as pwRequest, Page } from "playwright";
import * as cheerio from "cheerio";

const NSE_BASE = "https://www.nseindia.com";
const LIST_URL =
  "https://www.nseindia.com/companies-listing/corporate-filings-insider-trading";

function parseNseDate(s?: string | null) {
  if (!s) return null;
  const [d, mon, yAndTime] = s.split("-");
  if (!d || !mon || !yAndTime) return s;
  const [yyyy, time] = yAndTime.split(" ");
  const months: Record<string, number> = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  const m = months[mon]; if (m === undefined) return s;
  const [hh = "00", mm = "00"] = (time || "").split(":");
  const dt = new Date(+yyyy, m, +d, +hh, +mm, 0);
  return isNaN(dt.getTime()) ? s : dt.toISOString();
}

function parseIntSafe(s?: string | null) {
  if (s == null) return null;
  const n = Number(String(s).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

function toAbsolute(href?: string | null) {
  if (!href) return null;
  if (/^https?:\/\//i.test(href)) return href;
  return NSE_BASE + href;
}

type Row = {
  symbol: string | null;
  companyName: string | null;
  acquirerOrDisposer: string | null;
  regulation: string | null;
  securityType: string | null;
  quantity: number | null;
  transactionType: string | null;
  disclosedAtText: string | null;
  disclosedAt: string | null;
  xbrlLink: string | null;
};

function parseRowsFromHtml(html: string): Row[] {
  const $ = cheerio.load(html);
  const out: Row[] = [];
  const $rows = $("#CFinsidertradingTable tbody tr");
  if ($rows.length === 0) return out;

  $rows.each((_i, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 9) return;

    const symbol =
      $(tds[0]).find("a").text().trim() || $(tds[0]).text().trim() || null;
    const companyName = $(tds[1]).text().trim() || null;
    const acquirerOrDisposer = $(tds[2]).text().trim() || null;
    const regulation = $(tds[3]).text().trim() || null;
    const securityType = $(tds[4]).text().trim() || null;
    const quantity = parseIntSafe($(tds[5]).text().trim());
    const transactionType = $(tds[6]).text().trim() || null;
    const disclosedAtText = $(tds[7]).text().trim() || null;
    const disclosedAt = parseNseDate(disclosedAtText);

    const a = $(tds[8]).find("a").attr("href") || null;
    const xbrlLink = toAbsolute(a || undefined);

    out.push({
      symbol,
      companyName,
      acquirerOrDisposer,
      regulation,
      securityType,
      quantity,
      transactionType,
      disclosedAtText,
      disclosedAt,
      xbrlLink,
    });
  });

  return out;
}

async function scrapeViaPage(targetUrl: string) {
  const browser = await chromium.launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
  });

  const context = await browser.newContext({
    ...devices["Desktop Chrome"],
    ignoreHTTPSErrors: true,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 900 },
    locale: "en-US",
    timezoneId: "Asia/Kolkata",
  });

  await context.setExtraHTTPHeaders({
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "Upgrade-Insecure-Requests": "1",
  });

  const page = await context.newPage();

  // Hide webdriver automation signals
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    (window as Window & { navigator: Navigator & { chrome?: unknown } }).navigator.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  });

  await page.route("**/*", (route) => {
    const type = route.request().resourceType();
    if (["image", "font", "stylesheet", "media"].includes(type)) {
      return route.abort();
    }
    const headers = { ...route.request().headers(), referer: NSE_BASE };
    return route.continue({ headers });
  });

  page.setDefaultNavigationTimeout(120000);

  try {
    console.log(`[DEBUG] Navigating to: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 90000 });
    
    console.log("[DEBUG] Waiting for table to appear...");
    const start = Date.now();
    let foundTable = false;
    while (Date.now() - start < 45000) {
      const hasRows = await page.$("#CFinsidertradingTable tbody tr");
      if (hasRows) {
        foundTable = true;
        console.log(`[DEBUG] Table found after ${Date.now() - start}ms`);
        break;
      }
      await page.waitForTimeout(1000);
    }

    if (!foundTable) {
      console.log("[DEBUG] Table not found, taking screenshot...");
      // Take screenshot for debugging (save to /tmp in serverless)
      await page.screenshot({ path: "/tmp/nse-debug.png", fullPage: true }).catch(() => {});
      const html = await page.content();
      console.log("[DEBUG] Page HTML length:", html.length);
    }

    await page.waitForSelector("#CFinsidertradingTable", { timeout: 5000 }).catch(() => {});

    const html = await page.content();
    const rows = parseRowsFromHtml(html);
    console.log(`[DEBUG] Parsed ${rows.length} rows`);

    await browser.close();
    return rows;
  } catch (e) {
    try { await browser.close(); } catch {}
    throw e;
  }
}

async function scrapeViaHtmlRequest(targetUrl: string) {
  const req = await pwRequest.newContext({
    extraHTTPHeaders: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      "Upgrade-Insecure-Requests": "1",
      Referer: NSE_BASE,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
    ignoreHTTPSErrors: true,
  });

  const res = await req.get(targetUrl, { timeout: 90000 });
  if (!res.ok()) {
    throw new Error(`Fallback HTML request failed: ${res.status()} ${res.statusText()}`);
  }
  const html = await res.text();
  await req.dispose();

  return parseRowsFromHtml(html);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || undefined;
  const url = symbol
    ? `${LIST_URL}?symbol=${encodeURIComponent(symbol)}&tabIndex=equity`
    : LIST_URL;

  try {
    const rows = await scrapeViaPage(url);
    if (rows.length > 0) return NextResponse.json({ count: rows.length, rows });
    const fallbackRows = await scrapeViaHtmlRequest(url);
    return NextResponse.json({ count: fallbackRows.length, rows: fallbackRows, via: "fallback" });
  } catch (errPage: unknown) {
    try {
      const rows = await scrapeViaHtmlRequest(url);
      return NextResponse.json({ count: rows.length, rows, via: "fallback" });
    } catch (errHtml: unknown) {
      const msg1 = errPage instanceof Error ? errPage.message : String(errPage);
      const msg2 = errHtml instanceof Error ? errHtml.message : String(errHtml);
      return NextResponse.json(
        { error: `Page scrape failed: ${msg1} | Fallback failed: ${msg2}` },
        { status: 500 }
      );
    }
  }
}