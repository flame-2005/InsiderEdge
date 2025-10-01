export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { BulkDealRow } from "@/constants/company";

export async function GET(req: NextRequest) {
  try {
    console.log("[BSE Bulk Deals Scraper] Starting...");

    const url = "https://www.bseindia.com/markets/equity/EQReports/bulk_deals.aspx";
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const rows:BulkDealRow[] = [];

    // Find the table and iterate through rows
    $("#ContentPlaceHolder1_gvbulk_deals tbody tr.tdcolumn").each((i, elem) => {
      const $row = $(elem);
      const cells = $row.find("td");

      if (cells.length >= 7) {
        const dateText = $(cells[0]).text().trim();
        const scripCode = $(cells[1]).text().trim();
        const companyName = $(cells[2]).text().trim();
        const clientName = $(cells[3]).text().trim();
        const dealType = $(cells[4]).text().trim(); // B = Buy, S = Sell
        const quantityText = $(cells[5]).text().trim().replace(/,/g, "");
        const priceText = $(cells[6]).text().trim().replace(/,/g, "");

        // Parse date (DD/MM/YYYY format)
        let parsedDate = null;
        try {
          const [day, month, year] = dateText.split("/");
          parsedDate = new Date(`${year}-${month}-${day}`);
        } catch (e) {
          console.warn(`Failed to parse date: ${dateText}`);
        }

        const quantity = parseInt(quantityText, 10) || 0;
        const price = parseFloat(priceText) || 0;

        rows.push({
          date: parsedDate ? parsedDate.toISOString() : null,
          dateText: dateText,
          scripCode: scripCode,
          companyName: companyName,
          clientName: clientName,
          dealType: (dealType == 'S' ? "S" :"B" ), 
          quantity: quantity,
          price: price,
          totalValue: quantity * price,
        });
      }
    });

    console.log(`[BSE Bulk Deals Scraper] Scraped ${rows.length} rows`);

    return NextResponse.json({
      success: true,
      rows,
      count: rows.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[BSE Bulk Deals Scraper] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}