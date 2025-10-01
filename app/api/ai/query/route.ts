export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";

const pinecone = new Pinecone({
  apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!,
});
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

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

    console.log('[AI Query] Embedding generated:', {
      dimensions: queryEmbedding.length,
      sample: queryEmbedding.slice(0, 3)
    });

    // Get index and check stats
    const index = pinecone.index(process.env.NEXT_PUBLIC_PINECONE_INDEX!);
    
    // Optional: Check index stats for debugging
    try {
      const stats = await index.describeIndexStats();
      console.log('[AI Query] Index stats:', {
        totalVectors: stats.totalRecordCount,
        namespaceVectors: stats.namespaces?.['29-09-2025']?.recordCount || 0
      });
    } catch (statsError) {
      console.warn('[AI Query] Could not fetch index stats:', statsError);
    }

    // Search Pinecone with namespace
    const searchParams = {
      vector: queryEmbedding,
      topK: date ? 1 : 5,
      includeMetadata: true,
    };

    const searchResults = await index.namespace("29-09-2025").query(searchParams);

    console.log('[AI Query] Search results:', {
      matchCount: searchResults.matches?.length || 0,
      scores: searchResults.matches?.map(m => m.score) || [],
      hasMetadata: searchResults.matches?.some(m => m.metadata) || false
    });

    // Check if we have any matches at all (even with low scores)
    if (!searchResults.matches || searchResults.matches.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No relevant data found in the database. Please ensure data has been uploaded to the '29-09-2025' namespace.",
          debug: {
            query,
            embeddingLength: queryEmbedding.length,
            namespace: "29-09-2025"
          }
        },
        { status: 404 }
      );
    }

    // Filter matches with metadata
    const validMatches = searchResults.matches.filter(
      match => match.metadata
    );

    if (validMatches.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Found matches but they lack metadata. Please check your data upload process.",
          debug: {
            totalMatches: searchResults.matches.length,
            matchesWithMetadata: validMatches.length
          }
        },
        { status: 404 }
      );
    }

    // Prepare context from search results - reconstruct summary from metadata
    const context = validMatches
      .map((match) => {
        const m = match.metadata!;
        // If summary exists, use it; otherwise reconstruct from fields
        if (m.summary) {
          return m.summary;
        }
        // Reconstruct summary from available fields
        return `
Transaction Type: ${m.transactionType || 'Unknown'}
Person: ${m.personName || 'Unknown'}
Category: ${m.category || 'Unknown'}
Company: ${m.companyName || 'Unknown Company'} (${m.exchange || 'Unknown Exchange'})
Scrip Code: ${m.scripCode || 'N/A'}
Security Type: ${m.securityType || 'Unknown'}
Number of Securities: ${m.numberOfSecurities || 0}
Buy Value: ${m.buyValue || 0}
Sell Value: ${m.sellValue || 0}
Value Per Security: ${m.valuePerSecurity || 0}
        `.trim();
      })
      .join("\n\n---\n\n");

    // Generate AI response using Gemini
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.0-flash-exp",
    });

    const prompt = `You are a financial analyst assistant. Answer the user's question directly and concisely using the provided insider trading data.

Trading Data:
${context}

User Question: ${query}

Instructions:
- Answer the question directly without unnecessary preamble
- Use numbered lists for rankings/top items
- Use bullet points for details under each item
- Format: **Bold** for names and companies
- Include: Person name, company, number of shares, transaction value
- If values are zero, briefly note: "(stock grant/option)"
- Keep response under 200 words
- No lengthy analysis unless specifically asked

Response:`;

    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    return NextResponse.json({
      success: true,
      response: aiResponse,
      sources: validMatches.map((match) => ({
        date: match.metadata!.date,
        recordCount: match.metadata!.recordCount,
        score: match.score,
      })),
    });
  } catch (error) {
    console.error("[AI Query] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}