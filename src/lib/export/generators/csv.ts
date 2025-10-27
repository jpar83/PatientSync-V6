import Papa from 'papaparse';

export function generateCsv<T extends Record<string, any>>(data: T[], columns: { key: string; label: string }[]): string {
  const columnOrder = columns.map(c => c.key);
  const headerRow = columns.map(c => c.label);

  const body = data.map(row => {
    return columnOrder.map(key => {
      const value = row[key];
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return value;
    });
  });

  return Papa.unparse({
    fields: headerRow,
    data: body,
  });
}
