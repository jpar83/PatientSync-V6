import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from 'qrcode';
import type { Order, AuditLogEntry, Denial, User } from "@/lib/types";
import { getLogoDataUrl, daysOld } from './utils';
import workflowData from '@/../schemas/workflow.json';
import { labelMap, DocKey } from './docMapping';

const allStages = workflowData.workflow.map(w => w.stage);

const stageColors = [
  '#14b8a6', '#0d9488', '#0f766e', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#6b7280', '#4b5563'
];

async function getImageDataUrl(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn(`Could not fetch image from ${url}.`);
    return undefined;
  }
}

const addWatermark = (doc: jsPDF) => {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(50);
        doc.setTextColor(220, 220, 220); // Light gray
        // @ts-ignore
        doc.setGState(new doc.GState({ opacity: 0.5 }));
        doc.text(
            'CONFIDENTIAL',
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() / 2,
            { angle: 45, align: 'center' }
        );
        // @ts-ignore
        doc.setGState(new doc.GState({ opacity: 1 })); // Reset opacity
    }
};

export async function generatePatientSnapshotPDF({
  order,
  auditLog,
  denials,
  user,
}: {
  order: Order;
  auditLog: AuditLogEntry[];
  denials: Denial[];
  user: User | null;
}) {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  let startY = 20;

  const patient = order.patients;
  if (!patient) {
    throw new Error("Patient data is missing for this referral.");
  }
  
  const logoDataUrl = await getLogoDataUrl();
  const avatarDataUrl = patient.avatar_url ? await getImageDataUrl(patient.avatar_url) : undefined;
  let qrCodeDataUrl: string | undefined;
  try {
    qrCodeDataUrl = await QRCode.toDataURL(`${window.location.origin}/referrals?openPatientId=${order.patient_id}`, { width: 30 });
  } catch (err) {
    console.error('Could not generate QR code', err);
  }

  const checkPageBreak = (currentY: number, margin = 30) => {
    if (currentY > pageHeight - margin) {
      doc.addPage();
      return 20;
    }
    return currentY;
  };

  // --- Header ---
  if (logoDataUrl) doc.addImage(logoDataUrl, "PNG", 14, startY - 8, 15, 15);
  if (avatarDataUrl) doc.addImage(avatarDataUrl, 'PNG', pageWidth - 14 - 20, startY - 8, 20, 20);
  
  doc.setFontSize(18);
  doc.setTextColor("#14b8a6");
  doc.text("Patient Snapshot Report", 35, startY);
  startY = checkPageBreak(startY + 15);

  // --- Patient & Referral Info ---
  autoTable(doc, {
    startY,
    body: [
      ["Patient", `${patient.name} (DOB: ${patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'})`],
      ["Insurance", patient.primary_insurance || 'N/A'],
      ["Referral Date", order.referral_date ? new Date(order.referral_date).toLocaleDateString() : 'N/A'],
      ["Representative", order.rep_name || 'N/A'],
      ["Current Stage", order.workflow_stage || 'N/A'],
      ["Status", order.status || 'N/A'],
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
  });
  startY = (doc as any).lastAutoTable.finalY + 5;

  // --- Contact Info ---
  autoTable(doc, {
    startY,
    body: [
      ["Address", `${patient.address_line1 || ''} ${patient.address_line2 || ''}`.trim() || 'N/A'],
      ["Contact", `${patient.phone_number || 'N/A'} | ${patient.email || 'N/A'}`],
      ["Source", `${order.referral_source || 'N/A'} | Facility: ${patient.referring_physician || 'N/A'}`],
      ["Vendor", order.vendors?.name || 'N/A'],
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
  });
  startY = (doc as any).lastAutoTable.finalY + 8;

  // --- KPIs ---
  const requiredDocs = patient.required_documents || [];
  const completedDocs = requiredDocs.filter(d => order.document_status?.[d] === 'Complete').length;
  const docsPercentage = requiredDocs.length > 0 ? Math.round((completedDocs / requiredDocs.length) * 100) : 100;

  const kpiBody = [
    [
        { content: "Days Since Referral", styles: { fontStyle: 'bold' } },
        { content: order.referral_date ? daysOld(order.referral_date).toFixed(0) : 'N/A' },
        { content: "Days in Stage", styles: { fontStyle: 'bold' } },
        { content: order.last_stage_change ? daysOld(order.last_stage_change).toFixed(1) : 'N/A' },
    ],
    [
        { content: "Docs Complete", styles: { fontStyle: 'bold' } },
        { content: `${docsPercentage}% (${completedDocs}/${requiredDocs.length})` },
        { content: "Total Denials", styles: { fontStyle: 'bold' } },
        { content: denials.length.toString() },
    ],
  ];
  autoTable(doc, {
    startY,
    body: kpiBody,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
  });
  startY = (doc as any).lastAutoTable.finalY + 8;
  
  // --- Workflow Progress Bar ---
  startY = checkPageBreak(startY);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Workflow Progress:", 14, startY);
  startY += 5;
  const currentStageIndex = allStages.indexOf(order.workflow_stage || '');
  const barWidth = (pageWidth - 28) / allStages.length;
  allStages.forEach((stage, i) => {
    let fillColor = '#E5E7EB'; // gray-200
    if (i < currentStageIndex) fillColor = '#14b8a6'; // teal-500
    else if (i === currentStageIndex) fillColor = '#0d9488'; // teal-600
    doc.setFillColor(fillColor);
    doc.rect(14 + i * barWidth, startY, barWidth - 0.5, 4, 'F');
  });
  startY += 10;

  // --- Clinical Summary & Docs Checklist ---
  startY = checkPageBreak(startY);
  const clinicalBody = [
      ["Diagnosis", patient.diagnosis || 'N/A'],
      ["Equipment", order.chair_type || 'N/A'],
      ["Justification", order.justification || 'N/A'],
      ["Height / Weight", `${patient.height || 'N/A'} / ${patient.weight || 'N/A'}`],
  ];
  autoTable(doc, {
    startY,
    head: [["Clinical Summary"]],
    body: clinicalBody,
    theme: 'striped',
    headStyles: { fillColor: [75, 85, 99] },
    styles: { fontSize: 8, cellPadding: 2 },
    tableWidth: (pageWidth / 2) - 20,
    margin: { left: 14 }
  });
  const clinicalFinalY = (doc as any).lastAutoTable.finalY;

  const docsBody = requiredDocs.map(key => {
      const status = order.document_status?.[key] === 'Complete' ? '✓' : '✗';
      return [labelMap[key as DocKey] || key, status];
  });
  autoTable(doc, {
    startY,
    head: [["Required Documents", "Status"]],
    body: docsBody.length > 0 ? docsBody : [['No documents required', '']],
    theme: 'grid',
    headStyles: { fillColor: [75, 85, 99] },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 1: { halign: 'center' } },
    tableWidth: (pageWidth / 2) - 20,
    margin: { left: (pageWidth / 2) + 6 }
  });
  const docsFinalY = (doc as any).lastAutoTable.finalY;

  startY = Math.max(clinicalFinalY, docsFinalY) + 8;

  // --- Activity Log ---
  startY = checkPageBreak(startY);
  if (auditLog && auditLog.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Notes & Activity Log:", 14, startY);
    startY += 5;
    const activityBody = auditLog.slice(0, 5).map(log => {
        let content = log.action.replace(/_/g, ' ');
        if (log.details?.note) content = log.details.note;
        else if (log.details?.to) content = `Moved to ${log.details.to}`;
        else if (log.details?.document) content = `Doc '${log.details.document}' marked ${log.details.status}`;
        return [new Date(log.timestamp).toLocaleDateString(), log.changed_by, content];
    });
    autoTable(doc, {
        startY,
        head: [["Date", "User", "Activity"]],
        body: activityBody,
        theme: 'striped',
        headStyles: { fillColor: [75, 85, 99] },
        styles: { fontSize: 8, cellPadding: 2 },
    });
    startY = (doc as any).lastAutoTable.finalY + 8;
  }

  // --- Footer ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generated by Patient Sync v3 on ${new Date().toLocaleString()}`, 14, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: "right" });
    if (qrCodeDataUrl && i === pageCount) {
      doc.addImage(qrCodeDataUrl, 'PNG', 14, pageHeight - 20, 10, 10);
      doc.text('Live Record', 25, pageHeight - 15);
    }
  }

  const patientNameFormatted = (patient.name || 'Snapshot').replace(/\s/g, '_');
  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`PatientSync_Snapshot_${patientNameFormatted}_${timestamp}.pdf`);
}
