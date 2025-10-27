import * as XLSX from 'xlsx';
import { NormalizationOptions, ExportConfig } from '@/state/useExportCenter';
import { ColumnDefinition } from '../reportSchemas';

function getExcelDateFormat(dateFormat: string): string {
    const mappings: Record<string, string> = {
        'MMM d, yyyy h:mm a': 'mmm d, yyyy h:mm AM/PM',
        'MM/dd/yyyy': 'mm/dd/yyyy',
        'yyyy-MM-dd HH:mm': 'yyyy-mm-dd hh:mm',
    };
    return mappings[dateFormat] || 'm/d/yy h:mm';
}

export function buildWorkbook<T extends Record<string, any>>(
  data: T[],
  columns: ColumnDefinition[],
  title: string,
  config: ExportConfig
): XLSX.WorkBook {
  const { normalization, dateFormat } = config;

  const headerRow = columns.map(col => col.label);
  
  const bodyRows = data.map(row => {
    return columns.map(col => {
      let value = row[col.key];

      if (normalization.normalizeEmpty && (value === null || value === undefined)) {
        return '';
      }

      if (col.type === 'date' && typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date; // Return JS Date object for Excel
        }
      }

      if (normalization.normalizeBooleans && col.type === 'boolean') {
        return value === true ? 'Yes' : value === false ? 'No' : value;
      }

      if (normalization.normalizeEnums && col.type === 'enum' && typeof value === 'string') {
        return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
      
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }

      return value;
    });
  });

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...bodyRows]);

  // Apply formatting and types
  const excelDateFormat = getExcelDateFormat(dateFormat);
  bodyRows.forEach((row, rowIndex) => {
    columns.forEach((col, colIndex) => {
      if (col.type === 'date' && row[colIndex] instanceof Date) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex });
        if (ws[cellAddress]) {
          ws[cellAddress].t = 'd';
          ws[cellAddress].z = excelDateFormat;
        }
      }
    });
  });

  // Auto-fit columns
  const colWidths = columns.map((col, i) => {
    const headerLength = col.label.length;
    const bodyLengths = bodyRows.map(row => {
        const cell = row[i];
        if (cell instanceof Date) return excelDateFormat.length;
        return cell ? String(cell).length : 0;
    });
    return { wch: Math.max(headerLength, ...bodyLengths) + 2 };
  });
  ws['!cols'] = colWidths;
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 31));
  
  return wb;
}
