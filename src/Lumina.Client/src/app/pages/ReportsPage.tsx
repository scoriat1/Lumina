import { useEffect, useMemo, useState, type DragEventHandler, type MouseEvent, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadIcon from '@mui/icons-material/Download';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InsightsIcon from '@mui/icons-material/Insights';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import { PageHeader } from '../components/PageHeader';
import { apiClient } from '../api/client';
import type {
  BillingPaymentDto,
  ClientDto,
  ProviderDto,
  SavedReportDto,
  SessionDto,
  SessionStructuredNoteDto,
  TemplateDto,
} from '../api/types';

type ReportRow = Record<string, string | number>;
type SortDirection = 'asc' | 'desc';
type DateRange = 'thisMonth' | 'lastMonth' | 'last90Days' | 'yearToDate' | 'all' | 'custom';
type ExistingFieldSource = 'session' | 'payment' | 'client' | 'template';
type ReportValueType = 'text' | 'number' | 'currency' | 'date' | 'status';
type StandardReportId =
  | 'revenue'
  | 'paid-unpaid'
  | 'sessions-provider'
  | 'client-status'
  | 'template-analytics';

interface ReportFilters {
  dateRange: DateRange;
  customStartDate: string;
  customEndDate: string;
  providerId: string;
  clientId: string;
  sessionStatus: string;
  paymentStatus: string;
}

interface StructuredEntry {
  session: SessionDto;
  note: SessionStructuredNoteDto;
  templateId: string;
  templateKey: string;
  templateName: string;
  fieldValues: Record<string, string>;
}

interface CustomReportDraft {
  savedReportId: string | null;
  name: string;
  reportType: string;
  templateId: string;
  templateFieldId: number | null;
  fieldKey: string;
  analysisType: string;
  filters: ReportFilters;
  displayOptions: CustomReportDisplayOptions;
}

interface StandardReportDefinition {
  id: StandardReportId;
  title: string;
  description: string;
}

interface ReportSortState {
  sortBy: string;
  sortDirection: SortDirection;
}

interface ExistingFieldOption {
  id: string;
  source: ExistingFieldSource;
  groupLabel: string;
  label: string;
  fieldKey: string;
  valueType: ReportValueType;
  description: string;
  templateId?: string;
  templateKey?: string;
  templateKind?: 'preset' | 'custom';
  templateFieldId?: number;
  templateName?: string;
}

interface ProgressFieldMapping {
  id: string;
  providerId: string;
  templateId: string;
  templateFieldId: number | null;
  fieldKey: string;
  label: string;
}

interface ReportViewModel {
  title: string;
  description: string;
  rows: ReportRow[];
  filename: string;
  summary: Array<{ label: string; value: string | number }>;
  emptyState: string;
}

interface CustomReportDisplayOptions {
  sortBy: string;
  sortDirection: SortDirection;
  progressMappings: ProgressFieldMapping[];
  selectedFields: ExistingFieldOption[];
}

const standardReportDefinitions: StandardReportDefinition[] = [
  {
    id: 'revenue',
    title: 'Revenue',
    description: 'Paid and outstanding billing grouped by payment source.',
  },
  {
    id: 'paid-unpaid',
    title: 'Paid vs Unpaid Sessions',
    description: 'Session counts and billable amounts by payment status.',
  },
  {
    id: 'sessions-provider',
    title: 'Sessions by Provider',
    description: 'Completed, upcoming, and total sessions by provider.',
  },
  {
    id: 'client-status',
    title: 'Active vs Inactive Clients',
    description: 'Client distribution by current status.',
  },
  {
    id: 'template-analytics',
    title: 'Template Analytics',
    description: 'Structured template field usage across sessions without profession-specific assumptions.',
  },
];

const reportActionButtonSx = {
  width: 172,
  minWidth: 172,
  height: '44px !important',
  px: 2,
  borderRadius: '8px',
  textTransform: 'none',
  fontWeight: 700,
  whiteSpace: 'nowrap',
};

const standardReportBaseFieldIds: Record<StandardReportId, string[]> = {
  revenue: [
    'payment:serviceDate',
    'payment:clientName',
    'payment:description',
    'payment:billingSource',
    'payment:paymentStatus',
    'payment:amount',
    'payment:paymentDate',
    'payment:paymentMethod',
  ],
  'paid-unpaid': [
    'session:date',
    'session:client',
    'session:providerName',
    'session:sessionType',
    'session:status',
    'session:paymentStatus',
    'session:billingSource',
    'session:paymentAmount',
  ],
  'sessions-provider': [
    'session:date',
    'session:providerName',
    'session:client',
    'session:sessionType',
    'session:status',
    'session:duration',
    'session:location',
    'session:paymentStatus',
  ],
  'client-status': [
    'client:name',
    'client:status',
    'client:program',
    'client:billingModel',
    'client:email',
    'client:phone',
    'client:startDate',
    'client:sessionsCompleted',
    'client:totalSessions',
    'client:nextSession',
  ],
  'template-analytics': [
    'session:date',
    'session:client',
    'session:providerName',
    'session:sessionType',
  ],
};

const emptyFilters: ReportFilters = {
  dateRange: 'thisMonth',
  customStartDate: '',
  customEndDate: '',
  providerId: 'all',
  clientId: 'all',
  sessionStatus: 'all',
  paymentStatus: 'all',
};

const getCurrentMonthFilters = (): ReportFilters => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    ...emptyFilters,
    customStartDate: toDateInput(start),
    customEndDate: toDateInput(end),
  };
};

const createEmptyCustomDraft = (): CustomReportDraft => ({
  savedReportId: null,
  name: '',
  reportType: 'detail',
  templateId: '',
  templateFieldId: null,
  fieldKey: '',
  analysisType: 'detail',
  filters: getCurrentMonthFilters(),
  displayOptions: {
    sortBy: '',
    sortDirection: 'desc',
    progressMappings: [],
    selectedFields: [],
  },
});

const formatCurrency = (amount: number) =>
  amount.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });

const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

const getDateBounds = (filters: ReportFilters) => {
  const now = new Date();

  switch (filters.dateRange) {
    case 'thisMonth':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      };
    case 'lastMonth':
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
      };
    case 'last90Days': {
      const start = new Date(now);
      start.setDate(start.getDate() - 90);
      return { start, end: now };
    }
    case 'yearToDate':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: now,
      };
    case 'custom':
      return {
        start: filters.customStartDate ? new Date(`${filters.customStartDate}T00:00:00`) : null,
        end: filters.customEndDate ? new Date(`${filters.customEndDate}T23:59:59`) : null,
      };
    default:
      return { start: null, end: null };
  }
};

const inDateRange = (value: string, filters: ReportFilters) => {
  const { start, end } = getDateBounds(filters);
  if (!start && !end) {
    return true;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  if (start && date < start) {
    return false;
  }

  if (end && date > end) {
    return false;
  }

  return true;
};

const sessionFieldOptions: ExistingFieldOption[] = [
  { id: 'session:date', source: 'session', groupLabel: 'Session Fields', label: 'Session Date', fieldKey: 'date', valueType: 'date', description: 'Each matching session with its scheduled date.' },
  { id: 'session:client', source: 'session', groupLabel: 'Session Fields', label: 'Client Name', fieldKey: 'client', valueType: 'text', description: 'Sessions listed by the assigned client.' },
  { id: 'session:providerName', source: 'session', groupLabel: 'Session Fields', label: 'Provider', fieldKey: 'providerName', valueType: 'text', description: 'Sessions listed by provider.' },
  { id: 'session:sessionType', source: 'session', groupLabel: 'Session Fields', label: 'Session Type', fieldKey: 'sessionType', valueType: 'text', description: 'Session type for each record.' },
  { id: 'session:status', source: 'session', groupLabel: 'Session Fields', label: 'Session Status', fieldKey: 'status', valueType: 'status', description: 'Current status of each session.' },
  { id: 'session:paymentStatus', source: 'session', groupLabel: 'Session Fields', label: 'Payment Status', fieldKey: 'paymentStatus', valueType: 'status', description: 'Billing state stored on the session.' },
  { id: 'session:billingSource', source: 'session', groupLabel: 'Session Fields', label: 'Billing Source', fieldKey: 'billingSource', valueType: 'text', description: 'Billing source attached to the session.' },
  { id: 'session:paymentAmount', source: 'session', groupLabel: 'Session Fields', label: 'Session Payment Amount', fieldKey: 'paymentAmount', valueType: 'currency', description: 'Collected or expected amount tied to the session.' },
  { id: 'session:duration', source: 'session', groupLabel: 'Session Fields', label: 'Duration', fieldKey: 'duration', valueType: 'number', description: 'Session duration in minutes.' },
  { id: 'session:location', source: 'session', groupLabel: 'Session Fields', label: 'Location', fieldKey: 'location', valueType: 'text', description: 'Location recorded on the session.' },
  { id: 'session:focus', source: 'session', groupLabel: 'Session Fields', label: 'Focus', fieldKey: 'focus', valueType: 'text', description: 'Focus notes captured on the session.' },
  { id: 'session:packageName', source: 'session', groupLabel: 'Session Fields', label: 'Package Name', fieldKey: 'packageName', valueType: 'text', description: 'Package attached to the session when present.' },
];

const paymentFieldOptions: ExistingFieldOption[] = [
  { id: 'payment:serviceDate', source: 'payment', groupLabel: 'Billing Fields', label: 'Service Date', fieldKey: 'serviceDate', valueType: 'date', description: 'Billing records by service date.' },
  { id: 'payment:clientName', source: 'payment', groupLabel: 'Billing Fields', label: 'Client Name', fieldKey: 'clientName', valueType: 'text', description: 'Billing records by client.' },
  { id: 'payment:description', source: 'payment', groupLabel: 'Billing Fields', label: 'Description', fieldKey: 'description', valueType: 'text', description: 'Payment description on each billing record.' },
  { id: 'payment:amount', source: 'payment', groupLabel: 'Billing Fields', label: 'Amount', fieldKey: 'amount', valueType: 'currency', description: 'Amount on each billing record.' },
  { id: 'payment:paymentStatus', source: 'payment', groupLabel: 'Billing Fields', label: 'Payment Status', fieldKey: 'paymentStatus', valueType: 'status', description: 'Whether the billing item is paid or still due.' },
  { id: 'payment:billingSource', source: 'payment', groupLabel: 'Billing Fields', label: 'Billing Source', fieldKey: 'billingSource', valueType: 'text', description: 'Source of the charge.' },
  { id: 'payment:paymentDate', source: 'payment', groupLabel: 'Billing Fields', label: 'Payment Date', fieldKey: 'paymentDate', valueType: 'date', description: 'Date the payment was recorded.' },
  { id: 'payment:paymentMethod', source: 'payment', groupLabel: 'Billing Fields', label: 'Payment Method', fieldKey: 'paymentMethod', valueType: 'text', description: 'Payment method used on the billing record.' },
];

const clientFieldOptions: ExistingFieldOption[] = [
  { id: 'client:name', source: 'client', groupLabel: 'Client Fields', label: 'Client Name', fieldKey: 'name', valueType: 'text', description: 'Client roster with the selected field included.' },
  { id: 'client:status', source: 'client', groupLabel: 'Client Fields', label: 'Client Status', fieldKey: 'status', valueType: 'status', description: 'Status of each client record.' },
  { id: 'client:program', source: 'client', groupLabel: 'Client Fields', label: 'Program', fieldKey: 'program', valueType: 'text', description: 'Program listed for each client.' },
  { id: 'client:billingModel', source: 'client', groupLabel: 'Client Fields', label: 'Billing Model', fieldKey: 'billingModel', valueType: 'text', description: 'Billing model stored on the client.' },
  { id: 'client:email', source: 'client', groupLabel: 'Client Fields', label: 'Email', fieldKey: 'email', valueType: 'text', description: 'Client email addresses.' },
  { id: 'client:phone', source: 'client', groupLabel: 'Client Fields', label: 'Phone', fieldKey: 'phone', valueType: 'text', description: 'Client phone numbers.' },
  { id: 'client:startDate', source: 'client', groupLabel: 'Client Fields', label: 'Start Date', fieldKey: 'startDate', valueType: 'date', description: 'Client start date.' },
  { id: 'client:sessionsCompleted', source: 'client', groupLabel: 'Client Fields', label: 'Sessions Completed', fieldKey: 'sessionsCompleted', valueType: 'number', description: 'Completed sessions tracked for the client.' },
  { id: 'client:totalSessions', source: 'client', groupLabel: 'Client Fields', label: 'Total Sessions', fieldKey: 'totalSessions', valueType: 'number', description: 'Total sessions available on the client record.' },
  { id: 'client:nextSession', source: 'client', groupLabel: 'Client Fields', label: 'Next Session', fieldKey: 'nextSession', valueType: 'date', description: 'Upcoming session date stored on the client.' },
];

const createEmptyProgressMapping = (): ProgressFieldMapping => ({
  id: `mapping-${Math.random().toString(36).slice(2, 9)}`,
  providerId: 'all',
  templateId: '',
  templateFieldId: null,
  fieldKey: '',
  label: '',
});

const downloadFile = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const exportCsv = (filename: string, rows: ReportRow[]) => {
  const headers = Object.keys(rows[0] ?? { Report: 'No rows' });
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(formatCellValue(header, row[header])).replace(/"/g, '""')}"`)
        .join(','),
    ),
  ];
  downloadFile(`${filename}.csv`, lines.join('\n'), 'text/csv;charset=utf-8');
};

const exportExcel = (filename: string, rows: ReportRow[]) => {
  const headers = Object.keys(rows[0] ?? { Report: 'No rows' });
  const html = `
    <table>
      <thead><tr>${headers.map((header) => `<th style="border:1px solid #CFC7C2;padding:8px 10px;background:#FDFCFB;font-weight:700;">${header}</th>`).join('')}</tr></thead>
      <tbody>
        ${rows
          .map((row) => `<tr>${headers.map((header) => `<td style="border:1px solid #D8D0CB;padding:8px 10px;">${formatCellValue(header, row[header])}</td>`).join('')}</tr>`)
          .join('')}
      </tbody>
    </table>
  `;

  downloadFile(`${filename}.xls`, html, 'application/vnd.ms-excel;charset=utf-8');
};

const parseStructuredEntries = (
  session: SessionDto,
  note: SessionStructuredNoteDto | null,
  templates: TemplateDto[],
): StructuredEntry[] => {
  if (!note?.content?.trim()) {
    return [];
  }

  const resolveTemplate = (templateId: string | number | undefined, templateName?: string) => {
    if (!templateId) {
      return null;
    }

    const candidates = templates.filter((template) => template.id === String(templateId));
    if (templateName) {
      const namedMatch = candidates.find((template) => template.name === templateName);
      if (namedMatch) {
        return namedMatch;
      }
    }

    return candidates.find((template) => template.custom) ?? candidates[0] ?? null;
  };

  const buildEntry = (templateId: string | number | undefined, content: unknown, templateName?: string): StructuredEntry | null => {
    if (!templateId || typeof content !== 'string') {
      return null;
    }

    const template = resolveTemplate(templateId, templateName);
    if (!template) {
      return null;
    }
    const templateKind = template.custom ? 'custom' : 'preset';

    try {
      const parsed = JSON.parse(content) as Record<string, string>;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }

      return {
        session,
        note,
        templateId: String(templateId),
        templateKey: `${templateKind}:${template.id}`,
        templateName: template.name,
        fieldValues: parsed,
      };
    } catch {
      return null;
    }
  };

  try {
    const parsed = JSON.parse(note.content) as
      | { notes?: Array<{ isTemplate?: boolean; templateId?: string | number; templateName?: string; content?: string }> }
      | Array<{ isTemplate?: boolean; templateId?: string | number; templateName?: string; content?: string }>;

    const noteItems = Array.isArray(parsed) ? parsed : parsed.notes;
    if (Array.isArray(noteItems)) {
      return noteItems
        .filter((item) => item.isTemplate)
        .map((item) => buildEntry(item.templateId, item.content, item.templateName))
        .filter((entry): entry is StructuredEntry => Boolean(entry));
    }
  } catch {
    // Fall through to single-template content.
  }

  const entry = buildEntry(note.templateId, note.content);
  return entry ? [entry] : [];
};

const parseJsonObject = <T extends Record<string, unknown>>(value: string | undefined, fallback: T): T => {
  if (!value?.trim()) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value) as T;
    return parsed && typeof parsed === 'object' ? { ...fallback, ...parsed } : fallback;
  } catch {
    return fallback;
  }
};

const sortRows = (rows: ReportRow[], sortBy: string, sortDirection: SortDirection) => {
  if (!sortBy) {
    return rows;
  }

  return [...rows].sort((left, right) => {
    const leftValue = left[sortBy];
    const rightValue = right[sortBy];

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return sortDirection === 'asc' ? leftValue - rightValue : rightValue - leftValue;
    }

    return sortDirection === 'asc'
      ? String(leftValue ?? '').localeCompare(String(rightValue ?? ''))
      : String(rightValue ?? '').localeCompare(String(leftValue ?? ''));
  });
};

export function ReportsPage() {
  const [standardFilters, setStandardFilters] = useState<ReportFilters>(getCurrentMonthFilters());
  const [selectedReportKey, setSelectedReportKey] = useState<string>(`standard:${standardReportDefinitions[0].id}`);
  const [customDraft, setCustomDraft] = useState<CustomReportDraft>(createEmptyCustomDraft());
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [payments, setPayments] = useState<BillingPaymentDto[]>([]);
  const [providers, setProviders] = useState<ProviderDto[]>([]);
  const [templates, setTemplates] = useState<TemplateDto[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReportDto[]>([]);
  const [structuredEntries, setStructuredEntries] = useState<StructuredEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [isDeletingReport, setIsDeletingReport] = useState(false);
  const [isEditingCustomReport, setIsEditingCustomReport] = useState(false);
  const [isReportExpanded, setIsReportExpanded] = useState(false);
  const [standardSorts, setStandardSorts] = useState<Partial<Record<StandardReportId, ReportSortState>>>({});

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        setLoading(true);

        const [me, sessionData, clientData, paymentData, providerData, presetTemplates, reportData] = await Promise.all([
          apiClient.getMe(),
          apiClient.getSessions(),
          apiClient.getClients(),
          apiClient.getBillingPayments(),
          apiClient.getProviders(),
          apiClient.getTemplatePresets(),
          apiClient.getSavedReports(),
        ]);

        const customTemplates = await apiClient.getCustomTemplates(me.practiceId);
        const reportPresetTemplates = presetTemplates.map((template) => ({ ...template, custom: false }));
        const reportCustomTemplates = customTemplates.map((template) => ({ ...template, custom: true }));
        const allTemplates = [...reportPresetTemplates, ...reportCustomTemplates];

        const structuredNotes = await Promise.all(
          sessionData.map(async (session) => ({
            session,
            note: await apiClient.getSessionStructuredNote(session.id),
          })),
        );

        setSessions(sessionData);
        setClients(clientData);
        setPayments(paymentData);
        setProviders(providerData);
        setTemplates(allTemplates);
        setSavedReports(reportData);
        setStructuredEntries(
          structuredNotes.flatMap(({ session, note }) => parseStructuredEntries(session, note, allTemplates)),
        );
        setLoadError(null);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Unable to load reports.');
      } finally {
        setLoading(false);
      }
    };

    void loadWorkspace();
  }, []);

  useEffect(() => {
    if (selectedReportKey === 'custom:new') {
      return;
    }

    if (!selectedReportKey.startsWith('custom:')) {
      return;
    }

    const reportId = selectedReportKey.replace('custom:', '');
    const savedReport = savedReports.find((report) => report.id === reportId);
    if (!savedReport) {
      setSelectedReportKey(`standard:${standardReportDefinitions[0].id}`);
    }
  }, [savedReports, selectedReportKey]);

  const templateById = useMemo(
    () => new Map(templates.map((template) => [template.id, template])),
    [templates],
  );

  const filterOptions = useMemo(() => ({
    clients,
    providers,
    sessionStatuses: ['upcoming', 'completed', 'cancelled', 'noShow'],
    paymentStatuses: ['paid', 'pending', 'unpaid'],
  }), [clients, providers]);

  const filteredSessions = useMemo(
    () => sessions.filter((session) => matchesSessionFilters(session, standardFilters)),
    [sessions, standardFilters],
  );

  const filteredPayments = useMemo(
    () => payments.filter((payment) => matchesPaymentFilters(payment, standardFilters)),
    [payments, standardFilters],
  );

  const filteredEntries = useMemo(
    () => structuredEntries.filter((entry) => matchesStructuredEntryFilters(entry, standardFilters)),
    [structuredEntries, standardFilters],
  );

  const standardReportModels = useMemo<Record<StandardReportId, ReportViewModel>>(() => {
    const revenueRows = filteredPayments.map((payment) => ({
      'Service Date': payment.serviceDate,
      Client: payment.clientName,
      Description: payment.description,
      Source: payment.billingSource,
      'Payment Status': payment.paymentStatus,
      Amount: payment.amount,
      'Payment Date': payment.paymentDate ?? '',
      Method: payment.paymentMethod ?? '',
    }));

    const paidRows = filteredSessions
      .filter((session) => session.paymentStatus || session.paymentAmount || session.packagePrice)
      .map((session) => ({
        Date: session.date,
        Client: session.client,
        Provider: session.providerName ?? 'Unassigned',
        'Session Type': session.sessionType,
        'Session Status': session.status,
        'Payment Status': session.paymentStatus ?? 'unpaid',
        Source: session.billingSource ?? '',
        Amount: session.paymentAmount ?? session.packagePrice ?? 0,
        'Payment Date': session.paymentDate ?? '',
      }));

    const providerRows = filteredSessions.map((session) => ({
      Date: session.date,
      Provider: session.providerName ?? 'Unassigned',
      Client: session.client,
      'Session Type': session.sessionType,
      Status: session.status,
      Duration: session.duration,
      Location: session.location,
      'Payment Status': session.paymentStatus ?? 'unpaid',
    }));

    const clientRows = clients
      .filter((client) => standardFilters.clientId === 'all' || client.id === standardFilters.clientId)
      .map((client) => ({
        Client: client.name,
        Status: client.status,
        Program: client.program,
        'Billing Model': client.billingModel,
        Email: client.email,
        Phone: client.phone,
        'Start Date': client.startDate,
        'Sessions Completed': client.sessionsCompleted,
        'Total Sessions': client.totalSessions,
        'Next Session': client.nextSession ?? '',
      }));

    const templateRows = filteredEntries.flatMap((entry) =>
      Object.entries(entry.fieldValues)
        .filter(([, value]) => value.trim())
        .map(([field, value]) => ({
          Date: entry.session.date,
          Client: entry.session.client,
          Provider: entry.session.providerName ?? 'Unassigned',
          Template: entry.templateName,
          Field: field,
          Value: value,
          'Session Type': entry.session.sessionType,
        })),
    );

    return {
      revenue: {
        title: 'Revenue',
        description: 'Detailed billing activity with service dates, clients, payment status, and amounts.',
        rows: revenueRows,
        filename: 'lumina-report-revenue',
        summary: buildSummaryMetrics(revenueRows),
        emptyState: 'No billing activity matches the selected filters.',
      },
      'paid-unpaid': {
        title: 'Paid vs Unpaid Sessions',
        description: 'Detailed session billing rows with payment status, amounts, and dates.',
        rows: paidRows,
        filename: 'lumina-report-paid-vs-unpaid',
        summary: buildSummaryMetrics(paidRows),
        emptyState: 'No billable sessions are available for the selected filters.',
      },
      'sessions-provider': {
        title: 'Sessions by Provider',
        description: 'Detailed schedule rows with provider, client, date, duration, and status.',
        rows: providerRows,
        filename: 'lumina-report-sessions-by-provider',
        summary: buildSummaryMetrics(providerRows),
        emptyState: 'No provider activity matches the selected filters.',
      },
      'client-status': {
        title: 'Active vs Inactive Clients',
        description: 'Detailed client roster with status, program, and session counts.',
        rows: clientRows,
        filename: 'lumina-report-client-status',
        summary: buildSummaryMetrics(clientRows),
        emptyState: 'No clients match the selected filters.',
      },
      'template-analytics': {
        title: 'Template Analytics',
        description: 'Detailed structured-note rows with template, field, value, client, and session date.',
        rows: templateRows,
        filename: 'lumina-report-template-analytics',
        summary: buildSummaryMetrics(templateRows),
        emptyState: 'No structured template data is available for the selected filters.',
      },
    };
  }, [clients, filteredEntries, filteredPayments, filteredSessions, standardFilters.clientId]);

  const selectedStandardReportId = selectedReportKey.startsWith('standard:')
    ? (selectedReportKey.replace('standard:', '') as StandardReportId)
    : null;
  const selectedStandardReportBase = selectedStandardReportId
    ? standardReportModels[selectedStandardReportId]
    : null;
  const selectedStandardSort = selectedStandardReportId
    ? standardSorts[selectedStandardReportId] ?? { sortBy: '', sortDirection: 'asc' as SortDirection }
    : null;
  const selectedStandardReport = useMemo(() => {
    if (!selectedStandardReportBase) {
      return null;
    }

    const sortedRows = sortRows(
      selectedStandardReportBase.rows,
      selectedStandardSort?.sortBy ?? '',
      selectedStandardSort?.sortDirection ?? 'asc',
    );

    return {
      ...selectedStandardReportBase,
      rows: sortedRows,
      summary: buildSummaryMetrics(sortedRows),
    };
  }, [selectedStandardReportBase, selectedStandardSort?.sortBy, selectedStandardSort?.sortDirection]);

  const customFieldOptions = useMemo<ExistingFieldOption[]>(() => {
    const templateFields = templates.flatMap((template) => {
      const fields = template.fieldsDetail?.length
        ? template.fieldsDetail
        : template.fields.map((label, index) => ({
            id: index + 1,
            label,
            sortOrder: index + 1,
            fieldType: undefined,
          }));

      const templateKind = template.custom ? 'custom' : 'preset';
      const templateKey = `${templateKind}:${template.id}`;
      return fields.map((field) => ({
        id: `template:${templateKey}:${field.id}`,
        source: 'template' as const,
        groupLabel: template.custom ? 'Custom Note Template Fields' : 'Standard Note Template Fields',
        label: field.label,
        fieldKey: field.label,
        valueType: 'text',
        description: `Detailed rows from the ${template.name} template for the field ${field.label}.`,
        templateId: template.id,
        templateKey,
        templateKind,
        templateFieldId: field.id,
        templateName: template.name,
      }));
    });

    return [...sessionFieldOptions, ...paymentFieldOptions, ...clientFieldOptions, ...templateFields];
  }, [templates]);

  const progressFieldOptions = useMemo(
    () => customFieldOptions.filter((option) => option.source === 'template'),
    [customFieldOptions],
  );

  const detailSource = customDraft.reportType.startsWith('detail:')
    ? customDraft.reportType.replace('detail:', '')
    : '';

  const selectedFieldOption = useMemo(
    () =>
      customDraft.reportType === 'progressTracking'
        ? null
        :
      customFieldOptions.find((option) =>
        option.source === 'template'
          ? option.templateId === customDraft.templateId
            && option.templateFieldId === customDraft.templateFieldId
            && option.fieldKey === customDraft.fieldKey
          : option.source === detailSource && option.fieldKey === customDraft.fieldKey,
      ) ?? null,
    [customDraft.fieldKey, customDraft.reportType, customDraft.templateFieldId, customDraft.templateId, customFieldOptions, detailSource],
  );

  const selectedCustomFields = useMemo(() => {
    if (customDraft.displayOptions.selectedFields?.length) {
      return customDraft.displayOptions.selectedFields
        .map((field) =>
          customFieldOptions.find((option) => option.id === field.id)
          ?? customFieldOptions.find((option) =>
            option.source === field.source
            && option.templateId === field.templateId
            && option.templateName === field.templateName
            && option.fieldKey === field.fieldKey,
          )
          ?? field,
        )
        .filter((field): field is ExistingFieldOption => Boolean(field));
    }

    return selectedFieldOption ? [selectedFieldOption] : [];
  }, [customDraft.displayOptions.selectedFields, customFieldOptions, selectedFieldOption]);

  const customEntries = useMemo(
    () => structuredEntries.filter((entry) => matchesStructuredEntryFilters(entry, standardFilters)),
    [standardFilters, structuredEntries],
  );

  const customReportResult = useMemo(() => {
    if (selectedCustomFields.length === 0) {
      return null;
    }

    const baseMetadata = {
      title: customDraft.name.trim() || 'Custom Report',
      description: `${selectedCustomFields.length} saved field${selectedCustomFields.length === 1 ? '' : 's'} shown with the current report filters.`,
      filename: `lumina-custom-${slugify(customDraft.name || 'custom-report')}`,
      emptyState: 'No results match this field and filter combination.',
    };

    const rows = buildCustomReportRows({
      fields: selectedCustomFields,
      sessions: filteredSessions,
      payments: filteredPayments,
      clients,
      structuredEntries: customEntries,
      filters: standardFilters,
    });

    const sortedRows = sortRows(rows, customDraft.displayOptions.sortBy, customDraft.displayOptions.sortDirection);

    return {
      ...baseMetadata,
      rows: sortedRows,
      summary: buildSummaryMetrics(sortedRows),
    } satisfies ReportViewModel;
  }, [clients, customDraft.displayOptions.sortBy, customDraft.displayOptions.sortDirection, customDraft.name, customEntries, filteredPayments, filteredSessions, selectedCustomFields, standardFilters]);

  const selectedSavedReport = selectedReportKey.startsWith('custom:')
    ? savedReports.find((report) => report.id === selectedReportKey.replace('custom:', '')) ?? null
    : null;

  const customResultHeaders = Object.keys(customReportResult?.rows[0] ?? {});

  const applySavedReport = (savedReport: SavedReportDto) => {
    const savedFilters = parseJsonObject<ReportFilters>(savedReport.filtersJson, getCurrentMonthFilters());
    const savedDisplayOptions = parseJsonObject<CustomReportDraft['displayOptions']>(savedReport.displayOptionsJson, {
      sortBy: '',
      sortDirection: 'desc',
      progressMappings: [],
      selectedFields: [],
    });
    const normalizedReportType = savedReport.reportType === 'progressTracking'
      ? 'progressTracking'
      : savedReport.reportType?.startsWith('detail:')
        ? savedReport.reportType
        : savedReport.reportType
          ? `detail:${savedReport.reportType}`
          : 'detail';

    setCustomDraft({
      savedReportId: savedReport.id,
      name: savedReport.name,
      reportType: normalizedReportType,
      templateId: savedReport.templateId ?? '',
      templateFieldId: savedReport.templateFieldId ?? null,
      fieldKey: savedReport.fieldKey ?? '',
      analysisType: savedReport.analysisType ?? 'detail',
      filters: {
        ...getCurrentMonthFilters(),
        ...savedFilters,
      },
      displayOptions: {
        sortBy: savedDisplayOptions.sortBy ?? '',
        sortDirection: savedDisplayOptions.sortDirection === 'asc' ? 'asc' : 'desc',
        progressMappings: Array.isArray(savedDisplayOptions.progressMappings) ? savedDisplayOptions.progressMappings : [],
        selectedFields: Array.isArray(savedDisplayOptions.selectedFields) ? savedDisplayOptions.selectedFields : [],
      },
    });
    setSelectedReportKey(`custom:${savedReport.id}`);
    setIsEditingCustomReport(false);
    setIsReportExpanded(false);
    setSaveMessage(null);
  };

  const handleSelectNewCustomReport = () => {
    setCustomDraft(createEmptyCustomDraft());
    setSelectedReportKey('custom:new');
    setIsEditingCustomReport(true);
    setIsReportExpanded(false);
    setSaveMessage(null);
  };

  const handleCancelCustomEdit = () => {
    if (selectedSavedReport) {
      applySavedReport(selectedSavedReport);
      return;
    }

    setCustomDraft(createEmptyCustomDraft());
    setSelectedReportKey(`standard:${standardReportDefinitions[0].id}`);
    setIsEditingCustomReport(false);
    setIsReportExpanded(false);
    setSaveMessage(null);
  };

  const handleSaveCustomReport = async () => {
    if (!customDraft.name.trim() || selectedCustomFields.length === 0) {
      setSaveMessage('Add a report template name and at least one field before saving.');
      return;
    }

    setIsSavingReport(true);
    setSaveMessage(null);

    try {
      const firstTemplateField = selectedCustomFields.find((field) => field.source === 'template');
      const payload = {
        name: customDraft.name.trim(),
        reportType: 'customTemplate',
        templateId: firstTemplateField?.templateId || undefined,
        templateFieldId: firstTemplateField?.templateFieldId ?? undefined,
        fieldKey: selectedCustomFields[0]?.fieldKey,
        analysisType: 'detail',
        filtersJson: '{}',
        displayOptionsJson: JSON.stringify({
          ...customDraft.displayOptions,
          selectedFields: selectedCustomFields,
          progressMappings: [],
        }),
      };

      const savedReport = customDraft.savedReportId
        ? await apiClient.updateSavedReport(customDraft.savedReportId, payload)
        : await apiClient.createSavedReport(payload);

      setSavedReports((current) => {
        const next = current.filter((report) => report.id !== savedReport.id).concat(savedReport);
        return next.sort((left, right) => left.name.localeCompare(right.name));
      });

      setCustomDraft((current) => ({
        ...current,
        savedReportId: savedReport.id,
      }));
      setSelectedReportKey(`custom:${savedReport.id}`);
      setIsEditingCustomReport(false);
      setSaveMessage(customDraft.savedReportId ? 'Saved changes to custom report.' : 'Saved custom report.');
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Unable to save custom report.');
    } finally {
      setIsSavingReport(false);
    }
  };

  const handleDeleteCustomReport = async () => {
    if (!customDraft.savedReportId) {
      handleSelectNewCustomReport();
      return;
    }

    const confirmed = window.confirm(`Delete "${customDraft.name}"?`);
    if (!confirmed) {
      return;
    }

    setIsDeletingReport(true);
    setSaveMessage(null);

    try {
      await apiClient.deleteSavedReport(customDraft.savedReportId);
      setSavedReports((current) => current.filter((report) => report.id !== customDraft.savedReportId));
      handleSelectNewCustomReport();
      setSaveMessage('Deleted custom report.');
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Unable to delete custom report.');
    } finally {
      setIsDeletingReport(false);
    }
  };

  const selectedViewModel = selectedStandardReport ?? customReportResult;
  const isNewCustomReport = selectedReportKey === 'custom:new';
  const isCustomReportSelected = !selectedStandardReport;
  const showCustomBuilder = isNewCustomReport || isEditingCustomReport;
  const canToggleReportExpansion = Boolean(selectedViewModel?.rows.length) && !showCustomBuilder;

  const handleReportPanelClick = (event: MouseEvent<HTMLElement>) => {
    if (!canToggleReportExpansion) {
      return;
    }

    const target = event.target instanceof HTMLElement ? event.target : null;
    if (target?.closest('button, input, textarea, select, a, [role="button"], [role="combobox"], [role="listbox"], [data-no-report-toggle="true"]')) {
      return;
    }

    setIsReportExpanded((current) => !current);
  };

  const handleReportHeaderSort = (header: string) => {
    if (!isCustomReportSelected && selectedStandardReportId) {
      setStandardSorts((current) => {
        const currentSort = current[selectedStandardReportId] ?? { sortBy: '', sortDirection: 'asc' as SortDirection };
        const isSameColumn = currentSort.sortBy === header;

        return {
          ...current,
          [selectedStandardReportId]: {
            sortBy: header,
            sortDirection: isSameColumn && currentSort.sortDirection === 'asc' ? 'desc' : 'asc',
          },
        };
      });
      return;
    }

    setCustomDraft((current) => {
      const isSameColumn = current.displayOptions.sortBy === header;
      return {
        ...current,
        displayOptions: {
          ...current.displayOptions,
          sortBy: header,
          sortDirection: isSameColumn && current.displayOptions.sortDirection === 'asc' ? 'desc' : 'asc',
        },
      };
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        mx: { xs: -2, sm: -3, md: -4 },
        mt: { xs: -3, sm: -4 },
        mb: { xs: -4, sm: -5 },
        px: { xs: 2, sm: 3, md: 4 },
        pb: { xs: 4, sm: 5 },
      }}
    >
      <Box
        sx={{
          maxWidth: '1600px',
          width: '100%',
          mx: 'auto',
          px: { xs: 1, md: 2 },
          pt: { xs: 3, md: 4 },
          pb: { xs: 1, md: 2 },
          mb: { xs: 2, md: 3 },
        }}
      >
        <PageHeader
          title="Reports"
          subtitle="Choose a report, apply filters, and export your data"
        />
      </Box>

      {loading ? (
        <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : null}

      {loadError ? <Alert severity="error" sx={{ mb: 3 }}>{loadError}</Alert> : null}

      {!loading && !loadError ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: isReportExpanded ? '1fr' : '280px minmax(0, 1fr)' },
            gap: { xs: 3, lg: 6 },
            minHeight: 0,
            alignItems: 'start',
            maxWidth: isReportExpanded ? 'calc(100vw - 96px)' : '1600px',
            width: '100%',
            mx: 'auto',
            px: { xs: 1, md: 2 },
          }}
        >
          <Box sx={{ position: { lg: 'sticky' }, top: { lg: 24 }, display: isReportExpanded ? 'none' : 'block' }}>
            <Box sx={{ mb: 4 }}>
              <SidebarSection
                title="Standard Reports"
              >
                {standardReportDefinitions.map((report) => (
                  <SidebarItemButton
                    key={report.id}
                    active={selectedReportKey === `standard:${report.id}`}
                    title={report.title}
                    icon={<AssessmentIcon />}
                    onClick={() => {
                      setSelectedReportKey(`standard:${report.id}`);
                      setIsEditingCustomReport(false);
                      setIsReportExpanded(false);
                      setSaveMessage(null);
                    }}
                  />
                ))}
              </SidebarSection>
            </Box>

            <Divider sx={{ my: 3, borderColor: 'rgba(214, 211, 209, 0.65)' }} />
            <Box sx={{ mt: 4 }}>
              <SidebarSection
                title="Custom Reports"
                action={(
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleSelectNewCustomReport}
                    sx={{ textTransform: 'none', color: '#7A5C80', fontWeight: 700 }}
                  >
                    New
                  </Button>
                )}
              >
                <SidebarItemButton
                  active={selectedReportKey === 'custom:new'}
                  title="New Report Template"
                  icon={<TuneIcon />}
                  onClick={handleSelectNewCustomReport}
                />
                {savedReports.length === 0 ? (
                  <Box sx={{ px: 1, pt: 1, color: '#9A9490', fontSize: '13px', lineHeight: 1.5 }}>
                    No saved custom reports yet.
                  </Box>
                ) : (
                  savedReports.map((report) => (
                    <SidebarItemButton
                      key={report.id}
                      active={selectedReportKey === `custom:${report.id}`}
                      title={report.name}
                      icon={<AutoGraphIcon />}
                      onClick={() => applySavedReport(report)}
                    />
                  ))
                )}
              </SidebarSection>
            </Box>
          </Box>

          <Box>
            <Box sx={{ mb: 4, pb: 3, borderBottom: '1px solid rgba(214, 211, 209, 0.7)' }}>
              <StandardFilterBar
                filters={standardFilters}
                setFilters={setStandardFilters}
                filterOptions={filterOptions}
              />
            </Box>

            {isReportExpanded ? (
              <Box
                aria-hidden="true"
                onClick={() => setIsReportExpanded(false)}
                sx={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 1199,
                  cursor: 'zoom-out',
                  bgcolor: 'rgba(28, 25, 23, 0.02)',
                }}
              />
            ) : null}

            <Box
              onClick={handleReportPanelClick}
              title={canToggleReportExpansion ? (isReportExpanded ? 'Collapse report' : 'Expand report') : undefined}
              sx={{
                bgcolor: '#FFFFFF',
                border: '1px solid rgba(214, 211, 209, 0.8)',
                borderRadius: '20px',
                overflow: isReportExpanded ? 'auto' : 'hidden',
                boxShadow: '0 8px 24px rgba(39, 34, 30, 0.04)',
                cursor: canToggleReportExpansion ? (isReportExpanded ? 'zoom-out' : 'zoom-in') : 'default',
                ...(isReportExpanded
                  ? {
                      position: 'fixed',
                      top: { xs: 16, md: 72 },
                      right: { xs: 16, md: 24 },
                      bottom: { xs: 16, md: 24 },
                      left: { xs: 16, md: 80 },
                      zIndex: 1200,
                    }
                  : {}),
              }}
            >
              <Box sx={{ px: { xs: 3, md: 5 }, py: { xs: 3, md: 4 } }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
                    gap: 2.5,
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ minWidth: 0, pt: { md: 0.5 } }}>
                    <Typography
                      sx={{
                        fontSize: { xs: '28px', md: '32px' },
                        fontWeight: 700,
                        color: '#1C1917',
                        letterSpacing: 0,
                        lineHeight: 1.15,
                        maxWidth: '100%',
                        wordBreak: 'break-word',
                      }}
                    >
                      {selectedStandardReport?.title ?? (customDraft.name || 'Custom Report')}
                    </Typography>
                  </Box>

                  <Stack
                    direction="row"
                    spacing={1.25}
                    useFlexGap
                    data-no-report-toggle="true"
                    sx={{
                      flexWrap: 'wrap',
                      justifyContent: { xs: 'flex-start', md: 'flex-end' },
                      alignItems: 'center',
                      maxWidth: '100%',
                    }}
                  >
                    <Button
                      variant="text"
                      startIcon={<DownloadIcon />}
                      disabled={!selectedViewModel || selectedViewModel.rows.length === 0}
                      onClick={() => selectedViewModel && exportCsv(selectedViewModel.filename, selectedViewModel.rows)}
                      sx={{ ...reportActionButtonSx, color: '#57534E' }}
                    >
                      CSV
                    </Button>
                    <Button
                      variant="text"
                      startIcon={<DownloadIcon />}
                      disabled={!selectedViewModel || selectedViewModel.rows.length === 0}
                      onClick={() => selectedViewModel && exportExcel(selectedViewModel.filename, selectedViewModel.rows)}
                      sx={{ ...reportActionButtonSx, color: '#57534E' }}
                    >
                      Excel
                    </Button>
                  </Stack>
                </Box>

                {isCustomReportSelected ? (
                  <Stack
                    direction="row"
                    spacing={1.25}
                    useFlexGap
                    data-no-report-toggle="true"
                    sx={{
                      flexWrap: 'wrap',
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                      maxWidth: '100%',
                      mt: 2.5,
                    }}
                  >
                    {isCustomReportSelected && showCustomBuilder ? (
                      <>
                        <Button
                          variant="outlined"
                          disabled={isSavingReport}
                          onClick={handleCancelCustomEdit}
                          sx={{
                            ...reportActionButtonSx,
                            borderColor: 'rgba(214, 211, 209, 0.9)',
                            color: '#57534E',
                            '&:hover': { borderColor: '#A8A29E', bgcolor: '#FAFAF9' },
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<SaveOutlinedIcon />}
                          disabled={isSavingReport}
                          onClick={() => {
                            void handleSaveCustomReport();
                          }}
                          sx={{
                            ...reportActionButtonSx,
                            bgcolor: '#1C1917',
                            '&:hover': { bgcolor: '#292524' },
                          }}
                        >
                          {isSavingReport ? 'Saving...' : customDraft.savedReportId ? 'Save Changes' : 'Save Template'}
                        </Button>
                        {customDraft.savedReportId ? (
                          <Button
                            variant="outlined"
                            startIcon={<DeleteOutlineIcon />}
                            disabled={isDeletingReport}
                            onClick={() => {
                              void handleDeleteCustomReport();
                            }}
                            sx={{
                              ...reportActionButtonSx,
                              borderColor: 'rgba(214, 211, 209, 0.9)',
                              color: '#57534E',
                              '&:hover': { borderColor: '#A8A29E', bgcolor: '#FAFAF9' },
                            }}
                          >
                            Delete
                          </Button>
                        ) : null}
                      </>
                    ) : null}
                    {isCustomReportSelected && !showCustomBuilder ? (
                      <Button
                        variant="outlined"
                        startIcon={<EditOutlinedIcon />}
                        onClick={() => {
                          setIsEditingCustomReport(true);
                          setSaveMessage(null);
                        }}
                        sx={{
                          ...reportActionButtonSx,
                          borderColor: 'rgba(214, 211, 209, 0.9)',
                          color: '#57534E',
                          '&:hover': { borderColor: '#A8A29E', bgcolor: '#FAFAF9' },
                        }}
                      >
                        Edit
                      </Button>
                    ) : null}
                  </Stack>
                ) : null}

                {saveMessage ? (
                  <Alert severity={saveMessage.toLowerCase().includes('unable') || saveMessage.toLowerCase().includes('choose') || saveMessage.toLowerCase().includes('add at least') ? 'warning' : 'success'} sx={{ mt: 2 }}>
                    {saveMessage}
                  </Alert>
                ) : null}
              </Box>

              {isCustomReportSelected && showCustomBuilder ? (
                <>
                  <Divider sx={{ borderColor: 'rgba(214, 211, 209, 0.7)' }} />
                  <Box sx={{ px: { xs: 3, md: 5 }, py: { xs: 3, md: 4 } }}>
                  <CustomReportBuilder
                    draft={customDraft}
                    setDraft={setCustomDraft}
                    fieldOptions={customFieldOptions}
                    savedReports={savedReports}
                    progressFieldOptions={progressFieldOptions}
                    selectedFieldOption={selectedFieldOption}
                    filterOptions={filterOptions}
                    previewHeaders={customResultHeaders}
                    previewRowCount={customReportResult?.rows.length ?? 0}
                  />
                  </Box>
                </>
              ) : null}

              <Divider sx={{ borderColor: 'rgba(214, 211, 209, 0.7)' }} />

              <Box sx={{ px: { xs: 3, md: 5 }, py: { xs: 3, md: 4 } }}>
                {selectedViewModel ? (
                  <ReportResultsView
                    model={selectedViewModel}
                    showChart={false}
                    expanded={isReportExpanded}
                    sortBy={isCustomReportSelected ? customDraft.displayOptions.sortBy : selectedStandardSort?.sortBy}
                    sortDirection={isCustomReportSelected ? customDraft.displayOptions.sortDirection : selectedStandardSort?.sortDirection}
                    onSort={handleReportHeaderSort}
                  />
                ) : (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <InsightsIcon sx={{ fontSize: 40, color: '#B8B1AC', mb: 1 }} />
                    <Typography sx={{ color: '#4A4542', fontWeight: 700, mb: 0.75 }}>
                      Choose a field to preview report rows
                    </Typography>
                    <Typography sx={{ color: '#7A746F', fontSize: '14px' }}>
                      The report will show the matching records directly, with totals at the bottom.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

function SidebarSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
        <Box>
          <Typography sx={{ color: '#78716C', fontSize: '11px', textTransform: 'none', letterSpacing: '0.06em', fontWeight: 500, mb: 0.5 }}>
            {title}
          </Typography>
          {description ? <Typography sx={{ color: '#A8A29E', fontSize: '12px' }}>{description}</Typography> : null}
        </Box>
        {action}
      </Box>
      <Stack spacing={1}>{children}</Stack>
    </Box>
  );
}

function SidebarItemButton({
  active,
  title,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        borderRadius: '10px',
        border: active ? '1px solid #1C1917' : '1px solid transparent',
        bgcolor: active ? '#1C1917' : 'transparent',
        px: 1.5,
        py: 1.1,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: active ? '#1C1917' : 'rgba(245, 245, 244, 0.9)',
          borderColor: active ? '#1C1917' : 'rgba(231, 229, 228, 0.9)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
        <Box sx={{ color: active ? '#FFFFFF' : '#A8A29E', display: 'flex', alignItems: 'center' }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 500, color: active ? '#FFFFFF' : '#1C1917', fontSize: '14px', mb: 0.1, lineHeight: 1.2 }}>
            {title}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function StandardFilterBar({
  filters,
  setFilters,
  filterOptions,
}: {
  filters: ReportFilters;
  setFilters: React.Dispatch<React.SetStateAction<ReportFilters>>;
  filterOptions: {
    clients: ClientDto[];
    providers: ProviderDto[];
    sessionStatuses: string[];
    paymentStatuses: string[];
  };
}) {
  const setFilter = (key: keyof ReportFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <Typography sx={{ color: '#A8A29E', fontSize: '12px', mr: 0.5 }}>
        Filters
      </Typography>
      <FilterPill
        label="Date range"
        value={filters.dateRange}
        onChange={(value) => setFilter('dateRange', value)}
        options={[
          { value: 'thisMonth', label: 'This month' },
          { value: 'lastMonth', label: 'Last month' },
          { value: 'last90Days', label: 'Last 90 days' },
          { value: 'yearToDate', label: 'Year to date' },
          { value: 'all', label: 'All time' },
          { value: 'custom', label: 'Custom range' },
        ]}
      />
      <FilterPill
        label="Provider"
        value={filters.providerId}
        onChange={(value) => setFilter('providerId', value)}
        options={[
          { value: 'all', label: 'All providers' },
          ...filterOptions.providers.map((provider) => ({ value: provider.id, label: provider.name })),
        ]}
      />
      <FilterPill
        label="Client"
        value={filters.clientId}
        onChange={(value) => setFilter('clientId', value)}
        options={[
          { value: 'all', label: 'All clients' },
          ...filterOptions.clients.map((client) => ({ value: client.id, label: client.name })),
        ]}
      />
      <FilterPill
        label="Session status"
        value={filters.sessionStatus}
        onChange={(value) => setFilter('sessionStatus', value)}
        options={[
          { value: 'all', label: 'All session statuses' },
          ...filterOptions.sessionStatuses.map((status) => ({ value: status, label: formatStatusLabel(status) })),
        ]}
      />
      <FilterPill
        label="Payment status"
        value={filters.paymentStatus}
        onChange={(value) => setFilter('paymentStatus', value)}
        options={[
          { value: 'all', label: 'All payment statuses' },
          ...filterOptions.paymentStatuses.map((status) => ({ value: status, label: formatStatusLabel(status) })),
        ]}
      />
      {filters.dateRange === 'custom' ? (
        <>
          <FilterDateInput
            label="Start date"
            value={filters.customStartDate}
            onChange={(value) => setFilter('customStartDate', value)}
          />
          <FilterDateInput
            label="End date"
            value={filters.customEndDate}
            onChange={(value) => setFilter('customEndDate', value)}
          />
        </>
      ) : null}
    </Box>
  );
}

function FilterPill({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <FormControl size="small" sx={{ minWidth: 0 }}>
      <Select
        value={value}
        displayEmpty
        onChange={(event) => onChange(event.target.value)}
        renderValue={(selected) => options.find((option) => option.value === selected)?.label ?? label}
        sx={{
          borderRadius: '10px',
          bgcolor: '#FFFFFF',
          color: '#57534E',
          fontSize: '13px',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(214, 211, 209, 0.9)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#A8A29E',
          },
          '& .MuiSelect-select': {
            py: 1,
            pr: 4,
          },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function FilterDateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <TextField
      size="small"
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      InputLabelProps={{ shrink: true }}
      placeholder={label}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '10px',
          bgcolor: '#FFFFFF',
          '& fieldset': {
            borderColor: 'rgba(214, 211, 209, 0.9)',
          },
          '&:hover fieldset': {
            borderColor: '#A8A29E',
          },
        },
      }}
    />
  );
}

function ReportFiltersPanel({
  filters,
  setFilters,
  filterOptions,
  title,
  description,
}: {
  filters: ReportFilters;
  setFilters: React.Dispatch<React.SetStateAction<ReportFilters>>;
  filterOptions: {
    clients: ClientDto[];
    providers: ProviderDto[];
    sessionStatuses: string[];
    paymentStatuses: string[];
  };
  title: string;
  description: string;
}) {
  const setFilter = (key: keyof ReportFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <Box>
      <Typography sx={{ color: '#6F6862', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
        {title}
      </Typography>
      <Typography sx={{ color: '#7A746F', fontSize: '13px', mb: 2 }}>{description}</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
        <FormControl size="small">
          <InputLabel id="reports-date-range-label">Date range</InputLabel>
          <Select
            labelId="reports-date-range-label"
            value={filters.dateRange}
            label="Date range"
            onChange={(event) => setFilter('dateRange', event.target.value)}
          >
            <MenuItem value="thisMonth">This month</MenuItem>
            <MenuItem value="lastMonth">Last month</MenuItem>
            <MenuItem value="last90Days">Last 90 days</MenuItem>
            <MenuItem value="yearToDate">Year to date</MenuItem>
            <MenuItem value="all">All time</MenuItem>
            <MenuItem value="custom">Custom range</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel id="reports-provider-label">Provider</InputLabel>
          <Select
            labelId="reports-provider-label"
            value={filters.providerId}
            label="Provider"
            onChange={(event) => setFilter('providerId', event.target.value)}
          >
            <MenuItem value="all">All providers</MenuItem>
            {filterOptions.providers.map((provider) => (
              <MenuItem key={provider.id} value={provider.id}>
                {provider.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel id="reports-client-label">Client</InputLabel>
          <Select
            labelId="reports-client-label"
            value={filters.clientId}
            label="Client"
            onChange={(event) => setFilter('clientId', event.target.value)}
          >
            <MenuItem value="all">All clients</MenuItem>
            {filterOptions.clients.map((client) => (
              <MenuItem key={client.id} value={client.id}>
                {client.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {filters.dateRange === 'custom' ? (
          <>
            <TextField
              size="small"
              type="date"
              label="Start date"
              value={filters.customStartDate}
              onChange={(event) => setFilter('customStartDate', event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small"
              type="date"
              label="End date"
              value={filters.customEndDate}
              onChange={(event) => setFilter('customEndDate', event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </>
        ) : null}

        <FormControl size="small">
          <InputLabel id="reports-session-status-label">Session status</InputLabel>
          <Select
            labelId="reports-session-status-label"
            value={filters.sessionStatus}
            label="Session status"
            onChange={(event) => setFilter('sessionStatus', event.target.value)}
          >
            <MenuItem value="all">All session statuses</MenuItem>
            {filterOptions.sessionStatuses.map((status) => (
              <MenuItem key={status} value={status}>
                {formatStatusLabel(status)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel id="reports-payment-status-label">Payment status</InputLabel>
          <Select
            labelId="reports-payment-status-label"
            value={filters.paymentStatus}
            label="Payment status"
            onChange={(event) => setFilter('paymentStatus', event.target.value)}
          >
            <MenuItem value="all">All payment statuses</MenuItem>
            {filterOptions.paymentStatuses.map((status) => (
              <MenuItem key={status} value={status}>
                {formatStatusLabel(status)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}

function CustomReportBuilder({
  draft,
  setDraft,
  fieldOptions,
  savedReports,
  progressFieldOptions,
  selectedFieldOption,
  filterOptions,
  previewHeaders,
  previewRowCount,
}: {
  draft: CustomReportDraft;
  setDraft: React.Dispatch<React.SetStateAction<CustomReportDraft>>;
  fieldOptions: ExistingFieldOption[];
  savedReports: SavedReportDto[];
  progressFieldOptions: ExistingFieldOption[];
  selectedFieldOption: ExistingFieldOption | null;
  filterOptions: {
    clients: ClientDto[];
    providers: ProviderDto[];
    sessionStatuses: string[];
    paymentStatuses: string[];
  };
  previewHeaders: string[];
  previewRowCount: number;
}) {
  const [baseReportKey, setBaseReportKey] = useState('');
  const updateDraft = (updater: (current: CustomReportDraft) => CustomReportDraft) => {
    setDraft((current) => updater(current));
  };
  const isProgressMode = draft.reportType === 'progressTracking';
  const isDetailMode = !isProgressMode;
  const validProgressMappings = draft.displayOptions.progressMappings.filter((mapping) => mapping.templateId && mapping.fieldKey);
  const stepOneComplete = Boolean(draft.name.trim()) && draft.reportType !== '';
  const stepTwoComplete = isProgressMode ? validProgressMappings.length > 0 : Boolean(selectedFieldOption);
  const hasPreview = previewRowCount > 0;
  const selectedFields = draft.displayOptions.selectedFields?.length
    ? draft.displayOptions.selectedFields
    : selectedFieldOption
      ? [selectedFieldOption]
      : [];
  const selectedFieldIds = new Set(selectedFields.map((field) => field.id));
  const selectedFieldLabels = new Set(selectedFields.map((field) => getFieldColumnLabel(field)));
  const templateOptions = fieldOptions
    .filter((field) => field.source === 'template' && field.templateId && field.templateName)
    .reduce<Array<{ id: string; name: string }>>((options, field) => {
      if (!field.templateKey || !field.templateName || options.some((option) => option.id === field.templateKey)) {
        return options;
      }

      return [...options, { id: field.templateKey, name: `${field.templateName} (${field.templateKind === 'custom' ? 'Custom' : 'Standard'})` }];
    }, [])
    .sort((left, right) => left.name.localeCompare(right.name));
  const selectedTemplateKey = selectedFields.find((field) => field.source === 'template')?.templateKey
    ?? (draft.templateId.includes(':') ? draft.templateId : '');
  const availableBasicFields = dedupeBasicFieldOptions(
    fieldOptions.filter((field) =>
      field.source !== 'template'
      && !selectedFieldIds.has(field.id)
      && !selectedFieldLabels.has(getFieldColumnLabel(field)),
    ),
  );
  const availableTemplateFields = selectedTemplateKey
    ? fieldOptions.filter((field) =>
        field.source === 'template'
        && field.templateKey === selectedTemplateKey
        && !selectedFieldIds.has(field.id),
      )
    : [];

  const resolveSavedFields = (fields: ExistingFieldOption[]) =>
    fields
      .map((field) =>
        fieldOptions.find((option) => option.id === field.id)
        ?? fieldOptions.find((option) =>
          option.source === field.source
          && option.templateId === field.templateId
          && option.templateName === field.templateName
          && option.fieldKey === field.fieldKey,
        )
        ?? field,
      )
      .filter((field): field is ExistingFieldOption => Boolean(field));

  const applyBaseReport = (value: string) => {
    setBaseReportKey(value);
    if (!value) {
      return;
    }

    if (value.startsWith('standard:')) {
      const reportId = value.replace('standard:', '') as StandardReportId;
      const reportDefinition = standardReportDefinitions.find((report) => report.id === reportId);
      const selectedBaseFields = (standardReportBaseFieldIds[reportId] ?? [])
        .map((fieldId) => fieldOptions.find((field) => field.id === fieldId))
        .filter((field): field is ExistingFieldOption => Boolean(field));

      updateDraft((current) => ({
        ...current,
        savedReportId: null,
        name: current.name || `${reportDefinition?.title ?? 'Report'} Custom`,
        reportType: 'customTemplate',
        templateId: '',
        templateFieldId: null,
        fieldKey: selectedBaseFields[0]?.fieldKey ?? '',
        analysisType: 'detail',
        displayOptions: {
          sortBy: '',
          sortDirection: 'desc',
          progressMappings: [],
          selectedFields: selectedBaseFields,
        },
      }));
      return;
    }

    if (value.startsWith('custom:')) {
      const reportId = value.replace('custom:', '');
      const savedReport = savedReports.find((report) => report.id === reportId);
      if (!savedReport) {
        return;
      }

      const savedDisplayOptions = parseJsonObject<CustomReportDraft['displayOptions']>(savedReport.displayOptionsJson, {
        sortBy: '',
        sortDirection: 'desc',
        progressMappings: [],
        selectedFields: [],
      });
      const selectedBaseFields = resolveSavedFields(
        Array.isArray(savedDisplayOptions.selectedFields) ? savedDisplayOptions.selectedFields : [],
      );

      updateDraft((current) => ({
        ...current,
        savedReportId: null,
        name: current.name || `${savedReport.name} Copy`,
        reportType: 'customTemplate',
        templateId: selectedBaseFields.find((field) => field.source === 'template')?.templateKey ?? '',
        templateFieldId: selectedBaseFields.find((field) => field.source === 'template')?.templateFieldId ?? null,
        fieldKey: selectedBaseFields[0]?.fieldKey ?? '',
        analysisType: 'detail',
        displayOptions: {
          sortBy: savedDisplayOptions.sortBy ?? '',
          sortDirection: savedDisplayOptions.sortDirection === 'asc' ? 'asc' : 'desc',
          progressMappings: [],
          selectedFields: selectedBaseFields,
        },
      }));
    }
  };

  const addField = (field: ExistingFieldOption) => {
    updateDraft((current) => ({
      ...current,
      reportType: 'customTemplate',
      templateId: field.source === 'template' ? field.templateKey || '' : current.templateId,
      templateFieldId: current.templateFieldId ?? field.templateFieldId ?? null,
      fieldKey: current.fieldKey || field.fieldKey,
      displayOptions: {
        ...current.displayOptions,
        selectedFields: [...(current.displayOptions.selectedFields ?? []), field],
        sortBy: '',
      },
    }));
  };

  const removeField = (fieldId: string) => {
    updateDraft((current) => ({
      ...current,
      displayOptions: {
        ...current.displayOptions,
        selectedFields: (current.displayOptions.selectedFields ?? []).filter((field) => field.id !== fieldId),
        sortBy: previewHeaders.includes(current.displayOptions.sortBy) ? current.displayOptions.sortBy : '',
      },
    }));
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) {
      return;
    }

    updateDraft((current) => {
      const nextFields = [...(current.displayOptions.selectedFields ?? [])];
      const [field] = nextFields.splice(fromIndex, 1);
      if (!field) {
        return current;
      }
      nextFields.splice(toIndex, 0, field);
      return {
        ...current,
        displayOptions: {
          ...current.displayOptions,
          selectedFields: nextFields,
        },
      };
    });
  };

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          p: 0,
        }}
      >
        <Typography sx={{ color: '#6F6862', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
          Report Template
        </Typography>
        {!draft.savedReportId ? (
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="custom-report-base-label">Base off existing report</InputLabel>
            <Select
              labelId="custom-report-base-label"
              value={baseReportKey}
              label="Base off existing report"
              onChange={(event) => applyBaseReport(event.target.value)}
            >
              <MenuItem value="">Start blank</MenuItem>
              <ListSubheader>Standard Reports</ListSubheader>
              {standardReportDefinitions.map((report) => (
                <MenuItem key={`standard:${report.id}`} value={`standard:${report.id}`}>
                  {report.title}
                </MenuItem>
              ))}
              {savedReports.length > 0 ? <ListSubheader>Custom Reports</ListSubheader> : null}
              {savedReports.map((report) => (
                <MenuItem key={`custom:${report.id}`} value={`custom:${report.id}`}>
                  {report.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : null}
        <TextField
          fullWidth
          value={draft.name}
          onChange={(event) => updateDraft((current) => ({ ...current, name: event.target.value }))}
          placeholder="Report name"
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#FFFFFF',
              fontSize: '18px',
              fontWeight: 600,
            },
          }}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        <Box
          sx={{
            p: 0,
          }}
        >
          <Typography sx={{ color: '#6F6862', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
            Basic Fields
          </Typography>
          <Typography sx={{ color: '#7A746F', fontSize: '13px', mb: 2 }}>
            Add common client, session, and billing columns.
          </Typography>
          <Stack spacing={1} sx={{ maxHeight: 240, overflowY: 'auto', pr: 0.5, mb: 3 }}>
            {availableBasicFields.map((field) => (
              <FieldChoice
                key={field.id}
                field={field}
                actionLabel="Add"
                onAction={() => addField(field)}
              />
            ))}
            {availableBasicFields.length === 0 ? (
              <Typography sx={{ color: '#9A9490', fontSize: '13px' }}>All basic fields have been added.</Typography>
            ) : null}
          </Stack>

          <Typography sx={{ color: '#6F6862', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
            Note Template Fields
          </Typography>
          <Typography sx={{ color: '#7A746F', fontSize: '13px', mb: 2 }}>
            Choose one note template to add its fields.
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="custom-report-template-picker-label">Template</InputLabel>
            <Select
              labelId="custom-report-template-picker-label"
              value={selectedTemplateKey}
              label="Template"
              onChange={(event) => {
                const templateKey = event.target.value;
                updateDraft((current) => ({
                  ...current,
                  templateId: templateKey,
                  templateFieldId: null,
                  fieldKey: '',
                  displayOptions: {
                    ...current.displayOptions,
                    selectedFields: (current.displayOptions.selectedFields ?? []).filter((field) => field.source !== 'template'),
                    sortBy: '',
                  },
                }));
              }}
            >
              <MenuItem value="">Select a template</MenuItem>
              {templateOptions.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography sx={{ color: '#6F6862', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
            Available Fields
          </Typography>
          <Stack spacing={1} sx={{ maxHeight: 420, overflowY: 'auto', pr: 0.5 }}>
            {availableTemplateFields.map((field) => (
              <FieldChoice
                key={field.id}
                field={field}
                actionLabel="Add"
                onAction={() => addField(field)}
              />
            ))}
            {!selectedTemplateKey ? (
              <Typography sx={{ color: '#9A9490', fontSize: '13px' }}>Select a template to see its fields.</Typography>
            ) : availableTemplateFields.length === 0 ? (
              <Typography sx={{ color: '#9A9490', fontSize: '13px' }}>All fields from this template have been added.</Typography>
            ) : null}
          </Stack>
        </Box>

        <Box
          sx={{
            p: 0,
          }}
        >
          <Typography sx={{ color: '#6F6862', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
            Report Fields
          </Typography>
          <Typography sx={{ color: '#7A746F', fontSize: '13px', mb: 2 }}>
            Drag fields to reorder the report columns.
          </Typography>
          <Stack spacing={1}>
            {selectedFields.map((field, index) => (
              <FieldChoice
                key={field.id}
                field={field}
                actionLabel="Remove"
                draggable
                onAction={() => removeField(field.id)}
                onDragStart={(event) => event.dataTransfer.setData('text/plain', String(index))}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const fromIndex = Number(event.dataTransfer.getData('text/plain'));
                  if (Number.isInteger(fromIndex)) {
                    moveField(fromIndex, index);
                  }
                }}
              />
            ))}
            {selectedFields.length === 0 ? (
              <Box sx={{ border: '1px dashed rgba(168, 162, 158, 0.8)', borderRadius: '14px', p: 2.5, textAlign: 'center' }}>
                <Typography sx={{ color: '#7A746F', fontSize: '13px' }}>Add fields to define this report template.</Typography>
              </Box>
            ) : null}
          </Stack>
        </Box>
      </Box>

      <Box
        sx={{
          p: 0,
        }}
      >
        <Typography sx={{ color: '#6F6862', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
          Preview
        </Typography>
        <Typography sx={{ color: '#7A746F', fontSize: '13px', mb: 2 }}>
          The preview uses the report filters above. Save the template when the fields look right.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
          <TextField
            size="small"
            disabled
            label="Preview output"
            value={selectedFields.length > 0 ? `${selectedFields.length} selected field${selectedFields.length === 1 ? '' : 's'}` : ''}
            placeholder="Select fields"
          />

          <TextField
            size="small"
            disabled
            label="Preview status"
            value={
              selectedFields.length === 0
                ? 'Add fields to preview'
                : hasPreview
                  ? `${previewRowCount.toLocaleString()} rows ready`
                  : 'No rows match current filters'
            }
          />

          <FormControl size="small" disabled={previewHeaders.length === 0}>
            <InputLabel id="custom-report-sort-by-label">Sort by</InputLabel>
            <Select
              labelId="custom-report-sort-by-label"
              value={draft.displayOptions.sortBy}
              label="Sort by"
              onChange={(event) =>
                updateDraft((current) => ({
                  ...current,
                  displayOptions: {
                    ...current.displayOptions,
                    sortBy: event.target.value,
                  },
                }))
              }
            >
              <MenuItem value="">No sorting</MenuItem>
              {previewHeaders.map((header) => (
                <MenuItem key={header} value={header}>
                  {header}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" disabled={!draft.displayOptions.sortBy}>
            <InputLabel id="custom-report-sort-direction-label">Sort direction</InputLabel>
            <Select
              labelId="custom-report-sort-direction-label"
              value={draft.displayOptions.sortDirection}
              label="Sort direction"
              onChange={(event) =>
                updateDraft((current) => ({
                  ...current,
                  displayOptions: {
                    ...current.displayOptions,
                    sortDirection: event.target.value as SortDirection,
                  },
                }))
              }
            >
              <MenuItem value="desc">Descending</MenuItem>
              <MenuItem value="asc">Ascending</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
    </Stack>
  );

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
          gap: 1.5,
        }}
      >
        <BuilderStepCard
          step="1"
          title="Choose Report Type"
          description="Name the report and choose whether this is one field or unified progress tracking."
          active={true}
          complete={stepOneComplete}
        />
        <BuilderStepCard
          step="2"
          title={isProgressMode ? 'Map Progress Fields' : 'Pick A Field'}
          description={isProgressMode ? 'Map fields from one or more templates into one shared progress report.' : 'Choose the single field you want to report on.'}
          active={stepOneComplete}
          complete={stepTwoComplete}
        />
        <BuilderStepCard
          step="3"
          title="Apply Filters"
          description="Limit the report by date range, provider, client, session status, and payment status."
          active={stepTwoComplete}
          complete={true}
        />
        <BuilderStepCard
          step="4"
          title="Preview Before Saving"
          description="Check the preview below, adjust sorting, then save when the output looks right."
          active={hasPreview}
          complete={hasPreview}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        <Box
          sx={{
            border: '1px solid rgba(214, 211, 209, 0.8)',
            borderRadius: '18px',
            bgcolor: '#FCFBFA',
            p: { xs: 2, md: 2.5 },
          }}
        >
          <Typography sx={{ color: '#6F6862', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
            Step 1: Report Setup
          </Typography>
          <Typography sx={{ color: '#7A746F', fontSize: '13px', mb: 2 }}>
            Start with a name, then choose the report style that best matches the question you need answered.
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
            <TextField
              size="small"
              label="Report name"
              value={draft.name}
              onChange={(event) => updateDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="e.g. Sessions by payment status detail"
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1.25, gridColumn: '1 / -1' }}>
              <ModeCard
                title="Detailed Field Report"
                description="Use this when one field clearly answers the question."
                selected={isDetailMode}
                onClick={() =>
                  updateDraft((current) => ({
                    ...createEmptyCustomDraft(),
                    name: current.name,
                    savedReportId: current.savedReportId,
                    filters: current.filters,
                    displayOptions: {
                      ...createEmptyCustomDraft().displayOptions,
                      sortDirection: current.displayOptions.sortDirection,
                    },
                    reportType: 'detail',
                  }))
                }
              />
              <ModeCard
                title="Progress Tracking Report"
                description="Use this when providers track progress in different templates or fields."
                selected={isProgressMode}
                onClick={() =>
                  updateDraft((current) => ({
                    ...createEmptyCustomDraft(),
                    name: current.name,
                    savedReportId: current.savedReportId,
                    filters: current.filters,
                    displayOptions: {
                      ...createEmptyCustomDraft().displayOptions,
                      sortDirection: current.displayOptions.sortDirection,
                      progressMappings: current.displayOptions.progressMappings.length > 0 ? current.displayOptions.progressMappings : [createEmptyProgressMapping()],
                    },
                    reportType: 'progressTracking',
                  }))
                }
              />
            </Box>

            {isDetailMode ? (
              <FormControl size="small">
                <InputLabel id="custom-report-field-picker-label">Field</InputLabel>
                <Select
                  labelId="custom-report-field-picker-label"
                  value={selectedFieldOption?.id ?? ''}
                  label="Field"
                  onChange={(event) => {
                    const option = fieldOptions.find((item) => item.id === event.target.value) ?? null;
                    updateDraft((current) => ({
                      ...current,
                      reportType: option ? `detail:${option.source}` : 'detail',
                      templateId: option?.templateId ?? '',
                      templateFieldId: option?.templateFieldId ?? null,
                      fieldKey: option?.fieldKey ?? '',
                      analysisType: 'detail',
                      displayOptions: {
                        ...current.displayOptions,
                        sortBy: '',
                      },
                    }));
                  }}
                >
                  <MenuItem value="">Select a field</MenuItem>
                  {renderFieldOptions(fieldOptions)}
                </Select>
              </FormControl>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', px: 0.5 }}>
                <Typography sx={{ color: '#7A746F', fontSize: '13px', lineHeight: 1.6 }}>
                  Progress mode lets you combine different note-template fields into one report, optionally by provider.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            border: '1px solid rgba(214, 211, 209, 0.8)',
            borderRadius: '18px',
            bgcolor: '#FFFFFF',
            p: { xs: 2, md: 2.5 },
          }}
        >
          <Typography sx={{ color: '#6F6862', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
            {isProgressMode ? 'Step 2: Progress Mapping' : 'Step 2: Selected Field'}
          </Typography>
          {!isProgressMode && selectedFieldOption ? (
            <Stack spacing={1.25}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={selectedFieldOption.groupLabel} size="small" sx={{ bgcolor: '#F3EFEA', color: '#6F6862' }} />
                {draft.savedReportId ? (
                  <Chip label="Saved custom report" size="small" sx={{ bgcolor: 'rgba(122, 92, 128, 0.08)', color: '#7A5C80' }} />
                ) : null}
              </Box>
              <Typography sx={{ color: '#1C1917', fontWeight: 700, fontSize: '15px' }}>
                {selectedFieldOption.label}
              </Typography>
              <Typography sx={{ color: '#7A746F', fontSize: '13px', lineHeight: 1.6 }}>
                {selectedFieldOption.description}
              </Typography>
            </Stack>
          ) : isProgressMode ? (
            <Stack spacing={1.5}>
              <Typography sx={{ color: '#7A746F', fontSize: '13px', lineHeight: 1.6 }}>
                Add one mapping for each provider or template field that represents progress. All mapped values roll into one unified report.
              </Typography>
              {validProgressMappings.length > 0 ? (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {validProgressMappings.map((mapping) => (
                    <Chip
                      key={mapping.id}
                      size="small"
                      label={`${mapping.label || mapping.fieldKey}${mapping.providerId !== 'all' ? ` • ${filterOptions.providers.find((provider) => provider.id === mapping.providerId)?.name ?? 'Provider'}` : ''}`}
                      sx={{ bgcolor: '#F3EFEA', color: '#6F6862' }}
                    />
                  ))}
                </Box>
              ) : null}
              {draft.displayOptions.progressMappings.map((mapping) => (
                <Box
                  key={mapping.id}
                  sx={{
                    border: '1px solid rgba(214, 211, 209, 0.85)',
                    borderRadius: '14px',
                    p: 1.5,
                    bgcolor: '#FCFBFA',
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                    gap: 1.5,
                  }}
                >
                  <FormControl size="small">
                    <InputLabel id={`progress-provider-${mapping.id}`}>Provider</InputLabel>
                    <Select
                      labelId={`progress-provider-${mapping.id}`}
                      value={mapping.providerId}
                      label="Provider"
                      onChange={(event) =>
                        updateDraft((current) => ({
                          ...current,
                          displayOptions: {
                            ...current.displayOptions,
                            progressMappings: current.displayOptions.progressMappings.map((item) =>
                              item.id === mapping.id ? { ...item, providerId: event.target.value } : item,
                            ),
                          },
                        }))
                      }
                    >
                      <MenuItem value="all">Any provider</MenuItem>
                      {filterOptions.providers.map((provider) => (
                        <MenuItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small">
                    <InputLabel id={`progress-field-${mapping.id}`}>Progress field</InputLabel>
                    <Select
                      labelId={`progress-field-${mapping.id}`}
                      value={mapping.templateId && mapping.templateFieldId ? `template:${mapping.templateId}:${mapping.templateFieldId}` : ''}
                      label="Progress field"
                      onChange={(event) => {
                        const option = progressFieldOptions.find((item) => item.id === event.target.value) ?? null;
                        updateDraft((current) => ({
                          ...current,
                          displayOptions: {
                            ...current.displayOptions,
                            progressMappings: current.displayOptions.progressMappings.map((item) =>
                              item.id === mapping.id
                                ? {
                                    ...item,
                                    templateId: option?.templateId ?? '',
                                    templateFieldId: option?.templateFieldId ?? null,
                                    fieldKey: option?.fieldKey ?? '',
                                    label: item.label || option?.fieldKey || '',
                                  }
                                : item,
                            ),
                          },
                        }));
                      }}
                    >
                      <MenuItem value="">Select a template field</MenuItem>
                      {renderFieldOptions(progressFieldOptions)}
                    </Select>
                  </FormControl>

                  <TextField
                    size="small"
                    label="Unified label"
                    value={mapping.label}
                    onChange={(event) =>
                      updateDraft((current) => ({
                        ...current,
                        displayOptions: {
                          ...current.displayOptions,
                          progressMappings: current.displayOptions.progressMappings.map((item) =>
                            item.id === mapping.id ? { ...item, label: event.target.value } : item,
                          ),
                        },
                      }))
                    }
                    placeholder="e.g. Progress Score"
                  />

                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() =>
                      updateDraft((current) => ({
                        ...current,
                        displayOptions: {
                          ...current.displayOptions,
                          progressMappings: current.displayOptions.progressMappings.filter((item) => item.id !== mapping.id),
                        },
                      }))
                    }
                    sx={{ textTransform: 'none', justifySelf: 'start' }}
                  >
                    Remove mapping
                  </Button>
                </Box>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() =>
                  updateDraft((current) => ({
                    ...current,
                    displayOptions: {
                      ...current.displayOptions,
                      progressMappings: [...current.displayOptions.progressMappings, createEmptyProgressMapping()],
                    },
                  }))
                }
                sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
              >
                Add progress mapping
              </Button>
            </Stack>
          ) : (
            <Typography sx={{ color: '#7A746F', fontSize: '13px', lineHeight: 1.6 }}>
              Start by choosing any existing field from sessions, billing, clients, or structured templates.
            </Typography>
          )}
        </Box>
      </Box>

      <ReportFiltersPanel
        filters={draft.filters}
        setFilters={(updater) => {
          setDraft((current) => ({
            ...current,
            filters: typeof updater === 'function' ? updater(current.filters) : updater,
          }));
        }}
        filterOptions={filterOptions}
        title="Step 3: Filters"
        description="Limit which rows appear in the report. These selections are saved with the report."
      />

      <Box
        sx={{
          border: '1px solid rgba(214, 211, 209, 0.8)',
          borderRadius: '18px',
          bgcolor: '#FFFFFF',
          p: { xs: 2, md: 2.5 },
        }}
      >
        <Typography sx={{ color: '#6F6862', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
          Step 4: Preview Settings
        </Typography>
        <Typography sx={{ color: '#7A746F', fontSize: '13px', mb: 2 }}>
          Review the live preview below before saving. If it does not look right, update the field, mappings, or filters first.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
          <TextField
            size="small"
            disabled
            label="Preview output"
            value={isProgressMode ? 'Unified progress rows' : selectedFieldOption ? 'Detailed rows' : ''}
            placeholder={isProgressMode ? 'Unified progress rows' : 'Detailed rows'}
          />

          <TextField
            size="small"
            disabled
            label="Preview status"
            value={
              !stepTwoComplete
                ? 'Finish setup to preview'
                : hasPreview
                  ? `${previewRowCount.toLocaleString()} rows ready`
                  : 'No rows match current filters'
            }
          />

          <FormControl size="small" disabled={previewHeaders.length === 0}>
            <InputLabel id="custom-report-sort-by-label">Sort by</InputLabel>
            <Select
              labelId="custom-report-sort-by-label"
              value={draft.displayOptions.sortBy}
              label="Sort by"
              onChange={(event) =>
                updateDraft((current) => ({
                  ...current,
                  displayOptions: {
                    ...current.displayOptions,
                    sortBy: event.target.value,
                  },
                }))
              }
            >
              <MenuItem value="">No sorting</MenuItem>
              {previewHeaders.map((header) => (
                <MenuItem key={header} value={header}>
                  {header}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" disabled={!draft.displayOptions.sortBy}>
            <InputLabel id="custom-report-sort-direction-label">Sort direction</InputLabel>
            <Select
              labelId="custom-report-sort-direction-label"
              value={draft.displayOptions.sortDirection}
              label="Sort direction"
              onChange={(event) =>
                updateDraft((current) => ({
                  ...current,
                  displayOptions: {
                    ...current.displayOptions,
                    sortDirection: event.target.value as SortDirection,
                  },
                }))
              }
            >
              <MenuItem value="desc">Descending</MenuItem>
              <MenuItem value="asc">Ascending</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Alert severity={isProgressMode ? 'success' : 'info'} sx={{ alignItems: 'flex-start' }}>
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Tracking Progress Across Different Note Templates</Typography>
        <Typography sx={{ fontSize: '13px', lineHeight: 1.6 }}>
          The cleanest approach is still one shared progress field across providers, such as Progress Score, Progress Status, or Progress Notes.
          When that is not possible, use Progress Tracking Report mode and map each provider or template field into one common progress view.
        </Typography>
      </Alert>
    </Stack>
  );
}

function renderFieldOptions(fieldOptions: ExistingFieldOption[]) {
  const groups = new Map<string, ExistingFieldOption[]>();
  fieldOptions.forEach((option) => {
    groups.set(option.groupLabel, [...(groups.get(option.groupLabel) ?? []), option]);
  });

  return [...groups.entries()].flatMap(([groupLabel, options]) => [
    <ListSubheader key={`${groupLabel}-header`}>{groupLabel}</ListSubheader>,
    ...options.map((option) => (
      <MenuItem key={option.id} value={option.id}>
        {option.label}
      </MenuItem>
    )),
  ]);
}

function BuilderStepCard({
  step,
  title,
  description,
  active,
  complete,
}: {
  step: string;
  title: string;
  description: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <Box
      sx={{
        border: '1px solid rgba(214, 211, 209, 0.8)',
        borderRadius: '16px',
        bgcolor: complete ? '#F8F6F3' : '#FFFFFF',
        p: 1.75,
        boxShadow: active ? '0 8px 18px rgba(39, 34, 30, 0.04)' : 'none',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
        <Chip
          size="small"
          label={complete ? `Step ${step} Complete` : `Step ${step}`}
          sx={{
            bgcolor: complete ? 'rgba(28, 25, 23, 0.08)' : '#F3EFEA',
            color: '#57534E',
          }}
        />
      </Box>
      <Typography sx={{ color: '#1C1917', fontWeight: 700, fontSize: '14px', mb: 0.5 }}>
        {title}
      </Typography>
      <Typography sx={{ color: '#7A746F', fontSize: '12px', lineHeight: 1.6 }}>
        {description}
      </Typography>
    </Box>
  );
}

function ModeCard({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        border: selected ? '1px solid #1C1917' : '1px solid rgba(214, 211, 209, 0.9)',
        borderRadius: '14px',
        p: 1.75,
        cursor: 'pointer',
        bgcolor: selected ? '#1C1917' : '#FFFFFF',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: '#1C1917',
          bgcolor: selected ? '#1C1917' : '#FAFAF9',
        },
      }}
    >
      <Typography sx={{ color: selected ? '#FFFFFF' : '#1C1917', fontWeight: 700, fontSize: '14px', mb: 0.5 }}>
        {title}
      </Typography>
      <Typography sx={{ color: selected ? 'rgba(255,255,255,0.78)' : '#7A746F', fontSize: '12px', lineHeight: 1.6 }}>
        {description}
      </Typography>
    </Box>
  );
}

function ReportResultsView({
  model,
  showChart,
  expanded,
  sortBy,
  sortDirection = 'asc',
  onSort,
}: {
  model: ReportViewModel;
  showChart: boolean;
  expanded: boolean;
  sortBy?: string;
  sortDirection?: SortDirection;
  onSort?: (header: string) => void;
}) {
  const headers = Object.keys(model.rows[0] ?? {});
  const chartConfig = showChart ? getChartConfig(model.rows) : null;
  const totals = getColumnTotals(model.rows, headers);

  return (
    <Stack
      spacing={3}
      title={model.rows.length > 0 ? (expanded ? 'Collapse report' : 'Expand report') : undefined}
      sx={{
        cursor: 'inherit',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ fontWeight: 700, color: '#4A4542', fontSize: '15px' }}>
          Results
        </Typography>
        <Typography sx={{ color: '#9A9490', fontSize: '12px' }}>
          {model.rows.length} rows
        </Typography>
      </Box>

      {model.rows.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <InsightsIcon sx={{ fontSize: 40, color: '#B8B1AC', mb: 1 }} />
          <Typography sx={{ color: '#4A4542', fontWeight: 700, mb: 0.75 }}>No results to show</Typography>
          <Typography sx={{ color: '#7A746F', fontSize: '14px' }}>{model.emptyState}</Typography>
        </Box>
      ) : (
        <>
          {chartConfig ? <ReportBarChart rows={model.rows} {...chartConfig} /> : null}
          <Box
            sx={{
              overflowX: expanded ? 'visible' : 'auto',
              border: '1px solid #F0EDEA',
              borderRadius: '12px',
            }}
          >
            <Table
              size="small"
              sx={{
                tableLayout: expanded ? 'fixed' : 'auto',
                minWidth: expanded ? '100%' : Math.max(headers.length * 180, 980),
                width: '100%',
              }}
            >
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    <TableCell
                      key={header}
                      sx={{
                        bgcolor: '#FDFCFB',
                        fontWeight: 700,
                        color: '#7A746F',
                        fontSize: '12px',
                        minWidth: expanded ? 0 : getColumnWidth(header),
                        borderRight: '1px solid #F0EDEA',
                        borderBottom: '1px solid #E7E2DD',
                        whiteSpace: expanded ? 'normal' : 'nowrap',
                        wordBreak: expanded ? 'break-word' : 'normal',
                      }}
                    >
                      {onSort ? (
                        <TableSortLabel
                          active={sortBy === header}
                          direction={sortBy === header ? sortDirection : 'asc'}
                          onClick={(event) => {
                            event.stopPropagation();
                            onSort(header);
                          }}
                          sx={{
                            color: '#7A746F',
                            fontWeight: 700,
                            '&.Mui-active': { color: '#1C1917' },
                            '& .MuiTableSortLabel-icon': { color: '#7A746F !important' },
                          }}
                        >
                          {header}
                        </TableSortLabel>
                      ) : (
                        header
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {model.rows.map((row, index) => (
                  <TableRow key={`${index}-${headers[0] ?? 'row'}`}>
                    {headers.map((header) => (
                      <TableCell
                        key={header}
                        sx={{
                          color: '#4A4542',
                          fontSize: '13px',
                          minWidth: expanded ? 0 : getColumnWidth(header),
                          borderRight: '1px solid #F5F1EE',
                          borderBottom: '1px solid #F0EDEA',
                          verticalAlign: 'top',
                          whiteSpace: expanded || isLongTextColumn(header) ? 'normal' : 'nowrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {formatCellValue(header, row[header])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
              {totals ? (
                <TableFooter>
                  <TableRow>
                    {headers.map((header, index) => (
                      <TableCell
                        key={header}
                        sx={{
                          bgcolor: '#FDFCFB',
                          fontWeight: 700,
                          color: '#57534E',
                          fontSize: '12px',
                          minWidth: expanded ? 0 : getColumnWidth(header),
                          borderRight: '1px solid #F0EDEA',
                          borderTop: '1px solid #E7E2DD',
                          whiteSpace: expanded ? 'normal' : 'nowrap',
                          wordBreak: expanded ? 'break-word' : 'normal',
                        }}
                      >
                        {index === 0 ? 'Totals' : totals[header] !== undefined ? formatCellValue(header, totals[header]) : ''}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableFooter>
              ) : null}
            </Table>
          </Box>
          {model.summary.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', pt: 0.5 }}>
              {model.summary.map((item) => (
                <Box key={item.label}>
                  <Typography sx={{ color: '#9A9490', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.35 }}>
                    {item.label}
                  </Typography>
                  <Typography sx={{ color: '#4A4542', fontSize: '13px', fontWeight: 600 }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : null}
        </>
      )}
    </Stack>
  );
}

function FieldChoice({
  field,
  actionLabel,
  onAction,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  field: ExistingFieldOption;
  actionLabel: string;
  onAction: () => void;
  draggable?: boolean;
  onDragStart?: DragEventHandler<HTMLDivElement>;
  onDragOver?: DragEventHandler<HTMLDivElement>;
  onDrop?: DragEventHandler<HTMLDivElement>;
}) {
  return (
    <Box
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      sx={{
        display: 'grid',
        gridTemplateColumns: draggable ? '24px minmax(0, 1fr) auto' : 'minmax(0, 1fr) auto',
        gap: 1,
        alignItems: 'center',
        border: '1px solid rgba(214, 211, 209, 0.85)',
        borderRadius: '12px',
        bgcolor: '#FFFFFF',
        px: 1.25,
        py: 1,
        cursor: draggable ? 'grab' : 'default',
      }}
    >
      {draggable ? <DragIndicatorIcon sx={{ color: '#A8A29E', fontSize: 20 }} /> : null}
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: '#1C1917', fontWeight: 700, fontSize: '13px', lineHeight: 1.25 }}>
          {field.label}
        </Typography>
        <Typography sx={{ color: '#8A817A', fontSize: '12px', lineHeight: 1.35 }}>
          {field.groupLabel}
        </Typography>
      </Box>
      <Button
        size="small"
        variant={actionLabel === 'Add' ? 'contained' : 'outlined'}
        onClick={onAction}
        sx={{
          textTransform: 'none',
          bgcolor: actionLabel === 'Add' ? '#1C1917' : undefined,
          color: actionLabel === 'Add' ? '#FFFFFF' : '#57534E',
          borderColor: 'rgba(214, 211, 209, 0.9)',
          '&:hover': {
            bgcolor: actionLabel === 'Add' ? '#292524' : '#FAFAF9',
            borderColor: '#A8A29E',
          },
        }}
      >
        {actionLabel}
      </Button>
    </Box>
  );
}

function buildCustomReportRows({
  fields,
  sessions,
  payments,
  clients,
  structuredEntries,
  filters,
}: {
  fields: ExistingFieldOption[];
  sessions: SessionDto[];
  payments: BillingPaymentDto[];
  clients: ClientDto[];
  structuredEntries: StructuredEntry[];
  filters: ReportFilters;
}) {
  const rows: ReportRow[] = [];
  const columns = [...new Set(fields.map(getFieldColumnLabel))];
  const sessionFields = fields.filter((field) => getFieldForSource(field, 'session'));
  const paymentFields = fields.filter((field) => getFieldForSource(field, 'payment'));
  const clientFields = fields.filter((field) => getFieldForSource(field, 'client'));
  const templateFields = fields.filter((field) => field.source === 'template');
  const sessionBasedReport = sessionFields.length > 0 || templateFields.length > 0;
  const createEmptyRow = () =>
    columns.reduce<ReportRow>((row, column) => {
      row[column] = '';
      return row;
    }, {});

  if (sessionBasedReport) {
    const clientById = new Map(clients.map((client) => [client.id, client]));
    const entriesBySessionId = structuredEntries.reduce<Map<string, StructuredEntry[]>>((map, entry) => {
      const sessionId = entry.session.id;
      map.set(sessionId, [...(map.get(sessionId) ?? []), entry]);
      return map;
    }, new Map());

    rows.push(...sessions.map((session) => {
      const row = createEmptyRow();
      sessionFields.forEach((field) => {
        const sourceField = getFieldForSource(field, 'session');
        if (sourceField) {
          row[getFieldColumnLabel(field)] = getSessionFieldValue(session, sourceField.fieldKey);
        }
      });
      clientFields.forEach((field) => {
        const client = clientById.get(session.clientId);
        const sourceField = getFieldForSource(field, 'client');
        if (client && sourceField) {
          row[getFieldColumnLabel(field)] = getClientFieldValue(client, sourceField.fieldKey);
        }
      });
      templateFields.forEach((field) => {
        const entry = (entriesBySessionId.get(session.id) ?? []).find((item) => item.templateKey === field.templateKey);
        row[getFieldColumnLabel(field)] = entry?.fieldValues[field.fieldKey] ?? '';
      });
      return row;
    }));

    return rows;
  }

  if (paymentFields.length > 0) {
    rows.push(...payments.map((payment) => {
      const row = createEmptyRow();
      paymentFields.forEach((field) => {
        const sourceField = getFieldForSource(field, 'payment');
        if (sourceField) {
          row[getFieldColumnLabel(field)] = getPaymentFieldValue(payment, sourceField.fieldKey);
        }
      });
      return row;
    }).filter((row) => hasSelectedFieldValue(row, paymentFields)));
  }

  if (clientFields.length > 0) {
    rows.push(...clients
      .filter((client) => filters.clientId === 'all' || client.id === filters.clientId)
      .map((client) => {
        const row = createEmptyRow();
        clientFields.forEach((field) => {
          const sourceField = getFieldForSource(field, 'client');
          if (sourceField) {
            row[getFieldColumnLabel(field)] = getClientFieldValue(client, sourceField.fieldKey);
          }
        });
        return row;
      })
      .filter((row) => hasSelectedFieldValue(row, clientFields)));
  }

  return rows;
}

function hasSelectedFieldValue(row: ReportRow, fields: ExistingFieldOption[]) {
  return fields.some((field) => hasValue(row[getFieldColumnLabel(field)]));
}

function getFieldColumnLabel(field: ExistingFieldOption) {
  return field.label;
}

function dedupeBasicFieldOptions(fields: ExistingFieldOption[]) {
  const seen = new Set<string>();
  return fields.filter((field) => {
    const label = getFieldColumnLabel(field);
    if (seen.has(label)) {
      return false;
    }

    seen.add(label);
    return true;
  });
}

function getFieldForSource(field: ExistingFieldOption, source: 'session' | 'payment' | 'client') {
  if (field.source === source) {
    return field;
  }

  const options = source === 'session'
    ? sessionFieldOptions
    : source === 'payment'
      ? paymentFieldOptions
      : clientFieldOptions;

  return options.find((option) => option.label === field.label) ?? null;
}

function hasValue(value: string | number | undefined) {
  if (typeof value === 'number') {
    return true;
  }

  return Boolean(String(value ?? '').trim());
}

function getColumnWidth(header: string) {
  if (/description|focus|notes|value|program/i.test(header)) {
    return 280;
  }

  if (/client|provider|template|session type|billing model|payment method/i.test(header)) {
    return 200;
  }

  if (/date|time/i.test(header)) {
    return 185;
  }

  return 150;
}

function isLongTextColumn(header: string) {
  return /description|focus|notes|value|program/i.test(header);
}

function getSessionFieldValue(session: SessionDto, fieldKey: string) {
  const value = session[fieldKey as keyof SessionDto];
  return typeof value === 'number' ? value : String(value ?? '');
}

function getPaymentFieldValue(payment: BillingPaymentDto, fieldKey: string) {
  const value = payment[fieldKey as keyof BillingPaymentDto];
  return typeof value === 'number' ? value : String(value ?? '');
}

function getClientFieldValue(client: ClientDto, fieldKey: string) {
  const value = client[fieldKey as keyof ClientDto];
  return typeof value === 'number' ? value : String(value ?? '');
}

function buildSummaryMetrics(rows: ReportRow[]) {
  if (rows.length === 0) {
    return [];
  }

  const headers = Object.keys(rows[0]);
  const numericHeaders = headers.filter((header) => rows.some((row) => typeof row[header] === 'number'));
  const metrics: Array<{ label: string; value: string | number }> = [{ label: 'Rows', value: rows.length }];

  numericHeaders.slice(0, 2).forEach((header) => {
    const total = rows.reduce((sum, row) => sum + (typeof row[header] === 'number' ? Number(row[header]) : 0), 0);
    metrics.push({ label: `${header} total`, value: formatCellValue(header, total) });
  });

  return metrics;
}

function getColumnTotals(rows: ReportRow[], headers: string[]) {
  const totals: ReportRow = {};
  let hasNumericTotals = false;

  headers.forEach((header) => {
    const hasNumericColumn = rows.some((row) => typeof row[header] === 'number');
    if (!hasNumericColumn) {
      return;
    }

    totals[header] = rows.reduce((sum, row) => sum + (typeof row[header] === 'number' ? Number(row[header]) : 0), 0);
    hasNumericTotals = true;
  });

  return hasNumericTotals ? totals : null;
}

function formatDisplayDate(value: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const rawHours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const hours = String(((rawHours + 11) % 12) + 1).padStart(2, '0');
  const meridiem = rawHours >= 12 ? 'pm' : 'am';
  return `${month}/${day}/${year} ${hours}:${minutes} ${meridiem}`;
}

function formatCellValue(header: string, value: string | number | undefined) {
  if (typeof value === 'number') {
    return /amount|revenue|price|total/i.test(header) ? formatCurrency(value) : value.toLocaleString();
  }

  const normalized = String(value ?? '');
  if (!normalized) {
    return '';
  }

  if (/date/i.test(header)) {
    return formatDisplayDate(normalized);
  }

  if (/status/i.test(header)) {
    return formatStatusLabel(normalized);
  }

  return normalized;
}

function ReportBarChart({
  rows,
  labelKey,
  valueKey,
}: {
  rows: ReportRow[];
  labelKey: string;
  valueKey: string;
}) {
  const chartRows = rows
    .slice(0, 8)
    .map((row) => ({
      label: String(row[labelKey] ?? ''),
      value: Number(row[valueKey] ?? 0),
    }))
    .filter((row) => Number.isFinite(row.value));

  const maxValue = Math.max(...chartRows.map((row) => row.value), 1);

  return (
    <Box sx={{ borderTop: '1px solid #F0EDEA', borderBottom: '1px solid #F0EDEA', py: 2.5 }}>
      <Typography sx={{ color: '#4A4542', fontWeight: 700, mb: 2, fontSize: '14px' }}>Chart Preview</Typography>
      <Stack spacing={1.25}>
        {chartRows.map((row) => (
          <Box key={row.label}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 0.5 }}>
              <Typography sx={{ color: '#7A746F', fontSize: '12px' }}>{row.label}</Typography>
              <Typography sx={{ color: '#4A4542', fontSize: '12px', fontWeight: 700 }}>{row.value}</Typography>
            </Box>
            <Box sx={{ height: 10, borderRadius: '999px', bgcolor: '#EFEAE4', overflow: 'hidden' }}>
              <Box
                sx={{
                  height: '100%',
                  width: `${Math.max((row.value / maxValue) * 100, 8)}%`,
                  borderRadius: '999px',
                  bgcolor: '#7A5C80',
                }}
              />
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function matchesSessionFilters(session: SessionDto, filters: ReportFilters) {
  const matchesDate = inDateRange(session.date, filters);
  const matchesProvider = filters.providerId === 'all' || session.providerId === filters.providerId;
  const matchesClient = filters.clientId === 'all' || session.clientId === filters.clientId;
  const matchesSessionStatus = filters.sessionStatus === 'all' || session.status === filters.sessionStatus;
  const matchesPaymentStatus = filters.paymentStatus === 'all' || session.paymentStatus === filters.paymentStatus;
  return matchesDate && matchesProvider && matchesClient && matchesSessionStatus && matchesPaymentStatus;
}

function matchesPaymentFilters(payment: BillingPaymentDto, filters: ReportFilters) {
  const matchesDate = inDateRange(payment.serviceDate, filters);
  const matchesClient = filters.clientId === 'all' || payment.clientId === filters.clientId;
  const matchesPaymentStatus = filters.paymentStatus === 'all' || payment.paymentStatus === filters.paymentStatus;
  return matchesDate && matchesClient && matchesPaymentStatus;
}

function matchesStructuredEntryFilters(entry: StructuredEntry, filters: ReportFilters) {
  const matchesDate = inDateRange(entry.session.date, filters);
  const matchesProvider = filters.providerId === 'all' || entry.session.providerId === filters.providerId;
  const matchesClient = filters.clientId === 'all' || entry.session.clientId === filters.clientId;
  const matchesSessionStatus = filters.sessionStatus === 'all' || entry.session.status === filters.sessionStatus;
  const matchesPaymentStatus = filters.paymentStatus === 'all' || entry.session.paymentStatus === filters.paymentStatus;
  return matchesDate && matchesProvider && matchesClient && matchesSessionStatus && matchesPaymentStatus;
}

function getChartConfig(rows: ReportRow[]) {
  if (rows.length === 0 || rows.length > 12) {
    return null;
  }

  const headers = Object.keys(rows[0]);
  const labelKey = headers.find((header) => typeof rows[0][header] === 'string');
  const valueKey = headers.find((header) => typeof rows[0][header] === 'number');

  if (!labelKey || !valueKey) {
    return null;
  }

  return { labelKey, valueKey };
}

function formatStatusLabel(value: string) {
  return value === 'noShow'
    ? 'No-show'
    : value.charAt(0).toUpperCase() + value.slice(1);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    || 'report';
}
