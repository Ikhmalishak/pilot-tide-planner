import { api } from './client';
import type { TideIndicator } from '@pilot-tide-planner/shared-types';

export const tideApi = {
  getAll: (date?: string) => api.get<TideIndicator[]>(`/tide-indicators${date ? `?date=${date}` : ''}`),
  create: (data: Partial<TideIndicator>) => api.post<TideIndicator>('/tide-indicators', data),
  update: (id: string, data: Partial<TideIndicator>) => api.put<TideIndicator>(`/tide-indicators/${id}`, data),
  delete: (id: string) => api.delete<void>(`/tide-indicators/${id}`),
  upload: (file: File) => api.upload('/tide-indicators/import', file),
};

export const hourlyApi = {
  getAll: (date?: string) => api.get<any[]>(`/hourly-levels${date ? `?date=${date}` : ''}`),
  create: (data: any) => api.post('/hourly-levels', data),
  update: (id: string, data: any) => api.put(`/hourly-levels/${id}`, data),
  delete: (id: string) => api.delete(`/hourly-levels/${id}`),
  upload: (file: File) => api.upload('/hourly-levels/import', file),
};
