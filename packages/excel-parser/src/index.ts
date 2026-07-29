import * as XLSX from 'xlsx';
import type { TideIndicator, HourlyTideLevel } from '@pilot-tide-planner/shared-types';

export interface ParseResult<T> {
  data: T[];
  errors: { row: number; message: string }[];
}

export function parseTideIndicators(file: Uint8Array): ParseResult<TideIndicator> {
  const workbook = XLSX.read(file, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const result: ParseResult<TideIndicator> = { data: [], errors: [] };

  rows.forEach((row, index) => {
    try {
      const date = row['Date'] || row['date'];
      const time = (row['Time'] || row['time'] || '').toString().padStart(4, '0');
      const type = (row['Type'] || row['type'] || '').toString().toUpperCase();
      const level = Number(row['Level'] || row['level'] || row['Water Level']);

      const hours = time.slice(0, 2);
      const minutes = time.slice(2, 4);
      const dateStr = String(date || '');
      const [year, month, day] = dateStr.split('-').map(Number);
      const occurredAt = new Date(Date.UTC(year, month - 1, day, Number(hours), Number(minutes)));

      if (!type || !['HIGH', 'LOW'].includes(type)) {
        result.errors.push({ row: index + 1, message: `Invalid tide type: ${type}` });
        return;
      }
      if (isNaN(level)) {
        result.errors.push({ row: index + 1, message: `Invalid water level: ${row['Level']}` });
        return;
      }

      result.data.push({
        occurredAt,
        type: type as 'HIGH' | 'LOW',
        waterLevelFt: level,
        source: 'EXCEL',
      });
    } catch (err) {
      result.errors.push({ row: index + 1, message: `Parse error: ${err}` });
    }
  });

  return result;
}

export function parseHourlyLevels(file: Uint8Array): ParseResult<HourlyTideLevel> {
  const workbook = XLSX.read(file, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const result: ParseResult<HourlyTideLevel> = { data: [], errors: [] };

  rows.forEach((row, index) => {
    try {
      const time = (row['Time'] || row['time'] || '').toString().padStart(4, '0');
      const level = Number(row['Level'] || row['level'] || row['Water Level']);

      const hours = time.slice(0, 2);
      const minutes = time.slice(2, 4);
      const now = new Date();
      const recordedAt = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), Number(hours), Number(minutes)));

      if (isNaN(level)) {
        result.errors.push({ row: index + 1, message: `Invalid water level: ${row['Level']}` });
        return;
      }

      result.data.push({
        recordedAt,
        waterLevelFt: level,
        source: 'EXCEL',
      });
    } catch (err) {
      result.errors.push({ row: index + 1, message: `Parse error: ${err}` });
    }
  });

  return result;
}
