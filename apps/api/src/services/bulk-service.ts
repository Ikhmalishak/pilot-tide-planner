import { parseMonthlyTideIndicators, parseHourlyMatrixLevels, type ImportOptions } from '@pilot-tide-planner/excel-parser';
import { tideIndicatorRepository } from '../repositories/tide-indicator-repository';
import { hourlyLevelRepository } from '../repositories/hourly-level-repository';
import { navigationService } from './navigation-service';

function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface BulkImportResult {
  totalDays: number;
  succeeded: { date: string; insertedIndicators: number; insertedLevels: number }[];
  failed: { date: string; error: string }[];
  totalInserted: { indicators: number; levels: number };
  parseErrors: { source: string; row: number; message: string }[];
}

export const bulkService = {
  async import({
    tideFile,
    hourlyFile,
    profileId,
    year,
    month,
  }: {
    tideFile: Uint8Array;
    hourlyFile: Uint8Array;
    profileId?: string;
    year: number;
    month: number;
  }): Promise<BulkImportResult> {
    const opts: ImportOptions = { year, month };

    const tideResult = parseMonthlyTideIndicators(tideFile, opts);
    const hourlyResult = parseHourlyMatrixLevels(hourlyFile, opts);

    const parseErrors = [
      ...tideResult.errors.map((e) => ({ source: 'tide-indicators', ...e })),
      ...hourlyResult.errors.map((e) => ({ source: 'hourly-levels', ...e })),
    ];

    const tideByDate = new Map<string, typeof tideResult.data>();
    for (const t of tideResult.data) {
      const key = formatDate(t.occurredAt);
      const arr = tideByDate.get(key) || [];
      arr.push(t);
      tideByDate.set(key, arr);
    }

    const hourlyByDate = new Map<string, typeof hourlyResult.data>();
    for (const h of hourlyResult.data) {
      const key = formatDate(h.recordedAt);
      const arr = hourlyByDate.get(key) || [];
      arr.push(h);
      hourlyByDate.set(key, arr);
    }

    const allDates = new Set([...tideByDate.keys(), ...hourlyByDate.keys()]);
    const sortedDates = [...allDates].sort();

    const succeeded: BulkImportResult['succeeded'] = [];
    const failed: BulkImportResult['failed'] = [];
    let totalIndicators = 0;
    let totalLevels = 0;

    for (const date of sortedDates) {
      try {
        const indicators = tideByDate.get(date) || [];
        const levels = hourlyByDate.get(date) || [];

        await tideIndicatorRepository.deleteByDate(date);
        await hourlyLevelRepository.deleteByDate(date);

        let insertedIndicators = 0;
        let insertedLevels = 0;

        if (indicators.length > 0) {
          await tideIndicatorRepository.createMany(indicators as any);
          insertedIndicators = indicators.length;
          totalIndicators += insertedIndicators;
        }

        if (levels.length > 0) {
          await hourlyLevelRepository.createMany(levels as any);
          insertedLevels = levels.length;
          totalLevels += insertedLevels;
        }

        if (indicators.length > 0 && levels.length > 0) {
          await navigationService.generate(date, profileId);
        }

        succeeded.push({ date, insertedIndicators, insertedLevels });
      } catch (err: any) {
        failed.push({ date, error: err.message || String(err) });
      }
    }

    return {
      totalDays: sortedDates.length,
      succeeded,
      failed,
      totalInserted: { indicators: totalIndicators, levels: totalLevels },
      parseErrors,
    };
  },
};
