import type { ClientDto, DashboardDto, SessionDto } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  getHealth: () => request<{ status: string }>('/health'),
  getDashboard: () => request<DashboardDto>('/api/dashboard'),
  getClients: () => request<ClientDto[]>('/api/clients'),
  getClient: (id: string) => request<ClientDto>(`/api/clients/${id}`),
  getSessions: () => request<SessionDto[]>('/api/sessions'),
  getSession: (id: string) => request<SessionDto>(`/api/sessions/${id}`),
  createSession: (payload: Partial<SessionDto>) => request<SessionDto>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateSession: (id: string, payload: Partial<SessionDto>) => request<SessionDto>(`/api/sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
};
