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


const avatarPalette = ["#9B8B9E", "#A8B5A0", "#9DAAB5", "#D4B88A", "#8AAF7D", "#8B6B9E", "#D9A66E", "#7B9AB5"];

const computeAvatarColor = (id: string | number): string => {
  const numericId = typeof id === 'number' ? id : Number.parseInt(id, 10);
  if (Number.isNaN(numericId)) return avatarPalette[0];
  return avatarPalette[Math.abs(numericId) % avatarPalette.length];
};
const computeInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

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

type ClientApiDto = Omit<ClientDto, 'initials'> & { initials?: string };
type SessionApiDto = Omit<SessionDto, 'initials'> & { initials?: string };
type InvoiceApiDto = Omit<InvoiceDto, 'clientInitials'> & { clientInitials?: string };
type ProviderApiDto = Omit<ProviderDto, 'initials'> & { initials?: string };
type DashboardApiDto = Omit<DashboardDto, 'upcomingSessions' | 'activeClientPreview'> & {
  upcomingSessions: SessionApiDto[];
  activeClientPreview: ClientApiDto[];
};

const mapClientDto = (client: ClientApiDto): ClientDto => ({
  ...client,
  avatarColor: client.avatarColor ?? computeAvatarColor(client.id),
  initials: client.initials ?? computeInitials(client.name),
});

const mapSessionDto = (session: SessionApiDto): SessionDto => ({
  ...session,
  avatarColor: session.avatarColor ?? computeAvatarColor(session.clientId),
  initials: session.initials ?? computeInitials(session.client),
});

const mapInvoiceDto = (invoice: InvoiceApiDto): InvoiceDto => ({
  ...invoice,
  clientColor: invoice.clientColor ?? computeAvatarColor(invoice.clientId ?? 0),
  clientInitials: invoice.clientInitials ?? computeInitials(invoice.clientName),
});

const mapProviderDto = (provider: ProviderApiDto): ProviderDto => ({
  ...provider,
  initials: provider.initials ?? computeInitials(provider.name),
});

export const apiClient = {
  getHealth: () => request<{ status: string }>('/health'),
  login: (email: string, password: string) => request<void>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  getMe: () => request<AuthMeDto>('/api/auth/me'),
  getDashboard: async () => {
    const response = await request<DashboardApiDto>('/api/dashboard');
    return {
      ...response,
      upcomingSessions: response.upcomingSessions.map(mapSessionDto),
      activeClientPreview: response.activeClientPreview.map(mapClientDto),
    };
  },
  getClients: async () => {
    const clients = await request<ClientApiDto[]>('/api/clients');
    return clients.map(mapClientDto);
  },
  createClient: (payload: {
    name: string;
    email: string;
    phone: string;
    program: string;
    startDate: string;
    status: 'active' | 'paused' | 'completed';
    notes: string | null;
  }) => request<{ id: string }>('/api/clients', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getClient: async (id: string) => {
    const client = await request<ClientApiDto>(`/api/clients/${id}`);
    return mapClientDto(client);
  },
  getSessions: async (clientId?: string) => {
    const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
    const sessions = await request<SessionApiDto[]>(`/api/sessions${query}`);
    return sessions.map(mapSessionDto);
  },
  getClientSessions: async (id: string) => {
    const sessions = await request<SessionApiDto[]>(`/api/clients/${id}/sessions`);
    return sessions.map(mapSessionDto);
  },
  createSession: (payload: { clientId: string | number; date: string; duration: number; sessionType: string; focus: string; }) => request<{ id: string }>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ ...payload, clientId: Number(payload.clientId) }),
  }),
  updateSession: (id: string, payload: Partial<SessionDto>) => request(`/api/sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  getBillingSummary: () => request<BillingSummaryDto>('/api/billing/summary'),
  getBillingInvoices: async () => {
    const invoices = await request<InvoiceApiDto[]>('/api/billing/invoices');
    return invoices.map(mapInvoiceDto);
  },
  getProviders: async () => {
    const providers = await request<ProviderApiDto[]>('/api/settings/providers');
    return providers.map(mapProviderDto);
  },
  getTemplatePresets: () => request<TemplateDto[]>('/api/templates/presets'),
  getCustomTemplates: () => request<TemplateDto[]>('/api/templates/custom'),
  duplicateTemplateFromPreset: (presetId: string | number) => request('/api/templates/custom/from-preset', {
    method: 'POST',
    body: JSON.stringify({ presetId: Number(presetId) }),
  }),
  googleLoginUrl: `${API_BASE_URL}/api/auth/google/login`,
};
