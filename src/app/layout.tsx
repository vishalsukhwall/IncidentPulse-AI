import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IncidentPulse AI — Autonomous Incident Triage & War-Room Copilot",
  description:
    "Production-grade enterprise SRE command center. Ingests raw stack traces and customer escalations, determines severity, SLA breach countdown, affected VIP ARR, auto-routing, 4-stage timeline, runbook fixes, and dual-audience reports with PDF export.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-obsidian-900 text-gray-100 min-h-screen antialiased selection:bg-electric-blue selection:text-white">
        {children}
      </body>
    </html>
  );
}
