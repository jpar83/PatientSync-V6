import { saveAs } from 'file-saver';
import { generateCsv } from './generators/csv';
import { generateDocx } from './generators/docx';
import { generatePdf } from './generators/pdf';
import { buildWorkbook } from './generators/xlsx';
import { writeAuditLog } from '../auditLogger';
import { normalizeRow } from './normalize';
import type { ExportConfig } from '@/state/useExportCenter';
import type { ColumnDefinition } from './reportSchemas';

interface ExportParams<T extends Record<string, any>> {
  data: T[];
  reportName: string;
  columns: ColumnDefinition[];
  config: ExportConfig;
}

export async function generateExport<T extends Record<string, any>>(params: ExportParams<T>) {
  const { data, reportName, columns, config } = params;
  const { format, normalization, timezone, dateFormat, filters } = config;
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${reportName.replace(/\s+/g, '_')}_${timestamp}`;

  try {
    switch (format) {
      case 'xlsx': {
        const wb = buildWorkbook(data, columns, reportName, config);
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: "application/octet-stream" }), `${filename}.xlsx`);
        break;
      }
      case 'csv': {
        const normalizedData = data.map(row => normalizeRow(row, columns, normalization, timezone, dateFormat));
        const csv = generateCsv(normalizedData, columns);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${filename}.csv`);
        break;
      }
      case 'pdf': {
        const normalizedData = data.map(row => normalizeRow(row, columns, normalization, timezone, dateFormat));
        const doc = generatePdf(normalizedData, columns, reportName);
        doc.save(`${filename}.pdf`);
        break;
      }
      case 'docx': {
        const normalizedData = data.map(row => normalizeRow(row, columns, normalization, timezone, dateFormat));
        const blob = await generateDocx(normalizedData, columns, reportName);
        saveAs(blob, `${filename}.docx`);
        break;
      }
    }

    await writeAuditLog('export', {
      subject: reportName,
      meta: {
        format,
        filters,
        row_count: data.length,
        filename,
      }
    });

    return { success: true, filename };
  } catch (error) {
    console.error(`Failed to generate ${format} export:`, error);
    return { success: false, error };
  }
}
