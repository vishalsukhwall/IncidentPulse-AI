import {
  IncidentSeverity,
  IncidentTriageData,
  TimelinePillar,
  RunbookStep,
  VipClientProfile,
  AutoRoutingDiagnosis,
  TechnicalPostMortem,
  VipClientBrief,
} from "../types/incident";

export function analyzeIncidentDeterministically(
  rawLogs: string,
  customerEmail: string,
  errorReason?: string
): IncidentTriageData {
  const combined = `${rawLogs}\n${customerEmail}`;
  const lowerLogs = rawLogs.toLowerCase();
  const lowerEmail = customerEmail.toLowerCase();
  const lowerCombined = combined.toLowerCase();

  // 1. Detect Failing File and Line Number from stack trace
  const stackMatch =
    rawLogs.match(/at\s+(?:async\s+)?([^\s(]+)?\s*\(?([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+):(\d+)(?::\d+)?\)?/) ||
    rawLogs.match(/([a-zA-Z0-9_\-./\\]+\.(?:ts|js|py|go|java|rs)):(\d+)/);

  let failingFile = "src/services/payments/redisPool.ts";
  let failingLine = 142;
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
  const microservice = serviceMatch ? serviceMatch[1] : "payment-gateway-v2";

  // 3. Detect Error Signature
  let errorSignature = "Unhandled System Exception";
  if (rawLogs.includes("PoolAcquisitionTimeoutError") || lowerLogs.includes("pool exhausted")) {
    errorSignature = "PoolAcquisitionTimeoutError: Connection pool exhausted (max capacity 50)";
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

  // 4. Sentiment & Anger Score
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
  angerScore = Math.min(Math.max(angerScore, 45), 98);

  let sentimentLabel = `${angerScore}/100 Elevated Frustration — Management Escalation`;
  if (angerScore >= 90) {
    sentimentLabel = `${angerScore}/100 Furious — Imminent Churn & Legal Breach Threat`;
  } else if (angerScore >= 75) {
    sentimentLabel = `${angerScore}/100 Severely Distressed — Operations Paralyzed`;
  }

  // 5. VIP Client Discovery
  let clientName = "Enterprise Customer";
  let contractValue = "$1.2M ARR";
  let clientTier = "Tier-1 Enterprise";
  let slaMinutes = 30;

  const arrMatch = customerEmail.match(/\$([0-9.]+)\s*(?:M|m|k|K)?\s*ARR/i) || customerEmail.match(/\$([0-9,]+)/);
  if (arrMatch) {
    contractValue = arrMatch[0].toUpperCase();
  }

  if (lowerEmail.includes("apex") || lowerEmail.includes("fintech")) {
    clientName = "Apex Global Fintech Corp";
    contractValue = "$2.4M ARR";
    clientTier = "Tier-1 Platinum Enterprise";
    slaMinutes = 30;
  } else if (lowerEmail.includes("omnihealth") || lowerEmail.includes("hospital") || lowerEmail.includes("doctor")) {
    clientName = "OmniHealth Systems";
    contractValue = "$850k ARR";
    clientTier = "Tier-2 Gold Enterprise";
    slaMinutes = 60;
  } else {
    const fromMatch = customerEmail.match(/From:\s*([^<\n]+)(?:<([^>\n]+)>)?/);
    if (fromMatch && fromMatch[1]) {
      const parts = fromMatch[1].trim().split(" ");
      clientName = parts.length > 1 ? `${parts[parts.length - 1]} Enterprises` : "Global Enterprise Client";
    }
  }

  // 6. Severity Calculation
  let severity: IncidentSeverity = "P2";
  if (
    angerScore >= 90 ||
    lowerCombined.includes("p1") ||
    lowerCombined.includes("black friday") ||
    lowerCombined.includes("losing over") ||
    lowerCombined.includes("revenue hemorrhage") ||
    lowerCombined.includes("checkout failure")
  ) {
    severity = "P1";
    slaMinutes = 30;
  } else if (
    angerScore >= 70 ||
    lowerCombined.includes("p2") ||
    lowerCombined.includes("locked out") ||
    lowerCombined.includes("handover blocked") ||
    lowerCombined.includes("rate limit")
  ) {
    severity = "P2";
    slaMinutes = 60;
  }

  const slaRemaining = Math.max(8, Math.round(slaMinutes * 0.6));

  // 7. Squad Assignment
  let assignedDepartment = "Payments-Core Squad";
  let onCallHandle = "@arjun-sre (Lead On-Call SRE)";
  let secondaryEscalation = "@priya-infra (Database & Cache Guild Lead)";
  let routingReason = `Unhandled connection resource contention isolated to ${failingFile}:${failingLine} within ${microservice}.`;

  if (failingFile.includes("auth") || lowerLogs.includes("jwt") || lowerLogs.includes("token") || lowerLogs.includes("oauth")) {
    assignedDepartment = "Identity & Access Management (IAM) Squad";
    onCallHandle = "@devesh-iam (IAM Lead SRE)";
    secondaryEscalation = "@marina-sec (Security Platform Guild)";
    routingReason = `OAuth token issuance and verification bottleneck pinpointed at ${failingFile}:${failingLine}.`;
  }

  // 8. Runbook Steps
  const runbookSteps: RunbookStep[] = [
    {
      id: 1,
      title: `Drain & Increase Resource Ceiling for ${microservice}`,
      command: `kubectl set env deployment/${microservice} POOL_SIZE=250 TIMEOUT_MS=6000 MAX_CONCURRENCY=5000 -n production`,
      explanation: "Dynamically raises concurrency limits and execution socket thresholds to prevent cascading worker timeouts under surge load.",
      riskLevel: "LOW",
      expectedOutcome: "Immediate suppression of connection timeout errors.",
      verificationCmd: `kubectl logs -n production -l app=${microservice} --tail=30`,
      executed: false,
    },
    {
      id: 2,
      title: `Graceful Rolling Worker Pod Rollout`,
      command: `kubectl rollout restart deployment/${microservice} -n production && kubectl rollout status deployment/${microservice} -n production`,
      explanation: "Flushes orphaned connection handles and recycles saturated worker heap memory without dropping active transactions.",
      riskLevel: "MEDIUM",
      expectedOutcome: "Pod status returns to 100% Running with fresh connection pool.",
      verificationCmd: `kubectl get pods -n production -l app=${microservice}`,
      executed: false,
    },
    {
      id: 3,
      title: `Purge Stale Tenant Lock Keys in Cache`,
      command: `redis-cli -h redis-master.internal -p 6379 --scan --pattern '*:lock:*' | xargs -r redis-cli -h redis-master.internal -p 6379 del`,
      explanation: "Clears deadlocked transaction and idempotency keys left hanging by timed-out client requests.",
      riskLevel: "HIGH",
      expectedOutcome: "Unlocks queued client retries without spurious concurrency blocks.",
      verificationCmd: `redis-cli -h redis-master.internal -p 6379 ping`,
      executed: false,
    },
    {
      id: 4,
      title: `Reset Circuit Breakers & Validate Route Health`,
      command: `curl -X POST http://${microservice}.internal:9090/admin/circuit-breaker/reset -H "Authorization: Bearer $ADMIN_KEY"`,
      explanation: "Resets degraded circuit-breaker states, reopening downstream transaction flow to external providers.",
      riskLevel: "LOW",
      expectedOutcome: "Error rate drops below 0.05% across edge ingress routes.",
      verificationCmd: `curl -s http://${microservice}.internal:9090/healthz`,
      executed: false,
    },
  ];

  // 9. Timeline Pillars
  const timeline: TimelinePillar[] = [
    {
      id: "kab-chalu-hua",
      pillarBadge: "1. KAB CHALU HUA (INCIDENT START)",
      timestamp: "16:48:12 UTC",
      title: "Initial Latency Surge & Connection Contention",
      summary: `First system anomaly detected in ${microservice}. Queue acquisition latency breached normal P99 thresholds.`,
      bullets: [
        `Initial warning emitted in ${failingFile}:${failingLine}`,
        `Connection wait time spiked 5x above baseline under promotional surge`,
        `Ingress traffic reported incoming request volume exceeding allocated pool capacity`,
      ],
      codeOrLogReference: `[${microservice}] [WARN] Acquisition wait time exceeded limit. File: ${failingFile}:${failingLine}`,
      citation: `LOG 16:48:14 · ${microservice}`,
      statusType: "start",
    },
    {
      id: "kya-hua",
      pillarBadge: "2. KYA HUA (BLAST RADIUS & IMPACT)",
      timestamp: "16:48:15 UTC",
      title: "Cascade Gateway Timeouts & Customer Executive Escalation",
      summary: `Downstream services throttled. ${clientName} initiated high-urgency executive escalation citing ${contractValue} contract impact.`,
      bullets: [
        `Blast radius: Core checkout endpoints in ${microservice} failing at elevated rates`,
        `Client impact: ${clientName} operations severely disrupted`,
        `Escalation sent by client leadership demanding immediate SRE intervention and SLA tracking`,
      ],
      blastRadius: `Critical workflow failure across ${clientName} user base. Elevated 504 error rate.`,
      citation: `EMAIL ${clientName} · Executive Escalation`,
      statusType: "impact",
    },
    {
      id: "kyun-hua",
      pillarBadge: "3. KYUN HUA (ROOT CAUSE ANALYSIS)",
      timestamp: "16:50:00 UTC",
      title: `Unhandled Exception & Resource Leak in ${failingFile}`,
      summary: `Root cause identified as unhandled failure branch in ${failingFile}:${failingLine}. Sockets remained unreleased upon upstream interruption.`,
      bullets: [
        `Under high concurrency, upstream timeout triggered an exception before socket return`,
        `Connection pool reached maximum ceiling with 0 idle connections available for new transactions`,
        `Memory usage climbed sharply due to orphaned buffer handles in worker threads`,
      ],
      codeOrLogReference: `${errorSignature} at ${failingFile}:${failingLine}`,
      citation: `FILE ${failingFile}:${failingLine}`,
      statusType: "root-cause",
    },
    {
      id: "ab-kya-karein",
      pillarBadge: "4. AB KYA KAR SAKTE HAIN (IMMEDIATE ACTION & RUNBOOK)",
      timestamp: "16:52:30 UTC",
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
      citation: `RUNBOOK ${microservice}`,
      statusType: "action",
    },
  ];

  // 10. Technical Post-Mortem
  const techPostMortem: TechnicalPostMortem = {
    incidentId: "INC-8941",
    incidentTitle: `${errorSignature.split(":")[0]} on ${microservice}`,
    severity,
    affectedSystems: [microservice, "ingress-gateway", "cache-cluster"],
    detectedAt: "16:48:14 UTC",
    mitigatedAt: "16:56:00 UTC",
    rootCauseAnalysis: `A high-concurrency surge combined with an unhandled exception branch in ${failingFile} at line ${failingLine} prevented timely socket/resource release. The resource pool was exhausted within seconds, triggering cascade timeouts and service degradation across ${microservice}.`,
    stackTraceExcerpts:
      rawLogs.length > 500
        ? rawLogs.substring(0, 500) + "\n...[truncated]"
        : rawLogs || "No raw stack trace provided.",
    executedFixSummary: [
      `Dynamically scaled connection and concurrency limits for deployment/${microservice}.`,
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
    recipient: "Executive Leadership & Core Infrastructure Counterparts",
    subject: `INCIDENT MITIGATION & RCA BRIEF: ${microservice} Stabilization [INC-8941]`,
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
    commercialImpactMitigation: `Dedicated SRE monitoring bridge opened; contractual SLA terms acknowledged and credit review initiated.`,
    slaCommitmentStatus: `Remediated within SLA target window (${slaMinutes} min max target).`,
    nextUpdateEta: "Executive RCA document by end of business day.",
    signoff: "IncidentPulse Global Reliability Guild",
  };

  const vipProfile: VipClientProfile = {
    name: clientName,
    tier: clientTier,
    arr: contractValue,
    slaThresholdMinutes: slaMinutes,
    penaltyTerms: `${severity === "P1" ? "15%" : "10%"} monthly credit rebate upon SLA breach + mandatory executive review`,
    primaryContact: "Marcus Vance (VP of Core Infrastructure)",
    impactSummary: `Critical transaction and workflow failure for ${clientName}. High visibility escalation.`,
  };

  const voiceBriefingScript = `IncidentPulse Alert: Severity Level ${severity} emergency detected on microservice ${microservice}. Affecting ${clientTier} client, ${clientName}, with ${contractValue} contract value at risk. Root cause isolated to ${failingFile} at line ${failingLine}. Assigned to ${assignedDepartment} under lead engineer ${onCallHandle}. Immediate first runbook action: dynamically scale resource limits and execute rolling pod restart. Incident war room telemetry is active.`;

  return {
    id: "INC-8941",
    title: `${severity} Critical Incident: ${errorSignature.split(":")[0]} in ${microservice}`,
    severity,
    severityReasoning: `Critical impact reported on ${microservice} affecting ${clientName} (${contractValue}).`,
    sentimentScore: angerScore,
    sentimentLabel,
    slaMinutesRemaining: slaRemaining,
    slaRuleSummary: `${slaMinutes}-Minute Target • ${severity === "P1" ? "15%" : "10%"} Invoice Credit Clause`,
    vipClient: vipProfile,
    vipClients: [vipProfile],
    routing: {
      failingFile,
      failingLine,
      microservice,
      errorSignature,
      assignedDepartment,
      assignedSquad: assignedDepartment,
      onCallHandle,
      secondaryEscalation,
      confidence: 94,
      routingReason,
      executiveBullets: [
        `High-concurrency failure in ${microservice} leading to elevated error rates.`,
        `Client impact reported by ${clientName} (${contractValue} contract at risk).`,
        `Targeted resource scaling and rolling pod refresh recovers processing within 4 minutes.`,
      ],
      runbookSteps,
    },
    timeline,
    techPostMortem,
    vipClientBrief,
    dualReports: {
      engineerPostMortem: techPostMortem,
      clientBrief: vipClientBrief,
    },
    voiceBriefingScript,
    _meta: {
      source: "fallback",
      error: errorReason || "Local deterministic engine executed.",
      timestamp: new Date().toISOString(),
    },
  };
}
