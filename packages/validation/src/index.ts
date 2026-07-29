import type {
  TideIndicator,
  HourlyTideLevel,
  RuleProfile,
} from '@pilot-tide-planner/shared-types';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateTideIndicator(data: Partial<TideIndicator>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.occurredAt) {
    errors.push({ field: 'occurredAt', message: 'Occurred at is required' });
  }
  if (!data.type || !['HIGH', 'LOW'].includes(data.type)) {
    errors.push({ field: 'type', message: 'Type must be HIGH or LOW' });
  }
  if (data.waterLevelFt === undefined || data.waterLevelFt === null) {
    errors.push({ field: 'waterLevelFt', message: 'Water level is required' });
  }

  return errors;
}

export function validateHourlyTideLevel(data: Partial<HourlyTideLevel>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.recordedAt) {
    errors.push({ field: 'recordedAt', message: 'Recorded at is required' });
  }
  if (data.waterLevelFt === undefined || data.waterLevelFt === null) {
    errors.push({ field: 'waterLevelFt', message: 'Water level is required' });
  }

  return errors;
}

export function validateRuleProfile(data: Partial<RuleProfile>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name) {
    errors.push({ field: 'name', message: 'Profile name is required' });
  }
  if (data.redDifference === undefined || data.redDifference < 0) {
    errors.push({ field: 'redDifference', message: 'Red difference must be >= 0' });
  }
  if (data.yellowDifference === undefined || data.yellowDifference < 0) {
    errors.push({ field: 'yellowDifference', message: 'Yellow difference must be >= 0' });
  }
  if (data.greenDifference === undefined || data.greenDifference < 0) {
    errors.push({ field: 'greenDifference', message: 'Green difference must be >= 0' });
  }

  return errors;
}
