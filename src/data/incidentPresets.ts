import { IncidentPreset } from "../types/incident";

export const PRESET_P1_PAYMENT_OUTAGE: IncidentPreset = {
  id: "preset-p1-payment-outage",
  label: "Simulate P1 VIP Payment Outage",
  badge: "P1 CRITICAL • $2.4M ARR",
  severity: "P1",
  title: "Critical Gateway Timeout: Redis Connection Pool Exhaustion in Payment Pipeline",
  description:
    "Multi-service checkout cascade failure: Redis connection pool leak locks payment workers, dropping checkout transactions at 94% failure rate for top enterprise account.",
  rawLogs: `[2026-11-07T16:48:12.104Z] [payment-gateway-v2] [INFO] [req_9a8f2c] INCOMING POST /api/v2/checkout/charge payload_size=1.4KB tenant_id=apex_fintech_corp
[2026-11-07T16:48:12.189Z] [payment-gateway-v2] [DEBUG] [redisPool] Acquiring client from cluster pool (active=48, idle=2, max=50)
[2026-11-07T16:48:14.212Z] [payment-gateway-v2] [WARN]  [redisPool] Pool acquisition wait time exceeded 2000ms. Queue depth: 38
[2026-11-07T16:48:15.190Z] [payment-gateway-v2] [ERROR] [redisPool] PoolAcquisitionTimeoutError: Connection pool exhausted (max: 50). 124 pending acquisitions timed out after 3000ms.
    at RedisPoolManager.acquire (src/services/payments/redisPool.ts:142:27)
    at async IdempotencyService.lockKey (src/services/payments/idempotency.ts:64:19)
    at async ChargeController.processCharge (src/controllers/chargeController.ts:88:12)
    at async /app/node_modules/express/lib/router/layer.js:95:5
[2026-11-07T16:48:15.201Z] [payment-gateway-v2] [FATAL] [req_9a8f2c] Unhandled rejection during transaction lock acquisition. Status 504 Gateway Timeout.
[2026-11-07T16:48:15.820Z] [stripe-orchestrator] [ERROR] [webhook_tx_772] Upstream connection reset by peer during 3D-Secure auth token exchange.
[2026-11-07T16:48:16.002Z] [ingress-controller] [ALERT] HTTP 504 spike detected: 342 req/sec failing on route /api/v2/checkout/* (Tenant: apex_fintech_corp)
[2026-11-07T16:48:16.440Z] [ledger-sync] [ERROR] Circuit breaker OPEN for payment-gateway-v2. Fallback queue rejected (buffer limit 5000 messages exceeded).
[2026-11-07T16:48:17.112Z] [payment-gateway-v2] [ERROR] Memory leak detected in worker thread #4: RSS 1.84GB (>95% threshold). Health check probe failed at /healthz/readiness.`,
  customerEmail: `From: Marcus Vance <m.vance@apexfintech.io>
To: leadership-escalations@incidentpulse.internal, vikas-vp-customer@incidentpulse.internal
Date: Sat, Nov 7, 2026, 4:51 PM
Subject: URGENT P1 ESCALATION: $2.4M ARR Account Down - Black Friday Checkouts Failing at 94% Rate

Team,

This is completely unacceptable. Our European peak flash sale launched 15 minutes ago, and our entire checkout pipeline is dead in the water with 504 Gateway Timeouts. We are losing over $85,000 PER MINUTE in gross merchandise value right now.

Our executive team is on a crisis bridge. As you know, Apex Fintech is your highest-tier Platinum Enterprise customer ($2.4M ARR). Our Master Services Agreement has a strict 30-minute SLA response and resolution window. Every minute beyond this will trigger our contractual 15% monthly invoice credit ($36,000) and an immediate review of our renewal next quarter.

Do not give me a generic status page link. I need:
1. An SRE Lead and Engineering Director on our vendor bridge IMMEDIATELY.
2. The exact root cause and time-to-remediation.
3. Confirmation that transactions aren't double-charging our shoppers due to idempotency failures.

I expect an executive callback within 10 minutes.

Marcus Vance
VP of Core Infrastructure & Payments
Apex Global Fintech Corp (Tier-1 Platinum)`,
  triageData: {
    id: "INC-8941",
    title: "Redis Connection Pool Exhaustion Triggering P1 Payment Gateway Cascade",
    severity: "P1",
    severityReasoning:
      "Direct financial loss ($85k/min GMV), 94% checkout transaction failure rate for highest ARR Platinum customer ($2.4M), with contractual SLA breach penalty imminent within 18 minutes.",
    sentiment: {
      score: 96,
      label: "96/100 Furious — Imminent Churn & Legal SLA Threat",
      urgency: "CRITICAL",
      toneSummary:
        "Extremely hostile and demanding executive escalation. Cites specific SLA financial penalties ($36,000 credit penalty), enterprise renewal jeopardy, and demands immediate direct engineering leadership on crisis bridge.",
      keyFrustrationPoints: [
        "$85,000 per minute revenue hemorrhage during peak European flash sale",
        "94% checkout failure rate with HTTP 504 Gateway Timeouts",
        "Risk of double-charging shoppers due to unreleased idempotency keys",
        "Demanding executive presence and threatening $2.4M ARR contract renewal cancellation",
      ],
      customerQuote:
        "“This is completely unacceptable... We are losing over $85,000 PER MINUTE... Every minute beyond our 30-minute SLA triggers our contractual 15% invoice credit and an immediate renewal review.”",
    },
    vipClient: {
      name: "Apex Global Fintech Corp",
      tier: "Tier-1 Platinum Enterprise",
      contractValue: "$2.4M ARR",
      contractValueRaw: 2400000,
      slaThresholdMinutes: 30,
      slaPenaltyTerms:
        "15% monthly billing credit ($36,000 rebate) after 30-min SLA breach + mandatory Executive Board incident disclosure.",
      primaryContact: "Marcus Vance (VP of Core Infrastructure)",
      businessImpact:
        "Global checkout failure across 12 European countries during high-traffic promo window. $85,000/min estimated revenue burn.",
    },
    routing: {
      failingMicroservice: "payment-gateway-v2",
      failingFile: "src/services/payments/redisPool.ts",
      failingLine: 142,
      errorSignature: "PoolAcquisitionTimeoutError: Connection pool exhausted (max: 50)",
      assignedSquad: "Payments-Core Squad",
      onCallHandle: "@arjun-sre (Lead On-Call SRE)",
      secondaryEscalation: "@priya-infra (Database & Cache Guild Lead)",
      routingConfidence: 98,
      routingRationale:
        "Stack trace clearly identifies unhandled Redis client leak in `src/services/payments/redisPool.ts:142` within `payment-gateway-v2`. Idempotency lock acquisition is timing out under thread worker leak.",
      runbookSteps: [
        {
          id: 1,
          title: "Drain & Increase Redis Pool Connection Ceiling",
          command:
            "kubectl set env deployment/payment-gateway-v2 REDIS_MAX_POOL_SIZE=250 REDIS_POOL_TIMEOUT_MS=6000 -n payments",
          explanation:
            "Temporarily elevates maximum Redis client connection pool cap from 50 to 250 connections and extends acquisition timeout to prevent immediate 504 timeouts under peak flash sale load.",
          riskLevel: "LOW",
          expectedOutcome: "Immediate mitigation of PoolAcquisitionTimeoutError errors.",
          verificationCmd:
            "kubectl logs -n payments -l app=payment-gateway-v2 --tail=50 | grep -i 'redisPool'",
          executed: false,
        },
        {
          id: 2,
          title: "Rolling Restart of payment-gateway-v2 Worker Pods",
          command:
            "kubectl rollout restart deployment/payment-gateway-v2 -n payments && kubectl rollout status deployment/payment-gateway-v2 -n payments",
          explanation:
            "Recycles leaked worker thread memory (RSS > 1.84GB) and flushes orphaned unreleased idempotency client handles without dropping in-flight transactions.",
          riskLevel: "MEDIUM",
          expectedOutcome:
            "Fresh worker threads initialize with empty connection queues and clean memory profiles.",
          verificationCmd:
            "kubectl get pods -n payments -l app=payment-gateway-v2 -o wide",
          executed: false,
        },
        {
          id: 3,
          title: "Clear Deadlocked Idempotency Lock Keys for Tenant",
          command:
            "redis-cli -h redis-master.payments.svc.cluster.local -p 6379 --scan --pattern 'lock:idempotency:apex_fintech_corp:*' | xargs -r redis-cli -h redis-master.payments.svc.cluster.local -p 6379 del",
          explanation:
            "Removes orphaned transaction locks left frozen by timed-out requests so legitimate shoppers can retry without 'Concurrent Transaction' false-positive blocks.",
          riskLevel: "HIGH",
          expectedOutcome: "Unblocks queued checkout transactions for Apex Fintech shoppers.",
          verificationCmd:
            "redis-cli -h redis-master.payments.svc.cluster.local -p 6379 EVAL 'return #redis.call(\"keys\", \"lock:idempotency:apex_fintech_corp:*\")' 0",
          executed: false,
        },
        {
          id: 4,
          title: "Reset Circuit Breaker & Re-enable Ingress Traffic",
          command:
            "curl -X POST http://payment-gateway-v2.payments.internal:9090/admin/circuit-breaker/reset -H 'Authorization: Bearer $SRE_ADMIN_TOKEN'",
          explanation:
            "Resets the trip status of the ledger-sync circuit breaker, allowing queued transactions to sync with the primary double-entry ledger.",
          riskLevel: "LOW",
          expectedOutcome: "HTTP 504 error rate drops to <0.02% across all European endpoints.",
          verificationCmd:
            "curl -s http://payment-gateway-v2.payments.internal:9090/metrics | grep 'http_requests_total{status=\"504\"}'",
          executed: false,
        },
      ],
    },
    timeline: [
      {
        id: "kab-chalu-hua",
        pillarBadge: "1. KAB CHALU HUA (INCIDENT START)",
        timestamp: "16:48:12 UTC",
        title: "Initial Redis Pool Contention & Connection Saturation",
        summary:
          "Tenant 'apex_fintech_corp' launched peak flash sale traffic spike (1.4k req/sec). Worker thread #4 failed to return Redis client handle to pool in `redisPool.ts:142`.",
        bullets: [
          "16:48:12 UTC — Normal traffic jumped 4x from European flash sale kickoff.",
          "16:48:14 UTC — Redis pool reached 48/50 active sockets; acquisition wait time crossed 2000ms SLA limit.",
          "First log anomaly: [payment-gateway-v2] [WARN] [redisPool] Pool wait time exceeded 2000ms.",
        ],
        codeOrLogReference:
          "[2026-11-07T16:48:14.212Z] [payment-gateway-v2] [WARN] [redisPool] Pool acquisition wait time exceeded 2000ms. Queue depth: 38",
        statusType: "start",
      },
      {
        id: "kya-hua",
        pillarBadge: "2. KYA HUA (BLAST RADIUS & IMPACT)",
        timestamp: "16:48:15 UTC",
        title: "Cascade 504 Timeouts & Customer Escalation Trigger",
        summary:
          "Connection pool exhausted (50/50). 124 pending acquisitions timed out. Ingress controller registered 342 req/sec failing with 504. Customer VP sent furious escalation email at 16:51 UTC.",
        bullets: [
          "Blast Radius: 94% of Apex Fintech checkout transactions failing globally across 12 countries.",
          "Gross Merchandise Value impact: ~$85,000 lost per minute.",
          "Customer escalation: Marcus Vance (VP Core Infra) triggered P1 bridge citing 30-min SLA breach & $36,000 credit penalty.",
          "Secondary impact: ledger-sync circuit breaker tripped, buffering 5,000 orphaned transactions.",
        ],
        codeOrLogReference:
          "[2026-11-07T16:48:16.002Z] [ingress-controller] [ALERT] HTTP 504 spike detected: 342 req/sec failing on route /api/v2/checkout/* (Tenant: apex_fintech_corp)",
        statusType: "impact",
      },
      {
        id: "kyun-hua",
        pillarBadge: "3. KYUN HUA (ROOT CAUSE ANALYSIS)",
        timestamp: "16:50:00 UTC",
        title: "Asynchronous Connection Leak in Idempotency Service",
        summary:
          "Code inspection revealed `src/services/payments/redisPool.ts:142` lacked a `finally { pool.release(client); }` block when Stripe 3D-Secure auth token exchange threw an upstream reset.",
        bullets: [
          "Root Cause: Missing `finally` socket release in `IdempotencyService.lockKey()`.",
          "When Stripe orchestrator reset upstream peer connections at 16:48:15Z, the caught exception aborted before returning socket.",
          "50 leaked sockets starved the pool within 8 seconds under high concurrency.",
          "Worker thread RSS climbed to 1.84GB due to orphaned buffer handles.",
        ],
        codeOrLogReference:
          "src/services/payments/redisPool.ts:142:27 -> RedisPoolManager.acquire() without matching release block on upstream reset",
        statusType: "root-cause",
      },
      {
        id: "ab-kya-karein",
        pillarBadge: "4. AB KYA KAR SAKTE HAIN (IMMEDIATE & PREVENTIVE)",
        timestamp: "16:52:30 UTC",
        title: "Pool Expansion, Rolling Pod Restart & Circuit Reset",
        summary:
          "Immediate runbook commands unblock traffic within 4 minutes. Long-term architectural safeguards scheduled for next release.",
        bullets: [
          "Immediate Action: Increase `REDIS_MAX_POOL_SIZE` to 250, perform zero-downtime pod rollout, and flush orphan idempotency keys.",
          "Customer Mitigation: SRE Lead joins vendor bridge with live dashboard; assure zero double-charges occurred.",
          "Permanent Guardrail (PR #4921): Enforce RAII auto-disposing Redis client wrappers with timeout circuit breakers.",
          "Monitoring Ticket: Add Prometheus alert `redis_pool_saturation_ratio > 0.70` for instant automated scaling.",
        ],
        codeOrLogReference:
          "PR #4921: payments/redisPool.ts: Wrap Redis client in using/AsyncDisposable pattern with strict 2500ms fallback.",
        statusType: "action",
      },
    ],
    techPostMortem: {
      incidentId: "INC-8941",
      incidentTitle: "Redis Connection Pool Exhaustion on Payment Gateway v2",
      severity: "P1",
      affectedSystems: [
        "payment-gateway-v2",
        "redis-cluster-payments",
        "stripe-orchestrator",
        "ledger-sync",
      ],
      detectedAt: "2026-11-07 16:48:14 UTC",
      mitigatedAt: "2026-11-07 16:56:00 UTC (Estimated Remediation)",
      rootCauseAnalysis:
        "At 16:48:12 UTC during a 4x promotional traffic spike from tenant 'apex_fintech_corp', upstream Stripe 3DS socket resets triggered an exception in `src/services/payments/redisPool.ts:142`. The acquisition method lacked an asynchronous error release handler, causing 50 connections to remain leased in orphan worker states. The pool was exhausted within 3 seconds, leading to cascade 504 Gateway Timeouts across checkout routes.",
      stackTraceExcerpts: `PoolAcquisitionTimeoutError: Connection pool exhausted (max: 50). 124 pending acquisitions timed out after 3000ms.
    at RedisPoolManager.acquire (src/services/payments/redisPool.ts:142:27)
    at async IdempotencyService.lockKey (src/services/payments/idempotency.ts:64:19)
    at async ChargeController.processCharge (src/controllers/chargeController.ts:88:12)`,
      executedFixSummary: [
        "Dynamically scaled REDIS_MAX_POOL_SIZE from 50 to 250 via ConfigMap patch.",
        "Conducted rolling restart of payment-gateway-v2 pods to reclaim 1.84GB leaked heap.",
        "Scanned and cleared 214 stale idempotency lock keys to prevent checkout false-positives.",
        "Reset ledger-sync circuit breaker and confirmed error rate returned to <0.01%.",
      ],
      preventativeMeasures: [
        "Implement TypeScript Disposable / RAII pattern in RedisPoolManager so sockets auto-release on any thrown error.",
        "Add synthetic canary probe checking pool queue acquisition latency every 5 seconds.",
        "Configure automated horizontal pod autoscaler (HPA) based on Redis socket utilization metric.",
      ],
      author: "@arjun-sre (Lead Site Reliability Engineer) & IncidentPulse AI",
    },
    vipClientBrief: {
      clientName: "Apex Global Fintech Corp",
      recipient: "Marcus Vance, VP of Core Infrastructure & Executive Leadership",
      subject:
        "INCIDENT BRIEFING & RESOLUTION: Payment Checkout Gateway Degradation [INC-8941]",
      plainEnglishExplanation:
        "During your European flash sale traffic launch at 16:48 UTC, a high-volume surge combined with an upstream network interruption caused our payment validation caching layer to hold connection slots open longer than intended. As a result, new checkout requests could not acquire a processing slot in time, returning gateway timeout errors.",
      emailBody: `Dear Marcus and the Apex Executive Team,

We want to first sincerely apologize for the disruption to your European flash sale checkouts earlier today. We recognize the immense revenue impact ($85,000/min GMV) and understand your frustration completely.

Our Senior SRE and Engineering Leadership teams took immediate control of the incident within 3 minutes of alert detection. We have executed targeted remediations:

1. Root Cause Resolution: We expanded our internal payment transaction capacity 5x and performed a graceful worker refresh, immediately releasing blocked transaction queues.
2. Zero Double-Charges: We have verified through our ledger reconciliation engine that NO shopper was double-charged during this period. Unfinished requests failed cleanly prior to ledger capture.
3. Service Status: As of 16:56 UTC, checkout success rates have fully restored to 99.98% across all 12 European regions.

Regarding your Service Level Agreement (SLA):
We respect your contractual terms and our $2.4M ARR partnership. Our Customer Success VP and Head of Engineering will deliver a formal Post-Incident Review document and coordinate your contractually guaranteed SLA invoice rebate credit.

A dedicated senior reliability engineer will remain on your vendor bridge through the duration of your flash sale window.

Sincerely,
Vikas Mehta
VP of Customer Engineering & Reliability
IncidentPulse Command Center`,
      commercialImpactMitigation:
        "Full 15% monthly billing credit applied automatically; dedicated SRE assigned to active monitoring bridge for the remaining 48 hours of flash sale.",
      slaCommitmentStatus:
        "Mitigated within 22 minutes (well within the contractual 30-minute critical SLA breach window).",
      nextUpdateEta: "Formal executive RCA post-mortem PDF to be delivered by 20:00 UTC.",
      signoff: "IncidentPulse Executive Command & SRE Guild",
    },
    voiceBriefingScript:
      "IncidentPulse Alert: Severity Level 1 Critical emergency detected on payment gateway version two. Affecting Tier 1 Platinum client, Apex Global Fintech Corp, with 2.4 million dollars ARR at risk. Live SLA countdown has 18 minutes remaining before contractual financial penalties trigger. Root cause isolated to Redis connection pool exhaustion in file src/services/payments/redisPool.ts at line 142. Assigned to Payments Core Squad under Lead SRE Arjun. Immediate remediation action: scale Redis max pool size to 250 connections and execute rolling pod restart. Incident war room is now live.",
    slaTotalSeconds: 1800, // 30 minutes
    slaInitialRemainingSeconds: 1125, // 18m 45s left
    isLiveAiGenerated: false,
    engineUsed: "Deterministic SRE Engine",
    generatedAt: "2026-11-07 16:51:30 UTC",
  },
};

export const PRESET_P2_AUTH_SPIKE: IncidentPreset = {
  id: "preset-p2-auth-spike",
  label: "Simulate P2 Auth Spike",
  badge: "P2 HIGH • $850k ARR",
  severity: "P2",
  title: "OAuth2 Token Refresh Rate-Limit Spike Locking Out Enterprise SSO Users",
  description:
    "Token rotation lockup: Upstream IdP rate limit tripped after Okta certificate rotation, blocking enterprise SSO logins across hospital clinical systems.",
  rawLogs: `[2026-11-07T16:52:01.320Z] [auth-token-service] [INFO] Handling batch token exchange for tenant=omnihealth_systems (client_id: omni_health_prod)
[2026-11-07T16:52:02.110Z] [auth-token-service] [WARN] [tokenBucket] Rate limit threshold approached: 4,820 / 5,000 req/min for tenant omnihealth_systems
[2026-11-07T16:52:03.490Z] [auth-token-service] [ERROR] [jwtRotation] RateLimitExceeded: Upstream Okta IdP returned HTTP 429 Too Many Requests (retry-after: 60s)
    at JwtRotationEngine.rotateAccessToken (src/auth/jwtRotation.ts:89:15)
    at async AuthService.refreshUserSession (src/auth/sessionManager.ts:114:9)
    at async AuthMiddleware.validateBearer (src/middleware/authGuard.ts:42:7)
[2026-11-07T16:52:03.502Z] [auth-token-service] [ERROR] Failed to refresh public JWKS cache from upstream IdP: certificate thumbprint mismatch after rotation.
[2026-11-07T16:52:04.100Z] [gateway-proxy] [WARN] HTTP 429 spike on /oauth/v2/token: 140 req/sec throttled.
[2026-11-07T16:52:04.890Z] [emr-adapter] [ERROR] SSO Handshake timeout: 1400 doctor workstation sessions failed re-authentication.`,
  customerEmail: `From: Sarah Jenkins <sjenkins@omnihealth.org>
To: support-priority@incidentpulse.internal, helpdesk-escalation@incidentpulse.internal
Date: Sat, Nov 7, 2026, 4:54 PM
Subject: HIGH SEVERITY: 1,400 Doctors Locked Out of EMR Portal - Shift Handover Blocked

Support Team,

This is Sarah Jenkins, Director of Clinical Systems at OmniHealth Systems ($850k ARR). 

We are currently having our shift changeover across 4 regional hospitals, and over 1,400 physicians, nurses, and pharmacists cannot log into the Electronic Medical Records (EMR) portal. They are receiving "429 Rate Limit Exceeded" and session timeout errors during SSO handshake.

Our ER and ICU clinical staff cannot chart patient vitals or approve urgent medication orders right now. This is a severe clinical operations roadblock. 

Our contractual P2 SLA requires initial response and mitigation plan within 60 minutes. We need our rate-limit quota raised or the JWKS thumbprint cache flushed immediately.

Sarah Jenkins
Director of Clinical Systems | OmniHealth Systems`,
  triageData: {
    id: "INC-8942",
    title: "OAuth2 Token Refresh Rate-Limit Spike Blocking Clinical EMR Logins",
    severity: "P2",
    severityReasoning:
      "Enterprise customer ($850k ARR) with 1,400 healthcare staff locked out during hospital shift change. High customer anxiety and clinical operations impact, but core database remains healthy.",
    sentiment: {
      score: 82,
      label: "82/100 Anxious & High Urgency — Clinical Workflow Impact",
      urgency: "HIGH",
      toneSummary:
        "High-urgency institutional escalation. Professional yet severely concerned about patient care and clinical operations during hospital shift changeover.",
      keyFrustrationPoints: [
        "1,400 clinical staff (ER/ICU doctors and nurses) locked out of EMR",
        "Unable to chart vitals or release urgent prescription approvals",
        "Hospital shift changeover paralyzed across 4 facilities",
        "Demanding immediate JWKS cache flush and rate-limit quota expansion",
      ],
      customerQuote:
        "“Over 1,400 physicians, nurses, and pharmacists cannot log into the EMR portal... Our ER and ICU staff cannot chart vitals or approve urgent medication orders.”",
    },
    vipClient: {
      name: "OmniHealth Systems",
      tier: "Tier-2 Gold Enterprise",
      contractValue: "$850k ARR",
      contractValueRaw: 850000,
      slaThresholdMinutes: 60,
      slaPenaltyTerms:
        "10% monthly service credit upon 60-min SLA response breach + formal clinical governance incident audit.",
      primaryContact: "Sarah Jenkins (Director of Clinical Systems)",
      businessImpact:
        "1,400 clinical practitioners across 4 hospital facilities unable to access patient medical records during 5:00 PM shift change.",
    },
    routing: {
      failingMicroservice: "auth-token-service",
      failingFile: "src/auth/jwtRotation.ts",
      failingLine: 89,
      errorSignature: "RateLimitExceeded: HTTP 429 Too Many Requests on Upstream Okta IdP",
      assignedSquad: "Identity & Access Management (IAM) Squad",
      onCallHandle: "@devesh-iam (IAM Lead)",
      secondaryEscalation: "@marina-sec (Security Platform Guild)",
      routingConfidence: 95,
      routingRationale:
        "Log files directly point to `src/auth/jwtRotation.ts:89` where token bucket was overwhelmed by thundering herd after Okta IdP JWKS certificate thumbprint rotation.",
      runbookSteps: [
        {
          id: 1,
          title: "Flush Stale JWKS Public Key Cache in Redis",
          command:
            "redis-cli -h auth-cache.internal -p 6379 DEL 'jwks:keys:omni_health_prod'",
          explanation:
            "Forces auth-token-service to fetch the newly rotated Okta signing certificate thumbprint immediately rather than waiting for TTL expiration.",
          riskLevel: "LOW",
          expectedOutcome: "Resolves JWKS signature verification errors.",
          verificationCmd:
            "curl -s http://auth-token-service.internal:8080/jwks/status?tenant=omnihealth_systems",
          executed: false,
        },
        {
          id: 2,
          title: "Temporarily Elevate Rate-Limit Quota for Tenant",
          command:
            "curl -X PATCH http://gateway-proxy.internal:8001/plugins/rate-limiting/omnihealth_systems -d '{\"rate_limit_per_minute\": 25000}' -H 'Content-Type: application/json'",
          explanation:
            "Increases token bucket limit from 5,000 to 25,000 req/min to absorb the thundering herd of 1,400 simultaneous doctor shifts.",
          riskLevel: "LOW",
          expectedOutcome: "Eliminates HTTP 429 throttles on /oauth/v2/token.",
          verificationCmd:
            "curl -i http://gateway-proxy.internal:8001/routes/oauth-token/health",
          executed: false,
        },
        {
          id: 3,
          title: "Deploy Thundering-Herd Jitter Backoff Patch",
          command:
            "kubectl patch configmap auth-client-config -n auth --type merge -p '{\"data\":{\"RETRY_JITTER_ENABLED\":\"true\",\"MAX_RETRY_DELAY_MS\":\"5000\"}}'",
          explanation:
            "Injects exponential jitter into failed client SSO requests so 1,400 medical workstations do not retry in lockstep.",
          riskLevel: "MEDIUM",
          expectedOutcome: "Smooths request distribution across next 15 minutes.",
          verificationCmd:
            "kubectl logs -n auth -l app=auth-token-service --tail=20 | grep -i 'jitter'",
          executed: false,
        },
      ],
    },
    timeline: [
      {
        id: "kab-chalu-hua",
        pillarBadge: "1. KAB CHALU HUA (INCIDENT START)",
        timestamp: "16:52:01 UTC",
        title: "Okta Certificate Rotation & JWKS Cache Mismatch",
        summary:
          "Upstream Okta IdP rotated its signing certificate. Auth-token-service cached stale thumbprint, rejecting tokens and prompting client mass re-logins.",
        bullets: [
          "16:52:01 UTC — Upstream IdP key change triggered client-side auth renegotiation.",
          "Stale JWKS cache failed signature checks, causing 1,400 workstations to simultaneously re-authenticate.",
          "First log anomaly: [auth-token-service] [ERROR] Failed to refresh public JWKS cache from upstream IdP.",
        ],
        codeOrLogReference:
          "[2026-11-07T16:52:03.502Z] [auth-token-service] [ERROR] Failed to refresh public JWKS cache: certificate thumbprint mismatch",
        statusType: "start",
      },
      {
        id: "kya-hua",
        pillarBadge: "2. KYA HUA (BLAST RADIUS & IMPACT)",
        timestamp: "16:52:03 UTC",
        title: "Token Bucket Rate Limit Exhaustion & Hospital Lockout",
        summary:
          "Thundering herd hit 4,820 req/min (cap 5,000). Gateway proxy returned 429 Too Many Requests, blocking 1,400 doctors and nurses from EMR clinical charts.",
        bullets: [
          "Blast Radius: 1,400 hospital workers across 4 medical centers locked out during 5 PM shift handover.",
          "Impact: Medication dispensation, vitals charting, and ER triage workflows interrupted.",
          "Customer escalation: Sarah Jenkins sent urgent P2 escalation email at 16:54 UTC.",
        ],
        codeOrLogReference:
          "[2026-11-07T16:52:03.490Z] [auth-token-service] [ERROR] [jwtRotation] RateLimitExceeded: Upstream Okta IdP returned HTTP 429",
        statusType: "impact",
      },
      {
        id: "kyun-hua",
        pillarBadge: "3. KYUN HUA (ROOT CAUSE ANALYSIS)",
        timestamp: "16:53:30 UTC",
        title: "Missing Stale-While-Revalidate Strategy on JWKS Keys",
        summary:
          "The auth client lacked proactive key discovery. When the cached certificate expired, all clients hit upstream simultaneously with zero retry jitter.",
        bullets: [
          "Root Cause: Rigid 24-hour cache TTL without asynchronous background refresh before expiration.",
          "Client retry loop lacked backoff jitter, transforming a simple key rotation into a self-inflicted DDoS on the rate limiter.",
          "Line src/auth/jwtRotation.ts:89 threw unhandled RateLimitExceeded exception.",
        ],
        codeOrLogReference:
          "src/auth/jwtRotation.ts:89 -> JwtRotationEngine.rotateAccessToken threw RateLimitExceeded",
        statusType: "root-cause",
      },
      {
        id: "ab-kya-karein",
        pillarBadge: "4. AB KYA KAR SAKTE HAIN (IMMEDIATE & PREVENTIVE)",
        timestamp: "16:55:00 UTC",
        title: "JWKS Flush, Quota Elevation to 25k, and Jitter Patch",
        summary:
          "Immediate cache purge and rate ceiling elevation unlocks clinical staff within 3 minutes.",
        bullets: [
          "Immediate: Delete stale Redis key `jwks:keys:omni_health_prod` and bump rate limit to 25k req/min.",
          "Immediate: Apply configmap jitter to disperse pending re-authentications smoothly.",
          "Preventative: Implement dual-key overlap retention so new IdP certs validate seamlessly 72 hours before old cert retirement.",
        ],
        codeOrLogReference:
          "ConfigMap update auth-client-config: RETRY_JITTER_ENABLED=true",
        statusType: "action",
      },
    ],
    techPostMortem: {
      incidentId: "INC-8942",
      incidentTitle: "OAuth2 Token Throttling Following Upstream Certificate Rotation",
      severity: "P2",
      affectedSystems: [
        "auth-token-service",
        "gateway-proxy",
        "emr-adapter",
        "redis-auth-cache",
      ],
      detectedAt: "2026-11-07 16:52:01 UTC",
      mitigatedAt: "2026-11-07 16:58:30 UTC",
      rootCauseAnalysis:
        "Following an automated certificate thumbprint rollover by customer's Okta IdP, local JWKS public key cache retained outdated signature verification material. 1,400 hospital workstations failed initial bearer validation and initiated immediate simultaneous refresh requests. The burst exceeded the 5,000 req/min token bucket quota, triggering cascade HTTP 429 responses.",
      stackTraceExcerpts: `RateLimitExceeded: Upstream Okta IdP returned HTTP 429 Too Many Requests (retry-after: 60s)
    at JwtRotationEngine.rotateAccessToken (src/auth/jwtRotation.ts:89:15)
    at async AuthService.refreshUserSession (src/auth/sessionManager.ts:114:9)
    at async AuthMiddleware.validateBearer (src/middleware/authGuard.ts:42:7)`,
      executedFixSummary: [
        "Evicted stale JWKS key cache in Redis cluster.",
        "Increased rate-limit bucket threshold from 5,000 to 25,000 req/min for tenant omnihealth_systems.",
        "Activated client-side jitter backoff to disperse thundering herd across 300-second window.",
      ],
      preventativeMeasures: [
        "Upgrade JWKS client library to support background pre-fetching 4 hours before certificate expiration.",
        "Implement IdP webhook listener for certificate lifecycle notifications.",
        "Add synthetic SSO login probe reporting to Datadog every 60 seconds.",
      ],
      author: "@devesh-iam (IAM Squad Lead) & IncidentPulse AI",
    },
    vipClientBrief: {
      clientName: "OmniHealth Systems",
      recipient: "Sarah Jenkins, Director of Clinical Systems",
      subject:
        "INCIDENT MITIGATION: EMR Single Sign-On Authentication Restored [INC-8942]",
      plainEnglishExplanation:
        "Our authentication security service experienced a temporary synchronization mismatch following an automated security certificate update from your identity provider. When workstation sessions refreshed during shift handover, our traffic rate-limiting controls treated the simultaneous logins as an unusual surge and temporarily restricted access.",
      emailBody: `Dear Sarah,

We understand the critical urgency of uninterrupted clinical access across your hospital facilities, especially during your staff shift changeover.

Our Identity and Reliability engineering teams responded immediately to your escalation. Within 6 minutes of notification, we:
1. Flushed the security certificate cache to synchronize instantly with your newly rotated Okta signing keys.
2. Increased your organization's login rate limit capacity 500% (from 5,000 to 25,000 logins per minute) to clear the backlog of clinical staff waiting to log in.
3. Successfully confirmed that doctors, nurses, and pharmacists across all 4 regional facilities can now authenticate into the EMR portal without delays.

We confirm that patient data integrity and audit logging remained completely secure throughout this window.

We are within your contractual 60-minute P2 SLA resolution commitment. A full clinical governance compliance report will follow within 4 hours.

Warm regards,
IncidentPulse Enterprise Support & Reliability Team`,
      commercialImpactMitigation:
        "Rate limit quota permanently increased at zero additional fee; dedicated clinical priority queue assigned to OmniHealth tenant.",
      slaCommitmentStatus:
        "Fully resolved in 9 minutes (well within the 60-minute contractual SLA).",
      nextUpdateEta: "Governance audit summary by 21:00 UTC.",
      signoff: "IncidentPulse IAM Operations Lead",
    },
    voiceBriefingScript:
      "IncidentPulse Alert: Severity Level 2 High incident identified on auth token service. Affecting Tier 2 Gold client, OmniHealth Systems, with 850 thousand dollars ARR. 1,400 healthcare staff locked out during hospital shift change. Live SLA timer shows 51 minutes remaining. Root cause traced to token bucket rate limit overflow in src/auth/jwtRotation.ts at line 89 following upstream certificate rollover. Assigned to IAM Squad under Lead Engineer Devesh. Immediate runbook fix: flush Redis JWKS cache and elevate tenant rate quota to 25,000 requests per minute.",
    slaTotalSeconds: 3600, // 60 minutes
    slaInitialRemainingSeconds: 3060, // 51 minutes left
    isLiveAiGenerated: false,
    engineUsed: "Deterministic SRE Engine",
    generatedAt: "2026-11-07 16:54:10 UTC",
  },
};

export const ALL_PRESETS: IncidentPreset[] = [
  PRESET_P1_PAYMENT_OUTAGE,
  PRESET_P2_AUTH_SPIKE,
];
