export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

import { CorporateActionRow } from "@/constants/company";
import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function GET(req: NextRequest) {
  let browser = null;
  
  try {
    console.log("[BSE Corporate Actions Scraper] Starting...");

    const url = "https://www.bseindia.com/corporates/corporates_act.html";
    
    // Launch Puppeteer browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    console.log("[BSE Corporate Actions] Navigating to:", url);
    
    // Navigate to the page and wait for the table to load
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });

    // Wait for the Angular table to be populated
    await page.waitForSelector('table.mGrid tbody tr.TTRow', { timeout: 30000 });

    console.log("[BSE Corporate Actions] Page loaded, extracting data...");

    // Extract data from the table
    const rows: CorporateActionRow[] = await page.evaluate(() => {
      const results:CorporateActionRow[] = [];
      const tableRows = document.querySelectorAll('table.mGrid tbody tr.TTRow');
      
      tableRows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        
        if (cells.length >= 10) {
          // Extract scrip code from link
          const scripCodeLink = cells[0].querySelector('a');
          let scripCode = null;
          if (scripCodeLink) {
            const href = scripCodeLink.getAttribute('href') || '';
            const match = href.match(/scrip_cd=(\d+)/);
            scripCode = match ? match[1] : scripCodeLink.textContent?.trim();
          }
          if (!scripCode) {
            scripCode = cells[0].textContent?.trim() || null;
          }

          const companyName = cells[1].textContent?.trim() || null;
          const field2 = cells[2].textContent?.trim() || null;
          const purpose = cells[3].textContent?.trim() || null;
          const exDate = cells[4].textContent?.trim() || null;
          const recordDate = cells[5].textContent?.trim() || null;
          const bcStartDate = cells[6].textContent?.trim() || null;
          const bcEndDate = cells[7].textContent?.trim() || null;
          const ndStartDate = cells[8].textContent?.trim() || null;
          const ndEndDate = cells[9].textContent?.trim() || null;

          results.push({
            scripCode,
            companyName,
            field2,
            purpose,
            exDateText: exDate,
            recordDate,
            bcStartDate,
            bcEndDate,
            ndStartDate,
            ndEndDate,
            exDate,
          });
        }
      });
      
      return results;
    });

    // Parse dates
    const processedRows = rows.map(row => {
      let parsedExDate = null;
      if (row.exDateText && row.exDateText.trim() !== '') {
        try {
          // Try parsing different date formats
          const dateStr = row.exDateText;
          // Handle formats like "03 Nov 2025" or "03/11/2025"
          parsedExDate = new Date(dateStr).toISOString();
        } catch (e) {
          console.warn(`Failed to parse ex-date: ${row.exDateText}`);
        }
      }

      return {
        ...row,
        exDate: parsedExDate,
      };
    });

    console.log(`[BSE Corporate Actions Scraper] Scraped ${processedRows.length} rows`);

    await browser.close();

    return NextResponse.json({
      success: true,
      rows: processedRows,
      count: processedRows.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[BSE Corporate Actions Scraper] Error:", error);
    
    if (browser) {
      await browser.close();
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}