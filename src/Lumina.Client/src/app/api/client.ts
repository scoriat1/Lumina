import type {
  AuthMeDto,
  BillingSettingsDto,
  BillingPaymentDto,
  BillingSummaryDto,
  ClientPackageDto,
  ClientDetailViewDto,
  ClientDto,
  ClientNoteDto,
  DashboardDto,
  InvoiceDto,
  NotesTemplateSettingsDto,
  PracticePackageDto,
  ProviderDto,
  SessionDto,
  SessionBillingModeValue,
  SessionEntryMode,
  SessionLocationValue,
  SessionStatusValue,
  SessionStructuredNoteDto,
  SavedReportDto,
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

const calculateProgress = (completed: number, total: number): number => {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
};

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

async function downloadFile(path: string): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json() as { message?: string; title?: string };
      errorMessage = errorBody.message ?? errorBody.title ?? errorMessage;
    } catch {
      // Ignore JSON parsing failures and fall back to status-based message.
    }

    throw new Error(errorMessage);
  }

  const disposition = response.headers.get('content-disposition') ?? '';
  const filenameMatch = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : 'lumina-download.xlsx';

  return {
    blob: await response.blob(),
    filename,
  };
}

async function uploadFile<T>(path: string, file: File): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json() as {
        message?: string;
        title?: string;
        errors?: string[] | Record<string, string[]>;
      };
      const errorDetails = Array.isArray(errorBody.errors)
        ? errorBody.errors
        : errorBody.errors
          ? Object.values(errorBody.errors).flat()
          : [];
      const detailMessage = errorDetails.filter(Boolean).slice(0, 5).join('\n');
      errorMessage = [errorBody.message ?? errorBody.title ?? errorMessage, detailMessage]
        .filter(Boolean)
        .join('\n');
    } catch {
      // Ignore JSON parsing failures and fall back to status-based message.
    }

    throw new Error(errorMessage);
  }

  const responseText = await response.text();
  return responseText ? JSON.parse(responseText) as T : {} as T;
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const withQuery = (
  path: string,
  query?: Record<string, string | number | null | undefined>,
) => {
  if (!query) {
    return path;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
};

type ClientApiDto = Omit<ClientDto, 'initials'> & { initials?: string };
type SessionApiDto = Omit<SessionDto, 'initials'> & { initials?: string };
type InvoiceApiDto = Omit<InvoiceDto, 'clientInitials'> & { clientInitials?: string };
type BillingPaymentApiDto = Omit<BillingPaymentDto, 'clientInitials' | 'sourceId' | 'clientId'> & {
  clientInitials?: string;
  sourceId: string | number;
  clientId: string | number;
};
type ProviderApiDto = Omit<ProviderDto, 'initials'> & { initials?: string };
type NotesTemplateSettingsApiDto = Omit<NotesTemplateSettingsDto, 'selectedTemplateId'> & {
  selectedTemplateId?: number | null;
  selectedTemplateKind?: 'preset' | 'custom' | null;
};
type SavedReportApiDto = Omit<SavedReportDto, 'id' | 'templateId' | 'practiceId' | 'providerId'> & {
  id: string | number;
  templateId?: number | null;
  practiceId: string | number;
  providerId: string | number;
};
type DashboardApiDto = Omit<DashboardDto, 'upcomingSessions' | 'activeClientPreview'> & {
  upcomingSessions: SessionApiDto[];
  activeClientPreview: ClientApiDto[];
};

const mapClientDto = (client: ClientApiDto): ClientDto => ({
  ...client,
  id: String(client.id),
  billingModel: client.billingModel ?? 'payPerSession',
  avatarColor: client.avatarColor ?? computeAvatarColor(client.id),
  initials: client.initials ?? computeInitials(client.name),
  progress: client.progress ?? calculateProgress(client.sessionsCompleted, client.totalSessions),
});

const mapSessionDto = (session: SessionApiDto): SessionDto => ({
  ...session,
  id: String(session.id),
  clientId: String(session.clientId),
  avatarColor: session.avatarColor ?? computeAvatarColor(session.clientId),
  initials: session.initials ?? computeInitials(session.client),
  packageId: session.packageId ? String(session.packageId) : undefined,
  clientPackageId: session.clientPackageId ? String(session.clientPackageId) : undefined,
  invoiceId: session.invoiceId ? String(session.invoiceId) : undefined,
  providerId: session.providerId ? String(session.providerId) : undefined,
});

const mapInvoiceDto = (invoice: InvoiceApiDto): InvoiceDto => ({
  ...invoice,
  clientColor: invoice.clientColor ?? computeAvatarColor(invoice.clientId ?? 0),
  clientInitials: invoice.clientInitials ?? computeInitials(invoice.clientName),
});

const mapBillingPaymentDto = (payment: BillingPaymentApiDto): BillingPaymentDto => ({
  ...payment,
  sourceId: String(payment.sourceId),
  clientId: String(payment.clientId),
  clientColor: payment.clientColor ?? computeAvatarColor(payment.clientId),
  clientInitials: payment.clientInitials ?? computeInitials(payment.clientName),
});

const mapProviderDto = (provider: ProviderApiDto): ProviderDto => ({
  ...provider,
  id: String(provider.id),
  initials: provider.initials ?? computeInitials(provider.name),
});

const mapClientPackageDto = (clientPackage: ClientPackageDto): ClientPackageDto => ({
  ...clientPackage,
  id: String(clientPackage.id),
  packageId: String(clientPackage.packageId),
});

const mapPracticePackageDto = (pkg: PracticePackageDto): PracticePackageDto => ({
  ...pkg,
  id: String(pkg.id),
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
      id: index + 1,
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

const mapSavedReportDto = (report: SavedReportApiDto): SavedReportDto => ({
  ...report,
  id: String(report.id),
  templateId: report.templateId != null ? String(report.templateId) : undefined,
  practiceId: String(report.practiceId),
  providerId: String(report.providerId),
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
    billingModel?: SessionBillingModeValue;
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
    billingModel?: SessionBillingModeValue;
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
  getClientPackages: async (id: string) => {
    const packages = await request<ClientPackageDto[]>(`/api/clients/${id}/packages`);
    return packages.map(mapClientPackageDto);
  },
  createSession: (payload: {
    clientId: string | number;
    date: string;
    duration: number;
    sessionType: string;
    focus: string;
    location: SessionLocationValue;
    status?: SessionStatusValue;
    mode?: SessionEntryMode;
    billingMode: SessionBillingModeValue;
    packageId?: string | number;
    clientPackageId?: string | number;
    amount?: number;
    recurrenceFrequency?: 'weekly' | 'biweekly' | 'monthly';
    recurrenceCount?: number;
  }) => request<{ id: string; ids?: string[]; createdCount?: number }>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      clientId: Number(payload.clientId),
      packageId:
        payload.packageId != null ? Number(payload.packageId) : null,
      clientPackageId:
        payload.clientPackageId != null ? Number(payload.clientPackageId) : null,
      amount: payload.amount ?? null,
      recurrenceFrequency: payload.recurrenceFrequency ?? null,
      recurrenceCount: payload.recurrenceCount ?? null,
    }),
  }),
  updateSession: (id: string, payload: Partial<SessionDto>) => request(`/api/sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  getBillingSummary: (filters?: { clientId?: string; startDate?: string; endDate?: string }) =>
    request<BillingSummaryDto>(withQuery('/api/billing/summary', filters)),
  getBillingPayments: async (filters?: { clientId?: string; startDate?: string; endDate?: string }) => {
    const payments = await request<BillingPaymentApiDto[]>(withQuery('/api/billing/payments', filters));
    return payments.map(mapBillingPaymentDto);
  },
  getBillingSettings: () => request<BillingSettingsDto>('/api/settings/billing'),
  updateBillingSettings: (payload: BillingSettingsDto) => request<BillingSettingsDto>('/api/settings/billing', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  getBillingInvoices: async () => {
    const invoices = await request<InvoiceApiDto[]>('/api/billing/invoices');
    return invoices.map(mapInvoiceDto);
  },
  markInvoicePaid: (id: string) => request<void>(`/api/billing/invoices/${id}/mark-paid`, {
    method: 'POST',
  }),
  markSessionPaid: (id: string, payload: { amount?: number; paymentMethod?: string; paymentDate?: string } = {}) =>
    request<SessionDto>(`/api/sessions/${id}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateSessionPayment: (id: string, payload: {
    paymentStatus: 'paid' | 'pending' | 'unpaid';
    amount?: number | null;
    paymentMethod?: string | null;
    paymentDate?: string | null;
  }) =>
    request<SessionDto>(`/api/sessions/${id}/payment`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  generateMonthlyInvoices: (payload: { year?: number; month?: number; clientId?: string | number; dueDate?: string } = {}) =>
    request<{ createdCount: number; invoiceIds: string[] }>('/api/billing/monthly-invoices', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        clientId: payload.clientId != null ? Number(payload.clientId) : null,
      }),
    }),
  markClientPackagePaid: (
    clientId: string | number,
    clientPackageId: string | number,
    payload: { amount?: number; paymentMethod?: string; paymentDate?: string } = {},
  ) =>
    request<void>(`/api/clients/${clientId}/packages/${clientPackageId}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateClientPackagePayment: (
    clientId: string | number,
    clientPackageId: string | number,
    payload: {
      paymentStatus: 'paid' | 'pending' | 'unpaid';
      amount?: number | null;
      paymentMethod?: string | null;
      paymentDate?: string | null;
    },
  ) =>
    request<void>(`/api/clients/${clientId}/packages/${clientPackageId}/payment`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  getPracticePackages: async () => {
    const packages = await request<PracticePackageDto[]>('/api/settings/packages');
    return packages.map(mapPracticePackageDto);
  },
  createPracticePackage: async (payload: {
    name: string;
    sessionCount: number;
    price: number;
    enabled?: boolean;
  }) => {
    const pkg = await request<PracticePackageDto>('/api/settings/packages', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        enabled: payload.enabled ?? true,
      }),
    });

    return mapPracticePackageDto(pkg);
  },
  updatePracticePackage: async (id: string | number, payload: {
    name: string;
    sessionCount: number;
    price: number;
    enabled: boolean;
  }) => {
    const pkg = await request<PracticePackageDto>(`/api/settings/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    return mapPracticePackageDto(pkg);
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
  getSavedReports: async () => {
    const reports = await request<SavedReportApiDto[]>('/api/reports/custom');
    return reports.map(mapSavedReportDto);
  },
  createSavedReport: async (payload: {
    name: string;
    reportType: string;
    templateId?: string | number;
    templateFieldId?: number;
    fieldKey?: string;
    analysisType?: string;
    filtersJson?: string;
    displayOptionsJson?: string;
  }) => {
    const report = await request<SavedReportApiDto>('/api/reports/custom', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        templateId: payload.templateId != null ? Number(payload.templateId) : null,
      }),
    });

    return mapSavedReportDto(report);
  },
  updateSavedReport: async (id: string | number, payload: {
    name: string;
    reportType: string;
    templateId?: string | number;
    templateFieldId?: number;
    fieldKey?: string;
    analysisType?: string;
    filtersJson?: string;
    displayOptionsJson?: string;
  }) => {
    const report = await request<SavedReportApiDto>(`/api/reports/custom/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...payload,
        templateId: payload.templateId != null ? Number(payload.templateId) : null,
      }),
    });

    return mapSavedReportDto(report);
  },
  deleteSavedReport: (id: string | number) => request<void>(`/api/reports/custom/${id}`, {
    method: 'DELETE',
  }),
  exportPracticeData: async () => {
    const file = await downloadFile('/api/data-export');
    saveBlob(file.blob, file.filename);
  },
  downloadImportTemplate: async () => {
    const file = await downloadFile('/api/data-export/import-template');
    saveBlob(file.blob, file.filename);
  },
  importPracticeData: (file: File) => uploadFile<{
    clientsImported: number;
    sessionsImported: number;
    notesImported: number;
  }>('/api/data-export/import', file),
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
