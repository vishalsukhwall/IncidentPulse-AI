export type IncidentSeverity = "P1" | "P2" | "P3" | "P4";

export interface SentimentAnalysis {
  score: number; // 0-100 (100 = most furious)
  label: string; // e.g. "94/100 Furious — Escalation Risk"
  urgency: "CRITICAL" | "HIGH" | "ELEVATED" | "MODERATE";
  toneSummary: string;
  keyFrustrationPoints: string[];
  customerQuote: string;
}

export interface VipClientProfile {
  name: string; // e.g. "Apex Global Fintech Corp"
  tier: string; // e.g. "Tier-1 Platinum Enterprise"
  contractValue: string; // e.g. "$2.4M ARR"
  contractValueRaw: number; // 2400000
  slaThresholdMinutes: number; // e.g. 30
  slaPenaltyTerms: string; // e.g. "15% monthly invoice rebate ($30,000 credit) upon SLA breach + executive churn review"
  primaryContact: string; // e.g. "Marcus Vance (VP Engineering)"
  businessImpact: string;
}

export interface RunbookStep {
  id: number;
  title: string;
  command: string;
  explanation: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  expectedOutcome: string;
  verificationCmd?: string;
  executed?: boolean;
}

export interface AutoRoutingDiagnosis {
  failingMicroservice: string; // e.g. "payment-gateway-v2"
  failingFile: string; // e.g. "src/services/payments/redisPool.ts"
  failingLine: number; // e.g. 142
  errorSignature: string; // e.g. "PoolAcquisitionTimeoutError / Max Redis Connections Exceeded"
  assignedSquad: string; // e.g. "Payments-Core Squad"
  onCallHandle: string; // e.g. "@arjun-sre (Lead On-Call)"
  secondaryEscalation: string; // e.g. "@priya-infra (Database Guild Lead)"
  routingConfidence: number; // e.g. 98%
  routingRationale: string;
  runbookSteps: RunbookStep[];
}

export interface TimelinePillar {
  id: "kab-chalu-hua" | "kya-hua" | "kyun-hua" | "ab-kya-karein";
  pillarBadge: string; // e.g. "1. KAB CHALU HUA (INCIDENT START)"
  timestamp: string;
  title: string;
  summary: string;
  bullets: string[];
  codeOrLogReference?: string;
  statusType: "start" | "impact" | "root-cause" | "action";
}

export interface TechnicalPostMortem {
  incidentId: string;
  incidentTitle: string;
  severity: IncidentSeverity;
  affectedSystems: string[];
  detectedAt: string;
  mitigatedAt: string;
  rootCauseAnalysis: string;
  stackTraceExcerpts: string;
  executedFixSummary: string[];
  preventativeMeasures: string[];
  author: string;
}

export interface VipClientBrief {
  clientName: string;
  recipient: string;
  subject: string;
  emailBody: string;
  plainEnglishExplanation: string;
  commercialImpactMitigation: string;
  slaCommitmentStatus: string;
  nextUpdateEta: string;
  signoff: string;
}

export interface IncidentTriageData {
  id: string;
  title: string;
  severity: IncidentSeverity;
  severityReasoning: string;
  sentiment: SentimentAnalysis;
  vipClient: VipClientProfile;
  routing: AutoRoutingDiagnosis;
  timeline: TimelinePillar[];
  techPostMortem: TechnicalPostMortem;
  vipClientBrief: VipClientBrief;
  voiceBriefingScript: string;
  slaTotalSeconds: number; // default e.g. 1800 for P1 (30m)
  slaInitialRemainingSeconds: number; // e.g. 1125 (18m 45s)
  isLiveAiGenerated?: boolean;
  engineUsed: "Gemini 2.5 Flash Live" | "Deterministic SRE Engine";
  generatedAt: string;
}

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  citations?: string[]; // e.g. ["[LOG 14:02:18]", "[EMAIL Lines 4-8]"]
}

export interface IncidentPreset {
  id: string;
  label: string;
  badge: string;
  severity: IncidentSeverity;
  title: string;
  description: string;
  rawLogs: string;
  customerEmail: string;
  triageData: IncidentTriageData;
}
