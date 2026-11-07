"use client";

import React from "react";
import {
  Flame,
  Volume2,
  Square,
  Download,
  FolderInput,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Cpu,
} from "lucide-react";
import { IncidentPreset } from "@/types/incident";

interface TopControlBarProps {
  currentPresetId: string;
  onSelectPreset: (presetId: string) => void;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
  isVoicePlaying: boolean;
  onPlayVoiceBriefing: () => void;
  onStopVoiceBriefing: () => void;
  isAnalyzing: boolean;
  serverError: string | null;
  onDownloadPdf: () => void;
  isDownloadingPdf?: boolean;
  activeModel?: string;
  isFallback?: boolean;
  fallbackReason?: string | null;
}

export const TopControlBar: React.FC<TopControlBarProps> = ({
  currentPresetId,
  onSelectPreset,
  isDrawerOpen,
  onToggleDrawer,
  isVoicePlaying,
  onPlayVoiceBriefing,
  onStopVoiceBriefing,
  isAnalyzing,
  serverError,
  onDownloadPdf,
  isDownloadingPdf = false,
  activeModel = "gemini-2.5-flash",
  isFallback = false,
  fallbackReason = null,
}) => {
  return (
    <header className="w-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        {/* Left: Brand + Live Engine Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-500 shadow-sm">
              <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white font-mono">
                  IncidentPulse<span className="text-blue-500">.AI</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold tracking-wide">
                  WAR-ROOM SRE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono tracking-tight hidden sm:block">
                Autonomous Incident Triage & War-Room Copilot
              </p>
            </div>
          </div>

          <div className="h-5 w-px bg-zinc-800 hidden sm:block" />

          {/* Live Server Engine Status Pill */}
          <div className="flex items-center">
            {isAnalyzing ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                ● ANALYZING WITH GEMINI...
              </span>
            ) : isFallback || serverError ? (
              <span
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 max-w-xs truncate"
                title={fallbackReason || serverError || "Deterministic fallback engine active"}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span className="truncate">
                  ● FALLBACK MODE: {fallbackReason?.split(":")[0]?.substring(0, 20) || serverError?.split(":")[0]?.substring(0, 20) || "API CONTINGENCY"}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                ● LIVE GEMINI AI ({activeModel})
              </span>
            )}
          </div>
        </div>

        {/* Right: Quick Presets + Audio + Drawer + Download */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset 1: P1 Outage */}
          <button
            onClick={() => onSelectPreset("preset-p1-payment-outage")}
            disabled={isAnalyzing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border ${
              currentPresetId === "preset-p1-payment-outage"
                ? "bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-roseGlow ring-1 ring-rose-500/30 font-semibold"
                : "bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white"
            } ${isAnalyzing ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <span>Simulate P1 VIP Payment Outage</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-950 text-rose-400 border border-rose-500/20 font-bold ml-0.5">
              $2.4M ARR
            </span>
          </button>

          {/* Preset 2: P2 Auth */}
          <button
            onClick={() => onSelectPreset("preset-p2-auth-spike")}
            disabled={isAnalyzing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border ${
              currentPresetId === "preset-p2-auth-spike"
                ? "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-amberGlow ring-1 ring-amber-500/30 font-semibold"
                : "bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white"
            } ${isAnalyzing ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Simulate P2 Auth Spike</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-950 text-amber-400 border border-amber-500/20 font-bold ml-0.5">
              $850k ARR
            </span>
          </button>

          {/* 30-Sec Crisis Audio Briefing */}
          {isVoicePlaying ? (
            <button
              onClick={onStopVoiceBriefing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-rose-600 text-white border border-rose-500 hover:bg-rose-700 transition-all shadow-roseGlow"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop Briefing</span>
              <div className="flex items-center gap-0.5 h-3 ml-1">
                <span className="w-0.5 bg-white rounded-full animate-wave-1"></span>
                <span className="w-0.5 bg-white rounded-full animate-wave-2"></span>
                <span className="w-0.5 bg-white rounded-full animate-wave-3"></span>
                <span className="w-0.5 bg-white rounded-full animate-wave-4"></span>
                <span className="w-0.5 bg-white rounded-full animate-wave-5"></span>
              </div>
            </button>
          ) : (
            <button
              onClick={onPlayVoiceBriefing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-400 transition-all"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Play 30-Sec Crisis Briefing</span>
            </button>
          )}

          {/* Drawer Toggle */}
          <button
            onClick={onToggleDrawer}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border ${
              isDrawerOpen
                ? "bg-zinc-800 text-white border-zinc-700"
                : "bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white"
            }`}
          >
            <FolderInput className="w-3.5 h-3.5 text-zinc-400" />
            <span>{isDrawerOpen ? "Hide Log Drawer" : "Paste Logs / Upload File"}</span>
          </button>

          {/* Top-Bar PDF Export */}
          <button
            onClick={onDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-zinc-900 text-zinc-200 border border-zinc-800 hover:border-zinc-700 hover:text-white transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isDownloadingPdf ? "Generating..." : "Download PDF Report"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export const CommandHeader = TopControlBar;

