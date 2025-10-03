import { NextResponse } from "next/server";

export async function POST() {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Call the cron endpoint with the secret from server-side env
    const res = await fetch(`${baseUrl}/api/cron/bse-scraper`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[TRIGGER_CRON] Error:", errorText);
      return NextResponse.json(
        { error: `Cron failed: ${res.status} - ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[TRIGGER_CRON] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}