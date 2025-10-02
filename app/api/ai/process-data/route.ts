export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

interface UnifiedInsiderTradingRecord {
  exchange: string;
  scripCode: string;
  companyName: string;
  personName: string;
  category: string;
  securityType: string;
  numberOfSecurities: number;
  transactionType: string;
  transactionDate: string;
  transactionDateText: string | null;
  securitiesHeldPreTransaction: number | null;
  securitiesHeldPrePercentage: number | null;
  valuePerSecurity: number | null;
  securitiesHeldPostTransaction: number | null;
  securitiesHeldPostPercentage: number | null;
  modeOfAcquisition: string | null;
  derivativeType: string | null;
  buyValueUnits: string | null;
  sellValueUnits: string | null;
  xbrlLink: string | null;
  createdAt: number;
}

type DateKey = string;
type DateGroupedRecords = Map<DateKey, UnifiedInsiderTradingRecord[]>;

type PCMetadata = Record<string, string | number | boolean>;

interface DateVectorMetadata extends PCMetadata {
  date: string;
  recordCount: number;
  exchanges: string;
  companies: string;
  totalBuyValue: number;
  totalSellValue: number;
  summary: string;
}

interface TransactionMetadata extends DateVectorMetadata {
  exchange: string;
  scripCode: string;
  companyName: string;
  personName: string;
  category: string;
  transactionType: string;
  numberOfSecurities: number;
  buyValue: number;
  sellValue: number;
  securityType: string;
  valuePerSecurity: number;
  summary: string;
}

interface PineconeVector {
  id: string;
  values: number[];
  metadata: DateVectorMetadata;
}

interface EmbeddingValues {
  values: number[];
}
interface EmbedContentResponse {
  embedding: EmbeddingValues;
}

type SuccessResponse = {
  success: true;
  processedDates: number;
  totalRecords: number;
  message: string;
};
type ErrorResponse = {
  success: false;
  error: string;
};
type RouteResponse = SuccessResponse | ErrorResponse;


const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const pinecone = new Pinecone({
  apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!,
});
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

function normalizeDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "unknown";
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return "unknown";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return "unknown";
  }
}

// Remove currency symbols, commas, spaces; keep digits, minus, dot, scientific notation
function toNumber(val: string | number | null | undefined): number {
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.\-eE]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function isBuy(type: string | null | undefined): boolean {
  const t = (type ?? "").toLowerCase();
  return t.includes("buy") || t.includes("purchase");
}

export async function POST(
  _req: NextRequest
): Promise<NextResponse<RouteResponse>> {
  try {
    console.log("[AI Processing] Starting data processing...");

    if (!process.env.NEXT_PUBLIC_PINECONE_INDEX) {
      throw new Error(
        "NEXT_PUBLIC_PINECONE_INDEX_NAME environment variable is not set"
      );
    }

    const allData = (await convex.query(
      api.unifiedInsiderTrading.getAll
    )) as UnifiedInsiderTradingRecord[];

    if (!allData || allData.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: "No data found in unified table" },
        { status: 404 }
      );
    }

    const dataByDate: DateGroupedRecords = new Map();

    for (const record of allData) {
      let dateKey: DateKey = record.transactionDateText || "";

      if (!dateKey && record.transactionDate) {
        dateKey = normalizeDate(record.transactionDate);
      }

      if (!dateKey || dateKey === "unknown") {
        dateKey = normalizeDate(record.transactionDate) || "unknown";
      }

      if (!dataByDate.has(dateKey)) {
        dataByDate.set(dateKey, []);
      }
      dataByDate.get(dateKey)!.push(record);
    }

    console.log(
      `[AI Processing] Grouped data into ${dataByDate.size} unique dates`
    );

    const indexName = process.env.NEXT_PUBLIC_PINECONE_INDEX;
    console.log(`[AI Processing] Using Pinecone index: ${indexName}`);
    const index = pinecone.Index(indexName);

    const embeddingModel: GenerativeModel = genAI.getGenerativeModel({
      model: "gemini-embedding-001",
    });

    let totalProcessed = 0;

    for (const [date, records] of dataByDate) {
      if (date === "unknown") {
        console.log(
          `[AI Processing] Skipping unknown date with ${records.length} records`
        );
        continue;
      }

      console.log(
        `[AI Processing] Processing ${records.length} records for date: ${date}`
      );

      const namespace = date.replace(/\//g, "-");
      const vectors: PineconeVector[] = [];
      let recordCount = 0;

      // Create a vector for each individual transaction
      for (const record of records) {
        const transactionText = createTransactionSummary(record);

        try {
          const embeddingResult = (await embeddingModel.embedContent(
            transactionText
          )) as EmbedContentResponse;
          const embedding: number[] = embeddingResult.embedding?.values ?? [];

          if (embedding.length === 0) {
            console.warn(
              `[AI Processing] Empty embedding for transaction, skipping`
            );
            continue;
          }

          const metadata: TransactionMetadata = {
            date: String(date),
            recordCount: recordCount,
            exchanges: record.exchange || "",
            companies: record.companyName || "",
            totalBuyValue: toNumber(record.buyValueUnits),
            totalSellValue: toNumber(record.sellValueUnits),
            exchange: record.exchange || "",
            scripCode: record.scripCode || "",
            companyName: record.companyName || "",
            personName: record.personName || "",
            category: record.category || "",
            transactionType: record.transactionType || "",
            numberOfSecurities: record.numberOfSecurities || 0,
            buyValue: toNumber(record.buyValueUnits),
            sellValue: toNumber(record.sellValueUnits),
            securityType: record.securityType || "",
            valuePerSecurity: record.valuePerSecurity || 0,
            summary: transactionText,
          };

          vectors.push({
            id: `txn-${record.scripCode}-${recordCount}-${Date.now()}`,
            values: embedding,
            metadata: metadata,
          });

          recordCount++;

          if (vectors.length >= 100) {
            console.log(
              `[AI Processing] Upserting batch of ${vectors.length} to namespace: ${namespace}`
            );
            await index.namespace(namespace).upsert(vectors);
            totalProcessed += vectors.length;
            vectors.length = 0;
          }
        } catch (err) {
          console.error(`[AI Processing] Error processing transaction:`, err);
          continue;
        }
      }

      if (vectors.length > 0) {
        console.log(
          `[AI Processing] Upserting final ${vectors.length} vectors to namespace: ${namespace}`
        );
        await index.namespace(namespace).upsert(vectors);
        totalProcessed += vectors.length;
      }

      console.log(
        `[AI Processing] Completed ${recordCount} transactions for date: ${date}`
      );
    }

    console.log(
      `[AI Processing] Successfully processed ${totalProcessed} total transactions across ${dataByDate.size} date namespaces`
    );

    return NextResponse.json<SuccessResponse>({
      success: true,
      processedDates: dataByDate.size,
      totalRecords: totalProcessed,
      message: `Data successfully processed and stored in Pinecone across ${dataByDate.size} date namespaces`,
    });
  } catch (error: unknown) {
    console.error("[AI Processing] Error:", error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Create summary for individual transaction
function createTransactionSummary(record: UnifiedInsiderTradingRecord): string {
  const person = record.personName || "Unknown";
  const company = record.companyName || "Unknown Company";
  const exchange = record.exchange || "Unknown Exchange";
  const transactionType = record.transactionType || "Unknown";
  const shares = record.numberOfSecurities || 0;
  const category = record.category || "Unknown";
  const securityType = record.securityType || "Unknown";

  const isBuyTxn = isBuy(record.transactionType);
  const value = isBuyTxn
    ? toNumber(record.buyValueUnits)
    : toNumber(record.sellValueUnits);

  const preHolding = record.securitiesHeldPreTransaction || 0;
  const postHolding = record.securitiesHeldPostTransaction || 0;
  const prePercent = record.securitiesHeldPrePercentage || 0;
  const postPercent = record.securitiesHeldPostPercentage || 0;

  return `
Transaction Type: ${transactionType}
Person: ${person}
Category: ${category}
Company: ${company} (${exchange})
Scrip Code: ${record.scripCode}
Security Type: ${securityType}
Number of Securities: ${shares}
Transaction Value: ${value}
Holdings Before: ${preHolding} shares (${prePercent}%)
Holdings After: ${postHolding} shares (${postPercent}%)
Mode of Acquisition: ${record.modeOfAcquisition || "N/A"}
  `.trim();
}
