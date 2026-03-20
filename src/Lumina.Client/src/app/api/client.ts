import type {
  AuthMeDto,
  BillingSummaryDto,
  ClientDetailViewDto,
  ClientDto,
  ClientNoteDto,
  DashboardDto,
  InvoiceDto,
  NotesTemplateSettingsDto,
  ProviderDto,
  SessionDto,
  SessionStructuredNoteDto,
  TemplateDto,
  TemplateFieldDto,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';


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
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json() as {
        message?: string;
        title?: string;
        errors?: Record<string, string[]>;
      };

      if (errorBody.message) {
        errorMessage = errorBody.message;
      } else if (errorBody.title) {
        errorMessage = errorBody.title;
      } else if (errorBody.errors) {
        const firstError = Object.values(errorBody.errors).flat().find(Boolean);
        if (firstError) {
          errorMessage = firstError;
        }
      }
    } catch {
      // Ignore JSON parsing failures and fall back to status-based message.
    }

    throw new Error(errorMessage);
  }

  const responseText = await response.text();
  if (!responseText) {
    return {} as T;
  }

  return JSON.parse(responseText) as T;
}

type ClientApiDto = Omit<ClientDto, 'initials'> & { initials?: string };
type SessionApiDto = Omit<SessionDto, 'initials'> & { initials?: string };
type InvoiceApiDto = Omit<InvoiceDto, 'clientInitials'> & { clientInitials?: string };
type ProviderApiDto = Omit<ProviderDto, 'initials'> & { initials?: string };
type NotesTemplateSettingsApiDto = Omit<NotesTemplateSettingsDto, 'selectedTemplateId'> & {
  selectedTemplateId?: number | null;
  selectedTemplateKind?: 'preset' | 'custom' | null;
};
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


const mapClientNoteDto = (note: ClientNoteDto): ClientNoteDto => ({
  ...note,
  id: String(note.id),
  clientId: String(note.clientId),
  sessionId: note.sessionId ? String(note.sessionId) : undefined,
});

const mapSessionStructuredNoteDto = (note: SessionStructuredNoteDto): SessionStructuredNoteDto => ({
  ...note,
  id: String(note.id),
  clientId: String(note.clientId),
  sessionId: note.sessionId ? String(note.sessionId) : undefined,
});

const mapTemplateDto = (template: TemplateDto): TemplateDto => {
  const normalizedFields = template.fieldsDetail?.length
    ? [...template.fieldsDetail].sort((a, b) => a.sortOrder - b.sortOrder)
    : (template.fields || []).map((label, index) => ({
      id: 0,
      label,
      sortOrder: index + 1,
      fieldType: undefined,
    } as TemplateFieldDto));

  return {
    ...template,
    id: String(template.id),
    fieldsDetail: normalizedFields,
    fields: normalizedFields.map((field) => field.label),
  };
};

const mapNotesTemplateSettingsDto = (
  settings: NotesTemplateSettingsApiDto,
): NotesTemplateSettingsDto => ({
  templateMode: settings.templateMode,
  selectedTemplateKind: settings.selectedTemplateKind ?? undefined,
  selectedTemplateId:
    settings.selectedTemplateId != null
      ? String(settings.selectedTemplateId)
      : undefined,
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
  updateClient: (id: string, payload: {
    name: string;
    email: string;
    phone: string;
    program: string;
    startDate: string;
    status: 'active' | 'paused' | 'completed';
    notes: string | null;
  }) => request<void>(`/api/clients/${id}`, {
    method: 'PUT',
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
  getSession: async (id: string) => {
    const session = await request<SessionApiDto>(`/api/sessions/${id}`);
    return mapSessionDto(session);
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
  getNotesTemplateSettings: async () => {
    const settings = await request<NotesTemplateSettingsApiDto>('/api/settings/notes');
    return mapNotesTemplateSettingsDto(settings);
  },
  updateNotesTemplateSettings: async (payload: {
    templateMode: 'default' | 'template';
    selectedTemplateKind?: 'preset' | 'custom';
    selectedTemplateId?: string | number;
  }) => {
    const settings = await request<NotesTemplateSettingsApiDto>('/api/settings/notes', {
      method: 'PUT',
      body: JSON.stringify({
        templateMode: payload.templateMode,
        selectedTemplateKind: payload.selectedTemplateKind ?? null,
        selectedTemplateId:
          payload.selectedTemplateId != null
            ? Number(payload.selectedTemplateId)
            : null,
      }),
    });

    return mapNotesTemplateSettingsDto(settings);
  },
  getTemplatePresets: async () => {
    const templates = await request<TemplateDto[]>('/api/templates/presets');
    return templates.map(mapTemplateDto);
  },
  getCustomTemplates: async (practiceId: string | number) => {
    const templates = await request<TemplateDto[]>(`/api/templates/custom?practiceId=${encodeURIComponent(String(practiceId))}`);
    return templates.map(mapTemplateDto);
  },

  updateTemplate: async (templateId: string | number, payload: {
    practiceId: string | number;
    name: string;
    description?: string;
    fields: Array<{ id: number; label: string; sortOrder: number; fieldType?: string | null }>;
  }) => {
    const template = await request<TemplateDto>(`/api/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify({
        practiceId: Number(payload.practiceId),
        name: payload.name.trim(),
        description: payload.description?.trim() || undefined,
        fields: payload.fields.map((field, index) => ({
          id: Number(field.id) || 0,
          label: field.label,
          sortOrder: index + 1,
          fieldType: field.fieldType ?? null,
        })),
      }),
    });

    return mapTemplateDto(template);
  },
  duplicateTemplateFromPreset: async (payload: { practiceId: string | number; sourcePresetId: string | number; name?: string }) => {
    const template = await request<TemplateDto>('/api/templates/from-preset', {
      method: 'POST',
      body: JSON.stringify({
        practiceId: Number(payload.practiceId),
        sourcePresetId: Number(payload.sourcePresetId),
        name: payload.name?.trim() || undefined,
      }),
    });

    return mapTemplateDto(template);
  },

  deleteTemplate: (templateId: string | number) => request<void>(`/api/templates/${templateId}`, { method: 'DELETE' }),
  getClientDetailView: async (id: string) => {
    const detail = await request<ClientDetailViewDto>(`/api/clients/${id}/detail-view`);
    return {
      ...detail,
      engagements: detail.engagements.map((engagement) => ({
        ...engagement,
        id: String(engagement.id),
        packageId: engagement.packageId ? String(engagement.packageId) : undefined,
        clientPackageId: engagement.clientPackageId ? String(engagement.clientPackageId) : undefined,
        sessions: engagement.sessions.map(mapSessionDto),
      })),
      timeline: detail.timeline.map((entry) => ({
        ...entry,
        sessionId: entry.sessionId ? String(entry.sessionId) : undefined,
        session: entry.session ? mapSessionDto(entry.session) : undefined,
      })),
      clientNotes: detail.clientNotes.map(mapClientNoteDto),
      nextStep: detail.nextStep ? { ...detail.nextStep, sessionId: String(detail.nextStep.sessionId) } : null,
    };
  },
  getClientNotes: async (clientId: string) => {
    const notes = await request<ClientNoteDto[]>(`/api/clients/${clientId}/notes`);
    return notes.map(mapClientNoteDto);
  },
  createClientNote: (clientId: string, payload: { content: string; type?: string; source?: string }) => request<{ id: string }>(`/api/clients/${clientId}/notes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getSessionStructuredNote: async (sessionId: string) => {
    const response = await request<{ note: SessionStructuredNoteDto | null }>(`/api/sessions/${sessionId}/note`);
    return response.note ? mapSessionStructuredNoteDto(response.note) : null;
  },
  saveSessionStructuredNote: (sessionId: string, payload: {
    templateId?: number;
    noteType?: string;
    content: string;
    legacyNotes: string;
  }) => request<void>(`/api/sessions/${sessionId}/note`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  googleLoginUrl: `${API_BASE_URL}/api/auth/google/login`,
};
