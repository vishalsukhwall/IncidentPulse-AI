"use client";

import React, { useState } from "react";
import {
  Flame,
  Volume2,
  Square,
  Sparkles,
  Cpu,
  Key,
  FolderInput,
  Download,
  ShieldAlert,
  Play,
  RotateCcw,
} from "lucide-react";
import { IncidentPreset } from "@/types/incident";

interface CommandHeaderProps {
  currentPresetId: string;
  onSelectPreset: (presetId: string) => void;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
  isVoicePlaying: boolean;
  onPlayVoiceBriefing: () => void;
  onStopVoiceBriefing: () => void;
  engineUsed: "Gemini 2.5 Flash Live" | "Deterministic SRE Engine";
  apiKey: string;
  onSetApiKey: (key: string) => void;
  presets: IncidentPreset[];
  onDownloadPdf: () => void;
  isDownloadingPdf?: boolean;
}

export const CommandHeader: React.FC<CommandHeaderProps> = ({
  currentPresetId,
  onSelectPreset,
  isDrawerOpen,
  onToggleDrawer,
  isVoicePlaying,
  onPlayVoiceBriefing,
  onStopVoiceBriefing,
  engineUsed,
  apiKey,
  onSetApiKey,
  presets,
  onDownloadPdf,
  isDownloadingPdf = false,
}) => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey);

  const handleSaveKey = () => {
    onSetApiKey(keyInput.trim());
    setShowKeyModal(false);
  };

  const isGeminiLive = engineUsed.includes("Gemini");

  return (
    <header className="w-full border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        {/* Left: Branding & Grounding Pill */}
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

          {/* Engine Grounding Status Pill */}
          <button
            onClick={() => setShowKeyModal(true)}
            title="Click to view or set Gemini API Key"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all ${
              isGeminiLive
                ? "bg-purple-500/10 text-purple-300 border-purple-500/30 hover:border-purple-400"
                : "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:border-blue-400"
            }`}
          >
            {isGeminiLive ? (
              <>
                <Sparkles className="w-3 h-3 text-purple-400 animate-spin-slow" />
                <span className="font-medium">Gemini 2.5 Flash Live</span>
              </>
            ) : (
              <>
                <Cpu className="w-3 h-3 text-blue-400" />
                <span className="font-medium">Local SRE Engine</span>
              </>
            )}
            <Key className="w-2.5 h-2.5 text-zinc-400 ml-0.5 opacity-60" />
          </button>
        </div>

        {/* Right: Presets, Briefing, Ingestion & PDF Export Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset 1: Simulate P1 VIP Payment Outage */}
          <button
            onClick={() => onSelectPreset("preset-p1-payment-outage")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border ${
              currentPresetId === "preset-p1-payment-outage"
                ? "bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-roseGlow ring-1 ring-rose-500/30 font-semibold"
                : "bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <span>Simulate P1 VIP Payment Outage</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-950 text-rose-400 border border-rose-500/20 font-bold ml-0.5">
              $2.4M ARR
            </span>
          </button>

          {/* Preset 2: Simulate P2 Auth Spike */}
          <button
            onClick={() => onSelectPreset("preset-p2-auth-spike")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border ${
              currentPresetId === "preset-p2-auth-spike"
                ? "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-amberGlow ring-1 ring-amber-500/30 font-semibold"
                : "bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Simulate P2 Auth Spike</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-950 text-amber-400 border border-amber-500/20 font-bold ml-0.5">
              $850k ARR
            </span>
          </button>

          {/* Voice Crisis Briefing (Web Speech API) */}
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

          {/* Upload / Paste Logs Drawer Trigger */}
          <button
            onClick={onToggleDrawer}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border ${
              isDrawerOpen
                ? "bg-zinc-800 text-white border-zinc-700"
                : "bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white"
            }`}
          >
            <FolderInput className="w-3.5 h-3.5 text-zinc-400" />
            <span>{isDrawerOpen ? "Hide Log Ingestion" : "Upload / Paste Logs"}</span>
          </button>

          {/* Download Dual PDF Report Button (Top Bar 1-Click Export) */}
          <button
            onClick={onDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-zinc-900 text-zinc-200 border border-zinc-800 hover:border-zinc-700 hover:text-white transition-all active:scale-95"
            title="Download Dual 2-Page Executive & Technical Post-Mortem PDF"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isDownloadingPdf ? "Generating..." : "Download PDF Report"}</span>
          </button>
        </div>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-400" />
                Gemini API Key Configuration
              </h3>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-zinc-500 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed font-sans">
              IncidentPulse AI defaults to an offline <span className="text-blue-400 font-semibold font-mono">Deterministic SRE Engine</span>.
              To route live calls through <span className="text-purple-400 font-semibold font-mono">gemini-2.5-flash</span>, enter your Gemini API key below:
            </p>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 mb-4"
            />
            <div className="flex items-center justify-end gap-2 font-mono">
              <button
                onClick={() => {
                  setKeyInput("");
                  onSetApiKey("");
                  setShowKeyModal(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
              >
                Use Local SRE Engine
              </button>
              <button
                onClick={handleSaveKey}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
