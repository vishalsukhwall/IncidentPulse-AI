"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  Copy,
  Check,
  Mail,
  Wrench,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { DualReports, VipClient, IncidentSeverity } from "@/types/incident";

interface DualReportsTabProps {
  dualReports: DualReports;
  vipClients: VipClient[];
  severity: IncidentSeverity;
  onDownloadPdf: () => void;
  isDownloadingPdf?: boolean;
}

export const DualReportsTab: React.FC<DualReportsTabProps> = ({
  dualReports,
  vipClients,
  severity,
  onDownloadPdf,
  isDownloadingPdf = false,
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const { engineerPostMortem, clientBrief } = dualReports;
  const primaryVip = vipClients[0] || { name: "VIP Enterprise Client", arr: "$1.0M ARR" };

  const handleCopyEmail = () => {
    const fullText = `Subject: ${clientBrief.subject}\n\n${clientBrief.emailBody}`;
    navigator.clipboard.writeText(fullText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-mono">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            Dual-Audience Deliverables: Engineering Post-Mortem vs. VIP Client Executive Brief
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Targeted post-incident communications: deep technical telemetry for internal engineering vs. jargon-free executive RCA & SLA remedies for enterprise customers.
          </p>
        </div>

        <button
          onClick={onDownloadPdf}
          disabled={isDownloadingPdf}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-blueGlow transition-all shrink-0 active:scale-95"
        >
          {isDownloadingPdf ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download Dual PDF Brief (2-Page)</span>
            </>
          )}
        </button>
      </div>

      {/* Side-by-Side Dual Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT CARD: TECHNICAL POST-MORTEM (ENGINEERING) */}
        <div className="bg-zinc-900/80 rounded-xl border border-blue-500/30 overflow-hidden flex flex-col">
          <div className="bg-blue-950/30 border-b border-blue-500/20 p-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-mono font-bold text-white">
                  Technical Post-Mortem (Engineering Internal)
                </h4>
                <p className="text-[11px] font-mono text-zinc-400">
                  Target: SRE Team, Architecture Guild & Engineering Leads
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase">
              CONFIDENTIAL
            </span>
          </div>

          <div className="p-6 space-y-5 font-mono text-xs flex-1">
            {/* Metadata Table */}
            <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-3.5 rounded-lg border border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Incident ID & Severity</span>
                <span className="font-bold text-white mt-0.5 block">
                  {engineerPostMortem.incidentId} • <span className="text-rose-400">{severity} CRITICAL</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Detected / Mitigated</span>
                <span className="text-zinc-300 mt-0.5 block">
                  {engineerPostMortem.detectedAt} → {engineerPostMortem.mitigatedAt}
                </span>
              </div>
            </div>

            {/* Root Cause Failure Mechanism */}
            <div>
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block mb-1.5">
                Technical Failure Mechanism
              </span>
              <p className="text-zinc-300 bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 leading-relaxed">
                {engineerPostMortem.rootCauseAnalysis}
              </p>
            </div>

            {/* Stack Trace */}
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-rose-400" />
                Raw Stack Trace Evidence
              </span>
              <pre className="bg-zinc-950 text-rose-300 p-3.5 rounded-lg border border-zinc-800 text-[10px] overflow-x-auto leading-relaxed select-all">
                {engineerPostMortem.stackTraceExcerpts}
              </pre>
            </div>

            {/* Executed Mitigations */}
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1.5">
                Executed Remediations & Probes
              </span>
              <ul className="space-y-2 bg-zinc-950 p-3.5 rounded-lg border border-zinc-800">
                {engineerPostMortem.executedFixSummary.map((fix: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-zinc-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="leading-snug">{fix}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Long-Term Guardrails */}
            <div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1.5">
                Permanent Architectural Guardrails
              </span>
              <ul className="space-y-2 bg-zinc-950 p-3.5 rounded-lg border border-zinc-800">
                {engineerPostMortem.preventativeMeasures.map((measure: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-zinc-300">
                    <span className="text-amber-400 font-bold mt-0.5">•</span>
                    <span className="leading-snug">{measure}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT CARD: VIP CLIENT EXECUTIVE BRIEF (NON-TECH) */}
        <div className="bg-zinc-900/80 rounded-xl border border-emerald-500/30 overflow-hidden flex flex-col">
          <div className="bg-emerald-950/30 border-b border-emerald-500/20 p-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-mono font-bold text-white">
                  VIP Client Executive Brief & Apology
                </h4>
                <p className="text-[11px] font-mono text-zinc-400">
                  Target: {clientBrief.clientName} VP & C-Suite Leadership
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyEmail}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emeraldGlow transition-all active:scale-95"
            >
              {copiedEmail ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Email Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Client Email</span>
                </>
              )}
            </button>
          </div>

          <div className="p-6 space-y-5 font-mono text-xs flex-1">
            {/* Email Meta */}
            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 space-y-2">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Primary Recipient</span>
                <span className="text-white font-bold mt-0.5 block">{clientBrief.recipient}</span>
              </div>
              <div className="border-t border-zinc-800/80 pt-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Subject Line</span>
                <span className="text-emerald-400 font-bold mt-0.5 block">{clientBrief.subject}</span>
              </div>
            </div>

            {/* Plain English Explanation */}
            <div className="bg-emerald-950/15 border border-emerald-500/30 rounded-lg p-4 space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Plain-English Summary (Zero Technical Jargon)
              </span>
              <p className="text-zinc-200 leading-relaxed font-sans text-xs">
                {clientBrief.plainEnglishExplanation}
              </p>
            </div>

            {/* Email Body */}
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Executive Assurance Letter Body
              </span>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto select-all">
                {clientBrief.emailBody}
              </div>
            </div>

            {/* Commercial SLA Safeguards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950 p-3.5 rounded-lg border border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Commercial SLA Remedy</span>
                <span className="text-emerald-400 font-bold mt-0.5 block">
                  {clientBrief.commercialImpactMitigation}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">SLA Commitment Status</span>
                <span className="text-white font-semibold mt-0.5 block">
                  {clientBrief.slaCommitmentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DualReportTab = DualReportsTab;

