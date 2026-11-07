export type IncidentSeverity = "P1" | "P2" | "P3" | "P4";

export interface VipClientProfile {
  name: string;
  tier: string;
  arr: string;
  slaThresholdMinutes: number;
  penaltyTerms: string;
  primaryContact: string;
  impactSummary: string;
}

export type VipClient = VipClientProfile;

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

export interface AutoRoutingDiagnosis {
  failingFile: string;
  failingLine: number;
  microservice: string;
  errorSignature: string;
  assignedDepartment: string;
  assignedSquad: string; // alias
  onCallHandle: string;
  secondaryEscalation: string;
  confidence: number;
  routingReason: string;
  executiveBullets: string[];
  runbookSteps: RunbookStep[];
}

export type IncidentRouting = AutoRoutingDiagnosis;

export interface TimelinePillar {
  id: "kab-chalu-hua" | "kya-hua" | "kyun-hua" | "ab-kya-karein";
  pillarBadge: string;
  timestamp: string;
  title: string;
  summary: string;
  bullets: string[];
  codeOrLogReference?: string;
  citation?: string;
  blastRadius?: string;
  statusType?: "start" | "impact" | "root-cause" | "action";
}

export interface IncidentTimelineObject {
  startedAt: {
    timestamp: string;
    title: string;
    summary: string;
    bullets: string[];
    citation?: string;
  };
  whatHappened: {
    timestamp: string;
    title: string;
    summary: string;
    bullets: string[];
    blastRadius?: string;
  };
  whyItHappened: {
    timestamp: string;
    title: string;
    summary: string;
    technicalChain: string[];
    codeSnippetOrTrace?: string;
    citation?: string;
  };
  immediateAction: {
    timestamp: string;
    title: string;
    summary: string;
    actionBullets: string[];
  };
  longTermPrevention: {
    ticketRef: string;
    actions?: string[];
  };
}

export type IncidentTimeline = TimelinePillar[] | IncidentTimelineObject | any;

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

export type EngineerPostMortem = TechnicalPostMortem;

export interface VipClientBrief {
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

export type ClientBrief = VipClientBrief;

export interface DualReports {
  engineerPostMortem: TechnicalPostMortem;
  clientBrief: VipClientBrief;
}

export interface IncidentMeta {
  source: "live-gemini" | "fallback";
  modelUsed?: string;
  error?: string;
  timestamp?: string;
  statusCode?: number;
}

export interface IncidentTriageData {
  id: string;
  title: string;
  severity: IncidentSeverity;
  severityReasoning?: string;
  sentimentScore: number;
  sentimentLabel: string;
  slaMinutesRemaining: number;
  slaRuleSummary: string;
  vipClient: VipClientProfile;
  vipClients: VipClientProfile[];
  routing: AutoRoutingDiagnosis;
  timeline: IncidentTimeline;
  techPostMortem: TechnicalPostMortem;
  vipClientBrief: VipClientBrief;
  dualReports: DualReports;
  voiceBriefingScript: string;
  _meta?: IncidentMeta;
}

export type IncidentAnalysisData = IncidentTriageData;

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
  rawLogs: string;
  customerEmail: string;
  rawText: string;
  triageData: IncidentTriageData;
  initialAnalysis?: IncidentTriageData; // compatibility alias
  failingService?: string;
  clientName?: string;
  arrAtRisk?: string;
}
