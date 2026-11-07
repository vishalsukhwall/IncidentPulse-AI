export type IncidentSeverity = "P1" | "P2" | "P3" | "P4";

export interface VipClient {
  name: string;
  tier: string;
  arr: string;
  slaThresholdMinutes: number;
  penaltyTerms: string;
  primaryContact: string;
  impactSummary: string;
}

export interface RunbookStep {
  id: number;
  title: string;
  command: string;
  explanation: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  expectedOutcome: string;
  verificationCmd: string;
  executed?: boolean;
}

export interface IncidentRouting {
  failingFile: string;
  failingLine: number;
  microservice: string;
  errorSignature: string;
  assignedDepartment: string;
  onCallHandle: string;
  secondaryEscalation: string;
  confidence: number;
  routingReason: string;
  executiveBullets: string[];
  runbookSteps: RunbookStep[];
}

export interface TimelinePillarStart {
  timestamp: string;
  title: string;
  summary: string;
  bullets: string[];
  citation: string;
}

export interface TimelinePillarImpact {
  timestamp: string;
  title: string;
  summary: string;
  bullets: string[];
  blastRadius: string;
  citation: string;
}

export interface TimelinePillarRootCause {
  timestamp: string;
  title: string;
  summary: string;
  technicalChain: string[];
  codeSnippetOrTrace: string;
  citation: string;
}

export interface TimelinePillarAction {
  timestamp: string;
  title: string;
  summary: string;
  actionBullets: string[];
  citation: string;
}

export interface TimelinePillarPrevention {
  title: string;
  guardrails: string[];
  ticketRef: string;
}

export interface IncidentTimeline {
  startedAt: TimelinePillarStart;
  whatHappened: TimelinePillarImpact;
  whyItHappened: TimelinePillarRootCause;
  immediateAction: TimelinePillarAction;
  longTermPrevention: TimelinePillarPrevention;
}

export interface EngineerPostMortem {
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

export interface ClientBrief {
  clientName: string;
  recipient: string;
  subject: string;
  plainEnglishExplanation: string;
  emailBody: string;
  commercialImpactMitigation: string;
  slaCommitmentStatus: string;
  nextUpdateEta: string;
  signoff: string;
}

export interface DualReports {
  engineerPostMortem: EngineerPostMortem;
  clientBrief: ClientBrief;
}

export interface IncidentAnalysisData {
  id: string;
  title: string;
  severity: IncidentSeverity;
  sentimentScore: number;
  sentimentLabel: string;
  slaMinutesRemaining: number;
  slaRuleSummary: string;
  vipClients: VipClient[];
  routing: IncidentRouting;
  timeline: IncidentTimeline;
  dualReports: DualReports;
  voiceBriefingScript: string;
  analyzedAt: string;
  source?: "gemini-3.8-flash" | "preset-cached";
}

export interface CopilotChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  citations?: string[];
}

export interface IncidentPreset {
  id: string;
  label: string;
  badge: string;
  severity: IncidentSeverity;
  title: string;
  description: string;
  rawText: string;
  initialAnalysis: IncidentAnalysisData;
}
