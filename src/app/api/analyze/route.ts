import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { IncidentAnalysisData } from "@/types/incident";

export const maxDuration = 60; // Allow 60s for full analysis

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawText } = body;

    if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
      return NextResponse.json(
        { error: "rawText payload is required and must contain logs or escalation text." },
        { status: 400 }
      );
    }

    // Read strictly from process.env.GEMINI_API_KEY (accept any non-empty key format including AQ.)
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

    // Initialize the official @google/genai SDK
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `
You are the AI Principal SRE Systems Architect for "IncidentPulse AI — Autonomous Incident Triage & War-Room Copilot".
Analyze the provided server error stack traces, telemetry logs, and customer escalation emails.
Extract structured incident triage data with strict grounding.

CRITICAL INSTRUCTIONS:
1. Determine Severity: P1 (Critical business loss/data loss/revenue drop/SLA breach), P2 (High degradation/partial lockout/workaround exists), P3 (Medium/localized), P4 (Low/cosmetic).
2. Customer Sentiment Score: 0-100 (100 = most furious/hostile) with an urgent qualitative label.
3. Live SLA countdown: Estimated minutes remaining before contractual breach based on SLA rule (e.g. 18 for P1, 50 for P2).
4. VIP Enterprise Clients: Extract any client names, ARR ($2.4M ARR), enterprise tier, contractual SLA penalty clauses ($36k monthly credit), primary contact, business impact.
5. Routing & Diagnosis:
   - Exact failing file and line number from stack traces (e.g., src/services/payments/redisPool.ts at line 142)
   - Failing microservice name (e.g., payment-gateway-v2)
   - Error signature (exact exception name & brief description)
   - Owning engineering squad & on-call handle
   - 3 to 4 actionable Runbook Remediation Steps with clean, executable terminal commands (e.g., kubectl, redis-cli, curl)
   - 3 high-level executive bullet points (max 2 lines each) summarizing what failed, financial impact, and mitigation.
6. 4-Stage Chronological Incident Timeline:
   - startedAt: 1. KAB CHALU HUA (INCIDENT START) - exact timestamp of first anomaly, summary, bullets, citation.
   - whatHappened: 2. KYA HUA (BLAST RADIUS & IMPACT) - services degraded, customer escalation trigger, blast radius, citation.
   - whyItHappened: 3. KYUN HUA (ROOT CAUSE ANALYSIS) - technical failure chain, code snippet, citation.
   - immediateAction: 4. AB KYA KAR SAKTE HAIN (IMMEDIATE ACTION & RUNBOOK) - immediate mitigation runbook actions, citation.
   - longTermPrevention: Permanent architectural guardrails and tracking ticket reference.
7. Dual-Audience Deliverables:
   - engineerPostMortem: Technical post-mortem for internal engineering with stack traces, root cause, and fixes.
   - clientBrief: Warm, polite, jargon-free executive apology & RCA brief for the VIP client VP/CEO with SLA remedy details.
8. voiceBriefingScript: A crisp, authoritative ~70-word spoken war-room summary designed for browser text-to-speech (~30 seconds) covering severity, affected VIP client & ARR at risk, remaining SLA countdown, assigned engineering squad, and the immediate first runbook remediation command.
`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        title: { type: Type.STRING },
        severity: { type: Type.STRING, enum: ["P1", "P2", "P3", "P4"] },
        sentimentScore: { type: Type.NUMBER },
        sentimentLabel: { type: Type.STRING },
        slaMinutesRemaining: { type: Type.NUMBER },
        slaRuleSummary: { type: Type.STRING },
        vipClients: {
          type: Type.ARRAY,
          items: {
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
          type: Type.OBJECT,
          properties: {
            startedAt: {
              type: Type.OBJECT,
              properties: {
                timestamp: { type: Type.STRING },
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                citation: { type: Type.STRING },
              },
              required: ["timestamp", "title", "summary", "bullets", "citation"],
            },
            whatHappened: {
              type: Type.OBJECT,
              properties: {
                timestamp: { type: Type.STRING },
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                blastRadius: { type: Type.STRING },
                citation: { type: Type.STRING },
              },
              required: [
                "timestamp",
                "title",
                "summary",
                "bullets",
                "blastRadius",
                "citation",
              ],
            },
            whyItHappened: {
              type: Type.OBJECT,
              properties: {
                timestamp: { type: Type.STRING },
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                technicalChain: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                codeSnippetOrTrace: { type: Type.STRING },
                citation: { type: Type.STRING },
              },
              required: [
                "timestamp",
                "title",
                "summary",
                "technicalChain",
                "codeSnippetOrTrace",
                "citation",
              ],
            },
            immediateAction: {
              type: Type.OBJECT,
              properties: {
                timestamp: { type: Type.STRING },
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                actionBullets: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                citation: { type: Type.STRING },
              },
              required: [
                "timestamp",
                "title",
                "summary",
                "actionBullets",
                "citation",
              ],
            },
            longTermPrevention: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                guardrails: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                ticketRef: { type: Type.STRING },
              },
              required: ["title", "guardrails", "ticketRef"],
            },
          },
          required: [
            "startedAt",
            "whatHappened",
            "whyItHappened",
            "immediateAction",
            "longTermPrevention",
          ],
        },
        dualReports: {
          type: Type.OBJECT,
          properties: {
            engineerPostMortem: {
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
            clientBrief: {
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
          },
          required: ["engineerPostMortem", "clientBrief"],
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
        "vipClients",
        "routing",
        "timeline",
        "dualReports",
        "voiceBriefingScript",
      ],
    };

    const userPrompt = `
Analyze this untruncated telemetry, logs, and customer communications:

================ BEGIN INGESTED RAW TELEMETRY & ESCALATIONS ================
${rawText}
================ END INGESTED RAW TELEMETRY & ESCALATIONS ================
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema as any,
        temperature: 0.2,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response received from Gemini 2.5 Flash model.");
    }

    const parsedData: IncidentAnalysisData = JSON.parse(responseText);
    parsedData.analyzedAt = new Date().toISOString();
    parsedData.source = "gemini-2.5-flash";

    return NextResponse.json({
      data: parsedData,
      status: "success",
    });
  } catch (err: any) {
    console.error("[Gemini API Error in /api/analyze]:", err);
    return NextResponse.json(
      {
        error:
          err.message ||
          "Gemini API execution failed. Please verify your GEMINI_API_KEY in .env.local and restart the server.",
      },
      { status: 500 }
    );
  }
}
