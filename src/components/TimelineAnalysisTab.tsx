"use client";

import React from "react";
import {
  Clock,
  Flame,
  Search,
  ShieldCheck,
  Activity,
  FileCode,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import { IncidentTimeline, EngineerPostMortem } from "@/types/incident";

interface TimelineAnalysisTabProps {
  timeline: IncidentTimeline;
  engineerPostMortem: EngineerPostMortem;
}

export const TimelineAnalysisTab: React.FC<TimelineAnalysisTabProps> = ({
  timeline,
  engineerPostMortem,
}) => {
  const { startedAt, whatHappened, whyItHappened, immediateAction, longTermPrevention } =
    timeline;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-mono">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Chronological Incident Timeline (4 Pillars of Truth)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Strict chronological reconstruction: Kab Chalu Hua → Kya Hua → Kyun Hua → Ab Kya Kar Sakte Hain.
          </p>
        </div>
        <span className="text-[11px] px-3 py-1 rounded bg-zinc-950 text-zinc-400 border border-zinc-800 shrink-0">
          Telemetry & Log Grounded
        </span>
      </div>

      {/* Side-by-Side Deep Analysis: Stack Trace vs Plain-English Root Cause */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Raw Stack Trace Evidence */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-rose-400" />
              Stack Trace & Code Evidence
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
              RAW LOG PROOF
            </span>
          </div>
          <pre className="bg-zinc-950 text-rose-300 p-3.5 rounded-lg border border-zinc-800 text-[10px] overflow-x-auto leading-relaxed select-all">
            {whyItHappened.codeSnippetOrTrace || engineerPostMortem.stackTraceExcerpts}
          </pre>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
            <span>Citation:</span>
            <span className="text-rose-300 font-bold">{whyItHappened.citation}</span>
          </div>
        </div>

        {/* Right: Plain-English Technical Breakdown */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-blue-400" />
              Plain-English Root Cause Chain
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
              DIAGNOSTIC
            </span>
          </div>
          <p className="text-xs text-zinc-200 leading-relaxed bg-zinc-950 p-3.5 rounded-lg border border-zinc-800">
            {engineerPostMortem.rootCauseAnalysis}
          </p>
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
              Failure Chain:
            </span>
            {whyItHappened.technicalChain.map((link, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px] text-zinc-300">
                <span className="text-blue-400 font-bold mt-0.5">•</span>
                <span className="leading-snug">{link}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Pillars of Truth Vertical Timeline */}
      <div className="relative pl-6 sm:pl-10 space-y-6 before:absolute before:left-3 sm:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-amber-400 via-rose-500 to-emerald-400">
        {/* Pillar 1: Kab Chalu Hua */}
        <div className="relative group">
          <div className="absolute -left-6 sm:-left-10 top-0 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-zinc-950 border-2 border-amber-400 text-amber-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>

          <div className="bg-zinc-900/80 border border-amber-500/30 rounded-xl p-6 ml-3 sm:ml-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider bg-amber-500/10 text-amber-400 border-amber-500/20">
                1. KAB CHALU HUA (INCIDENT START)
              </span>
              <span className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                {startedAt.timestamp}
              </span>
            </div>

            <h4 className="text-sm font-mono font-bold text-white mb-2">{startedAt.title}</h4>
            <p className="text-xs text-zinc-300 font-mono leading-relaxed mb-4">{startedAt.summary}</p>

            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-2 mb-3.5">
              {startedAt.bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs font-mono text-zinc-300">
                  <span className="text-amber-400 font-bold mt-0.5">•</span>
                  <span className="leading-snug">{bullet}</span>
                </div>
              ))}
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-[11px] text-zinc-400 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">CITATION:</span>
              <code className="text-amber-300 font-semibold">{startedAt.citation}</code>
            </div>
          </div>
        </div>

        {/* Pillar 2: Kya Hua */}
        <div className="relative group">
          <div className="absolute -left-6 sm:-left-10 top-0 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-zinc-950 border-2 border-rose-500 text-rose-400 animate-pulse flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>

          <div className="bg-zinc-900/80 border border-rose-500/40 rounded-xl p-6 ml-3 sm:ml-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider bg-rose-500/10 text-rose-400 border-rose-500/20">
                2. KYA HUA (BLAST RADIUS & IMPACT)
              </span>
              <span className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                {whatHappened.timestamp}
              </span>
            </div>

            <h4 className="text-sm font-mono font-bold text-white mb-2">{whatHappened.title}</h4>
            <p className="text-xs text-zinc-300 font-mono leading-relaxed mb-4">{whatHappened.summary}</p>

            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-2 mb-3.5">
              {whatHappened.bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs font-mono text-zinc-300">
                  <span className="text-rose-400 font-bold mt-0.5">•</span>
                  <span className="leading-snug">{bullet}</span>
                </div>
              ))}
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-[11px] text-zinc-400 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">BLAST RADIUS:</span>
              <span className="text-rose-300 font-semibold">{whatHappened.blastRadius}</span>
            </div>
          </div>
        </div>

        {/* Pillar 3: Kyun Hua */}
        <div className="relative group">
          <div className="absolute -left-6 sm:-left-10 top-0 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-zinc-950 border-2 border-blue-400 text-blue-400 flex items-center justify-center">
            <Search className="w-4 h-4" />
          </div>

          <div className="bg-zinc-900/80 border border-blue-500/30 rounded-xl p-6 ml-3 sm:ml-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider bg-blue-500/10 text-blue-400 border-blue-500/20">
                3. KYUN HUA (ROOT CAUSE ANALYSIS)
              </span>
              <span className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                {whyItHappened.timestamp}
              </span>
            </div>

            <h4 className="text-sm font-mono font-bold text-white mb-2">{whyItHappened.title}</h4>
            <p className="text-xs text-zinc-300 font-mono leading-relaxed mb-4">{whyItHappened.summary}</p>

            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-2 mb-3.5">
              {whyItHappened.technicalChain.map((chain, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs font-mono text-zinc-300">
                  <span className="text-blue-400 font-bold mt-0.5">•</span>
                  <span className="leading-snug">{chain}</span>
                </div>
              ))}
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-[11px] text-zinc-400 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">LOCUS CITATION:</span>
              <code className="text-blue-300 font-semibold">{whyItHappened.citation}</code>
            </div>
          </div>
        </div>

        {/* Pillar 4: Ab Kya Kar Sakte Hain */}
        <div className="relative group">
          <div className="absolute -left-6 sm:-left-10 top-0 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-zinc-950 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>

          <div className="bg-zinc-900/80 border border-emerald-500/30 rounded-xl p-6 ml-3 sm:ml-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                4. AB KYA KAR SAKTE HAIN (IMMEDIATE ACTION & RUNBOOK)
              </span>
              <span className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                {immediateAction.timestamp}
              </span>
            </div>

            <h4 className="text-sm font-mono font-bold text-white mb-2">{immediateAction.title}</h4>
            <p className="text-xs text-zinc-300 font-mono leading-relaxed mb-4">{immediateAction.summary}</p>

            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-2 mb-3.5">
              {immediateAction.actionBullets.map((action, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs font-mono text-zinc-300">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span className="leading-snug">{action}</span>
                </div>
              ))}
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-[11px] text-zinc-400 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">PREVENTION REF:</span>
              <span className="text-emerald-300 font-semibold">{longTermPrevention.ticketRef}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
