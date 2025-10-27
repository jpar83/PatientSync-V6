import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';

export async function generateDocx<T extends Record<string, any>>(data: T[], columns: { key: string; label: string }[], title: string): Promise<Blob> {
  const headerRow = new TableRow({
    children: columns.map(col => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: col.label, bold: true })] })],
      width: { size: 100 / columns.length, type: WidthType.PERCENTAGE },
    })),
  });

  const dataRows = data.map(row => new TableRow({
    children: columns.map(col => {
      let cellValue = row[col.key];
      if (cellValue === null || cellValue === undefined) {
        cellValue = '';
      } else if (typeof cellValue === 'object') {
        cellValue = JSON.stringify(cellValue);
      } else {
        cellValue = String(cellValue);
      }
      return new TableCell({
        children: [new Paragraph(cellValue)],
      });
    }),
  }));

  const table = new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [new TextRun({ text: title, bold: true, size: 28 })],
        }),
        new Paragraph({
          children: [new TextRun({ text: `Generated on: ${new Date().toLocaleString()}`, size: 18, italics: true })],
        }),
        new Paragraph(" "), // Spacer
        table,
      ],
    }],
  });

  return Packer.toBlob(doc);
}
