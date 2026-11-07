import {
  IncidentSeverity,
  IncidentTriageData,
  TimelinePillar,
  RunbookStep,
  SentimentAnalysis,
  VipClientProfile,
  AutoRoutingDiagnosis,
  TechnicalPostMortem,
  VipClientBrief,
} from "../types/incident";

export function analyzeIncidentDeterministically(
  rawLogs: string,
  customerEmail: string
): IncidentTriageData {
  const combined = `${rawLogs}\n${customerEmail}`;
  const lowerLogs = rawLogs.toLowerCase();
  const lowerEmail = customerEmail.toLowerCase();
  const lowerCombined = combined.toLowerCase();

  // 1. Detect Failing File and Line Number from stack trace
  const stackMatch =
    rawLogs.match(/at\s+(?:async\s+)?([^\s(]+)?\s*\(?([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+):(\d+)(?::\d+)?\)?/) ||
    rawLogs.match(/([a-zA-Z0-9_\-./\\]+\.(?:ts|js|py|go|java|rs)):(\d+)/);

  let failingFile = "src/services/core/pipeline.ts";
  let failingLine = 88;
  if (stackMatch) {
    if (stackMatch[2] && stackMatch[3]) {
      failingFile = stackMatch[2];
      failingLine = parseInt(stackMatch[3], 10);
    } else if (stackMatch[1] && stackMatch[2]) {
      failingFile = stackMatch[1];
      failingLine = parseInt(stackMatch[2], 10);
    }
  }

  // 2. Detect Failing Microservice
  const serviceMatch =
    rawLogs.match(/\[([a-zA-Z0-9_\-]+(?:-service|-gateway|-proxy|-api|-orchestrator|-worker|-sync|-pool)?)\]/) ||
    rawLogs.match(/app=([a-zA-Z0-9_\-]+)/);
  const failingMicroservice = serviceMatch ? serviceMatch[1] : "payment-gateway-v2";

  // 3. Detect Error Signature
  let errorSignature = "Unhandled System Exception";
  if (rawLogs.includes("PoolAcquisitionTimeoutError") || lowerLogs.includes("pool exhausted")) {
    errorSignature = "PoolAcquisitionTimeoutError: Connection pool exhausted (max capacity)";
  } else if (rawLogs.includes("RateLimitExceeded") || rawLogs.includes("429")) {
    errorSignature = "RateLimitExceeded: HTTP 429 Too Many Requests / Token Bucket Saturation";
  } else if (rawLogs.includes("ECONNREFUSED")) {
    errorSignature = "ECONNREFUSED: Connection refused by upstream socket";
  } else if (rawLogs.includes("504") || lowerLogs.includes("gateway timeout")) {
    errorSignature = "HTTP 504 Gateway Timeout: Upstream request pipeline stalled";
  } else if (rawLogs.includes("OutOfMemory") || lowerLogs.includes("oom") || lowerLogs.includes("memory leak")) {
    errorSignature = "ProcessOutOfMemory: RSS memory threshold exceeded (>95%)";
  } else {
    const errorLine = rawLogs
      .split("\n")
      .find((l) => l.toLowerCase().includes("error") || l.toLowerCase().includes("fatal"));
    if (errorLine) {
      errorSignature = errorLine.substring(0, 90).replace(/^\[.*?\]\s*/g, "");
    }
  }

  // 4. Sentiment & Anger Analysis
  let angerScore = 55;
  const angerTriggers = [
    { words: ["unacceptable", "furious", "outrageous", "disaster", "catastrophe"], weight: 15 },
    { words: ["losing", "money", "revenue", "gmv", "sales", "$/min", "dollars"], weight: 12 },
    { words: ["lawyer", "legal", "penalty", "breach", "refund", "credit", "fine"], weight: 10 },
    { words: ["cancel", "churn", "renewal", "switch vendor", "alternative", "fire you"], weight: 12 },
    { words: ["immediately", "asap", "urgently", "crisis bridge", "executive callback", "vp"], weight: 8 },
    { words: ["patients", "hospital", "doctors", "emergency", "clinical", "life-saving"], weight: 15 },
    { words: ["locked out", "100%", "90%", "cascade", "black friday", "peak"], weight: 10 },
  ];

  for (const trigger of angerTriggers) {
    if (trigger.words.some((w) => lowerEmail.includes(w))) {
      angerScore += trigger.weight;
    }
  }
  angerScore = Math.min(Math.max(angerScore, 40), 99);

  let sentimentLabel = "75/100 Agitated — Moderate Escalation";
  let urgencyLevel: "CRITICAL" | "HIGH" | "ELEVATED" | "MODERATE" = "HIGH";
  if (angerScore >= 90) {
    sentimentLabel = `${angerScore}/100 Furious — Imminent Churn & Legal Breach Threat`;
    urgencyLevel = "CRITICAL";
  } else if (angerScore >= 75) {
    sentimentLabel = `${angerScore}/100 Severely Distressed — Operations Paralyzed`;
    urgencyLevel = "HIGH";
  } else if (angerScore >= 60) {
    sentimentLabel = `${angerScore}/100 Elevated Frustration — Management Escalation`;
    urgencyLevel = "ELEVATED";
  }

  // Extract customer quote
  const emailLines = customerEmail
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 20 && !l.startsWith("From:") && !l.startsWith("To:") && !l.startsWith("Subject:"));
  const customerQuote =
    emailLines.find((l) => l.includes("unacceptable") || l.includes("losing") || l.includes("locked out") || l.includes("SLA")) ||
    emailLines[0] ||
    "Customer reported critical blockage across primary user workflows.";

  // 5. VIP Client Discovery
  let clientName = "Enterprise Customer";
  let contractValue = "$1.2M ARR";
  let contractValueRaw = 1200000;
  let clientTier = "Tier-1 Enterprise";
  let slaThresholdMinutes = 30;

  const arrMatch = customerEmail.match(/\$([0-9.]+)\s*(?:M|m|k|K)?\s*ARR/i) || customerEmail.match(/\$([0-9,]+)/);
  if (arrMatch) {
    contractValue = arrMatch[0].toUpperCase();
    if (contractValue.includes("M")) {
      const num = parseFloat(arrMatch[1]);
      contractValueRaw = Math.round(num * 1000000);
    }
  }

  if (lowerEmail.includes("apex") || lowerEmail.includes("fintech")) {
    clientName = "Apex Global Fintech Corp";
    contractValue = "$2.4M ARR";
    contractValueRaw = 2400000;
    clientTier = "Tier-1 Platinum Enterprise";
    slaThresholdMinutes = 30;
  } else if (lowerEmail.includes("omnihealth") || lowerEmail.includes("hospital") || lowerEmail.includes("doctor")) {
    clientName = "OmniHealth Systems";
    contractValue = "$850k ARR";
    contractValueRaw = 850000;
    clientTier = "Tier-2 Gold Enterprise";
    slaThresholdMinutes = 60;
  } else {
    const fromMatch = customerEmail.match(/From:\s*([^<\n]+)(?:<([^>\n]+)>)?/);
    if (fromMatch && fromMatch[1]) {
      const parts = fromMatch[1].trim().split(" ");
      clientName = parts.length > 1 ? `${parts[parts.length - 1]} Enterprises` : "Global Enterprise Client";
    }
  }

  // 6. Severity Calculation
  let severity: IncidentSeverity = "P2";
  let severityReasoning =
    "Significant operational impact reported by enterprise tier account requiring swift intervention within SLA commitments.";

  if (
    angerScore >= 90 ||
    lowerCombined.includes("p1") ||
    lowerCombined.includes("black friday") ||
    lowerCombined.includes("losing over") ||
    lowerCombined.includes("revenue hemorrhage") ||
    lowerCombined.includes("checkout failure") ||
    contractValueRaw >= 2000000
  ) {
    severity = "P1";
    slaThresholdMinutes = 30;
    severityReasoning = `Direct financial hemorrhage & catastrophic availability failure affecting ${clientName} (${contractValue}). Contractual SLA penalty window actively counting down.`;
  } else if (
    angerScore >= 70 ||
    lowerCombined.includes("p2") ||
    lowerCombined.includes("locked out") ||
    lowerCombined.includes("handover blocked") ||
    lowerCombined.includes("rate limit")
  ) {
    severity = "P2";
    slaThresholdMinutes = 60;
    severityReasoning = `High-impact workflow block affecting mission-critical user sessions for ${clientName}. System core functional but primary interface throttled.`;
  } else if (lowerCombined.includes("p3")) {
    severity = "P3";
    slaThresholdMinutes = 240;
    severityReasoning = "Minor degradation or non-blocking defect affecting subset of non-critical workloads.";
  }

  // 7. Squad Assignment & Routing
  let assignedSquad = "Platform Core Reliability Squad";
  let onCallHandle = "@arjun-sre (Lead On-Call)";
  let secondaryEscalation = "@priya-infra (Infrastructure Lead)";
  let routingRationale = `Stack trace and logs point to failure in ${failingFile}:${failingLine} within ${failingMicroservice}.`;

  if (failingFile.includes("redis") || lowerLogs.includes("redis") || lowerCombined.includes("payment")) {
    assignedSquad = "Payments-Core Squad";
    onCallHandle = "@arjun-sre (Lead SRE)";
    secondaryEscalation = "@priya-infra (Database & Cache Guild Lead)";
    routingRationale = `Redis connection starvation isolated to ${failingFile}:${failingLine}. Directly blocks checkout transaction pipelines.`;
  } else if (failingFile.includes("auth") || lowerLogs.includes("jwt") || lowerLogs.includes("token") || lowerLogs.includes("oauth")) {
    assignedSquad = "Identity & Access Management (IAM) Squad";
    onCallHandle = "@devesh-iam (IAM Lead SRE)";
    secondaryEscalation = "@marina-sec (Security Platform Lead)";
    routingRationale = `OAuth token issuance and verification bottleneck pinpointed at ${failingFile}:${failingLine}.`;
  }

  // 8. Generate Runbook Steps
  const runbookSteps: RunbookStep[] = [
    {
      id: 1,
      title: `Emergency Resource Expansion for ${failingMicroservice}`,
      command: `kubectl set env deployment/${failingMicroservice} POOL_SIZE=250 TIMEOUT_MS=6000 MAX_CONCURRENCY=5000 -n production`,
      explanation:
        "Dynamically raises concurrency limits and execution socket thresholds to prevent cascading worker timeouts under surge load.",
      riskLevel: "LOW",
      expectedOutcome: "Immediate suppression of connection timeout errors.",
      verificationCmd: `kubectl logs -n production -l app=${failingMicroservice} --tail=30`,
      executed: false,
    },
    {
      id: 2,
      title: `Graceful Rolling Pod Rollout`,
      command: `kubectl rollout restart deployment/${failingMicroservice} -n production && kubectl rollout status deployment/${failingMicroservice} -n production`,
      explanation:
        "Flushes orphaned connection handles and recycles saturated worker heap memory without dropping active transactions.",
      riskLevel: "MEDIUM",
      expectedOutcome: "Pod status returns to 100% Running with fresh connection pool.",
      verificationCmd: `kubectl get pods -n production -l app=${failingMicroservice}`,
      executed: false,
    },
    {
      id: 3,
      title: `Purge Stale Tenant State & Lock Keys`,
      command: `redis-cli -h redis-master.internal -p 6379 --scan --pattern '*:lock:*' | xargs -r redis-cli -h redis-master.internal -p 6379 del`,
      explanation:
        "Clears deadlocked transaction and idempotency keys left hanging by timed-out client requests.",
      riskLevel: "HIGH",
      expectedOutcome: "Unlocks queued client retries without spurious concurrency blocks.",
      verificationCmd: `redis-cli -h redis-master.internal -p 6379 ping`,
      executed: false,
    },
    {
      id: 4,
      title: `Reset Circuit Breakers & Validate Route Health`,
      command: `curl -X POST http://${failingMicroservice}.internal:9090/admin/circuit-breaker/reset -H "Authorization: Bearer $ADMIN_KEY"`,
      explanation:
        "Resets degraded circuit-breaker states, reopening downstream transaction flow to external providers.",
      riskLevel: "LOW",
      expectedOutcome: "Error rate drops below 0.05% across edge ingress routes.",
      verificationCmd: `curl -s http://${failingMicroservice}.internal:9090/healthz`,
      executed: false,
    },
  ];

  // 9. Timeline Pillars (Kab Chalu Hua, Kya Hua, Kyun Hua, Ab Kya Kar Sakte Hain)
  const timeline: TimelinePillar[] = [
    {
      id: "kab-chalu-hua",
      pillarBadge: "1. KAB CHALU HUA (INCIDENT START)",
      timestamp: "T-22m (First Anomaly Detected)",
      title: "Initial Latency Surge & Connection Contention",
      summary: `First system anomaly detected in ${failingMicroservice}. Queue acquisition latency breached normal P99 thresholds.`,
      bullets: [
        `Initial warning emitted at ${failingFile}:${failingLine}`,
        `Connection wait time spiked 5x above baseline under promotional load`,
        `Ingress traffic reported incoming request volume exceeding allocated pool capacity`,
      ],
      codeOrLogReference: `Log event: [${failingMicroservice}] [WARN] Acquisition wait time exceeded limit. File: ${failingFile}:${failingLine}`,
      statusType: "start",
    },
    {
      id: "kya-hua",
      pillarBadge: "2. KYA HUA (BLAST RADIUS & IMPACT)",
      timestamp: "T-18m (Customer Impact Peak)",
      title: "Cascade Gateway Timeouts & Customer Executive Escalation",
      summary: `Downstream services throttled. ${clientName} initiated high-urgency executive escalation citing ${contractValue} ARR contract impact.`,
      bullets: [
        `Blast radius: Core endpoints in ${failingMicroservice} failing at elevated rates`,
        `Client impact: ${clientName} operations severely disrupted`,
        `Escalation sent by client leadership demanding immediate SRE intervention and SLA tracking`,
      ],
      codeOrLogReference: `Customer quote: "${customerQuote.substring(0, 140)}..."`,
      statusType: "impact",
    },
    {
      id: "kyun-hua",
      pillarBadge: "3. KYUN HUA (ROOT CAUSE ANALYSIS)",
      timestamp: "T-12m (Technical Root Cause Isolated)",
      title: `Unhandled Exception & Resource Leak in ${failingFile}`,
      summary: `Root cause identified as unhandled failure branch in ${failingFile}:${failingLine}. Sockets/resources remained unreleased upon upstream interruption.`,
      bullets: [
        `Under high concurrency, upstream timeout triggered an exception before socket return`,
        `Connection pool reached maximum ceiling with 0 idle connections available for new transactions`,
        `Memory usage climbed sharply due to orphaned buffer handles in worker threads`,
      ],
      codeOrLogReference: `${errorSignature} at ${failingFile}:${failingLine}`,
      statusType: "root-cause",
    },
    {
      id: "ab-kya-karein",
      pillarBadge: "4. AB KYA KAR SAKTE HAIN (IMMEDIATE & PREVENTIVE)",
      timestamp: "T-0m (Mitigation & Hardening)",
      title: "Dynamic Capacity Elevation, Zero-Downtime Rollout & Guardrails",
      summary:
        "Execution of targeted runbook commands restores service health within 4 minutes. Long-term automated scaling guardrails implemented.",
      bullets: [
        "Immediate: Dynamically increase pool ceiling and execute graceful pod restart",
        "Immediate: Clear stale idempotency lock keys to prevent customer retry blocks",
        "Preventative: Wrap connection acquisition in automated RAII / try-finally disposers",
        "Monitoring: Establish P1 saturation alerts at 75% connection pool threshold",
      ],
      codeOrLogReference: `Patch PR created: Fix async disposal in ${failingFile}`,
      statusType: "action",
    },
  ];

  // 10. Technical Post-Mortem
  const techPostMortem: TechnicalPostMortem = {
    incidentId: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
    incidentTitle: `${errorSignature.split(":")[0]} on ${failingMicroservice}`,
    severity,
    affectedSystems: [failingMicroservice, "ingress-gateway", "cache-cluster"],
    detectedAt: "T-22m",
    mitigatedAt: "In Progress (Remediation Active)",
    rootCauseAnalysis: `A high-concurrency surge combined with an unhandled exception branch in ${failingFile} at line ${failingLine} prevented timely socket/resource release. The resource pool was exhausted within seconds, triggering cascade timeouts and service degradation across ${failingMicroservice}.`,
    stackTraceExcerpts:
      rawLogs.length > 500
        ? rawLogs.substring(0, 500) + "\n...[truncated]"
        : rawLogs || "No raw stack trace provided.",
    executedFixSummary: [
      `Dynamically scaled connection and concurrency limits for deployment/${failingMicroservice}.`,
      `Executed rolling pod restart to reclaim memory and flush orphaned connection handles.`,
      `Cleared deadlocked transaction keys to allow seamless customer retries.`,
      `Verified HTTP 200 health status on /healthz endpoint.`,
    ],
    preventativeMeasures: [
      `Enforce automated try/finally socket release blocks in ${failingFile}.`,
      `Configure Prometheus alerts for queue saturation > 70%.`,
      `Implement automated horizontal pod autoscaling based on concurrency queue depth.`,
    ],
    author: `${onCallHandle} & IncidentPulse AI`,
  };

  // 11. VIP Client Brief
  const vipClientBrief: VipClientBrief = {
    clientName,
    recipient: "Executive Leadership & SRE Counterparts",
    subject: `INCIDENT MITIGATION & RCA BRIEF: ${failingMicroservice} Stabilization [${techPostMortem.incidentId}]`,
    plainEnglishExplanation: `During a period of elevated transaction activity, an internal connection coordination bottleneck caused our processing system to delay incoming requests rather than handling them immediately. This led to temporary timeout errors for your users.`,
    emailBody: `Dear Team at ${clientName},

We want to formally apologize for the service disruption you experienced earlier today. We understand the direct operational and commercial impact this caused, and we take our SLA commitments to ${clientName} (${contractValue}) with absolute seriousness.

Our Lead SREs and Infrastructure Guild took immediate control of the incident upon escalation. We have executed targeted fixes:

1. Resource Ceiling Scaled: We expanded processing capacity 5x to immediately eliminate request queuing.
2. System Refresh: We performed a zero-downtime rolling restart to flush blocked transaction queues.
3. Verification: Transaction success rates have fully restored to normal operational baselines (99.98%+).

We confirm that all customer data and transaction integrity remained completely intact throughout this event.

Regarding your Service Level Agreement (SLA):
Our Executive Customer Success team will coordinate with your team regarding our contractual SLA commitments and provide a formal Post-Incident Review document within 24 hours.

Sincerely,
IncidentPulse AI Command Center & Reliability Leadership`,
    commercialImpactMitigation: `Dedicated SRE monitoring bridge opened; contract SLA terms acknowledged and credit review initiated.`,
    slaCommitmentStatus: `Remediated within SLA target window (${slaThresholdMinutes} min max target).`,
    nextUpdateEta: "Executive RCA document by end of business day.",
    signoff: "IncidentPulse Global Reliability Guild",
  };

  // 12. Voice Briefing Script
  const voiceBriefingScript = `IncidentPulse Alert: Severity Level ${severity} emergency detected on microservice ${failingMicroservice}. Affecting ${clientTier} client, ${clientName}, with ${contractValue} contract value at risk. Root cause isolated to ${failingFile} at line ${failingLine}. Assigned to ${assignedSquad} under lead engineer ${onCallHandle}. Immediate first runbook action: dynamically scale resource limits and execute rolling pod restart. Incident war room telemetry is active.`;

  return {
    id: techPostMortem.incidentId,
    title: `${severity} Incident: ${errorSignature.split(":")[0]} in ${failingMicroservice}`,
    severity,
    severityReasoning,
    sentiment: {
      score: angerScore,
      label: sentimentLabel,
      urgency: urgencyLevel,
      toneSummary: `Customer escalation from ${clientName} displaying severe urgency and citing contract commitments.`,
      keyFrustrationPoints: [
        `Disruption of critical enterprise workflows during peak operational hours`,
        `Direct operational risk affecting ${contractValue} contract relationship`,
        `Demand for immediate engineering leadership presence and root cause clarity`,
      ],
      customerQuote,
    },
    vipClient: {
      name: clientName,
      tier: clientTier,
      contractValue,
      contractValueRaw,
      slaThresholdMinutes,
      slaPenaltyTerms: `${severity === "P1" ? "15%" : "10%"} monthly credit rebate upon SLA breach + mandatory executive review`,
      primaryContact: "Executive Sponsor & Core Infrastructure Team",
      businessImpact: `Critical user workflow failure for ${clientName}. High visibility escalation.`,
    },
    routing: {
      failingMicroservice,
      failingFile,
      failingLine,
      errorSignature,
      assignedSquad,
      onCallHandle,
      secondaryEscalation,
      routingConfidence: 94,
      routingRationale,
      runbookSteps,
    },
    timeline,
    techPostMortem,
    vipClientBrief,
    voiceBriefingScript,
    slaTotalSeconds: slaThresholdMinutes * 60,
    slaInitialRemainingSeconds: Math.round(slaThresholdMinutes * 60 * 0.62), // ~62% remaining
    isLiveAiGenerated: false,
    engineUsed: "Deterministic SRE Engine",
    generatedAt: new Date().toISOString(),
  };
}
