export type TideType = 'HIGH' | 'LOW';

export type DataSource = 'MANUAL' | 'EXCEL' | 'API' | 'OCR';

export type NavigationStatus = 'GENERATED' | 'FAILED';

export type NavigationColor = 'RED' | 'YELLOW' | 'GREEN';

export interface TideIndicator {
  id?: string;
  occurredAt: Date;
  type: TideType;
  waterLevelFt: number;
  waterLevelMeter?: number;
  source?: DataSource;
}

export interface HourlyTideLevel {
  id?: string;
  recordedAt: Date;
  waterLevelFt: number;
  waterLevelMeter?: number;
  source?: DataSource;
}

export interface RuleProfile {
  id?: string;
  name: string;
  redDifference: number;
  yellowDifference: number;
  greenDifference: number;
  yellowDisabledStart: string;
  yellowDisabledEnd: string;
  active?: boolean;
}

export interface NavigationItem {
  id?: string;
  hour: Date;
  waterLevelFt: number;
  waterLevelMeter?: number;
  isRed: boolean;
  isYellow: boolean;
  isGreen: boolean;
  remarks?: string;
}

export interface NavigationWindow {
  id?: string;
  navigationDate: Date;
  profileId: string;
  status: NavigationStatus;
  generatedAt?: Date;
  items: NavigationItem[];
}

export interface DashboardData {
  date: string;
  tideIndicators: {
    type: string;
    time: string;
    level: number;
  }[];
  navigationWindow: {
    generated: boolean;
    items: {
      hour: string;
      waterLevelFt?: number;
      status: NavigationColor[];
    }[];
  } | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}
