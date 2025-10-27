import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order } from "./types";

interface Metrics {
  total: number;
  ready: number;
  avgDays: number;
  archived: number;
}

export function printWeeklyReport(data: Order[], metrics: Metrics, logoDataUrl?: string) {
  const doc = new jsPDF();
  
  // Header
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 14, 12, 25, 25);
  }
  doc.setFontSize(18);
  doc.setTextColor("#0f766e");
  doc.text("Patient Sync", 45, 20);
  doc.setFontSize(14);
  doc.setTextColor("#374151");
  doc.text("Weekly Summary Report", 45, 28);
  doc.line(14, 40, 196, 40);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 196, 38, { align: 'right' });


  // Metrics Table
  autoTable(doc, {
    startY: 45,
    head: [["Key Metric", "Value"]],
    body: [
      ["Total Active Referrals", metrics.total.toString()],
      ["Orders Ready for PAR", metrics.ready.toString()],
      ["Average Days in Current Stage", `${metrics.avgDays} days`],
      ["Total Archived Cases", metrics.archived.toString()],
    ],
    theme: "striped",
    headStyles: { fillColor: [15, 118, 110] },
  });

  // Recent Orders Table
  autoTable(doc, {
    // @ts-ignore
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Patient", "Insurance", "Stage", "Vendor"]],
    body: data.slice(0, 20).map((r: Order) => [
      r.patients?.name ?? r.patient_name ?? "N/A",
      r.patients?.primary_insurance ?? "N/A",
      r.workflow_stage ?? "N/A",
      r.vendors?.name ?? "N/A",
    ]),
    headStyles: { fillColor: [15, 118, 110] },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Confidential — For Internal Use Only", 14, 287);
    doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: "right" });
  }

  doc.save(`PatientSync_Weekly_${new Date().toISOString().slice(0,10)}.pdf`);
}
