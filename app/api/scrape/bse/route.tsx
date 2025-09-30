export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

import { NextRequest, NextResponse } from "next/server";
import { chromium, devices, request as pwRequest } from "playwright";
import * as cheerio from "cheerio";
import { CompanyRow } from "@/constants/company";

const BSE_BASE = "https://www.bseindia.com";
const LIST_URL = "https://www.bseindia.com/corporates/Insider_Trading_new.aspx?expandable=2";

function parseBseDate(s?: string | null) {
  if (!s) return null;
  const trimmed = s.trim();
  // Handle date ranges like "26/09/2025 26/09/2025" - take first date
  const firstDate = trimmed.split(" ")[0];
  if (!firstDate) return null;
  
  const [d, m, y] = firstDate.split("/");
  if (!d || !m || !y) return trimmed;
  
  const dt = new Date(+y, +m - 1, +d, 0, 0, 0);
  return isNaN(dt.getTime()) ? trimmed : dt.toISOString();
}

function parseFloatSafe(s?: string | null) {
  if (s == null) return null;
  const n = Number(String(s).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

function parseIntSafe(s?: string | null) {
  if (s == null) return null;
  const n = Number(String(s).replace(/,/g, "").trim());
  return Number.isFinite(n) ? Math.floor(n) : null;
}

function extractPercentage(s?: string | null) {
  if (!s) return null;
  const match = s.match(/\(([\d.]+)\)/);
  return match ? parseFloatSafe(match[1]) : null;
}

function parseRowsFromHtml(html: string): CompanyRow[] {
  const $ = cheerio.load(html);
  const out: CompanyRow[] = [];
  const $rows = $("#ContentPlaceHolder1_gvData tbody tr.TTRow");
  
  if ($rows.length === 0) return out;

  $rows.each((_i, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 15) return;

    const scripCode = $(tds[0]).text().trim() || null;
    const companyName = $(tds[1]).text().trim() || null;
    const personName = $(tds[2]).text().trim() || null;
    const category = $(tds[3]).text().trim() || null;
    
    // Pre-transaction holdings
    const preText = $(tds[4]).text().trim();
    const preMatch = preText.match(/([\d,]+)\s*\(([\d.]+)\)/);
    const securitiesHeldPreTransaction = preMatch ? parseIntSafe(preMatch[1]) : parseIntSafe(preText);
    const securitiesHeldPrePercentage = preMatch ? parseFloatSafe(preMatch[2]) : extractPercentage(preText);
    
    const securityType = $(tds[5]).text().trim() || null;
    const numberOfSecurities = parseIntSafe($(tds[6]).text().trim());
    const valuePerSecurity = parseFloatSafe($(tds[7]).text().trim());
    const transactionType = $(tds[8]).text().trim() || null;
    
    // Post-transaction holdings
    const postText = $(tds[9]).text().trim();
    const postMatch = postText.match(/([\d,]+)\s*\(([\d.]+)\)/);
    const securitiesHeldPostTransaction = postMatch ? parseIntSafe(postMatch[1]) : parseIntSafe(postText);
    const securitiesHeldPostPercentage = postMatch ? parseFloatSafe(postMatch[2]) : extractPercentage(postText);
    
    const dateOfAllotmentOrTransactionText = $(tds[10]).text().trim() || null;
    const dateOfAllotmentOrTransaction = parseBseDate(dateOfAllotmentOrTransactionText);
    
    const modeOfAcquisition = $(tds[11]).text().trim() || null;
    const derivativeType = $(tds[12]).text().trim() || null;
    const buyValueUnits = $(tds[13]).text().trim() || null;
    const sellValueUnits = $(tds[14]).text().trim() || null;
    
    const dateOfIntimationText = $(tds[15])?.text().trim() || null;
    const dateOfIntimation = parseBseDate(dateOfIntimationText);

    out.push({
      scripCode,
      companyName,
      personName,
      category,
      securitiesHeldPreTransaction,
      securitiesHeldPrePercentage,
      securityType,
      numberOfSecurities,
      valuePerSecurity,
      transactionType,
      securitiesHeldPostTransaction,
      securitiesHeldPostPercentage,
      dateOfAllotmentOrTransaction,
      dateOfAllotmentOrTransactionText,
      modeOfAcquisition,
      derivativeType,
      buyValueUnits,
      sellValueUnits,
      dateOfIntimation,
      dateOfIntimationText,
    });
  });

  return out;
}

async function scrapeViaPage(targetUrl: string) {
  const browser = await chromium.launch({
    headless: true,
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
    const headers = { ...route.request().headers(), referer: BSE_BASE };
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
      const hasRows = await page.$("#ContentPlaceHolder1_gvData tbody tr.TTRow");
      if (hasRows) {
        foundTable = true;
        console.log(`[DEBUG] Table found after ${Date.now() - start}ms`);
        break;
      }
      await page.waitForTimeout(1000);
    }

    if (!foundTable) {
      console.log("[DEBUG] Table not found, taking screenshot...");
      await page.screenshot({ path: "/tmp/bse-debug.png", fullPage: true }).catch(() => {});
      const html = await page.content();
      console.log("[DEBUG] Page HTML length:", html.length);
    }

    await page.waitForSelector("#ContentPlaceHolder1_gvData", { timeout: 5000 }).catch(() => {});

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
      Referer: BSE_BASE,
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
  const scripCode = searchParams.get("scripCode") || undefined;
  
  // BSE uses different query params for filtering
  const url = scripCode
    ? `${LIST_URL}&scripcode=${encodeURIComponent(scripCode)}`
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