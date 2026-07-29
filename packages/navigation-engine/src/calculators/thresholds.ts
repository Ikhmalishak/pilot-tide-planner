import { TideIndicatorDomain } from '../models/tide-indicator';

export function calculateHighRedThreshold(highTide: TideIndicatorDomain, redDifference: number): number {
  return highTide.waterLevelFt - redDifference;
}

export function calculateHighYellowThreshold(highTide: TideIndicatorDomain, yellowDifference: number): number {
  return highTide.waterLevelFt - yellowDifference;
}

export function calculateLowRedThreshold(lowTide: TideIndicatorDomain, redDifference: number): number {
  return lowTide.waterLevelFt + redDifference;
}

export function calculateLowGreenThreshold(lowTide: TideIndicatorDomain, greenDifference: number): number {
  return lowTide.waterLevelFt + greenDifference;
}
