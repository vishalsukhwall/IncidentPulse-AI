"use client";

import React from "react";
import {
  Clock,
  Flame,
  Search,
  ShieldCheck,
  Activity,
  FileCode,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { TimelinePillar } from "@/types/incident";

interface TimelineTabProps {
  timeline: TimelinePillar[];
}

export const TimelineTab: React.FC<TimelineTabProps> = ({ timeline }) => {
  const getPillarIcon = (id: string) => {
    switch (id) {
      case "kab-chalu-hua":
        return <Clock className="w-4 h-4 text-amber-400" />;
      case "kya-hua":
        return <Flame className="w-4 h-4 text-rose-400" />;
      case "kyun-hua":
        return <Search className="w-4 h-4 text-blue-400" />;
      case "ab-kya-karein":
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      default:
        return <Activity className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getPillarStyles = (id: string) => {
    switch (id) {
      case "kab-chalu-hua":
        return {
          border: "border-amber-500/30",
          badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          node: "border-amber-400 text-amber-400",
        };
      case "kya-hua":
        return {
          border: "border-rose-500/40",
          badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          node: "border-rose-500 text-rose-400 animate-pulse",
        };
      case "kyun-hua":
        return {
          border: "border-blue-500/30",
          badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          node: "border-blue-400 text-blue-400",
        };
      case "ab-kya-karein":
        return {
          border: "border-emerald-500/30",
          badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          node: "border-emerald-400 text-emerald-400",
        };
      default:
        return {
          border: "border-zinc-800",
          badge: "bg-zinc-800 text-zinc-300 border-zinc-700",
          node: "border-zinc-500 text-zinc-400",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-mono">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            4-Stage Chronological Incident Narrative (Pillars of Truth)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Structured narrative extracted from raw logs & customer escalations: Kab Chalu Hua → Kya Hua → Kyun Hua → Ab Kya Kar Sakte Hain.
          </p>
        </div>
        <span className="text-[11px] px-3 py-1 rounded bg-zinc-950 text-zinc-400 border border-zinc-800 shrink-0">
          Telemetry Correlated
        </span>
      </div>

      {/* Timeline Grid */}
      <div className="relative pl-6 sm:pl-10 space-y-6 before:absolute before:left-3 sm:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-amber-400 via-rose-500 to-emerald-400">
        {timeline.map((pillar) => {
          const styles = getPillarStyles(pillar.id);

          return (
            <div key={pillar.id} className="relative group">
              {/* Timeline Node Icon Circle */}
              <div
                className={`absolute -left-6 sm:-left-10 top-0 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-zinc-950 border-2 flex items-center justify-center transition-all ${styles.node}`}
              >
                {getPillarIcon(pillar.id)}
              </div>

              {/* Pillar Content Card */}
              <div
                className={`bg-zinc-900/80 border rounded-xl p-6 ml-3 sm:ml-2 transition-all ${styles.border} hover:bg-zinc-900`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider ${styles.badge}`}
                  >
                    {pillar.pillarBadge}
                  </span>

                  <span className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    {pillar.timestamp}
                  </span>
                </div>

                <h4 className="text-sm font-mono font-bold text-white mb-2">
                  {pillar.title}
                </h4>

                <p className="text-xs text-zinc-300 font-mono leading-relaxed mb-4">
                  {pillar.summary}
                </p>

                {/* Scannable Bullets (Max 2 lines per bullet) */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-2.5 mb-3.5">
                  {pillar.bullets.map((bullet, bIdx) => (
                    <div
                      key={bIdx}
                      className="flex items-start gap-2 text-xs font-mono text-zinc-300"
                    >
                      <span className="text-blue-400 font-bold mt-0.5">•</span>
                      <span className="leading-snug">{bullet}</span>
                    </div>
                  ))}
                </div>

                {/* Telemetry / Log Grounding Reference */}
                {pillar.codeOrLogReference && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-[11px] text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                      GROUNDING CITATION:
                    </span>
                    <code className="text-rose-300 break-all select-all font-semibold">
                      {pillar.codeOrLogReference}
                    </code>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
