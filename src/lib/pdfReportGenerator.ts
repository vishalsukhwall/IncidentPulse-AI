import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { IncidentTriageData } from "../types/incident";

export function generateIncidentPdf(data: IncidentTriageData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Helper colors
  const primaryDark = [15, 17, 23] as const;
  const slateText = [71, 85, 105] as const;
  const accentBlue = [59, 130, 246] as const;
  const crimsonRed = [239, 68, 68] as const;
  const emeraldGreen = [16, 185, 129] as const;

  // ==========================================
  // PAGE 1: TECHNICAL POST-MORTEM (ENGINEERING)
  // ==========================================

  // Header Banner
  doc.setFillColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.rect(0, 0, pageWidth, 26, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("INCIDENTPULSE AI — TECHNICAL POST-MORTEM & ROOT CAUSE", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Incident ID: ${data.id}   |   Severity: ${data.severity} CRITICAL   |   Engine: ${data.engineUsed}`,
    14,
    19
  );

  // Metadata Table
  let currentY = 32;

  const metaData = [
    ["Incident Identifier", data.id, "Severity Classification", data.severity],
    ["Failing Microservice", data.routing.failingMicroservice, "Assigned Squad", data.routing.assignedSquad],
    [
      "Failing Code Location",
      `${data.routing.failingFile}:${data.routing.failingLine}`,
      "On-Call SRE",
      data.routing.onCallHandle,
    ],
    ["Affected VIP Customer", data.vipClient.name, "Contract Value at Risk", data.vipClient.contractValue],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [["Attribute", "Value", "Attribute", "Value"]],
    body: metaData,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 40 },
      1: { cellWidth: 55 },
      2: { fontStyle: "bold", cellWidth: 40 },
      3: { cellWidth: 55 },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Section: Root Cause Deep Dive
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text("1. Technical Root Cause & Failure Mechanism", 14, currentY);
  currentY += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const rcaLines = doc.splitTextToSize(data.techPostMortem.rootCauseAnalysis, pageWidth - 28);
  doc.text(rcaLines, 14, currentY);
  currentY += rcaLines.length * 4.5 + 4;

  // Section: Code / Stack Trace Excerpt
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text("2. Stack Trace & Error Signature", 14, currentY);
  currentY += 5;

  doc.setFillColor(248, 250, 252);
  doc.rect(14, currentY, pageWidth - 28, 22, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, currentY, pageWidth - 28, 22, "S");

  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(220, 38, 38);
  const traceLines = doc.splitTextToSize(
    data.techPostMortem.stackTraceExcerpts.substring(0, 320),
    pageWidth - 32
  );
  doc.text(traceLines, 16, currentY + 4.5);
  currentY += 26;

  // Section: Executed Fixes
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text("3. Executed Runbook Mitigations", 14, currentY);
  currentY += 5;

  const fixRows = data.routing.runbookSteps.map((step, idx) => [
    `Step ${idx + 1}`,
    step.title,
    step.command.substring(0, 60) + (step.command.length > 60 ? "..." : ""),
    step.riskLevel,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["ID", "Action Title", "Terminal Command Executed", "Risk"]],
    body: fixRows,
    theme: "plain",
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 15, fontStyle: "bold" },
      1: { cellWidth: 45, fontStyle: "bold" },
      2: { cellWidth: 105, font: "courier" },
      3: { cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Section: Preventative Hardening
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text("4. Preventative Architectural Safeguards", 14, currentY);
  currentY += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  data.techPostMortem.preventativeMeasures.forEach((measure, idx) => {
    doc.text(`• ${measure}`, 16, currentY);
    currentY += 4.5;
  });

  // Footer for Page 1
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Page 1 of 2 — Confidential Internal Engineering Document | Generated ${new Date().toLocaleDateString()}`,
    14,
    pageHeight - 8
  );

  // ==========================================
  // PAGE 2: VIP CLIENT EXECUTIVE BRIEF (NON-TECH)
  // ==========================================
  doc.addPage();

  // Header Banner
  doc.setFillColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.rect(0, 0, pageWidth, 26, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("EXECUTIVE INCIDENT RCA & CLIENT ASSURANCE BRIEF", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Prepared for: ${data.vipClient.name} (${data.vipClient.tier})   |   Incident Ref: ${data.id}`,
    14,
    19
  );

  currentY = 34;

  // Executive Header Block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text("RECIPIENT:", 14, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(data.vipClientBrief.recipient, 40, currentY);
  currentY += 6;

  doc.setFont("helvetica", "bold");
  doc.text("SUBJECT:", 14, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(data.vipClientBrief.subject, 40, currentY);
  currentY += 6;

  doc.setFont("helvetica", "bold");
  doc.text("SLA STATUS:", 14, currentY);
  doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.text(data.vipClientBrief.slaCommitmentStatus, 40, currentY);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  currentY += 10;

  // Plain English Summary Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, currentY, pageWidth - 28, 28, 2, 2, "F");
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, pageWidth - 28, 28, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text("Executive Summary (Plain English)", 18, currentY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const plainLines = doc.splitTextToSize(data.vipClientBrief.plainEnglishExplanation, pageWidth - 36);
  doc.text(plainLines, 18, currentY + 12);

  currentY += 36;

  // Formal Executive Apology & Letter
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text("Formal Executive Communication & Mitigation", 14, currentY);
  currentY += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const bodyLines = doc.splitTextToSize(data.vipClientBrief.emailBody, pageWidth - 28);
  doc.text(bodyLines, 14, currentY);
  currentY += bodyLines.length * 4.4 + 8;

  // Commercial Safeguards & SLA Credit Guarantee Table
  const slaTableData = [
    ["Contract Partnership", `${data.vipClient.name} (${data.vipClient.contractValue})`],
    ["Contractual SLA Response Target", `${data.vipClient.slaThresholdMinutes} minutes`],
    ["Service Credit / Financial Remedy", data.vipClientBrief.commercialImpactMitigation],
    ["Follow-Up Deliverable & ETA", data.vipClientBrief.nextUpdateEta],
    ["Sign-Off Authority", data.vipClientBrief.signoff],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [["SLA Contract Provision", "IncidentPulse AI Commitment"]],
    body: slaTableData,
    theme: "grid",
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 65, fontStyle: "bold" },
      1: { cellWidth: 120 },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer for Page 2
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Page 2 of 2 — Delivered directly to ${data.vipClient.name} Executive Leadership | Generated via IncidentPulse AI`,
    14,
    pageHeight - 8
  );

  // Save the PDF
  const filename = `IncidentPulse_${data.id}_Dual_Brief_${data.vipClient.name.replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}
