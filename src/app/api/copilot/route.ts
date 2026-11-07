import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { IncidentTriageData } from "@/types/incident";

export const maxDuration = 45;

const FLASH_MODELS_PRIORITY = [
  "gemini-3.8-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

interface CopilotRequestBody {
  question: string;
  logs?: string;
  email?: string;
  rawText?: string;
  incidentData?: IncidentTriageData;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export async function POST(req: NextRequest) {
  let question = "";
  let rawText = "";
  let incidentData: IncidentTriageData | undefined;
  let history: Array<{ role: "user" | "assistant"; content: string }> = [];

  try {
    const body: CopilotRequestBody = await req.json();
    question = body.question || "";
    rawText = body.rawText || `${body.logs || ""}\n${body.email || ""}`;
    incidentData = body.incidentData;
    history = body.history || [];

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "question string is required in request body." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      const missingKeyMsg = "GEMINI_API_KEY is missing in .env.local.";
      console.warn(`[IncidentPulse Copilot API]: ${missingKeyMsg}`);
      const fallbackReply = generateDeterministicCopilotAnswer(question, incidentData);
      return NextResponse.json({
        answer: fallbackReply.answer,
        citations: fallbackReply.citations,
        _meta: { source: "fallback", error: missingKeyMsg },
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const recentHistory = history
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
Incident ID: ${incidentData?.id || "N/A"}
Severity: ${incidentData?.severity || "N/A"}
Affected Microservice: ${incidentData?.routing?.microservice || "N/A"}
Failing Code: ${incidentData?.routing?.failingFile}:${incidentData?.routing?.failingLine}
Error Signature: ${incidentData?.routing?.errorSignature || "N/A"}
Assigned Squad: ${incidentData?.routing?.assignedDepartment || incidentData?.routing?.assignedSquad} (${incidentData?.routing?.onCallHandle})
VIP Client: ${incidentData?.vipClient?.name} (${incidentData?.vipClient?.arr}, ${incidentData?.vipClient?.tier})
SLA Minutes Remaining: ${incidentData?.slaMinutesRemaining ?? "N/A"}
Customer Sentiment: ${incidentData?.sentimentScore}/100 (${incidentData?.sentimentLabel})

================ INGESTED RAW SERVER LOGS & CUSTOMER EMAILS ================
${rawText || "[No raw text provided]"}

================ RECENT CONVERSATION ================
${recentHistory || "[None]"}

================ SRE COMMANDER QUESTION ================
${question}

Provide a direct, authoritative, grounded answer with bracketed citations:
`;

    let response: any = null;
    let modelUsed = "";
    let lastError: any = null;

    for (const model of FLASH_MODELS_PRIORITY) {
      try {
        console.log(`[IncidentPulse Copilot API]: Attempting generation with model: ${model}...`);
        response = await ai.models.generateContent({
          model: model,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: 0.1, // Strict factual adherence
          },
        });

        if (response) {
          modelUsed = model;
          console.log(`[IncidentPulse Copilot API]: Successfully generated reply with model: ${model}`);
          break;
        }
      } catch (modelErr: any) {
        lastError = modelErr;
        const status = modelErr?.status || modelErr?.statusCode || "UNKNOWN";
        const msg = modelErr?.message || String(modelErr);
        console.warn(`[IncidentPulse Copilot API]: Model ${model} failed (Status ${status}): ${msg}. Trying next model in priority chain...`);
      }
    }

    if (!response || !modelUsed) {
      throw lastError || new Error("All Flash models in fallback chain failed.");
    }

    const rawOutput =
      typeof response.text === "function" ? (response as any).text() : response.text;

    const answer = rawOutput || "No response generated by model.";

    // Extract bracketed citations e.g. [LOG ...], [FILE ...], [EMAIL ...]
    const citationMatches = answer.match(/\[(LOG[^\]]+|FILE[^\]]+|EMAIL[^\]]+|TIMESTAMP[^\]]+|SENDER[^\]]+)\]/g) || [];
    const uniqueCitations = Array.from(new Set(citationMatches));

    return NextResponse.json({
      answer,
      citations: uniqueCitations,
      _meta: { source: "live-gemini", modelUsed },
    });
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error("[IncidentPulse Gemini Error in /api/copilot]:", err);

    const fallbackReply = generateDeterministicCopilotAnswer(question, incidentData);

    return NextResponse.json({
      answer: fallbackReply.answer,
      citations: fallbackReply.citations,
      _meta: {
        source: "fallback",
        error: errorMsg,
        statusCode: err?.status || 500,
      },
    });
  }
}

function generateDeterministicCopilotAnswer(
  question: string,
  incidentData?: IncidentTriageData
): { answer: string; citations: string[] } {
  const q = question.toLowerCase();
  const citations: string[] = [];

  const failingFile = incidentData?.routing?.failingFile || "src/services/payments/redisPool.ts";
  const failingLine = incidentData?.routing?.failingLine || 142;
  const microservice = incidentData?.routing?.microservice || "payment-gateway-v2";
  const clientName = incidentData?.vipClient?.name || "Apex Global Fintech Corp";
  const arr = incidentData?.vipClient?.arr || "$2.4M ARR";
  const assignedSquad = incidentData?.routing?.assignedDepartment || "Payments-Core Squad";
  const onCall = incidentData?.routing?.onCallHandle || "@arjun-sre";

  if (q.includes("which service") || q.includes("services are down") || q.includes("what is down") || q.includes("affected")) {
    citations.push(`LOG ${microservice}`, `EMAIL Impact`);
    return {
      answer: `The primary degrading service is **\`${microservice}\`**, which triggered cascading timeouts across upstream ingress controllers and downstream ledger synchronizers.\n\nKey evidence:\n- [LOG ${microservice}]: Circuit breaker OPEN and HTTP 504 spike detected (342 req/sec failing).\n- Secondary affected components: \`ingress-controller\`, \`stripe-orchestrator\`, and \`ledger-sync\` buffer limits exceeded.`,
      citations,
    };
  }

  if (q.includes("sla") || q.includes("time left") || q.includes("countdown") || q.includes("breach")) {
    citations.push(`EMAIL SLA Clause`, `CONTRACT Tier-1`);
    return {
      answer: `Current incident SLA is governed by the critical response agreement for **${clientName}**.\n\n- Contractual penalty: ${incidentData?.vipClient?.penaltyTerms || "15% monthly invoice rebate ($36,000 credit)"}.\n- Active SLA countdown: ${incidentData?.slaMinutesRemaining || 18} minutes remaining before financial penalty triggers.\n- Reference: [EMAIL Marcus Vance / Master Services Agreement].`,
      citations,
    };
  }

  if (q.includes("exact line") || q.includes("line of code") || q.includes("where") || q.includes("stack trace") || q.includes("file")) {
    citations.push(`FILE ${failingFile}:${failingLine}`, `LOG StackTrace`);
    return {
      answer: `The exact point of failure is located in **\`${failingFile}\` at line ${failingLine}** inside \`${microservice}\`.\n\n- Method: \`RedisPoolManager.acquire (line ${failingLine})\`\n- Error: \`${incidentData?.routing?.errorSignature}\`\n- Cause: Connection pool exhaustion under concurrency surge with unreleased socket handles.\n- Reference: [FILE ${failingFile}:${failingLine}].`,
      citations,
    };
  }

  if (q.includes("arr") || q.includes("contract") || q.includes("client") || q.includes("vip") || q.includes("money") || q.includes("revenue")) {
    citations.push(`EMAIL Marcus Vance`, `VIP ${clientName}`);
    return {
      answer: `The affected enterprise client is **${clientName}** holding a **${arr}** contract (${incidentData?.vipClient?.tier}).\n\n- Impact: Over $85,000/minute GMV reported burned during flash sale window.\n- Primary Contact: ${incidentData?.vipClient?.primaryContact}.\n- Reference: [EMAIL Paragraph 1 & 2].`,
      citations,
    };
  }

  if (q.includes("who") || q.includes("squad") || q.includes("on-call") || q.includes("engineer") || q.includes("assigned")) {
    citations.push(`ROUTING ${assignedSquad}`);
    return {
      answer: `This incident is routed to **${assignedSquad}** with a ${incidentData?.routing?.confidence || 98}% confidence score.\n\n- Primary On-Call SRE: **${onCall}**\n- Secondary Escalation: **${incidentData?.routing?.secondaryEscalation || "@priya-infra"}**\n- Rationale: ${incidentData?.routing?.routingReason}`,
      citations,
    };
  }

  citations.push(`LOG ${microservice}`, `EMAIL ${clientName}`);
  return {
    answer: `Based on ingested logs for **\`${microservice}\`** and the escalation from **${clientName}**:\n\n- **Error Observed**: \`${incidentData?.routing?.errorSignature}\` at \`${failingFile}:${failingLine}\`.\n- **Customer Frustration**: Anger score of ${incidentData?.sentimentScore || 96}/100 with contractual penalties threatened.\n- **Assigned Team**: ${assignedSquad} (${onCall}) is executing the recovery runbook.\n\nAsk me specifically about: *Which services are down?*, *How much SLA time is left?*, *What exact line of code crashed?*, or *What is the runbook fix command?*`,
    citations,
  };
}
