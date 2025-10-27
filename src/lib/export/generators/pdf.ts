import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generatePdf<T extends Record<string, any>>(data: T[], columns: { key: string; label: string }[], title: string) {
  const doc = new jsPDF();
  
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 26);

  const head = [columns.map(c => c.label)];
  const body = data.map(row => columns.map(col => {
    const value = row[col.key];
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }));

  autoTable(doc, {
    head,
    body,
    startY: 32,
    headStyles: { fillColor: [34, 197, 94] }, // Tailwind green-500
    styles: { fontSize: 8 },
  });

  return doc;
}
