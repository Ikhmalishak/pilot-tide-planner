import * as XLSX from 'xlsx';
import type { TideIndicator, HourlyTideLevel } from '@pilot-tide-planner/shared-types';

export interface ParseResult<T> {
  data: T[];
  errors: { row: number; message: string }[];
}

export interface ImportOptions {
  year: number;
  month: number;
}

function extractDayNumber(val: unknown): number | null {
  if (val == null) return null;
  const str = String(val).trim();
  const firstLine = str.split(/[\n\r]/)[0].trim();
  const m = firstLine.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function padTime(val: unknown): string {
  return String(val ?? '').toString().padStart(4, '0');
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

/**
 * Parse the monthly tide indicator file (ttables1-15_7_mthly.xls).
 *
 * Format:
 *   Row 0: "01-15 JULY 2026"
 *   Row 1: DATE | TIME | MTR | FT.
 *   Row 2+: each day has 4 rows (HIGH, LOW, HIGH, LOW alternating)
 *           Day number in col 0 for the first tide, null for subsequent ones.
 *
 * Tide type alternates: first = HIGH, then LOW, HIGH, LOW for each day.
 */
export function parseMonthlyTideIndicators(
  file: Uint8Array,
  opts: ImportOptions
): ParseResult<TideIndicator> {
  const workbook = XLSX.read(file, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const result: ParseResult<TideIndicator> = { data: [], errors: [] };

  let currentDay = 0;
  let tideIndex = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 4) continue;

    const dayVal = extractDayNumber(row[0]);
    const rawTime = padTime(row[1]);
    const ftLevel = Number(row[3]);

    if (!rawTime || rawTime.length !== 4 || isNaN(ftLevel)) {
      continue;
    }

    if (dayVal !== null) {
      currentDay = dayVal;
    }

    const type: 'HIGH' | 'LOW' = tideIndex % 2 === 0 ? 'HIGH' : 'LOW';
    tideIndex++;

    if (currentDay < 1 || currentDay > 31) {
      result.errors.push({ row: i + 1, message: `Invalid day number: ${currentDay}` });
      continue;
    }

    const hours = parseInt(rawTime.slice(0, 2), 10);
    const minutes = parseInt(rawTime.slice(2, 4), 10);
    const occurredAt = new Date(Date.UTC(opts.year, opts.month - 1, currentDay, hours, minutes));

    result.data.push({
      occurredAt,
      type,
      waterLevelFt: ftLevel,
      source: 'EXCEL',
    });
  }

  return result;
}

/**
 * Parse the hourly matrix tide level file (ttables1-15_7_hourly.xlsx).
 *
 * Format:
 *   Row 0: "1-15 JULY 2026"
 *   Row 1: DATE | MRS | 0000 | 0100 | ... | 2300 | HRS
 *   Row 2:       | HEIGHTS |      |      |     |      | HEIGHTS
 *   Row 3: 1     | MTR.     | 2    | 2.2  | ... | 1.3 | MTR.
 *   Row 4:       | FT.      | 6.6  | 7.2  | ... | 4.3 | FT.
 *   ... repeat pairs for days 1-15
 *
 * We extract FT. rows only (label "FT." in col 1).
 * The day number comes from col 0 of the preceding MTR. row.
 */
export function parseHourlyMatrixLevels(
  file: Uint8Array,
  opts: ImportOptions
): ParseResult<HourlyTideLevel> {
  const workbook = XLSX.read(file, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const result: ParseResult<HourlyTideLevel> = { data: [], errors: [] };

  let currentDay = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const label = String(row[1] ?? '').trim();

    if (label === 'MTR.') {
      const d = extractDayNumber(row[0]);
      if (d !== null) currentDay = d;
      continue;
    }

    if (label !== 'FT.') continue;

    if (currentDay < 1 || currentDay > 31) {
      result.errors.push({ row: i + 1, message: `Invalid day number: ${currentDay}` });
      continue;
    }

    for (let hour = 0; hour < 24; hour++) {
      const colIdx = hour + 2;
      if (colIdx >= row.length) {
        result.errors.push({ row: i + 1, message: `Missing data for hour ${String(hour).padStart(2, '0')}00` });
        continue;
      }
      const level = Number(row[colIdx]);
      if (isNaN(level)) continue;

      const recordedAt = new Date(Date.UTC(opts.year, opts.month - 1, currentDay, hour, 0));
      result.data.push({
        recordedAt,
        waterLevelFt: level,
        source: 'EXCEL',
      });
    }
  }

  return result;
}
