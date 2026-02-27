import type {
  AuthMeDto,
  BillingSummaryDto,
  ClientDto,
  DashboardDto,
  InvoiceDto,
  ProviderDto,
  SessionDto,
  TemplateDto,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (response.status === 204) {
    return {} as T;
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  getHealth: () => request<{ status: string }>('/health'),
  login: (email: string, password: string) => request<void>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  getMe: () => request<AuthMeDto>('/api/auth/me'),
  getDashboard: () => request<DashboardDto>('/api/dashboard'),
  getClients: () => request<ClientDto[]>('/api/clients'),
  getClient: (id: string) => request<ClientDto>(`/api/clients/${id}`),
  getSessions: () => request<SessionDto[]>('/api/sessions'),
  createSession: (payload: { clientId: string; date: string; duration: number; sessionType: string; focus: string; }) => request('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateSession: (id: string, payload: Partial<SessionDto>) => request(`/api/sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  getBillingSummary: () => request<BillingSummaryDto>('/api/billing/summary'),
  getBillingInvoices: () => request<InvoiceDto[]>('/api/billing/invoices'),
  getProviders: () => request<ProviderDto[]>('/api/settings/providers'),
  getTemplatePresets: () => request<TemplateDto[]>('/api/templates/presets'),
  getCustomTemplates: () => request<TemplateDto[]>('/api/templates/custom'),
  duplicateTemplateFromPreset: (presetId: string) => request('/api/templates/custom/from-preset', {
    method: 'POST',
    body: JSON.stringify({ presetId }),
  }),
  googleLoginUrl: `${API_BASE_URL}/api/auth/google/login`,
};
