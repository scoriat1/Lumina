import type { ClientDto, DashboardDto, SessionDto } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
const TOKEN_STORAGE_KEY = 'lumina.auth.token';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

type OAuthLoginResponse = {
  accessToken: string;
  provider: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export const apiClient = {
  getHealth: () => request<{ status: string }>('/health'),
  oauthLogin: (provider: string) => request<OAuthLoginResponse>(`/api/auth/oauth/${provider}`, { method: 'POST' }),
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
  resetDevData: () => request<{ message: string; cleared: string[] }>('/api/dev/reset', { method: 'POST' }),
};
