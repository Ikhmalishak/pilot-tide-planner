import { api } from './client';
import type { DashboardData } from '@pilot-tide-planner/shared-types';

export const dashboardApi = {
  get: (date: string) => api.get<DashboardData>(`/dashboard?date=${date}`),
};
