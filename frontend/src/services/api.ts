import type { Project } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const get = async <T>(url: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${url}`);

  if (!response.ok) {
    throw new Error(`API ${response.status}`);
  }

  return response.json();
};

export const api = {
  stats: () => get<any>('/api/statistics'),
  projects: (q = '') =>
    get<{ items: Project[]; total: number }>(`/api/projects?${q}`),
  project: (id: string) => get<Project>(`/api/projects/${id}`),
  alerts: () => get<any[]>('/api/alerts'),
  map: () => get<any[]>('/api/map-points'),
};
