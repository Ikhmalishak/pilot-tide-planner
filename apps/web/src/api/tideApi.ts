import { api } from './client';
import type { TideIndicator } from '@pilot-tide-planner/shared-types';

export const tideApi = {
  getAll: (date?: string) => api.get<TideIndicator[]>(`/tide-indicators${date ? `?date=${date}` : ''}`),
  getByRange: (from: string, to: string) => api.get<TideIndicator[]>(`/tide-indicators?from=${from}&to=${to}`),
  create: (data: Partial<TideIndicator>) => api.post<TideIndicator>('/tide-indicators', data),
  update: (id: string, data: Partial<TideIndicator>) => api.put<TideIndicator>(`/tide-indicators/${id}`, data),
  delete: (id: string) => api.delete<void>(`/tide-indicators/${id}`),
  upload: (file: File) => api.upload('/tide-indicators/import', file),
  downloadUrl: (date?: string) => `/api/tide-indicators/export${date ? `?date=${date}` : ''}`,
};

export const hourlyApi = {
  getAll: (date?: string) => api.get<any[]>(`/hourly-levels${date ? `?date=${date}` : ''}`),
  create: (data: any) => api.post('/hourly-levels', data),
  update: (id: string, data: any) => api.put(`/hourly-levels/${id}`, data),
  delete: (id: string) => api.delete(`/hourly-levels/${id}`),
  upload: (file: File) => api.upload('/hourly-levels/import', file),
  downloadUrl: (date?: string) => `/api/hourly-levels/export${date ? `?date=${date}` : ''}`,
};

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const uploadApi = {
  tideIndicators: async (file: File, year?: number, month?: number, profileId?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (year) form.append('year', String(year));
    if (month) form.append('month', String(month));
    if (profileId) form.append('profileId', profileId);
    const res = await fetch(`${BASE_URL}/tide-indicators/import`, { method: 'POST', body: form });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Import failed');
    return json;
  },
  hourlyLevels: async (file: File, year?: number, month?: number, profileId?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (year) form.append('year', String(year));
    if (month) form.append('month', String(month));
    if (profileId) form.append('profileId', profileId);
    const res = await fetch(`${BASE_URL}/hourly-levels/import`, { method: 'POST', body: form });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Import failed');
    return json;
  },
};
