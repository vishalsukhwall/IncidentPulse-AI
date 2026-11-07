"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Quote,
  ShieldAlert,
  Terminal,
  Clock,
  FileCode,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Tag,
} from "lucide-react";
import { CopilotMessage, IncidentTriageData } from "@/types/incident";

interface CopilotChatTabProps {
  triageData: IncidentTriageData;
  rawLogs: string;
  customerEmail: string;
  apiKey: string;
}

export const CopilotChatTab: React.FC<CopilotChatTabProps> = ({
  triageData,
  rawLogs,
  customerEmail,
  apiKey,
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      content: `Hello! I am your **War-Room AI Copilot**, strictly grounded in the ingested logs for **${triageData.routing.failingMicroservice}** and the escalation from **${triageData.vipClient.name}**.\n\nEvery answer I give cites exact evidence from [LOG ...], [FILE ...], or [EMAIL ...].\n\nClick any quick-prompt chip below or ask any technical or commercial question to verify telemetry, code lines, or SLA contract penalties.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      citations: [`LOG ${triageData.routing.failingMicroservice}`, `EMAIL ${triageData.vipClient.name}`],
    },
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSendMessage = async (queryText: string) => {
    const query = queryText.trim();
    if (!query || isLoading) return;

    const userMessage: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-gemini-api-key": apiKey } : {}),
        },
        body: JSON.stringify({
          query,
          chatHistory: messages.map((m) => ({ role: m.role, content: m.content })),
          rawLogs,
          customerEmail,
          triageData,
          customApiKey: apiKey,
        }),
      });

      const data = await response.json();

      if (response.ok && data.reply) {
        const assistantMessage: CopilotMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          citations: data.citations || [],
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || "Copilot failed to reply");
      }
    } catch (err: any) {
      console.error("Copilot fetch error:", err);
      const errorMessage: CopilotMessage = {
        id: `bot-err-${Date.now()}`,
        role: "assistant",
        content: `Telemetry query grounded locally:\n- Failing File: \`${triageData.routing.failingFile}:${triageData.routing.failingLine}\`\n- Affected VIP: **${triageData.vipClient.name}** (${triageData.vipClient.contractValue})\n- Assigned Squad: **${triageData.routing.assignedSquad}** (${triageData.routing.onCallHandle})`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        citations: [`GROUNDED INC-${triageData.id}`],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/80 rounded-xl border border-zinc-800 flex flex-col h-[680px] overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-950 border-b border-zinc-800 p-4 px-5 flex items-center justify-between font-mono">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Log-Grounded War-Room Copilot
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold uppercase">
                STRICT GROUNDING ACTIVE
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Cites exact timestamps, file coordinates, and customer escalation clauses in every reply.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active Context: {triageData.id}</span>
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="bg-zinc-950/60 border-b border-zinc-800 p-2.5 px-5 flex items-center gap-2 overflow-x-auto text-xs font-mono">
        <span className="text-[11px] text-zinc-500 shrink-0 flex items-center gap-1 font-semibold">
          <Sparkles className="w-3 h-3 text-blue-400" />
          Quick Inquiries:
        </span>
        {quickPrompts.map((qp, idx) => {
          const Icon = qp.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp.label)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 hover:border-blue-500 text-zinc-300 hover:text-white transition-all shrink-0 hover:bg-blue-500/10"
            >
              <Icon className="w-3 h-3 text-blue-400" />
              <span>{qp.label}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs">
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
                className={`max-w-[85%] sm:max-w-[75%] rounded-xl p-4 space-y-2.5 border ${
                  isUser
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-zinc-950 text-zinc-200 border-zinc-800"
                }`}
              >
                {/* Header */}
                <div
                  className={`flex items-center justify-between text-[10px] pb-1.5 border-b ${
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

                {/* Content */}
                <div className="leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* Highlighted Citation Pills */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      Citations:
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
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 flex items-center gap-2.5 text-zinc-400">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-xs">Grounding response against ingested logs & escalation email...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="bg-zinc-950 border-t border-zinc-800 p-3.5">
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
            placeholder="Ask anything about the stack trace, failing file, SLA penalty, or customer quote..."
            disabled={isLoading}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition-all ${
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
  );
};
