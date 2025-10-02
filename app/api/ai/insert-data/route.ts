export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

import { NextRequest, NextResponse } from "next/server";
import { Pinecone, RecordMetadata } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { type PineconeRecord } from "@pinecone-database/pinecone";

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

type TransactionMetadata = RecordMetadata & {
  date: string;
  recordCount: number;
  exchanges: string;
  companies: string;
  totalBuyValue: number;
  totalSellValue: number;
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
};

interface EmbeddingValues {
  values: number[];
}
interface EmbedContentResponse {
  embedding: EmbeddingValues;
}

type SuccessResponse = {
  success: true;
  inserted: number;
  skipped: number;
  message: string;
};
type ErrorResponse = {
  success: false;
  error: string;
};
type RouteResponse = SuccessResponse | ErrorResponse;

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

export async function POST(
  req: NextRequest
): Promise<NextResponse<RouteResponse>> {
  try {
    console.log("[AI Insert] Starting incremental data insertion...");

    if (!process.env.NEXT_PUBLIC_PINECONE_INDEX) {
      throw new Error(
        "NEXT_PUBLIC_PINECONE_INDEX environment variable is not set"
      );
    }

    const body = await req.json();
    const records = body.records as UnifiedInsiderTradingRecord[];

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: "No records provided or invalid format" },
        { status: 400 }
      );
    }

    console.log(`[AI Insert] Received ${records.length} records to process`);

    const indexName = process.env.NEXT_PUBLIC_PINECONE_INDEX!;
    const index = pinecone.Index<TransactionMetadata>(indexName);

    const embeddingModel: GenerativeModel = genAI.getGenerativeModel({
      model: "gemini-embedding-001",
    });

    let insertedCount = 0;
    let skippedCount = 0;

    const recordsByDate = new Map<string, UnifiedInsiderTradingRecord[]>();

    for (const record of records) {
      let dateKey = record.transactionDateText || "";

      if (!dateKey && record.transactionDate) {
        dateKey = normalizeDate(record.transactionDate);
      }

      if (!dateKey || dateKey === "unknown") {
        dateKey = normalizeDate(record.transactionDate) || "unknown";
      }

      if (!recordsByDate.has(dateKey)) {
        recordsByDate.set(dateKey, []);
      }
      recordsByDate.get(dateKey)!.push(record);
    }

    for (const [date, dateRecords] of recordsByDate) {
      if (date === "unknown") {
        console.log(
          `[AI Insert] Skipping ${dateRecords.length} records with unknown date`
        );
        skippedCount += dateRecords.length;
        continue;
      }

      const namespace = date.replace(/\//g, "-");
      const vectors: PineconeRecord<TransactionMetadata>[] = [];

      console.log(
        `[AI Insert] Processing ${dateRecords.length} records for date: ${date}`
      );

      for (const record of dateRecords) {
        try {
          // Create transaction summary
          const transactionText = createTransactionSummary(record);

          // Generate embedding
          const embeddingResult = (await embeddingModel.embedContent(
            transactionText
          )) as EmbedContentResponse;
          const embedding: number[] = embeddingResult.embedding?.values ?? [];

          if (embedding.length === 0) {
            console.warn(`[AI Insert] Empty embedding, skipping transaction`);
            skippedCount++;
            continue;
          }

          const metadata: TransactionMetadata = {
            date: String(date),
            recordCount: insertedCount,
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

          const vectorId = `txn-${record.scripCode}-${record.createdAt || Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          vectors.push({
            id: vectorId,
            values: embedding,
            metadata: metadata,
          });

          insertedCount++;

          if (vectors.length >= 100) {
            console.log(
              `[AI Insert] Upserting batch of ${vectors.length} to namespace: ${namespace}`
            );
            await index.namespace(namespace).upsert(vectors);
            vectors.length = 0;
          }
        } catch (err) {
          console.error(`[AI Insert] Error processing record:`, err);
          skippedCount++;
          continue;
        }
      }

      if (vectors.length > 0) {
        console.log(
          `[AI Insert] Upserting final ${vectors.length} vectors to namespace: ${namespace}`
        );
        await index.namespace(namespace).upsert(vectors);
      }
    }

    console.log(
      `[AI Insert] Completed: ${insertedCount} inserted, ${skippedCount} skipped`
    );

    return NextResponse.json<SuccessResponse>({
      success: true,
      inserted: insertedCount,
      skipped: skippedCount,
      message: `Successfully inserted ${insertedCount} records into Pinecone`,
    });
  } catch (error: unknown) {
    console.error("[AI Insert] Error:", error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
