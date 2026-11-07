"use client";

import React, { useState } from "react";
import {
  Server,
  FileCode,
  Users,
  Copy,
  Check,
  Terminal,
  ShieldCheck,
  ListOrdered,
  Sparkles,
} from "lucide-react";
import { IncidentRouting } from "@/types/incident";

interface OverviewRoutingTabProps {
  routing: IncidentRouting;
}

export const OverviewRoutingTab: React.FC<OverviewRoutingTabProps> = ({
  routing,
}) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [executedSteps, setExecutedSteps] = useState<Record<number, boolean>>({});

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExecuted = (id: number) => {
    setExecutedSteps((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const totalSteps = routing.runbookSteps.length;
  const completedCount = routing.runbookSteps.filter((s) => executedSteps[s.id]).length;
  const completionPercentage = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 3 Executive Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Root Failure Coordinates */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-bold">
              <FileCode className="w-4 h-4 text-rose-400" />
              Root Failure Coordinates
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold uppercase">
              ISOLATED LOCUS
            </span>
          </div>

          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-4 space-y-3 font-mono">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Failing Microservice</span>
              <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                {routing.microservice}
              </span>
            </div>

            <div className="border-t border-zinc-800/80 pt-2.5">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Failing File & Line</span>
              <div className="flex items-center justify-between text-xs text-rose-300 font-semibold mt-0.5">
                <span className="truncate" title={routing.failingFile}>
                  {routing.failingFile}
                </span>
                <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-500/30 rounded text-rose-300 ml-2 shrink-0 font-bold">
                  :{routing.failingLine}
                </span>
              </div>
            </div>

            <div className="border-t border-zinc-800/80 pt-2.5">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Error Signature</span>
              <p className="text-[11px] text-zinc-300 leading-snug line-clamp-2 mt-0.5">
                {routing.errorSignature}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Auto-Assigned SRE Squad */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-bold">
              <Users className="w-4 h-4 text-emerald-400" />
              Assigned SRE Squad
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              {routing.confidence}% CONFIDENCE
            </span>
          </div>

          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-4 space-y-3 font-mono">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Owning Department / Squad</span>
              <span className="text-sm font-bold text-white mt-0.5 block">{routing.assignedDepartment}</span>
            </div>

            <div className="border-t border-zinc-800/80 pt-2.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Primary On-Call</span>
                <span className="text-xs text-emerald-400 font-bold">{routing.onCallHandle}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Backup Escalation</span>
                <span className="text-xs text-zinc-400">{routing.secondaryEscalation}</span>
              </div>
            </div>

            <div className="border-t border-zinc-800/80 pt-2.5">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Routing Rationale</span>
              <p className="text-[11px] text-zinc-400 leading-snug mt-0.5 line-clamp-2">
                {routing.routingReason}
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Executive Summary & Progress */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-bold">
              <Terminal className="w-4 h-4 text-blue-400" />
              Remediation Progress
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
              {completedCount} of {totalSteps} Executed
            </span>
          </div>

          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-4 space-y-3 font-mono">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-white">{completionPercentage}%</span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  completionPercentage === 100
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                }`}
              >
                {completionPercentage === 100 ? "REMEDIED & VERIFIED" : "EXECUTION IN PROGRESS"}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
              Execute each runbook step in sequence. Click <span className="text-white font-mono">Copy</span> to run in your terminal, then toggle verification.
            </p>
          </div>
        </div>
      </div>

      {/* Crisp 3-Bullet Executive Takeaway */}
      {routing.executiveBullets && routing.executiveBullets.length > 0 && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-2.5">
          <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Executive Takeaways (Crisp 3-Bullet Brief)
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {routing.executiveBullets.slice(0, 3).map((bullet, idx) => (
              <div
                key={idx}
                className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3 text-xs font-mono text-zinc-300 leading-snug flex items-start gap-2"
              >
                <span className="text-blue-400 font-bold mt-0.5">•</span>
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step-by-Step Runbook Section */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              Targeted SRE Runbook Remediation Checklist
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Production-hardened commands designed to resolve contention without data loss or shopper disruption.
            </p>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Verification probes verified
          </span>
        </div>

        {/* Steps List */}
        <div className="space-y-4">
          {routing.runbookSteps.map((step, index) => {
            const isDone = !!executedSteps[step.id];

            return (
              <div
                key={step.id}
                className={`border rounded-xl p-5 transition-all ${
                  isDone
                    ? "bg-emerald-950/10 border-emerald-500/30"
                    : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {/* Step Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExecuted(step.id)}
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-all border ${
                        isDone
                          ? "bg-emerald-500 text-zinc-950 border-emerald-400 font-bold"
                          : "border-zinc-700 text-zinc-400 hover:border-emerald-500 hover:text-emerald-400 bg-zinc-900"
                      }`}
                      title={isDone ? "Mark as Pending" : "Mark as Executed"}
                    >
                      {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <span className="text-xs font-mono font-bold">{index + 1}</span>}
                    </button>

                    <h4
                      className={`text-sm font-mono font-bold ${
                        isDone ? "text-emerald-300 line-through opacity-75" : "text-white"
                      }`}
                    >
                      Step {index + 1}: {step.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span
                      className={`px-2.5 py-0.5 rounded font-bold text-[10px] uppercase ${
                        step.riskLevel === "HIGH"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : step.riskLevel === "MEDIUM"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      Risk: {step.riskLevel}
                    </span>

                    <button
                      onClick={() => toggleExecuted(step.id)}
                      className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors border ${
                        isDone
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white hover:border-zinc-700"
                      }`}
                    >
                      {isDone ? "Executed ✓" : "Mark Executed"}
                    </button>
                  </div>
                </div>

                {/* Explanation */}
                <p className="text-xs text-zinc-300 font-mono mb-3.5 pl-9 leading-relaxed">
                  {step.explanation}
                </p>

                {/* Terminal Monospace Block */}
                <div className="ml-0 sm:ml-9 bg-zinc-900 border border-zinc-800 rounded-lg p-3.5 font-mono text-xs relative">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-zinc-800 pb-2 mb-2.5">
                    <span className="flex items-center gap-1.5 text-zinc-400 font-semibold uppercase tracking-wider">
                      <Terminal className="w-3 h-3 text-blue-400" />
                      EXECUTE RUNBOOK COMMAND
                    </span>
                    <button
                      onClick={() => handleCopy(step.id, step.command)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
                    >
                      {copiedId === step.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Command</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-blue-400 overflow-x-auto whitespace-pre-wrap select-all py-1 font-semibold leading-relaxed">
                    $ {step.command}
                  </div>

                  {step.verificationCmd && (
                    <div className="mt-2.5 pt-2.5 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex items-center justify-between">
                      <div>
                        <span className="text-emerald-400 font-bold mr-1.5">Verification Probe:</span>
                        <code className="text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded text-[10px] border border-zinc-800">
                          $ {step.verificationCmd}
                        </code>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono hidden md:inline">
                        Expected: {step.expectedOutcome}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
