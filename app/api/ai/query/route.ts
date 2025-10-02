// ============================================
// API Route: app/api/ai/query/route.ts
// ============================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

import { NextRequest, NextResponse } from "next/server";
import { Index, Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";

const pinecone = new Pinecone({
  apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!,
});
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

async function findBestNamespace(
  index: Index,
  targetDate?: string
): Promise<string | null> {
  // If date is provided, check if that specific namespace has data
  if (targetDate) {
    const namespace = targetDate.replace(/\//g, "-");

    // Get stats for the entire index first to see if namespace exists
    try {
      const indexStats = await index.describeIndexStats();
      const namespaceStats = indexStats.namespaces?.[namespace];

      if (
        namespaceStats &&
        namespaceStats.recordCount &&
        namespaceStats.recordCount > 0
      ) {
        console.log(
          `[AI Query] Using provided namespace: ${namespace} with ${namespaceStats.recordCount} records`
        );
        return namespace;
      }

      console.warn(
        `[AI Query] Provided namespace ${namespace} not found or empty, falling back to recent dates`
      );
    } catch (e) {
      console.warn(`[AI Query] Error checking namespace ${namespace}:`, e);
    }
    // Fall through to check recent dates
  }

  // Try current date and fall back to previous days
  const today = new Date();

  // Get all namespace stats once
  let indexStats;
  try {
    indexStats = await index.describeIndexStats();
  } catch (e) {
    console.error("[AI Query] Failed to get index stats:", e);
    return null;
  }

  for (let daysBack = 0; daysBack <= 7; daysBack++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - daysBack);

    const day = String(checkDate.getDate()).padStart(2, "0");
    const month = String(checkDate.getMonth() + 1).padStart(2, "0");
    const year = checkDate.getFullYear();
    const namespace = `${day}-${month}-${year}`;

    // Check if this namespace exists in the stats
    const namespaceStats = indexStats.namespaces?.[namespace];

    if (
      namespaceStats &&
      namespaceStats.recordCount &&
      namespaceStats.recordCount > 0
    ) {
      console.log(
        `[AI Query] Found data in namespace: ${namespace} with ${namespaceStats.recordCount} records (${daysBack} days back)`
      );
      return namespace;
    }
  }

  console.warn("[AI Query] No namespace with data found in last 7 days");
  console.warn(
    "[AI Query] Available namespaces:",
    Object.keys(indexStats.namespaces || {})
  );
  return null;
}
export async function POST(req: NextRequest) {
  try {
    const { query, date } = await req.json();

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: "Query is required",
        },
        { status: 400 }
      );
    }

    console.log(`[AI Query] Processing query: ${query}`);

    // Generate embedding for the query
    const embeddingModel = genAI.getGenerativeModel({
      model: "gemini-embedding-001",
    });
    const embeddingResult = await embeddingModel.embedContent(query);
    const queryEmbedding = embeddingResult.embedding.values;

    console.log("[AI Query] Embedding generated:", {
      dimensions: queryEmbedding.length,
      sample: queryEmbedding.slice(0, 3),
    });

    // Get index and check stats
    const index = pinecone.Index(process.env.NEXT_PUBLIC_PINECONE_INDEX!);

    // Check index stats for debugging
    try {
      const stats = await index.describeIndexStats();
      console.log("[AI Query] Index stats:", {
        totalVectors: stats.totalRecordCount,
        namespaces: Object.keys(stats.namespaces || {}).slice(0, 5),
      });
    } catch (statsError) {
      console.warn("[AI Query] Could not fetch index stats:", statsError);
    }

    // Find the best namespace to query
    const namespace = await findBestNamespace(index, date);

    if (!namespace) {
      return NextResponse.json(
        {
          success: false,
          error: "No data found in any recent namespace (checked last 7 days)",
        },
        { status: 404 }
      );
    }

    console.log(`[AI Query] Using namespace: ${namespace}`);

    // Search Pinecone with the found namespace
    const searchParams = {
      vector: queryEmbedding,
      topK: 10,
      includeMetadata: true,
    };

    const searchResults = await index.namespace(namespace).query(searchParams);

    console.log("[AI Query] Search results:", {
      namespace: namespace,
      matchCount: searchResults.matches?.length || 0,
      scores: searchResults.matches?.map((m) => m.score) || [],
      hasMetadata: searchResults.matches?.some((m) => m.metadata) || false,
    });

    // Check if we have any matches at all
    if (!searchResults.matches || searchResults.matches.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No relevant data found in namespace '${namespace}'. The database may be empty or the query doesn't match any records.`,
          debug: {
            query,
            embeddingLength: queryEmbedding.length,
            namespace: namespace,
          },
        },
        { status: 404 }
      );
    }

    // Filter matches with metadata
    const validMatches = searchResults.matches.filter(
      (match) => match.metadata
    );

    if (validMatches.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Found matches but they lack metadata. Please check your data upload process.",
          debug: {
            totalMatches: searchResults.matches.length,
            matchesWithMetadata: validMatches.length,
          },
        },
        { status: 404 }
      );
    }

    // Prepare context from search results
    const context = validMatches
      .map((match, idx) => {
        const m = match.metadata!;
        // If summary exists in metadata, use it
        if (m.summary) {
          return `Transaction ${idx + 1}:\n${m.summary}`;
        }
        // Otherwise reconstruct from available fields
        return `Transaction ${idx + 1}:
Transaction Type: ${m.transactionType || "Unknown"}
Person: ${m.personName || "Unknown"}
Category: ${m.category || "Unknown"}
Company: ${m.companyName || "Unknown Company"} (${m.exchange || "Unknown Exchange"})
Scrip Code: ${m.scripCode || "N/A"}
Security Type: ${m.securityType || "Unknown"}
Number of Securities: ${m.numberOfSecurities || 0}
Buy Value: ${m.buyValue || 0}
Sell Value: ${m.sellValue || 0}
Value Per Security: ${m.valuePerSecurity || 0}`;
      })
      .join("\n\n---\n\n");

    // Generate AI response using Gemini
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    const prompt = `You are a financial analyst assistant specializing in insider trading analysis. Answer the user's question directly and concisely using the provided data.

Trading Data (Date: ${namespace.replace(/-/g, "/")}):
${context}

User Question: ${query}

Instructions:
- Answer the question directly without unnecessary preamble
- Use numbered lists for rankings/top items
- Use bullet points for details under each item
- Format: Bold for names and companies
- Include: Person name, company, number of shares, transaction value
- If values are zero, note: "(stock grant/option/non-cash)"
- Keep response under 250 words unless user asks for detailed analysis
- Focus on the most relevant transactions for the query

Response:`;

    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    return NextResponse.json({
      success: true,
      response: aiResponse,
      namespace: namespace,
      sources: validMatches.map((match) => ({
        date: match.metadata!.date,
        company: match.metadata!.companyName,
        person: match.metadata!.personName,
        type: match.metadata!.transactionType,
        score: match.score,
      })),
    });
  } catch (error) {
    console.error("[AI Query] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
