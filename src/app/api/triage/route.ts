import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { analyzeIncidentDeterministically } from "@/lib/fallbackTriage";
import { IncidentTriageData } from "@/types/incident";

export const maxDuration = 60;

// Flash model priority fallback chain
const FLASH_MODELS_PRIORITY = [
  "gemini-3.8-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

const triageResponseSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    severity: { type: Type.STRING, enum: ["P1", "P2", "P3", "P4"] },
    severityReasoning: { type: Type.STRING },
    sentimentScore: { type: Type.NUMBER },
    sentimentLabel: { type: Type.STRING },
    slaMinutesRemaining: { type: Type.NUMBER },
    slaRuleSummary: { type: Type.STRING },
    vipClient: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        tier: { type: Type.STRING },
        arr: { type: Type.STRING },
        slaThresholdMinutes: { type: Type.NUMBER },
        penaltyTerms: { type: Type.STRING },
        primaryContact: { type: Type.STRING },
        impactSummary: { type: Type.STRING },
      },
      required: [
        "name",
        "tier",
        "arr",
        "slaThresholdMinutes",
        "penaltyTerms",
        "primaryContact",
        "impactSummary",
      ],
    },
    routing: {
      type: Type.OBJECT,
      properties: {
        failingFile: { type: Type.STRING },
        failingLine: { type: Type.NUMBER },
        microservice: { type: Type.STRING },
        errorSignature: { type: Type.STRING },
        assignedDepartment: { type: Type.STRING },
        onCallHandle: { type: Type.STRING },
        secondaryEscalation: { type: Type.STRING },
        confidence: { type: Type.NUMBER },
        routingReason: { type: Type.STRING },
        executiveBullets: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        runbookSteps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.NUMBER },
              title: { type: Type.STRING },
              command: { type: Type.STRING },
              explanation: { type: Type.STRING },
              riskLevel: {
                type: Type.STRING,
                enum: ["LOW", "MEDIUM", "HIGH"],
              },
              expectedOutcome: { type: Type.STRING },
              verificationCmd: { type: Type.STRING },
            },
            required: [
              "id",
              "title",
              "command",
              "explanation",
              "riskLevel",
              "expectedOutcome",
              "verificationCmd",
            ],
          },
        },
      },
      required: [
        "failingFile",
        "failingLine",
        "microservice",
        "errorSignature",
        "assignedDepartment",
        "onCallHandle",
        "secondaryEscalation",
        "confidence",
        "routingReason",
        "executiveBullets",
        "runbookSteps",
      ],
    },
    timeline: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            enum: ["kab-chalu-hua", "kya-hua", "kyun-hua", "ab-kya-karein"],
          },
          pillarBadge: { type: Type.STRING },
          timestamp: { type: Type.STRING },
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          bullets: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          codeOrLogReference: { type: Type.STRING },
          citation: { type: Type.STRING },
          blastRadius: { type: Type.STRING },
          statusType: {
            type: Type.STRING,
            enum: ["start", "impact", "root-cause", "action"],
          },
        },
        required: ["id", "pillarBadge", "timestamp", "title", "summary", "bullets"],
      },
    },
    techPostMortem: {
      type: Type.OBJECT,
      properties: {
        incidentId: { type: Type.STRING },
        incidentTitle: { type: Type.STRING },
        severity: { type: Type.STRING, enum: ["P1", "P2", "P3", "P4"] },
        affectedSystems: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        detectedAt: { type: Type.STRING },
        mitigatedAt: { type: Type.STRING },
        rootCauseAnalysis: { type: Type.STRING },
        stackTraceExcerpts: { type: Type.STRING },
        executedFixSummary: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        preventativeMeasures: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        author: { type: Type.STRING },
      },
      required: [
        "incidentId",
        "incidentTitle",
        "severity",
        "affectedSystems",
        "detectedAt",
        "mitigatedAt",
        "rootCauseAnalysis",
        "stackTraceExcerpts",
        "executedFixSummary",
        "preventativeMeasures",
        "author",
      ],
    },
    vipClientBrief: {
      type: Type.OBJECT,
      properties: {
        clientName: { type: Type.STRING },
        recipient: { type: Type.STRING },
        subject: { type: Type.STRING },
        plainEnglishExplanation: { type: Type.STRING },
        emailBody: { type: Type.STRING },
        commercialImpactMitigation: { type: Type.STRING },
        slaCommitmentStatus: { type: Type.STRING },
        nextUpdateEta: { type: Type.STRING },
        signoff: { type: Type.STRING },
      },
      required: [
        "clientName",
        "recipient",
        "subject",
        "plainEnglishExplanation",
        "emailBody",
        "commercialImpactMitigation",
        "slaCommitmentStatus",
        "nextUpdateEta",
        "signoff",
      ],
    },
    voiceBriefingScript: { type: Type.STRING },
  },
  required: [
    "id",
    "title",
    "severity",
    "sentimentScore",
    "sentimentLabel",
    "slaMinutesRemaining",
    "slaRuleSummary",
    "vipClient",
    "routing",
    "timeline",
    "techPostMortem",
    "vipClientBrief",
    "voiceBriefingScript",
  ],
};

export async function POST(req: NextRequest) {
  let combinedInput = "";
  let rawLogs = "";
  let customerEmail = "";

  try {
    const body = await req.json();
    rawLogs = body.logs || body.rawLogs || "";
    customerEmail = body.email || body.customerEmail || "";
    combinedInput = body.rawText || `${rawLogs}\n\n================ CUSTOMER ESCALATION EMAIL ================\n${customerEmail}`;

    if (!combinedInput.trim()) {
      return NextResponse.json(
        { error: "No telemetry logs or email escalation provided in request body." },
        { status: 400 }
      );
    }

    // Read apiKey directly from process.env (accept any non-empty string including AQ.)
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      const missingKeyMsg = "GEMINI_API_KEY is missing in .env.local. Please restart the Next.js server after saving .env.local.";
      console.warn(`[IncidentPulse API]: ${missingKeyMsg}`);
      const fallbackResult = analyzeIncidentDeterministically(rawLogs, customerEmail, missingKeyMsg);
      return NextResponse.json({
        data: fallbackResult,
        _meta: { source: "fallback", error: missingKeyMsg },
      });
    }

    // Initialize official @google/genai SDK
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `
You are the AI Principal SRE Systems Architect for "IncidentPulse AI — Autonomous Incident Triage & War-Room Copilot".
Analyze the provided server error stack traces, telemetry logs, and customer escalation emails.
Extract structured incident triage data with strict grounding.

CRITICAL INSTRUCTIONS:
1. Determine Severity: P1 (Critical business loss/data loss/revenue drop/SLA breach), P2 (High degradation/partial lockout/workaround exists), P3 (Medium/localized), P4 (Low/cosmetic).
2. Customer Sentiment Score: 0-100 (100 = most furious/hostile) with an urgent qualitative label.
3. Live SLA countdown: Estimated minutes remaining before contractual breach based on SLA rule (e.g. 18 for P1, 51 for P2).
4. VIP Enterprise Client: Extract client name, ARR ($2.4M ARR), enterprise tier, contractual SLA penalty clauses ($36k monthly credit), primary contact, business impact.
5. Routing & Diagnosis:
   - Exact failing file and line number from stack traces (e.g., src/services/payments/redisPool.ts at line 142)
   - Failing microservice name (e.g., payment-gateway-v2)
   - Error signature (exact exception name & brief description)
   - Owning engineering squad & on-call handle
   - 3 to 4 actionable Runbook Remediation Steps with clean, executable terminal commands (e.g., kubectl, redis-cli, curl)
   - 3 high-level executive bullet points (max 2 lines each) summarizing what failed, financial impact, and mitigation.
6. 4-Stage Chronological Incident Timeline:
   - kab-chalu-hua: 1. KAB CHALU HUA (INCIDENT START) - exact timestamp of first anomaly, summary, bullets, citation.
   - kya-hua: 2. KYA HUA (BLAST RADIUS & IMPACT) - services degraded, customer escalation trigger, blast radius, citation.
   - kyun-hua: 3. KYUN HUA (ROOT CAUSE ANALYSIS) - technical failure chain, code snippet, citation.
   - ab-kya-karein: 4. AB KYA KAR SAKTE HAIN (IMMEDIATE ACTION & RUNBOOK) - immediate mitigation runbook actions, citation.
7. Dual-Audience Deliverables:
   - techPostMortem: Technical post-mortem for internal engineering with stack traces, root cause, and fixes.
   - vipClientBrief: Warm, polite, jargon-free executive apology & RCA brief for the VIP client VP/CEO with SLA remedy details.
8. voiceBriefingScript: A crisp, authoritative ~70-word spoken war-room summary designed for browser text-to-speech (~30 seconds) covering severity, affected VIP client & ARR at risk, remaining SLA countdown, assigned engineering squad, and the immediate first runbook remediation command.
`;

    const userPrompt = `
Analyze this untruncated telemetry, logs, and customer communications:

================ BEGIN INGESTED RAW TELEMETRY & ESCALATIONS ================
${combinedInput}
================ END INGESTED RAW TELEMETRY & ESCALATIONS ================
`;

    // Automatic Flash Model Fallback Chain
    let response: any = null;
    let modelUsed = "";
    let lastError: any = null;

    for (const model of FLASH_MODELS_PRIORITY) {
      try {
        console.log(`[IncidentPulse API]: Attempting generation with model: ${model}...`);
        response = await ai.models.generateContent({
          model: model,
          contents: [
            { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: triageResponseSchema as any,
            temperature: 0.2,
          },
        });

        if (response) {
          modelUsed = model;
          console.log(`[IncidentPulse API]: Successfully generated triage with model: ${model}`);
          break;
        }
      } catch (modelErr: any) {
        lastError = modelErr;
        const status = modelErr?.status || modelErr?.statusCode || "UNKNOWN";
        const msg = modelErr?.message || String(modelErr);
        console.warn(`[IncidentPulse API]: Model ${model} failed (Status ${status}): ${msg}. Trying next model in priority chain...`);
      }
    }

    if (!response || !modelUsed) {
      throw lastError || new Error("All Flash models in fallback chain failed.");
    }

    // Safe extraction of response text
    const rawOutput =
      typeof response.text === "function" ? (response as any).text() : response.text;

    if (!rawOutput) {
      throw new Error(`Empty response text returned by model ${modelUsed}.`);
    }

    // Clean any accidental markdown code fences
    const cleanJson = rawOutput
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/g, "")
      .trim();

    const parsedData: IncidentTriageData = JSON.parse(cleanJson);

    // Normalize unified fields (both singular & plural)
    if (parsedData.vipClient && !parsedData.vipClients) {
      parsedData.vipClients = [parsedData.vipClient];
    } else if (parsedData.vipClients && !parsedData.vipClient) {
      parsedData.vipClient = parsedData.vipClients[0];
    }

    if (parsedData.routing && !parsedData.routing.assignedSquad) {
      parsedData.routing.assignedSquad = parsedData.routing.assignedDepartment;
    }

    if (!parsedData.dualReports && parsedData.techPostMortem && parsedData.vipClientBrief) {
      parsedData.dualReports = {
        engineerPostMortem: parsedData.techPostMortem,
        clientBrief: parsedData.vipClientBrief,
      };
    }

    parsedData._meta = {
      source: "live-gemini",
      modelUsed,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      data: parsedData,
      _meta: parsedData._meta,
    });
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error("[IncidentPulse Gemini Error in /api/triage]:", err);

    // Loud fallback execution with transparent error diagnostics
    const fallbackResult = analyzeIncidentDeterministically(
      rawLogs,
      customerEmail,
      errorMsg
    );

    fallbackResult._meta = {
      source: "fallback",
      error: errorMsg,
      statusCode: err?.status || 500,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      data: fallbackResult,
      _meta: fallbackResult._meta,
    });
  }
}
