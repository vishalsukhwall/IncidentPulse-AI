# 🚨 IncidentPulse AI — Autonomous Incident Triage & War-Room Copilot

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Gemini 2.5 Flash](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-8E75B2?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![Zero-Cost Voice](https://img.shields.io/badge/Voice-Web%20Speech%20API-10B981?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

> **Enterprise SRE Autonomous Incident Command Center & War-Room Copilot.**  
> Ingests messy server error stack traces alongside angry customer escalation emails, analyzes them via Gemini AI, and immediately determines severity (`P1`–`P4`), customer sentiment/anger score, live SLA breach countdown, affected VIP contract value at risk ($2.4M ARR), exact failing code line, owning engineering squad, executable CLI runbooks, a 4-pillar chronological timeline, dual Tech vs. Non-Tech client reports with PDF export, and a log-grounded Copilot chat.

---

## 💎 Strict Enterprise SaaS UI/UX Architecture

- **Color Palette & Visual Hierarchy (Obsidian Enterprise Theme):**
  - **App Background:** Deep Obsidian (`#09090B` / `bg-zinc-950`).
  - **Card Surfaces:** Elevated Slate (`#121215` / `bg-zinc-900/80`) with crisp `1px` subtle borders (`border-zinc-800`) and generous internal padding (`p-6`).
  - **Primary Brand Accent:** Electric Blue (`#3B82F6` / `text-blue-500`, `bg-blue-600`) for primary CTAs and active navigation tabs.
  - **Semantic Status Colors (Muted & Professional—never harsh neon):**
    - **Emerald** (`bg-emerald-500/10 text-emerald-400 border-emerald-500/20`) for Verified/Safe/Resolved steps.
    - **Amber** (`bg-amber-500/10 text-amber-400 border-amber-500/20`) for P2/Medium warnings & sentiment alerts.
    - **Rose** (`bg-rose-500/10 text-rose-400 border-rose-500/20`) for P1 Critical severity, VIP SLA alerts, and live red countdown timer.
- **Typography, Spacing & Scannability (Zero Walls of Text):**
  - All AI telemetry is formatted into crisp **KPI metric cards**, **structured key-value tables**, **scannable bullet points (max 2 lines per bullet)**, and **highlighted citation pills** (`LOG 16:48:15 · redisPool.ts:142`).
  - Generous whitespace (`gap-6`, `space-y-6`) so executives and non-technical judges can scan every insight in under 5 seconds.

---

## ⚡ Core Functional Features & Multi-View Architecture

1. **Compact Demo-Ready Top Control Bar**:
   - App Logo & Title (`IncidentPulse AI`) + Grounding Status Pill (`Gemini 2.5 Flash Live` vs. `Local Deterministic Engine`).
   - **2 Instant 1-Click Demo Preset Buttons**:
     - 🔴 `"Simulate P1 VIP Payment Outage"` (Node/Redis connection pool leak + furious VP email, $2.4M ARR).
     - 🟠 `"Simulate P2 Auth Spike"` (OAuth2 token-refresh rate-limit logs + clinical EMR hospital lockout, $850k ARR).
   - **"Upload / Paste Logs"** toggle button (keeps raw log textareas cleanly hidden behind a drawer so screen real estate is preserved).
   - **"Play 30-Sec Crisis Briefing"** button: Spoken audio via native browser Web Speech API (`window.speechSynthesis`) with live animated waveform.
   - **"Download PDF Report"** button: 1-click export of the dual Tech + Non-Tech 2-page PDF directly from the top bar.

2. **Persistent Executive Telemetry Strip (Compact Top KPI Bar)**:
   - **Severity & Sentiment KPI**: `P1 CRITICAL` badge + Customer Anger Score (`96/100 Furious — Imminent Churn & Legal Breach Threat`).
   - **Live Ticking Red SLA Countdown**: Real-time `MM:SS` timer (`18:45` ticking down every second) with SLA policy rule pill.
   - **VIP Client Alert Card**: Highlights affected VIP client name (**Apex Global Fintech Corp**), contract value at risk (**$2.4M ARR • Tier-1 Platinum**), and contractual penalty terms ($36,000 monthly rebate).
   - **Locus & Squad Pill**: `payment-gateway-v2` • `src/services/payments/redisPool.ts:142` • `Payments-Core Squad` (`@arjun-sre`).

3. **Main War-Room Workspace (4 Clean Tabs)**:
   - **Tab 1 — Auto-Routing & Runbook Fix**:
     - Root failure coordinates isolated at `redisPool.ts:142`.
     - Squad routing confidence: 98% confidence with explicit technical rationale.
     - Numbered runbook steps with dark monospace terminal blocks, 1-click **"Copy Command"** buttons, verification probes, and an interactive **"Mark Step Executed"** progress bar.
   - **Tab 2 — Chronological Timeline (4-Pillar Story)**:
     - 1. **Kab Chalu Hua (Incident Start)**: 16:48 UTC initial Redis contention under flash sale.
     - 2. **Kya Hua (Blast Radius & Impact)**: 504 spike, 94% checkout failures, $85k/min GMV burn, customer escalation.
     - 3. **Kyun Hua (Root Cause Analysis)**: Unhandled async connection leak in `redisPool.ts:142` on upstream Stripe reset.
     - 4. **Ab Kya Kar Sakte Hain (Immediate Action & Prevention)**: Pool ceiling expansion to 250, zero-downtime pod rollout, and RAII try/finally guardrails.
   - **Tab 3 — Dual-Audience Reports & PDF Export**:
     - **Left Card (For Engineers)**: Technical Post-Mortem with stack traces, root cause breakdown, and executed CLI commands.
     - **Right Card (For VIP Client VP/CEO)**: Warm, polite, jargon-free Executive Apology & RCA Brief with 1-click **"Copy Client Email"** button.
     - **Download Dual PDF Brief (2-Page)**: Generates downloadable PDF (`jspdf` + `jspdf-autotable`).
   - **Tab 4 — Log-Grounded Copilot Chat**:
     - Interactive SRE assistant with quick chips (*"Which services are down?"*, *"What exact line of code crashed?"*, *"How much SLA time is left?"*).
     - Strictly grounded in ingested telemetry, citing exact `[LOG TIMESTAMP]`, `[FILE:LINE]`, and `[EMAIL]` references.

---

## 🚀 Quickstart Guide

### 1. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser. The live war room will immediately open with the P1 VIP Payment Outage preset pre-loaded.

### 2. (Optional) Provide Gemini API Key
The app works **100% offline out-of-the-box** using its built-in Deterministic SRE Engine.  
To activate live `gemini-2.5-flash`:
1. Click the **Engine Status Pill** in the top navigation bar (`Local SRE Engine`).
2. Paste your `GEMINI_API_KEY` and click **Save & Connect** (persisted in browser `localStorage`).
   *Or add `GEMINI_API_KEY=your_key` in `.env.local`.*

### 3. Build for Production
```bash
npm run build
npm run start
```
*(Verified: `npm run build` compiled with 0 errors across all routes).*
