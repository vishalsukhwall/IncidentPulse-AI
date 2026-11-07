# 🚨 IncidentPulse AI — Autonomous Incident Triage & War-Room Copilot

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Official SDK](https://img.shields.io/badge/@google/genai-0.1-8E75B2?style=for-the-badge&logo=google)](https://www.npmjs.com/package/@google/genai)
[![Zero-Cost Voice](https://img.shields.io/badge/Voice-Web%20Speech%20API-10B981?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

> **Enterprise SRE Autonomous Incident Command Center & War-Room Copilot.**  
> Ingests messy server error stack traces alongside angry customer escalation emails, analyzes them live via Gemini 2.5 Flash, and immediately determines severity (`P1`–`P4`), customer sentiment/anger score, live SLA breach countdown, affected VIP contract value at risk ($2.4M ARR), exact failing code line, owning engineering squad, executable CLI runbooks, a 4-pillar chronological timeline, dual Tech vs. Non-Tech client reports with PDF export, and a log-grounded Copilot chat.

---

## ⚡ Server Authentication & Runtime Configuration

```bash
# 1. Edit .env.local with your Gemini API key from Google AI Studio:
GEMINI_API_KEY=your_key_here

# 2. Restart Next.js dev server so process.env.GEMINI_API_KEY is loaded:
npm run dev
```

> **Note on Key Formats:** Both traditional `AIza...` and modern `AQ....` API key formats issued by Google AI Studio are supported natively with zero regex prefix validation checks.

---

## 💎 Strict Enterprise SaaS Multi-View Architecture

- **Color Palette & Visual Hierarchy (Obsidian Enterprise Theme):**
  - **App Background:** Deep Obsidian (`#09090B` / `bg-zinc-950`).
  - **Card Surfaces:** Elevated Slate (`#121215` / `bg-zinc-900/80`) with crisp `1px` subtle borders (`border-zinc-800`) and generous internal padding (`p-6`).
  - **Primary Brand Accent:** Electric Blue (`#3B82F6` / `text-blue-500`, `bg-blue-600`) for primary CTAs and active navigation tabs.
  - **Semantic Status Colors (Muted & Professional):**
    - **Emerald** (`bg-emerald-500/10 text-emerald-400 border-emerald-500/20`) for Verified/Safe/Resolved steps.
    - **Amber** (`bg-amber-500/10 text-amber-400 border-amber-500/20`) for P2/Medium warnings & sentiment alerts.
    - **Rose** (`bg-rose-500/10 text-rose-400 border-rose-500/20`) for P1 Critical severity, VIP SLA alerts, and live red countdown timer.

---

## 🛠️ Tech Stack & API Endpoints

- **Framework**: Next.js 14+ (App Router, React 18, TypeScript)
- **Official AI SDK**: `@google/genai` (`new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })`)
- **Model**: `gemini-3.8-flash` with `responseMimeType: "application/json"` and strict `responseSchema` / `Type` definitions
- **Endpoints**:
  - `POST /api/analyze`: Ingests full untruncated telemetry `{ rawText }`, returns structured incident triage JSON.
  - `POST /api/chat`: Ingests `{ question, rawText, analysisContext, history }`, returns grounded answers citing exact `[TIMESTAMP]`, `[FILE]`, or `[EMAIL]` citations.
- **Voice Synthesis**: Native browser Web Speech API (`window.speechSynthesis`)
- **PDF Engine**: `jspdf` & `jspdf-autotable`

---

## 🎯 4-Tab Multi-View Workspace

| Tab | Feature | Description |
|---|---|---|
| **Tab 1** | **Executive Overview & Auto-Routing** | 4 KPI cards, crisp 3-bullet summary, failing file/line pill (`redisPool.ts:142`), owning squad (`Payments-Core Squad`), and copyable terminal fix commands with verification probes. |
| **Tab 2** | **Deep Analysis & Incident Timeline** | 4 structured vertical timeline cards: **Kab Chalu Hua** → **Kya Hua** → **Kyun Hua** → **Ab Kya Kar Sakte Hain** + side-by-side Stack Trace vs. Plain-English Root Cause. |
| **Tab 3** | **Dual-Audience Deliverables & Export** | Side-by-side Engineer Technical Post-Mortem vs. Non-Tech VIP Client Apology Brief + 1-click **Copy Client Email** and 2-page PDF export. |
| **Tab 4** | **Interactive AI Copilot** | Split-screen raw input viewer + grounded Q&A chat with clickable timestamp/email citation pills. |
