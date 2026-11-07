"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ALL_PRESETS,
  PRESET_P1_PAYMENT_OUTAGE,
  PRESET_P2_AUTH_SPIKE,
} from "@/data/incidentPresets";
import { IncidentPreset, IncidentAnalysisData } from "@/types/incident";
import { TopControlBar } from "@/components/TopControlBar";
import { SlaTelemetryStrip } from "@/components/SlaTelemetryStrip";
import { LogInputDrawer } from "@/components/LogInputDrawer";
import { OverviewRoutingTab } from "@/components/OverviewRoutingTab";
import { TimelineAnalysisTab } from "@/components/TimelineAnalysisTab";
import { DualReportsTab } from "@/components/DualReportsTab";
import { CopilotSplitTab } from "@/components/CopilotSplitTab";
import { generateIncidentPdf } from "@/lib/pdfReportGenerator";
import {
  Terminal,
  Clock,
  FileText,
  Bot,
  Square,
  Sparkles,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from "lucide-react";

export default function IncidentPulseCommandCenter() {
  // Preset & Ingestion state
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    PRESET_P1_PAYMENT_OUTAGE.id
  );
  const [rawText, setRawText] = useState<string>(PRESET_P1_PAYMENT_OUTAGE.rawText);
  const [analysisData, setAnalysisData] = useState<IncidentAnalysisData>(
    PRESET_P1_PAYMENT_OUTAGE.initialAnalysis
  );

  // SLA Live Countdown State
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    (PRESET_P1_PAYMENT_OUTAGE.initialAnalysis.slaMinutesRemaining || 18) * 60
  );

  // Active Tab
  const [activeTab, setActiveTab] = useState<"routing" | "timeline" | "reports" | "copilot">(
    "routing"
  );

  // Drawer & Processing state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Voice Briefing State (Native Web Speech API)
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Multi-step scanning messages
  const scanningSteps = [
    "Ingesting raw multi-service stack traces & customer emails...",
    "Gemini 2.5 Flash evaluating error signature & root failure coordinates...",
    "Computing customer sentiment score & contract ARR at risk...",
    "Formulating 4-stage timeline & step-by-step CLI runbook...",
    "Generating Dual Engineering Post-Mortem & VIP Client Executive Brief...",
  ];

  // Live SLA Timer ticking down every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [analysisData.id]);

  // Handle Preset Selection: populates rawText and runs live /api/analyze
  const handleSelectPreset = async (presetId: string) => {
    const preset = ALL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    handleStopVoice();
    setSelectedPresetId(preset.id);
    setRawText(preset.rawText);
    setServerError(null);

    // Run live Gemini analysis on preset
    await triggerLiveAnalysis(preset.rawText);
  };

  // Trigger Live Gemini 2.5 Flash Analysis
  const triggerLiveAnalysis = async (textToAnalyze: string) => {
    if (!textToAnalyze.trim()) return;

    handleStopVoice();
    setIsAnalyzing(true);
    setServerError(null);
    setAnalysisStep(0);

    // Multi-stage indicator intervals
    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => (prev < scanningSteps.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rawText: textToAnalyze }),
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setAnalysisData(result.data);
        const mins = result.data.slaMinutesRemaining || 20;
        setRemainingSeconds(mins * 60);
        setIsDrawerOpen(false);
      } else {
        throw new Error(
          result.error ||
            "Gemini API analysis failed. Please verify GEMINI_API_KEY in .env.local and restart the server."
        );
      }
    } catch (err: any) {
      console.error("[Live Analysis Error]:", err);
      setServerError(err.message || String(err));
    } finally {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
    }
  };

  // Web Speech API Handlers
  const handlePlayVoice = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Browser does not support native Web Speech API.");
      return;
    }

    window.speechSynthesis.cancel();

    const script = analysisData.voiceBriefingScript;
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice =
      voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Natural") ||
            v.name.includes("Google") ||
            v.name.includes("Samantha") ||
            v.name.includes("Daniel"))
      ) || voices.find((v) => v.lang.startsWith("en"));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => setIsVoicePlaying(true);
    utterance.onend = () => setIsVoicePlaying(false);
    utterance.onerror = () => setIsVoicePlaying(false);

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleStopVoice = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsVoicePlaying(false);
  };

  // PDF Export
  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    try {
      generateIncidentPdf(analysisData);
    } finally {
      setTimeout(() => setIsDownloadingPdf(false), 600);
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col text-zinc-100">
      {/* 1. Compact Demo-Ready Top Control Bar */}
      <TopControlBar
        currentPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        isDrawerOpen={isDrawerOpen}
        onToggleDrawer={() => setIsDrawerOpen((prev) => !prev)}
        isVoicePlaying={isVoicePlaying}
        onPlayVoiceBriefing={handlePlayVoice}
        onStopVoiceBriefing={handleStopVoice}
        isAnalyzing={isAnalyzing}
        serverError={serverError}
        onDownloadPdf={handleDownloadPdf}
        isDownloadingPdf={isDownloadingPdf}
      />

      {/* Server Error Toast Banner */}
      {serverError && (
        <div className="bg-rose-950 border-b border-rose-800 text-rose-200 px-4 py-3 text-xs font-mono flex items-center justify-between shadow-roseGlow">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong className="text-white">Gemini API Error:</strong> {serverError}
              </span>
            </div>
            <button
              onClick={() => setServerError(null)}
              className="text-rose-400 hover:text-white px-2 py-0.5 rounded bg-zinc-900 border border-rose-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 2. Ingestion Drawer (Collapsible) */}
      <LogInputDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        rawText={rawText}
        setRawText={setRawText}
        onRunAnalysis={() => triggerLiveAnalysis(rawText)}
        isAnalyzing={isAnalyzing}
        onLoadPreset={(pId) => {
          const p = ALL_PRESETS.find((x) => x.id === pId);
          if (p) setRawText(p.rawText);
        }}
      />

      {/* 3. Persistent Executive Telemetry Strip */}
      <SlaTelemetryStrip
        analysisData={analysisData}
        remainingSeconds={remainingSeconds}
      />

      {/* Voice Briefing Spoken Banner */}
      {isVoicePlaying && (
        <div className="sticky top-[53px] z-30 w-full bg-rose-950/95 text-white px-4 py-2 border-b border-rose-800 shadow-roseGlow flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5 h-3.5">
                <span className="w-0.5 bg-rose-400 rounded-full animate-wave-1"></span>
                <span className="w-0.5 bg-rose-400 rounded-full animate-wave-2"></span>
                <span className="w-0.5 bg-rose-400 rounded-full animate-wave-3"></span>
                <span className="w-0.5 bg-rose-400 rounded-full animate-wave-4"></span>
                <span className="w-0.5 bg-rose-400 rounded-full animate-wave-5"></span>
              </div>
              <span className="font-bold uppercase tracking-wider text-rose-300">
                CRISIS VOICE BRIEFING SPOKEN:
              </span>
              <span className="text-zinc-300 truncate max-w-xl hidden md:inline">
                "{analysisData.voiceBriefingScript.substring(0, 95)}..."
              </span>
            </div>

            <button
              onClick={handleStopVoice}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-900 text-rose-400 font-bold border border-rose-800 transition-colors shrink-0"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop Audio</span>
            </button>
          </div>
        </div>
      )}

      {/* Live Analyzing Scanning Overlay */}
      {isAnalyzing && (
        <div className="w-full bg-blue-950/40 border-b border-blue-500/30 px-4 py-3 text-xs font-mono text-blue-200">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
            <div className="flex-1">
              <span className="font-bold text-white mr-2">LIVE GEMINI 2.5 FLASH RUNNING:</span>
              <span className="text-blue-300">{scanningSteps[analysisStep]}</span>
            </div>
            <span className="text-[10px] text-blue-400 uppercase tracking-wider">
              Step {analysisStep + 1} of {scanningSteps.length}
            </span>
          </div>
        </div>
      )}

      {/* 4. Segmented 4-Tab Multi-View Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="border-b border-zinc-800 pb-1">
          <nav className="flex space-x-2 sm:space-x-3 overflow-x-auto font-mono text-xs">
            {/* Tab 1 */}
            <button
              onClick={() => setActiveTab("routing")}
              className={`flex items-center gap-2 py-3 px-4 rounded-t-lg border-b-2 font-bold transition-all shrink-0 ${
                activeTab === "routing"
                  ? "border-blue-500 text-blue-400 bg-blue-500/10"
                  : "border-transparent text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Tab 1: Executive Overview & Auto-Routing</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                {analysisData.routing.runbookSteps.length} Steps
              </span>
            </button>

            {/* Tab 2 */}
            <button
              onClick={() => setActiveTab("timeline")}
              className={`flex items-center gap-2 py-3 px-4 rounded-t-lg border-b-2 font-bold transition-all shrink-0 ${
                activeTab === "timeline"
                  ? "border-amber-400 text-amber-300 bg-amber-500/10"
                  : "border-transparent text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Tab 2: Deep Analysis & Incident Timeline</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                4 Pillars
              </span>
            </button>

            {/* Tab 3 */}
            <button
              onClick={() => setActiveTab("reports")}
              className={`flex items-center gap-2 py-3 px-4 rounded-t-lg border-b-2 font-bold transition-all shrink-0 ${
                activeTab === "reports"
                  ? "border-emerald-400 text-emerald-300 bg-emerald-500/10"
                  : "border-transparent text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Tab 3: Dual-Audience Deliverables & Export</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-emerald-400 border border-emerald-500/20 font-bold">
                Dual PDF
              </span>
            </button>

            {/* Tab 4 */}
            <button
              onClick={() => setActiveTab("copilot")}
              className={`flex items-center gap-2 py-3 px-4 rounded-t-lg border-b-2 font-bold transition-all shrink-0 ${
                activeTab === "copilot"
                  ? "border-purple-400 text-purple-300 bg-purple-500/10"
                  : "border-transparent text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Tab 4: Interactive AI Copilot</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-purple-300 border border-purple-500/20 font-bold">
                Split Viewer
              </span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="pt-2">
          {activeTab === "routing" && (
            <OverviewRoutingTab routing={analysisData.routing} />
          )}

          {activeTab === "timeline" && (
            <TimelineAnalysisTab
              timeline={analysisData.timeline}
              engineerPostMortem={analysisData.dualReports.engineerPostMortem}
            />
          )}

          {activeTab === "reports" && (
            <DualReportsTab
              dualReports={analysisData.dualReports}
              vipClients={analysisData.vipClients}
              severity={analysisData.severity}
              onDownloadPdf={handleDownloadPdf}
              isDownloadingPdf={isDownloadingPdf}
            />
          )}

          {activeTab === "copilot" && (
            <CopilotSplitTab
              analysisData={analysisData}
              rawText={rawText}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-800 bg-zinc-950 py-3.5 px-4 lg:px-6 font-mono text-[11px] text-zinc-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              IncidentPulse AI War-Room Active
            </span>
            <span className="text-zinc-700">•</span>
            <span>Auth: <code className="text-zinc-400">process.env.GEMINI_API_KEY</code></span>
            <span className="text-zinc-700">•</span>
            <span>Model: <code className="text-zinc-400">gemini-3.8-flash</code></span>
          </div>

          <div className="text-zinc-400">
            Autonomous Incident Triage & War-Room Copilot | SRE Engineering Command
          </div>
        </div>
      </footer>
    </div>
  );
}
