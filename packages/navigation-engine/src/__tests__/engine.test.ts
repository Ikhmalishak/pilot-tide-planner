import { describe, it, expect } from 'vitest';
import { generateNavigationWindow } from '../index';
import type { TideIndicator, HourlyTideLevel, RuleProfile } from '@pilot-tide-planner/shared-types';

const defaultProfile: RuleProfile = {
  id: 'test-profile',
  name: 'Default',
  redDifference: 2.5,
  yellowDifference: 1.5,
  greenDifference: 2.5,
  yellowDisabledStart: '07:00',
  yellowDisabledEnd: '19:00',
  active: true,
};

describe('Navigation Engine', () => {
  function utcDate(iso: string): Date {
    return new Date(iso + 'Z');
  }

  it('should assign RED for high tide descending period', () => {
    const indicators: TideIndicator[] = [
      { occurredAt: utcDate('2026-07-01T01:47:00'), type: 'HIGH', waterLevelFt: 7.22 },
    ];
    const levels: HourlyTideLevel[] = [
      { recordedAt: utcDate('2026-07-01T01:00:00'), waterLevelFt: 7.20 },
      { recordedAt: utcDate('2026-07-01T02:00:00'), waterLevelFt: 7.10 },
      { recordedAt: utcDate('2026-07-01T03:00:00'), waterLevelFt: 6.50 },
      { recordedAt: utcDate('2026-07-01T04:00:00'), waterLevelFt: 5.50 },
      { recordedAt: utcDate('2026-07-01T05:00:00'), waterLevelFt: 4.80 },
      { recordedAt: utcDate('2026-07-01T06:00:00'), waterLevelFt: 4.60 },
    ];

    const result = generateNavigationWindow(indicators, levels, defaultProfile);

    expect(result.items[0].isRed).toBe(true); // 01:00 - 7.20 >= 4.72
    expect(result.items[1].isRed).toBe(true); // 02:00 - 7.10 >= 4.72
    expect(result.items[2].isRed).toBe(true); // 03:00 - 6.50 >= 4.72
    expect(result.items[3].isRed).toBe(true); // 04:00 - 5.50 >= 4.72
    expect(result.items[4].isRed).toBe(true); // 05:00 - 4.80 >= 4.72
    expect(result.items[5].isRed).toBe(false); // 06:00 - 4.60 < 4.72
  });

  it('should assign GREEN after low tide recovery', () => {
    const indicators: TideIndicator[] = [
      { occurredAt: utcDate('2026-07-01T01:47:00'), type: 'HIGH', waterLevelFt: 8.86 },
      { occurredAt: utcDate('2026-07-01T07:53:00'), type: 'LOW', waterLevelFt: 3.61 },
    ];
    const levels: HourlyTideLevel[] = [
      { recordedAt: utcDate('2026-07-01T08:00:00'), waterLevelFt: 4.00 },
      { recordedAt: utcDate('2026-07-01T09:00:00'), waterLevelFt: 5.00 },
      { recordedAt: utcDate('2026-07-01T10:00:00'), waterLevelFt: 6.11 },
      { recordedAt: utcDate('2026-07-01T11:00:00'), waterLevelFt: 7.00 },
    ];

    const result = generateNavigationWindow(indicators, levels, defaultProfile);

    expect(result.items[2].isGreen).toBe(true); // 10:00 - 6.11 >= 6.11
    expect(result.items[3].isGreen).toBe(true); // 11:00 - 7.00 >= 6.11
  });

  it('should disable YELLOW during restricted hours', () => {
    const indicators: TideIndicator[] = [
      { occurredAt: utcDate('2026-07-01T01:47:00'), type: 'HIGH', waterLevelFt: 7.22 },
    ];
    const levels: HourlyTideLevel[] = [
      { recordedAt: utcDate('2026-07-01T08:00:00'), waterLevelFt: 5.80 },
    ];

    const result = generateNavigationWindow(indicators, levels, defaultProfile);

    expect(result.items[0].isYellow).toBe(false);
  });

  it('should continue GREEN past HIGH indicator while water still rising', () => {
    const indicators: TideIndicator[] = [
      { occurredAt: utcDate('2026-07-01T01:47:00'), type: 'HIGH', waterLevelFt: 7.22 },
      { occurredAt: utcDate('2026-07-01T07:48:00'), type: 'LOW', waterLevelFt: 3.61 },
      { occurredAt: utcDate('2026-07-01T12:45:00'), type: 'HIGH', waterLevelFt: 8.86 },
    ];
    const levels: HourlyTideLevel[] = [
      { recordedAt: utcDate('2026-07-01T11:00:00'), waterLevelFt: 6.60 },
      { recordedAt: utcDate('2026-07-01T12:00:00'), waterLevelFt: 7.90 },
      { recordedAt: utcDate('2026-07-01T13:00:00'), waterLevelFt: 8.90 },
      { recordedAt: utcDate('2026-07-01T14:00:00'), waterLevelFt: 8.90 },
      { recordedAt: utcDate('2026-07-01T15:00:00'), waterLevelFt: 8.50 },
    ];

    const result = generateNavigationWindow(indicators, levels, defaultProfile);

    expect(result.items[0].isGreen).toBe(true);  // 11:00 - rising, reaches green threshold
    expect(result.items[1].isGreen).toBe(true);  // 12:00 - still rising
    expect(result.items[2].isGreen).toBe(true);  // 13:00 - past HIGH 12:45, water still rising to 8.90
    expect(result.items[3].isGreen).toBe(true);  // 14:00 - water flat at peak 8.90
    expect(result.items[4].isGreen).toBe(false); // 15:00 - water drops to 8.50 < peak 8.90
  });

  it('should stop GREEN when tide level decreases from peak', () => {
    const indicators: TideIndicator[] = [
      { occurredAt: utcDate('2026-07-01T01:47:00'), type: 'HIGH', waterLevelFt: 8.86 },
      { occurredAt: utcDate('2026-07-01T07:53:00'), type: 'LOW', waterLevelFt: 3.61 },
    ];
    const levels: HourlyTideLevel[] = [
      { recordedAt: utcDate('2026-07-01T08:00:00'), waterLevelFt: 4.00 },
      { recordedAt: utcDate('2026-07-01T09:00:00'), waterLevelFt: 5.00 },
      { recordedAt: utcDate('2026-07-01T10:00:00'), waterLevelFt: 6.11 },
      { recordedAt: utcDate('2026-07-01T11:00:00'), waterLevelFt: 8.00 },
      { recordedAt: utcDate('2026-07-01T12:00:00'), waterLevelFt: 7.50 },
      { recordedAt: utcDate('2026-07-01T13:00:00'), waterLevelFt: 7.00 },
    ];

    const result = generateNavigationWindow(indicators, levels, defaultProfile);

    expect(result.items[2].isGreen).toBe(true);  // 10:00 - 6.11 >= 6.11, starts GREEN
    expect(result.items[3].isGreen).toBe(true);  // 11:00 - 8.00 new peak, continues GREEN
    expect(result.items[4].isGreen).toBe(false); // 12:00 - 7.50 < 8.00 peak, GREEN stops
    expect(result.items[5].isGreen).toBe(false); // 13:00 - 7.00 still below peak
  });

  it('should throw error for empty tide indicators', () => {
    expect(() =>
      generateNavigationWindow([], [{ recordedAt: new Date(), waterLevelFt: 5.0 }], defaultProfile)
    ).toThrow('No tide indicators provided');
  });

  it('should throw error for empty hourly levels', () => {
    const indicators: TideIndicator[] = [
      { occurredAt: utcDate('2026-07-01T01:47:00'), type: 'HIGH', waterLevelFt: 7.22 },
    ];
    expect(() => generateNavigationWindow(indicators, [], defaultProfile)).toThrow(
      'No hourly tide levels provided'
    );
  });
});
