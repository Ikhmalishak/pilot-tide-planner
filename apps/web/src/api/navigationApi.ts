import { api } from './client';
import type { NavigationWindow, RuleProfile } from '@pilot-tide-planner/shared-types';

export const navigationApi = {
  generate: (date: string, profileId?: string) =>
    api.post<NavigationWindow>('/navigation/generate', { date, profileId }),
  getToday: () => api.get<NavigationWindow>('/navigation/today'),
  getByDate: (date: string) => api.get<NavigationWindow>(`/navigation/date/${date}`),
  getHistory: (params?: { page?: number; limit?: number; from?: string; to?: string }) => {
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.from) search.set('from', params.from);
    if (params?.to) search.set('to', params.to);
    const qs = search.toString();
    return api.get<any>(`/navigation/history${qs ? `?${qs}` : ''}`);
  },
};

export const ruleProfileApi = {
  getAll: () => api.get<RuleProfile[]>('/rule-profiles'),
  update: (id: string, data: Partial<RuleProfile>) => api.put<RuleProfile>(`/rule-profiles/${id}`, data),
};
