"use client";

import React from "react";
import {
  AlertOctagon,
  Clock,
  DollarSign,
  ShieldAlert,
  Server,
  Users,
  Flame,
  FileCode,
} from "lucide-react";
import { IncidentAnalysisData } from "@/types/incident";

interface SlaTelemetryStripProps {
  analysisData: IncidentAnalysisData;
  remainingSeconds: number;
}

export const SlaTelemetryStrip: React.FC<SlaTelemetryStripProps> = ({
  analysisData,
  remainingSeconds,
}) => {
  const { severity, sentimentScore, sentimentLabel, vipClients, routing, slaRuleSummary } =
    analysisData;

  const primaryVip = vipClients[0] || {
    name: "Enterprise Customer",
    tier: "Tier-1 Enterprise",
    arr: "$1.0M ARR",
    slaThresholdMinutes: 30,
    penaltyTerms: "Standard SLA invoice credit",
    primaryContact: "VP Engineering",
    impactSummary: "Operational degradation",
  };

  const formatTime = (totalSec: number) => {
    if (totalSec <= 0) return "00:00 (BREACHED)";
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const totalSla = (primaryVip.slaThresholdMinutes || 30) * 60;
  const progressPercent = Math.max(0, Math.min(100, (remainingSeconds / totalSla) * 100));
  const isP1 = severity === "P1";
  const isBreached = remainingSeconds <= 0;

  return (
    <section className="w-full bg-zinc-950 border-b border-zinc-800/80 px-4 lg:px-6 py-5">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Top 4 KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI Card 1: Severity Level */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 relative overflow-hidden transition-all hover:border-zinc-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-semibold">
                <AlertOctagon className={`w-3.5 h-3.5 ${isP1 ? "text-rose-400" : "text-amber-400"}`} />
                Incident Severity
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
                {analysisData.id}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-black font-mono tracking-tight ${
                  isP1 ? "text-rose-400" : "text-amber-400"
                }`}
              >
                {severity} {isP1 ? "CRITICAL" : "HIGH"}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-semibold truncate">
                Direct Revenue Risk
              </span>
              <span className="text-[10px] font-mono text-zinc-400 truncate">
                {primaryVip.impactSummary.split(".")[0]}
              </span>
            </div>
          </div>

          {/* KPI Card 2: Live Ticking Red SLA Countdown */}
          <div
            className={`bg-zinc-900/90 border rounded-xl p-5 relative overflow-hidden transition-all ${
              isBreached
                ? "border-rose-500/80 bg-rose-950/20 shadow-roseGlow"
                : remainingSeconds < 600
                ? "border-rose-500/40 shadow-roseGlow"
                : "border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-semibold">
                <Clock className="w-3.5 h-3.5 text-rose-400 animate-spin-slow" />
                Live SLA Countdown
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
                Target: {primaryVip.slaThresholdMinutes}m
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span
                className={`text-2xl font-black font-mono tracking-wider tabular-nums ${
                  isBreached
                    ? "text-rose-500 animate-ping"
                    : remainingSeconds < 600
                    ? "text-rose-400"
                    : "text-amber-400"
                }`}
              >
                {formatTime(remainingSeconds)}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold uppercase">
                {isBreached ? "BREACHED" : "REMAINING"}
              </span>
            </div>

            <div className="w-full bg-zinc-950 h-1.5 rounded-full mt-3 overflow-hidden border border-zinc-800/80">
              <div
                className={`h-full transition-all duration-1000 ${
                  isBreached
                    ? "bg-rose-500 w-full"
                    : remainingSeconds < 600
                    ? "bg-rose-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* KPI Card 3: Customer Anger & Sentiment Score */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 relative overflow-hidden transition-all hover:border-zinc-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-semibold">
                <Flame
                  className={`w-3.5 h-3.5 ${
                    sentimentScore > 85 ? "text-rose-400" : "text-amber-400"
                  }`}
                />
                Customer Anger Score
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  sentimentScore > 85
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                {sentimentScore > 85 ? "CRITICAL" : "ELEVATED"}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-black font-mono tracking-tight ${
                  sentimentScore > 85 ? "text-rose-400" : "text-amber-400"
                }`}
              >
                {sentimentScore}
                <span className="text-sm font-normal text-zinc-500">/100</span>
              </span>
              <span className="text-xs font-mono text-zinc-300 font-semibold truncate">
                {sentimentLabel.split("—")[1]?.trim() || sentimentLabel}
              </span>
            </div>

            <div className="w-full bg-zinc-950 h-1.5 rounded-full mt-3 overflow-hidden border border-zinc-800/80">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-700"
                style={{ width: `${sentimentScore}%` }}
              />
            </div>
          </div>

          {/* KPI Card 4: VIP ARR at Risk */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 relative overflow-hidden transition-all hover:border-zinc-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-semibold">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                VIP Contract Value at Risk
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                {primaryVip.tier.split(" ")[0]}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
                {primaryVip.arr}
              </span>
              <span className="text-xs font-mono text-zinc-300 truncate font-semibold">
                {primaryVip.name}
              </span>
            </div>

            <div className="mt-3">
              <p className="text-[10px] font-mono text-zinc-400 truncate" title={primaryVip.penaltyTerms}>
                Penalty: {primaryVip.penaltyTerms}
              </p>
            </div>
          </div>
        </div>

        {/* Executive Banner: Locus & Owning Squad */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 px-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2 text-zinc-300">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold shrink-0">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              VIP CLIENT ESCALATION:
            </span>
            <span className="text-white font-bold">{primaryVip.name}</span>
            <span className="text-zinc-500 hidden sm:inline">•</span>
            <span className="text-zinc-400 truncate hidden sm:inline">
              Contact: {primaryVip.primaryContact}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
              <Server className="w-3 h-3 text-blue-400" />
              <span className="text-zinc-500">Service:</span>
              <span className="text-white font-semibold">{routing.microservice}</span>
            </span>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
              <FileCode className="w-3 h-3 text-rose-400" />
              <span className="text-zinc-500">Locus:</span>
              <span className="text-rose-300 font-semibold">{routing.failingFile}:{routing.failingLine}</span>
            </span>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
              <Users className="w-3 h-3 text-emerald-400" />
              <span className="text-zinc-500">Squad:</span>
              <span className="text-emerald-300 font-semibold">{routing.assignedDepartment}</span>
              <span className="text-zinc-400">({routing.onCallHandle.split(" ")[0]})</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
