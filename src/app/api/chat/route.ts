import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { IncidentAnalysisData } from "@/types/incident";

interface ChatRequestBody {
  question: string;
  rawText: string;
  analysisContext: IncidentAnalysisData;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestBody = await req.json();
    const { question, rawText, analysisContext, history } = body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "question string is required." },
        { status: 400 }
      );
    }

    // Authenticate strictly via process.env.GEMINI_API_KEY (accept any non-empty key format including AQ.)
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is missing in .env.local. Please restart the Next.js server after saving .env.local.",
        },
        { status: 500 }
      );
    }

    // Initialize official @google/genai SDK
    const ai = new GoogleGenAI({ apiKey });

    const recentHistory = (history || [])
      .slice(-4)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const prompt = `
You are the "War-Room AI Copilot" inside "IncidentPulse AI", assisting SREs, Incident Commanders, and Engineering Directors during an active production outage.

STRICT GROUNDING DIRECTIVES:
1. Ground every claim directly in the provided Raw Logs, Customer Escalations, and Active Analysis Summary below.
2. In EVERY response, cite exact references where evidence was found, such as [LOG 16:48:15.190Z], [FILE src/services/payments/redisPool.ts:142], or [EMAIL Marcus Vance].
3. If an answer cannot be deduced from the provided context, state clearly: "Not found in ingested logs or customer escalation." Do not fabricate server metrics.
4. Keep responses crisp, technical, structured, and actionable for SRE war-rooms.

================ ACTIVE INCIDENT TRIAGE SUMMARY ================
Incident ID: ${analysisContext?.id || "N/A"}
Severity: ${analysisContext?.severity || "N/A"}
Affected Microservice: ${analysisContext?.routing?.microservice || "N/A"}
Failing Code: ${analysisContext?.routing?.failingFile}:${analysisContext?.routing?.failingLine}
Error Signature: ${analysisContext?.routing?.errorSignature || "N/A"}
Assigned Squad: ${analysisContext?.routing?.assignedDepartment} (${analysisContext?.routing?.onCallHandle})
VIP Clients: ${analysisContext?.vipClients?.map((c) => `${c.name} (${c.arr}, ${c.tier})`).join("; ") || "N/A"}
SLA Minutes Remaining: ${analysisContext?.slaMinutesRemaining ?? "N/A"}
Customer Sentiment: ${analysisContext?.sentimentScore}/100 (${analysisContext?.sentimentLabel})

================ INGESTED RAW SERVER LOGS & CUSTOMER EMAILS ================
${rawText || "[No raw text provided]"}

================ RECENT CONVERSATION ================
${recentHistory || "[None]"}

================ SRE COMMANDER QUESTION ================
${question}

Provide a direct, authoritative, grounded answer with bracketed citations:
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1, // Strict factual adherence
      },
    });

    const reply = response.text || "No response generated.";

    // Extract bracketed citations e.g. [LOG ...], [FILE ...], [EMAIL ...]
    const citationMatches = reply.match(/\[(LOG[^\]]+|FILE[^\]]+|EMAIL[^\]]+|TIMESTAMP[^\]]+|SENDER[^\]]+)\]/g) || [];
    const uniqueCitations = Array.from(new Set(citationMatches));

    return NextResponse.json({
      reply,
      citations: uniqueCitations,
      status: "success",
    });
  } catch (err: any) {
    console.error("[Gemini API Error in /api/chat]:", err);
    return NextResponse.json(
      {
        error:
          err.message ||
          "Gemini API chat failed. Please check server logs and GEMINI_API_KEY.",
      },
      { status: 500 }
    );
  }
}
