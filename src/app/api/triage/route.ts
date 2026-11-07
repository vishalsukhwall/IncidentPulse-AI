import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { analyzeIncidentDeterministically } from "@/lib/fallbackTriage";
import { IncidentTriageData } from "@/types/incident";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawLogs, customerEmail, customApiKey } = body;

    if (!rawLogs && !customerEmail) {
      return NextResponse.json(
        { error: "Please provide either raw logs or customer email" },
        { status: 400 }
      );
    }

    const apiKey =
      customApiKey ||
      req.headers.get("x-gemini-api-key") ||
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Deterministic fallback engine
      const fallbackResult = analyzeIncidentDeterministically(
        rawLogs || "",
        customerEmail || ""
      );
      return NextResponse.json({
        data: fallbackResult,
        source: "fallback",
        message: "Analyzed via Local Deterministic SRE Engine (No GEMINI_API_KEY set)",
      });
    }

    // Call Gemini 2.5 Flash
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const prompt = `
You are the AI SRE Systems Architect for "IncidentPulse AI — Autonomous Incident Triage & War-Room Copilot".
Analyze the following raw server stack traces/error logs alongside the customer escalation email.

================ RAW SERVER ERROR LOGS / STACK TRACES ================
${rawLogs || "[No logs provided]"}

================ CUSTOMER ESCALATION EMAIL ================
${customerEmail || "[No email provided]"}

================ INSTRUCTIONS ================
1. Determine Incident Severity: 'P1' (Critical business loss/data loss/revenue drop/SLA breach), 'P2' (High degradation/partial lockout/workaround exists), 'P3' (Medium/localized), or 'P4' (Low/minor cosmetic).
2. Customer Sentiment & Anger Analysis: score 0-100 (100 = most furious/hostile), urgent label, tone summary, key frustration points, exact direct quote from email.
3. VIP Client Profile: Identify company name, ARR contract value at risk (e.g., "$2.4M ARR"), enterprise tier, contractual SLA penalty terms, key contact, business impact.
4. Auto-Routing & Diagnosis:
   - Failing microservice name (e.g., payment-gateway-v2)
   - Failing file path (e.g., src/services/payments/redisPool.ts)
   - Failing line number (e.g., 142)
   - Error signature (exact exception name & brief description)
   - Assigned squad (e.g., Payments-Core Squad)
   - Primary on-call engineer handle (e.g., @arjun-sre)
   - Secondary escalation handle
   - Confidence score (0-100)
   - Routing rationale
   - 3 to 4 actionable Runbook Remediation Steps with clean, executable terminal commands (e.g., kubectl, redis-cli, curl), explanations, risk level ('LOW'|'MEDIUM'|'HIGH'), expected outcome, and verification command.
5. 4-Stage Chronological Incident Timeline with 4 clear pillars:
   - 1. KAB CHALU HUA (INCIDENT START): exact timestamp of first anomaly, summary, bullets, log reference.
   - 2. KYA HUA (BLAST RADIUS & IMPACT): services degraded, user impact, revenue/customer escalation trigger, bullets.
   - 3. KYUN HUA (ROOT CAUSE ANALYSIS): technical chain of failure, code path, socket/memory leak reason, bullets.
   - 4. AB KYA KAR SAKTE HAIN (IMMEDIATE ACTION & PREVENTION): immediate runbook mitigation now + long-term architectural guardrail to prevent recurrence.
6. Dual-Audience Reports:
   - Technical Post-Mortem (for Engineers & SREs): executive summary, affected systems, root cause deep dive, stack trace excerpts, executed fix summary, preventative measures.
   - VIP Client Brief (for Non-Tech VP / C-Level Client): warm, polite, professional, jargon-free executive apology & RCA brief ready to send externally, explaining what happened in plain terms, guarantees that no double-charges occurred (or data was safe), SLA remedy/credit commitment, next update ETA, signoff.
7. 30-Second Voice Briefing Script: A crisp ~30-second spoken summary designed for browser text-to-speech covering severity, affected VIP client & ARR at risk, remaining SLA countdown, assigned engineering squad, and the immediate first runbook remediation command.

Respond with strict JSON adhering exactly to this TypeScript structure:
{
  "id": "INC-XXXX",
  "title": string,
  "severity": "P1" | "P2" | "P3" | "P4",
  "severityReasoning": string,
  "sentiment": {
    "score": number,
    "label": string,
    "urgency": "CRITICAL" | "HIGH" | "ELEVATED" | "MODERATE",
    "toneSummary": string,
    "keyFrustrationPoints": string[],
    "customerQuote": string
  },
  "vipClient": {
    "name": string,
    "tier": string,
    "contractValue": string,
    "contractValueRaw": number,
    "slaThresholdMinutes": number,
    "slaPenaltyTerms": string,
    "primaryContact": string,
    "businessImpact": string
  },
  "routing": {
    "failingMicroservice": string,
    "failingFile": string,
    "failingLine": number,
    "errorSignature": string,
    "assignedSquad": string,
    "onCallHandle": string,
    "secondaryEscalation": string,
    "routingConfidence": number,
    "routingRationale": string,
    "runbookSteps": [
      {
        "id": number,
        "title": string,
        "command": string,
        "explanation": string,
        "riskLevel": "LOW" | "MEDIUM" | "HIGH",
        "expectedOutcome": string,
        "verificationCmd": string,
        "executed": false
      }
    ]
  },
  "timeline": [
    {
      "id": "kab-chalu-hua" | "kya-hua" | "kyun-hua" | "ab-kya-karein",
      "pillarBadge": string,
      "timestamp": string,
      "title": string,
      "summary": string,
      "bullets": string[],
      "codeOrLogReference": string,
      "statusType": "start" | "impact" | "root-cause" | "action"
    }
  ],
  "techPostMortem": {
    "incidentId": string,
    "incidentTitle": string,
    "severity": "P1" | "P2" | "P3" | "P4",
    "affectedSystems": string[],
    "detectedAt": string,
    "mitigatedAt": string,
    "rootCauseAnalysis": string,
    "stackTraceExcerpts": string,
    "executedFixSummary": string[],
    "preventativeMeasures": string[],
    "author": string
  },
  "vipClientBrief": {
    "clientName": string,
    "recipient": string,
    "subject": string,
    "plainEnglishExplanation": string,
    "emailBody": string,
    "commercialImpactMitigation": string,
    "slaCommitmentStatus": string,
    "nextUpdateEta": string,
    "signoff": string
  },
  "voiceBriefingScript": string,
  "slaTotalSeconds": number,
  "slaInitialRemainingSeconds": number
}
`;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    const parsedData: IncidentTriageData = JSON.parse(textResponse);

    parsedData.isLiveAiGenerated = true;
    parsedData.engineUsed = "Gemini 2.5 Flash Live";
    parsedData.generatedAt = new Date().toISOString();

    return NextResponse.json({
      data: parsedData,
      source: "gemini",
      message: "Successfully triaged by Gemini 2.5 Flash Live",
    });
  } catch (error: any) {
    console.error("Gemini triage error, falling back:", error);

    // If Gemini fails or keys invalid, run deterministic fallback safely
    try {
      const body = await req.clone().json().catch(() => ({}));
      const fallbackResult = analyzeIncidentDeterministically(
        body.rawLogs || "",
        body.customerEmail || ""
      );
      return NextResponse.json({
        data: fallbackResult,
        source: "fallback",
        warning: `Gemini API call failed (${error.message || "Network/Auth"}), fell back to Local Deterministic Engine`,
      });
    } catch (fallbackErr) {
      return NextResponse.json(
        { error: "Triage failed: " + (error.message || String(error)) },
        { status: 500 }
      );
    }
  }
}
