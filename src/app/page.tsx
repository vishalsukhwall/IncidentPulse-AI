"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ALL_PRESETS,
  PRESET_P1_PAYMENT_OUTAGE,
  PRESET_P2_AUTH_SPIKE,
} from "@/data/incidentPresets";
import { IncidentPreset, IncidentTriageData } from "@/types/incident";
import { CommandHeader } from "@/components/CommandHeader";
import { SlaTelemetryStrip } from "@/components/SlaTelemetryStrip";
import { LogIngestionDrawer } from "@/components/LogIngestionDrawer";
import { RoutingRunbookTab } from "@/components/RoutingRunbookTab";
import { TimelineTab } from "@/components/TimelineTab";
import { DualReportTab } from "@/components/DualReportTab";
import { CopilotChatTab } from "@/components/CopilotChatTab";
import { generateIncidentPdf } from "@/lib/pdfReportGenerator";
import {
  Terminal,
  Clock,
  FileText,
  Bot,
  Square,
  Volume2,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

export default function WarRoomDashboard() {
  // Active Preset & Ingestion state
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    PRESET_P1_PAYMENT_OUTAGE.id
  );
  const [rawLogs, setRawLogs] = useState<string>(PRESET_P1_PAYMENT_OUTAGE.rawLogs);
  const [customerEmail, setCustomerEmail] = useState<string>(
    PRESET_P1_PAYMENT_OUTAGE.customerEmail
  );
  const [triageData, setTriageData] = useState<IncidentTriageData>(
    PRESET_P1_PAYMENT_OUTAGE.triageData
  );

  // SLA Live Countdown State
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    PRESET_P1_PAYMENT_OUTAGE.triageData.slaInitialRemainingSeconds
  );

  // Active Tab: routing | timeline | reports | copilot
  const [activeTab, setActiveTab] = useState<"routing" | "timeline" | "reports" | "copilot">(
    "routing"
  );

  // Ingestion Drawer Open/Closed
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTriageLoading, setIsTriageLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Voice Briefing State (Native Web Speech API)
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // API Key management
  const [apiKey, setApiKey] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("incidentpulse_gemini_key");
      if (savedKey) setApiKey(savedKey);
    }
  }, []);

  const handleSetApiKey = (key: string) => {
    setApiKey(key);
    if (typeof window !== "undefined") {
      if (key) {
        localStorage.setItem("incidentpulse_gemini_key", key);
      } else {
        localStorage.removeItem("incidentpulse_gemini_key");
      }
    }
  };

  // Live SLA Countdown ticking down every second
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [triageData.id]);

  // Handle Preset Switching
  const handleSelectPreset = (presetId: string) => {
    const preset = ALL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    handleStopVoice();

    setSelectedPresetId(preset.id);
    setRawLogs(preset.rawLogs);
    setCustomerEmail(preset.customerEmail);
    setTriageData(preset.triageData);
    setRemainingSeconds(preset.triageData.slaInitialRemainingSeconds);
  };

  // Handle Run AI Triage
  const handleRunTriage = async () => {
    if (!rawLogs.trim() && !customerEmail.trim()) return;

    handleStopVoice();
    setIsTriageLoading(true);

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-gemini-api-key": apiKey } : {}),
        },
        body: JSON.stringify({
          rawLogs,
          customerEmail,
          customApiKey: apiKey,
        }),
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setTriageData(result.data);
        setRemainingSeconds(result.data.slaInitialRemainingSeconds || 1125);
        setIsDrawerOpen(false);
      } else {
        throw new Error(result.error || "Triage failed");
      }
    } catch (err: any) {
      console.error("Triage call failed, falling back locally:", err);
    } finally {
      setIsTriageLoading(false);
    }
  };

  // Web Speech API Handlers
  const handlePlayVoice = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Browser does not support native Web Speech API.");
      return;
    }

    window.speechSynthesis.cancel();

    const script = triageData.voiceBriefingScript;
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice =
      voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Daniel"))) ||
      voices.find((v) => v.lang.startsWith("en"));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      setIsVoicePlaying(true);
    };

    utterance.onend = () => {
      setIsVoicePlaying(false);
    };

    utterance.onerror = () => {
      setIsVoicePlaying(false);
    };

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleStopVoice = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsVoicePlaying(false);
  };

  const handleDownloadPdfGlobal = () => {
    setIsDownloadingPdf(true);
    try {
      generateIncidentPdf(triageData);
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
      {/* 1. Top Control Bar */}
      <CommandHeader
        currentPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        isDrawerOpen={isDrawerOpen}
        onToggleDrawer={() => setIsDrawerOpen((prev) => !prev)}
        isVoicePlaying={isVoicePlaying}
        onPlayVoiceBriefing={handlePlayVoice}
        onStopVoiceBriefing={handleStopVoice}
        engineUsed={triageData.engineUsed}
        apiKey={apiKey}
        onSetApiKey={handleSetApiKey}
        presets={ALL_PRESETS}
        onDownloadPdf={handleDownloadPdfGlobal}
        isDownloadingPdf={isDownloadingPdf}
      />

      {/* 2. Collapsible Ingestion Drawer */}
      <LogIngestionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        rawLogs={rawLogs}
        setRawLogs={setRawLogs}
        customerEmail={customerEmail}
        setCustomerEmail={setCustomerEmail}
        onRunTriage={handleRunTriage}
        isLoading={isTriageLoading}
        onLoadPreset={handleSelectPreset}
      />

      {/* 3. Persistent Executive Telemetry Strip */}
      <SlaTelemetryStrip
        triageData={triageData}
        remainingSeconds={remainingSeconds}
      />

      {/* Sticky Voice Briefing Banner */}
      {isVoicePlaying && (
        <div className="sticky top-[57px] z-30 w-full bg-rose-950/95 text-white px-4 py-2 border-b border-rose-800 shadow-roseGlow flex items-center justify-between">
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
                "{triageData.voiceBriefingScript.substring(0, 95)}..."
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

      {/* 4. Main War-Room Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* Clean 4-Tab Navigation */}
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
              <span>Tab 1: Auto-Routing & Runbook Fix</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                {triageData.routing.runbookSteps.length} Steps
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
              <span>Tab 2: Chronological Timeline (4 Pillars)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                4 Stages
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
              <span>Tab 3: Dual Reports & PDF Export</span>
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
              <span>Tab 4: Log-Grounded Copilot Chat</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-purple-300 border border-purple-500/20 font-bold">
                Interactive
              </span>
            </button>
          </nav>
        </div>

        {/* Tab Content Display */}
        <div className="pt-2">
          {activeTab === "routing" && (
            <RoutingRunbookTab routing={triageData.routing} />
          )}

          {activeTab === "timeline" && (
            <TimelineTab timeline={triageData.timeline} />
          )}

          {activeTab === "reports" && (
            <DualReportTab
              triageData={triageData}
              onDownloadPdf={handleDownloadPdfGlobal}
              isDownloadingPdf={isDownloadingPdf}
            />
          )}

          {activeTab === "copilot" && (
            <CopilotChatTab
              triageData={triageData}
              rawLogs={rawLogs}
              customerEmail={customerEmail}
              apiKey={apiKey}
            />
          )}
        </div>
      </main>

      {/* 5. Command Center Bottom Telemetry Strip */}
      <footer className="w-full border-t border-zinc-800 bg-zinc-950 py-3.5 px-4 lg:px-6 font-mono text-[11px] text-zinc-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              IncidentPulse AI War-Room Active
            </span>
            <span className="text-zinc-700">•</span>
            <span>Cluster: <code className="text-zinc-400">prod-eu-west-1</code></span>
            <span className="text-zinc-700">•</span>
            <span>Engine: <code className="text-zinc-400">{triageData.engineUsed}</code></span>
          </div>

          <div className="text-zinc-400">
            Autonomous Incident Triage & War-Room Copilot | Enterprise SRE Systems
          </div>
        </div>
      </footer>
    </div>
  );
}
