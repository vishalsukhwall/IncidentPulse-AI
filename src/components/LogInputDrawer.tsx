"use client";

import React, { useRef } from "react";
import {
  Terminal,
  RotateCcw,
  Sparkles,
  FileCode,
  Upload,
  X,
} from "lucide-react";

interface LogInputDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rawText: string;
  setRawText: (val: string) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  onLoadPreset: (presetId: string) => void;
}

export const LogInputDrawer: React.FC<LogInputDrawerProps> = ({
  isOpen,
  onClose,
  rawText,
  setRawText,
  onRunAnalysis,
  isAnalyzing,
  onLoadPreset,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawText(text);
      }
    };
    reader.readAsText(file);
  };

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
              Paste server stack traces, K8s logs, or customer emails to trigger live Gemini 2.5 Flash analysis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.log,.json,.csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Upload Log File</span>
            </button>
            <button
              onClick={() => onLoadPreset("preset-p1-payment-outage")}
              className="text-xs font-mono px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-rose-500/50 transition-colors"
            >
              Load P1 Preset
            </button>
            <button
              onClick={() => onLoadPreset("preset-p2-auth-spike")}
              className="text-xs font-mono px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-amber-500/50 transition-colors"
            >
              Load P2 Preset
            </button>
            <button
              onClick={() => setRawText("")}
              className="text-xs font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
              title="Clear input"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 ml-1"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              Ingested Text (Raw Logs + Escalation Emails)
            </label>
            <span className="text-[10px] font-mono text-zinc-500">
              Live Gemini 2.5 Flash processes full untruncated telemetry
            </span>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste raw server logs, stack traces, and angry customer emails here..."
            rows={8}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 resize-y leading-relaxed"
          />
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>Sends directly to `/api/analyze` using `process.env.GEMINI_API_KEY`.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-xs font-mono px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onRunAnalysis}
              disabled={isAnalyzing || !rawText.trim()}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-mono font-bold text-white transition-all shadow-md ${
                isAnalyzing
                  ? "bg-blue-600/50 cursor-not-allowed"
                  : !rawText.trim()
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 shadow-blueGlow active:scale-95"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing with Gemini 2.5 Flash...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run Live AI Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
