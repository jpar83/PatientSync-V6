import { formatInTimeZone } from 'date-fns-tz';
import { NormalizationOptions } from '@/state/useExportCenter';
import { ColumnDefinition } from './reportSchemas';

function formatDate(dateString: string, formatStr: string, timezone: string): string {
  try {
    return formatInTimeZone(new Date(dateString), timezone, formatStr);
  } catch (e) {
    return dateString; // Return original string if formatting fails
  }
}

function formatPhoneNumber(phone: string): string {
  const cleaned = ('' + phone).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

function normalizeEnumValue(value: string): string {
  if (typeof value !== 'string') return value;
  return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function normalizeBoolean(value: any): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return value;
}

function normalizePayer(payer: string): string {
    const commonPayers: Record<string, string> = {
        'UHC': 'UnitedHealthcare',
        'BCBS': 'Blue Cross Blue Shield',
    };
    return commonPayers[payer.toUpperCase()] || payer;
}

export function normalizeRow(
  row: Record<string, any>,
  columns: ColumnDefinition[],
  options: NormalizationOptions,
  timezone: string,
  dateFormat: string
): Record<string, any> {
  const newRow: Record<string, any> = {};

  for (const col of columns) {
    let value = row[col.key];

    if (options.normalizeEmpty && (value === null || value === undefined)) {
      value = '';
    }

    if (options.normalizeDates && col.type === 'date' && typeof value === 'string') {
      value = formatDate(value, dateFormat, timezone);
    }

    if (options.normalizeEnums && col.type === 'enum' && typeof value === 'string') {
      value = normalizeEnumValue(value);
    }
    
    if (options.normalizeBooleans && col.type === 'boolean') {
      value = normalizeBoolean(value);
    }

    if (options.normalizePhone && col.type === 'phone' && typeof value === 'string') {
      value = formatPhoneNumber(value);
    }
    
    if (options.normalizePayer && col.key === 'payer' && typeof value === 'string') {
        value = normalizePayer(value);
    }

    newRow[col.key] = value;
  }

  return newRow;
}
