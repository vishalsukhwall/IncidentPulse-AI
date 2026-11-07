"use client";

import React from "react";
import {
  Terminal,
  Mail,
  RotateCcw,
  Sparkles,
  FileCode,
  X,
} from "lucide-react";

interface LogIngestionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rawLogs: string;
  setRawLogs: (val: string) => void;
  customerEmail: string;
  setCustomerEmail: (val: string) => void;
  onRunTriage: () => void;
  isLoading: boolean;
  onLoadPreset: (presetId: string) => void;
}

export const LogIngestionDrawer: React.FC<LogIngestionDrawerProps> = ({
  isOpen,
  onClose,
  rawLogs,
  setRawLogs,
  customerEmail,
  setCustomerEmail,
  onRunTriage,
  isLoading,
  onLoadPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="w-full bg-zinc-950 border-b border-zinc-800 px-4 lg:px-6 py-5 transition-all">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3.5">
          <div>
            <h2 className="text-sm font-mono font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              Raw Telemetry & Customer Escalation Ingestion
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Paste custom production logs, stack traces, and angry customer tickets to trigger autonomous triage.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onLoadPreset("preset-p1-payment-outage")}
              className="text-xs font-mono px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-rose-500/50 transition-colors"
            >
              Reset to P1 Outage
            </button>
            <button
              onClick={() => onLoadPreset("preset-p2-auth-spike")}
              className="text-xs font-mono px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-amber-500/50 transition-colors"
            >
              Reset to P2 Auth
            </button>
            <button
              onClick={() => {
                setRawLogs("");
                setCustomerEmail("");
              }}
              className="text-xs font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
              title="Clear both inputs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 ml-1"
              title="Close ingestion drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dual Input Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Column 1: Raw Server Logs */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                Raw Server Logs / Stack Traces
              </label>
              <span className="text-[10px] font-mono text-zinc-500">
                Supports Node.js, Python, Go, Java, Redis, K8s logs
              </span>
            </div>
            <textarea
              value={rawLogs}
              onChange={(e) => setRawLogs(e.target.value)}
              placeholder="Paste raw server logs or stack traces here..."
              rows={7}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 resize-y leading-relaxed"
            />
          </div>

          {/* Column 2: Customer Escalation Email */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-rose-400" />
                Customer Escalation Email / Ticket
              </label>
              <span className="text-[10px] font-mono text-zinc-500">
                Extracts sentiment score, ARR at risk & SLA penalty
              </span>
            </div>
            <textarea
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Paste angry customer escalation email or ticket body..."
              rows={7}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40 resize-y leading-relaxed"
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>AI extracts severity, sentiment score, code coordinates, owning squad, timeline & runbook.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-xs font-mono px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onRunTriage}
              disabled={isLoading || (!rawLogs.trim() && !customerEmail.trim())}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-mono font-bold text-white transition-all shadow-md ${
                isLoading
                  ? "bg-blue-600/50 cursor-not-allowed"
                  : !rawLogs.trim() && !customerEmail.trim()
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 shadow-blueGlow active:scale-95"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing Logs & Email...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run Autonomous AI Triage</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
