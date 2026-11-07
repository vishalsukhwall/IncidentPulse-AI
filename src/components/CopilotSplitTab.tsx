"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Terminal,
  Clock,
  FileCode,
  DollarSign,
  Copy,
  Check,
  FileText,
} from "lucide-react";
import { CopilotChatMessage, IncidentAnalysisData } from "@/types/incident";

interface CopilotSplitTabProps {
  analysisData: IncidentAnalysisData;
  rawText: string;
}

export const CopilotSplitTab: React.FC<CopilotSplitTabProps> = ({
  analysisData,
  rawText,
}) => {
  const [messages, setMessages] = useState<CopilotChatMessage[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      content: `Hello! I am your **War-Room AI Copilot**, strictly grounded in the ingested logs for **${analysisData.routing.microservice}** and the escalation from **${analysisData.vipClients[0]?.name || "VIP Customer"}**.\n\nEvery answer I give cites exact evidence from [LOG ...], [FILE ...], or [EMAIL ...].\n\nClick any quick-prompt chip below or ask any technical or commercial question to verify telemetry, code lines, or SLA contract penalties.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      citations: [
        `LOG ${analysisData.routing.microservice}`,
        `EMAIL ${analysisData.vipClients[0]?.name || "Customer"}`,
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: "Which services are down?", icon: Terminal },
    { label: "What exact line of code crashed?", icon: FileCode },
    { label: "How much SLA time is left?", icon: Clock },
    { label: "What is the ARR contract value at risk?", icon: DollarSign },
    { label: "Who is the on-call engineer?", icon: Bot },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(rawText);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const handleSendMessage = async (queryText: string) => {
    const question = queryText.trim();
    if (!question || isLoading) return;

    const userMessage: CopilotChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          rawText,
          analysisContext: analysisData,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      if (response.ok && data.reply) {
        const assistantMessage: CopilotChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          citations: data.citations || [],
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || "Copilot chat failed");
      }
    } catch (err: any) {
      console.error("Copilot fetch error:", err);
      const errorMessage: CopilotChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: "assistant",
        content: `Error connecting to Gemini API: ${err.message || String(err)}\n\nPlease ensure GEMINI_API_KEY is configured in .env.local and the server has been restarted.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        citations: [`ERROR`],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
      {/* Left: Raw Ingested Input Viewer (5 cols) */}
      <div className="lg:col-span-5 bg-zinc-900/80 rounded-xl border border-zinc-800 flex flex-col overflow-hidden">
        <div className="bg-zinc-950 border-b border-zinc-800 p-3.5 px-4 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Ingested Raw Telemetry & Emails
            </span>
          </div>
          <button
            onClick={handleCopyRaw}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] transition-colors"
          >
            {copiedRaw ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Logs</span>
              </>
            )}
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] text-zinc-300 whitespace-pre-wrap leading-relaxed select-all bg-zinc-950/60">
          {rawText || "[No logs currently loaded]"}
        </div>
      </div>

      {/* Right: Grounded Copilot Chat (7 cols) */}
      <div className="lg:col-span-7 bg-zinc-900/80 rounded-xl border border-zinc-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-950 border-b border-zinc-800 p-3.5 px-4 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                Log-Grounded War-Room Copilot
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold uppercase">
                  STRICT GROUNDING
                </span>
              </h3>
              <p className="text-[10px] text-zinc-400">
                Answers strictly from the left panel using [TIMESTAMP] and [EMAIL] citations.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px]">{analysisData.id}</span>
          </div>
        </div>

        {/* Quick Chips */}
        <div className="bg-zinc-950/60 border-b border-zinc-800 p-2 px-4 flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <span className="text-[10px] text-zinc-500 shrink-0 font-bold uppercase tracking-wider">
            Quick Inquiries:
          </span>
          {quickPrompts.map((qp, idx) => {
            const Icon = qp.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.label)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 hover:border-blue-500 text-zinc-300 hover:text-white transition-all shrink-0 hover:bg-blue-500/10 text-[11px]"
              >
                <Icon className="w-3 h-3 text-blue-400" />
                <span>{qp.label}</span>
              </button>
            );
          })}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
          {messages.map((msg) => {
            const isUser = msg.role === "user";

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5 text-blue-400">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-3.5 space-y-2 border ${
                    isUser
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-zinc-950 text-zinc-200 border-zinc-800"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between text-[10px] pb-1 border-b ${
                      isUser
                        ? "border-blue-400/40 text-blue-100"
                        : "border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <span className="font-bold">
                      {isUser ? "Incident Commander" : "IncidentPulse Copilot"}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div className="leading-relaxed whitespace-pre-wrap text-xs">
                    {msg.content}
                  </div>

                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        Evidence:
                      </span>
                      {msg.citations.map((cite, cIdx) => (
                        <span
                          key={cIdx}
                          className="px-2 py-0.5 rounded font-mono text-[10px] bg-zinc-900 text-purple-300 border border-purple-500/30 font-medium"
                        >
                          {cite}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5 text-white">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center gap-2 text-zinc-400">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span className="text-xs">Searching left panel for evidence...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="bg-zinc-950 border-t border-zinc-800 p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputQuery);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything about the stack trace, SLA penalty, or customer quote..."
              disabled={isLoading}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                isLoading || !inputQuery.trim()
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blueGlow active:scale-95"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask Copilot</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export const CopilotChatTab = CopilotSplitTab;

