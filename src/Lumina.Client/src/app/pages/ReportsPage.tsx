import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadIcon from '@mui/icons-material/Download';
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
  TemplateFieldDto,
} from '../api/types';

type ReportRow = Record<string, string | number>;
type SortDirection = 'asc' | 'desc';
type DateRange = 'thisMonth' | 'lastMonth' | 'last90Days' | 'yearToDate' | 'all' | 'custom';
type StandardReportId =
  | 'revenue'
  | 'paid-unpaid'
  | 'sessions-provider'
  | 'client-status'
  | 'template-analytics';
type CustomAnalysisType =
  | 'valueFrequency'
  | 'breakdownByClient'
  | 'breakdownOverTime'
  | 'average'
  | 'minimum'
  | 'maximum'
  | 'trendOverSessions';

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
  analysisType: CustomAnalysisType | '';
  filters: ReportFilters;
  displayOptions: {
    sortBy: string;
    sortDirection: SortDirection;
  };
}

interface StandardReportDefinition {
  id: StandardReportId;
  title: string;
  description: string;
}

interface ReportViewModel {
  title: string;
  description: string;
  rows: ReportRow[];
  filename: string;
  summary: Array<{ label: string; value: string | number }>;
  emptyState: string;
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
  reportType: 'templateField',
  templateId: '',
  templateFieldId: null,
  fieldKey: '',
  analysisType: '',
  filters: getCurrentMonthFilters(),
  displayOptions: {
    sortBy: '',
    sortDirection: 'desc',
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

const splitStructuredValue = (value: string) =>
  value
    .split(/[;,|]/)
    .map((part) => part.trim())
    .filter(Boolean);

const numericValue = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeFieldType = (field: TemplateFieldDto) => {
  const raw = (field.fieldType || field.label).toLowerCase();
  if (raw.includes('multi')) return 'multi-select';
  if (raw.includes('tag')) return 'tags';
  if (raw.includes('dropdown') || raw.includes('select')) return 'dropdown';
  if (raw.includes('rating') || raw.includes('score') || raw.includes('scale')) return 'rating';
  if (raw.includes('number') || raw.includes('numeric')) return 'numeric';
  if (raw.includes('yes') || raw.includes('no') || raw.includes('boolean')) return 'yes/no';
  return 'structured field';
};

const getAnalysisOptions = (fieldType: string) => {
  const categorical = ['dropdown', 'multi-select', 'yes/no', 'tags', 'structured field'];
  if (categorical.includes(fieldType)) {
    return [
      { value: 'valueFrequency', label: 'Frequency of value' },
      { value: 'breakdownByClient', label: 'Breakdown by client' },
      { value: 'breakdownOverTime', label: 'Breakdown over time' },
    ] as Array<{ value: CustomAnalysisType; label: string }>;
  }

  return [
    { value: 'breakdownByClient', label: 'Breakdown by client' },
    { value: 'breakdownOverTime', label: 'Breakdown over time' },
    { value: 'average', label: 'Average value' },
    { value: 'minimum', label: 'Minimum value' },
    { value: 'maximum', label: 'Maximum value' },
    { value: 'trendOverSessions', label: 'Trend over sessions' },
  ] as Array<{ value: CustomAnalysisType; label: string }>;
};

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
        .map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`)
        .join(','),
    ),
  ];
  downloadFile(`${filename}.csv`, lines.join('\n'), 'text/csv;charset=utf-8');
};

const exportExcel = (filename: string, rows: ReportRow[]) => {
  const headers = Object.keys(rows[0] ?? { Report: 'No rows' });
  const html = `
    <table>
      <thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead>
      <tbody>
        ${rows
          .map((row) => `<tr>${headers.map((header) => `<td>${row[header] ?? ''}</td>`).join('')}</tr>`)
          .join('')}
      </tbody>
    </table>
  `;

  downloadFile(`${filename}.xls`, html, 'application/vnd.ms-excel;charset=utf-8');
};

const parseStructuredEntries = (
  session: SessionDto,
  note: SessionStructuredNoteDto | null,
  templateById: Map<string, TemplateDto>,
): StructuredEntry[] => {
  if (!note?.content?.trim()) {
    return [];
  }

  const buildEntry = (templateId: string | number | undefined, content: unknown): StructuredEntry | null => {
    if (!templateId || typeof content !== 'string') {
      return null;
    }

    const template = templateById.get(String(templateId));
    if (!template) {
      return null;
    }

    try {
      const parsed = JSON.parse(content) as Record<string, string>;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }

      return {
        session,
        note,
        templateId: String(templateId),
        templateName: template.name,
        fieldValues: parsed,
      };
    } catch {
      return null;
    }
  };

  try {
    const parsed = JSON.parse(note.content) as
      | { notes?: Array<{ isTemplate?: boolean; templateId?: string | number; content?: string }> }
      | Array<{ isTemplate?: boolean; templateId?: string | number; content?: string }>;

    const noteItems = Array.isArray(parsed) ? parsed : parsed.notes;
    if (Array.isArray(noteItems)) {
      return noteItems
        .filter((item) => item.isTemplate)
        .map((item) => buildEntry(item.templateId, item.content))
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
        const allTemplates = [...presetTemplates, ...customTemplates];
        const templateById = new Map(allTemplates.map((template) => [String(template.id), template]));

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
          structuredNotes.flatMap(({ session, note }) => parseStructuredEntries(session, note, templateById)),
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
    const revenueRows = [
      ...groupRows(
        filteredPayments.filter((payment) => payment.paymentStatus === 'paid'),
        (payment) => payment.billingSource,
        (source, rows) => ({
          Source: source,
          Payments: rows.length,
          Revenue: rows.reduce((sum, payment) => sum + payment.amount, 0),
        }),
      ),
      ...groupRows(
        filteredPayments.filter((payment) => payment.paymentStatus !== 'paid'),
        (payment) => payment.billingSource,
        (source, rows) => ({
          Source: `${source} (due)`,
          Payments: rows.length,
          Revenue: rows.reduce((sum, payment) => sum + payment.amount, 0),
        }),
      ),
    ];

    const paidRows = groupRows(
      filteredSessions.filter((session) => session.paymentStatus),
      (session) => session.paymentStatus ?? 'unpaid',
      (status, rows) => ({
        Status: status,
        Sessions: rows.length,
        Amount: rows.reduce((sum, session) => sum + (session.paymentAmount ?? session.packagePrice ?? 0), 0),
      }),
    );

    const providerRows = groupRows(
      filteredSessions,
      (session) => session.providerName ?? 'Unassigned',
      (provider, rows) => ({
        Provider: provider,
        Total: rows.length,
        Completed: rows.filter((row) => row.status === 'completed').length,
        Upcoming: rows.filter((row) => row.status === 'upcoming').length,
      }),
    );

    const clientRows = groupRows(
      clients.filter((client) => standardFilters.clientId === 'all' || client.id === standardFilters.clientId),
      (client) => client.status,
      (status, rows) => ({
        Status: status,
        Clients: rows.length,
      }),
    );

    const templateRows = groupRows(
      filteredEntries.flatMap((entry) =>
        Object.entries(entry.fieldValues)
          .filter(([, value]) => value.trim())
          .flatMap(([field, value]) =>
            splitStructuredValue(value).map((part) => ({
              Template: entry.templateName,
              Field: field,
              Value: part,
              Client: entry.session.client,
            })),
          ),
      ),
      (item) => `${item.Template} / ${item.Field} / ${item.Value}`,
      (key, rows) => ({
        Insight: key,
        Uses: rows.length,
        Clients: new Set(rows.map((row) => row.Client)).size,
      }),
    ).slice(0, 20);

    return {
      revenue: {
        title: 'Revenue',
        description: 'Paid and outstanding billing by source for the selected workspace filters.',
        rows: revenueRows.map((row) => ({
          ...row,
          Revenue: formatCurrency(Number(row.Revenue)),
        })),
        filename: 'lumina-report-revenue',
        summary: [
          { label: 'Paid', value: formatCurrency(filteredPayments.filter((payment) => payment.paymentStatus === 'paid').reduce((sum, payment) => sum + payment.amount, 0)) },
          { label: 'Due / unpaid', value: formatCurrency(filteredPayments.filter((payment) => payment.paymentStatus !== 'paid').reduce((sum, payment) => sum + payment.amount, 0)) },
          { label: 'Items', value: filteredPayments.length },
        ],
        emptyState: 'No billing activity matches the selected filters.',
      },
      'paid-unpaid': {
        title: 'Paid vs Unpaid Sessions',
        description: 'Session counts and amounts across payment statuses.',
        rows: paidRows.map((row) => ({
          ...row,
          Amount: formatCurrency(Number(row.Amount)),
        })),
        filename: 'lumina-report-paid-vs-unpaid',
        summary: [
          { label: 'Paid sessions', value: filteredSessions.filter((session) => session.paymentStatus === 'paid').length },
          { label: 'Pending / unpaid', value: filteredSessions.filter((session) => session.paymentStatus !== 'paid').length },
          { label: 'Billable sessions', value: filteredSessions.length },
        ],
        emptyState: 'No billable sessions are available for the selected filters.',
      },
      'sessions-provider': {
        title: 'Sessions by Provider',
        description: 'Operational view of total, completed, and upcoming sessions by provider.',
        rows: providerRows,
        filename: 'lumina-report-sessions-by-provider',
        summary: [
          { label: 'Providers', value: providerRows.length },
          { label: 'Completed', value: filteredSessions.filter((session) => session.status === 'completed').length },
          { label: 'Upcoming', value: filteredSessions.filter((session) => session.status === 'upcoming').length },
        ],
        emptyState: 'No provider activity matches the selected filters.',
      },
      'client-status': {
        title: 'Active vs Inactive Clients',
        description: 'Current client mix for the selected client scope.',
        rows: clientRows,
        filename: 'lumina-report-client-status',
        summary: [
          { label: 'Active', value: clients.filter((client) => client.status === 'active').length },
          { label: 'Paused', value: clients.filter((client) => client.status === 'paused').length },
          { label: 'Completed', value: clients.filter((client) => client.status === 'completed').length },
        ],
        emptyState: 'No clients match the selected filters.',
      },
      'template-analytics': {
        title: 'Template Analytics',
        description: 'Top structured field values across saved session templates.',
        rows: templateRows,
        filename: 'lumina-report-template-analytics',
        summary: [
          { label: 'Templates used', value: new Set(filteredEntries.map((entry) => entry.templateId)).size },
          { label: 'Structured sessions', value: filteredEntries.length },
          { label: 'Insights shown', value: templateRows.length },
        ],
        emptyState: 'No structured template data is available for the selected filters.',
      },
    };
  }, [clients, filteredEntries, filteredPayments, filteredSessions, standardFilters.clientId]);

  const selectedStandardReportId = selectedReportKey.startsWith('standard:')
    ? (selectedReportKey.replace('standard:', '') as StandardReportId)
    : null;
  const selectedStandardReport = selectedStandardReportId
    ? standardReportModels[selectedStandardReportId]
    : null;

  const customTemplates = useMemo(
    () => templates.filter((template) => template.custom !== false),
    [templates],
  );

  const selectedTemplate = customDraft.templateId ? templateById.get(customDraft.templateId) ?? null : null;
  const selectedTemplateFields = useMemo(() => {
    if (!selectedTemplate) {
      return [];
    }

    return selectedTemplate.fieldsDetail?.length
      ? selectedTemplate.fieldsDetail
      : selectedTemplate.fields.map((label, index) => ({
          id: index + 1,
          label,
          sortOrder: index + 1,
          fieldType: undefined,
        }));
  }, [selectedTemplate]);

  const selectedTemplateField = selectedTemplateFields.find((field) => field.id === customDraft.templateFieldId) ?? null;
  const selectedFieldType = selectedTemplateField ? normalizeFieldType(selectedTemplateField) : null;
  const analysisOptions = selectedFieldType ? getAnalysisOptions(selectedFieldType) : [];

  useEffect(() => {
    if (!selectedTemplateField) {
      return;
    }

    setCustomDraft((current) => {
      const nextFieldKey = selectedTemplateField.label;
      const nextAnalysis =
        current.analysisType && analysisOptions.some((option) => option.value === current.analysisType)
          ? current.analysisType
          : analysisOptions[0]?.value ?? '';

      return {
        ...current,
        fieldKey: nextFieldKey,
        analysisType: nextAnalysis,
      };
    });
  }, [analysisOptions, selectedTemplateField]);

  const customEntries = useMemo(
    () => structuredEntries.filter((entry) => matchesStructuredEntryFilters(entry, customDraft.filters)),
    [customDraft.filters, structuredEntries],
  );

  const customReportResult = useMemo(() => {
    if (!selectedTemplate || !selectedTemplateField || !customDraft.analysisType) {
      return null;
    }

    const relevantEntries = customEntries
      .filter((entry) => entry.templateId === selectedTemplate.id)
      .flatMap((entry) => {
        const rawValue = entry.fieldValues[selectedTemplateField.label];
        if (!rawValue?.trim()) {
          return [];
        }

        return [{
          client: entry.session.client,
          clientId: entry.session.clientId,
          provider: entry.session.providerName ?? 'Unassigned',
          date: entry.session.date,
          sessionType: entry.session.sessionType,
          rawValue,
          values: splitStructuredValue(rawValue),
          numeric: numericValue(rawValue),
        }];
      });

    const baseMetadata = {
      title: customDraft.name.trim() || 'Custom Report',
      description: selectedFieldType
        ? `${selectedTemplate.name} / ${selectedTemplateField.label} using ${getAnalysisLabel(customDraft.analysisType)}.`
        : 'Custom report',
      filename: `lumina-custom-${slugify(customDraft.name || `${selectedTemplate.name}-${selectedTemplateField.label}`)}`,
      emptyState: 'No results match this custom report configuration.',
    };

    let rows: ReportRow[] = [];
    let summary: Array<{ label: string; value: string | number }> = [];

    switch (customDraft.analysisType) {
      case 'valueFrequency':
        rows = groupRows(
          relevantEntries.flatMap((entry) => entry.values.map((value) => ({ ...entry, value }))),
          (entry) => entry.value,
          (value, items) => ({
            Value: value,
            Count: items.length,
            Clients: new Set(items.map((item) => item.client)).size,
          }),
        );
        summary = [
          { label: 'Distinct values', value: rows.length },
          { label: 'Sessions', value: relevantEntries.length },
        ];
        break;
      case 'breakdownByClient':
        if (selectedFieldType && ['numeric', 'rating'].includes(selectedFieldType)) {
          rows = groupRows(
            relevantEntries.filter((entry) => entry.numeric !== null),
            (entry) => entry.client,
            (client, items) => {
              const numericItems = items.map((item) => item.numeric ?? 0);
              const average = numericItems.reduce((sum, value) => sum + value, 0) / Math.max(numericItems.length, 1);
              return {
                Client: client,
                Sessions: items.length,
                Average: Number(average.toFixed(2)),
                Minimum: Math.min(...numericItems),
                Maximum: Math.max(...numericItems),
              };
            },
          );
        } else {
          rows = groupRows(
            relevantEntries.flatMap((entry) => entry.values.map((value) => ({ ...entry, value }))),
            (entry) => entry.client,
            (client, items) => ({
              Client: client,
              Uses: items.length,
              'Top value': getMostCommonValue(items.map((item) => item.value)),
            }),
          );
        }
        summary = [
          { label: 'Clients', value: rows.length },
          { label: 'Sessions', value: relevantEntries.length },
        ];
        break;
      case 'breakdownOverTime':
        rows = groupRows(
          relevantEntries,
          (entry) => toDateInput(new Date(entry.date)).slice(0, 7),
          (month, items) => {
            if (selectedFieldType && ['numeric', 'rating'].includes(selectedFieldType)) {
              const numericItems = items.map((item) => item.numeric ?? 0);
              return {
                Period: month,
                Sessions: items.length,
                Average: Number((numericItems.reduce((sum, value) => sum + value, 0) / Math.max(numericItems.length, 1)).toFixed(2)),
              };
            }

            return {
              Period: month,
              Uses: items.reduce((sum, item) => sum + item.values.length, 0),
              'Top value': getMostCommonValue(items.flatMap((item) => item.values)),
            };
          },
        );
        summary = [
          { label: 'Periods', value: rows.length },
          { label: 'Sessions', value: relevantEntries.length },
        ];
        break;
      case 'average': {
        const numericItems = relevantEntries.filter((entry) => entry.numeric !== null).map((entry) => entry.numeric ?? 0);
        const average = numericItems.length
          ? numericItems.reduce((sum, value) => sum + value, 0) / numericItems.length
          : 0;
        rows = [{ Metric: 'Average', Value: Number(average.toFixed(2)), Sessions: numericItems.length }];
        summary = [
          { label: 'Average', value: Number(average.toFixed(2)) },
          { label: 'Sessions', value: numericItems.length },
        ];
        break;
      }
      case 'minimum': {
        const numericItems = relevantEntries.filter((entry) => entry.numeric !== null).map((entry) => entry.numeric ?? 0);
        const minimum = numericItems.length ? Math.min(...numericItems) : 0;
        rows = [{ Metric: 'Minimum', Value: minimum, Sessions: numericItems.length }];
        summary = [
          { label: 'Minimum', value: minimum },
          { label: 'Sessions', value: numericItems.length },
        ];
        break;
      }
      case 'maximum': {
        const numericItems = relevantEntries.filter((entry) => entry.numeric !== null).map((entry) => entry.numeric ?? 0);
        const maximum = numericItems.length ? Math.max(...numericItems) : 0;
        rows = [{ Metric: 'Maximum', Value: maximum, Sessions: numericItems.length }];
        summary = [
          { label: 'Maximum', value: maximum },
          { label: 'Sessions', value: numericItems.length },
        ];
        break;
      }
      case 'trendOverSessions':
        rows = relevantEntries
          .filter((entry) => entry.numeric !== null)
          .map((entry) => ({
            Date: toDateInput(new Date(entry.date)),
            Client: entry.client,
            Provider: entry.provider,
            Session: entry.sessionType,
            Value: Number((entry.numeric ?? 0).toFixed(2)),
          }));
        summary = [
          { label: 'Points', value: rows.length },
          { label: 'Clients', value: new Set(relevantEntries.map((entry) => entry.clientId)).size },
        ];
        break;
      default:
        rows = [];
        summary = [];
        break;
    }

    const sortedRows = sortRows(rows, customDraft.displayOptions.sortBy, customDraft.displayOptions.sortDirection);

    return {
      ...baseMetadata,
      rows: sortedRows,
      summary,
    } satisfies ReportViewModel;
  }, [customDraft, customEntries, selectedFieldType, selectedTemplate, selectedTemplateField]);

  const selectedSavedReport = selectedReportKey.startsWith('custom:')
    ? savedReports.find((report) => report.id === selectedReportKey.replace('custom:', '')) ?? null
    : null;

  const customResultHeaders = Object.keys(customReportResult?.rows[0] ?? {});

  const applySavedReport = (savedReport: SavedReportDto) => {
    const savedFilters = parseJsonObject<ReportFilters>(savedReport.filtersJson, getCurrentMonthFilters());
    const savedDisplayOptions = parseJsonObject<CustomReportDraft['displayOptions']>(savedReport.displayOptionsJson, {
      sortBy: '',
      sortDirection: 'desc',
    });

    setCustomDraft({
      savedReportId: savedReport.id,
      name: savedReport.name,
      reportType: savedReport.reportType,
      templateId: savedReport.templateId ?? '',
      templateFieldId: savedReport.templateFieldId ?? null,
      fieldKey: savedReport.fieldKey ?? '',
      analysisType: (savedReport.analysisType as CustomAnalysisType | '') ?? '',
      filters: {
        ...getCurrentMonthFilters(),
        ...savedFilters,
      },
      displayOptions: {
        sortBy: savedDisplayOptions.sortBy ?? '',
        sortDirection: savedDisplayOptions.sortDirection === 'asc' ? 'asc' : 'desc',
      },
    });
    setSelectedReportKey(`custom:${savedReport.id}`);
    setSaveMessage(null);
  };

  const handleSelectNewCustomReport = () => {
    setCustomDraft(createEmptyCustomDraft());
    setSelectedReportKey('custom:new');
    setSaveMessage(null);
  };

  const handleSaveCustomReport = async () => {
    if (!customDraft.name.trim() || !customDraft.templateId || !customDraft.templateFieldId || !customDraft.analysisType) {
      setSaveMessage('Choose a template, field, analysis type, and report name before saving.');
      return;
    }

    setIsSavingReport(true);
    setSaveMessage(null);

    try {
      const payload = {
        name: customDraft.name.trim(),
        reportType: customDraft.reportType,
        templateId: customDraft.templateId,
        templateFieldId: customDraft.templateFieldId,
        fieldKey: customDraft.fieldKey,
        analysisType: customDraft.analysisType,
        filtersJson: JSON.stringify(customDraft.filters),
        displayOptionsJson: JSON.stringify(customDraft.displayOptions),
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
  const selectedReportDescription = selectedStandardReport
    ? selectedStandardReport.description
    : selectedSavedReport
      ? `Saved custom report updated ${new Date(selectedSavedReport.updatedAt).toLocaleDateString()}`
      : 'Build a custom report from structured template fields and save it for later.';

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
            gridTemplateColumns: { xs: '1fr', lg: '280px minmax(0, 1fr)' },
            gap: { xs: 3, lg: 6 },
            minHeight: 0,
            alignItems: 'start',
            maxWidth: '1600px',
            width: '100%',
            mx: 'auto',
            px: { xs: 1, md: 2 },
          }}
        >
          <Box sx={{ position: { lg: 'sticky' }, top: { lg: 24 } }}>
            <Box sx={{ mb: 4 }}>
              <SidebarSection
                title="Standard Reports"
              >
                {standardReportDefinitions.map((report) => (
                  <SidebarItemButton
                    key={report.id}
                    active={selectedReportKey === `standard:${report.id}`}
                    title={report.title}
                    subtitle={report.description}
                    icon={<AssessmentIcon />}
                    onClick={() => {
                      setSelectedReportKey(`standard:${report.id}`);
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
                  title="New Custom Report"
                  subtitle="Create and save a report from structured template fields"
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
                      subtitle={report.analysisType ? getAnalysisLabel(report.analysisType) : 'Saved custom report'}
                      icon={<AutoGraphIcon />}
                      onClick={() => applySavedReport(report)}
                    />
                  ))
                )}
              </SidebarSection>
            </Box>
          </Box>

          <Box>
            {selectedStandardReport ? (
              <Box sx={{ mb: 4, pb: 3, borderBottom: '1px solid rgba(214, 211, 209, 0.7)' }}>
                <StandardFilterBar
                  filters={standardFilters}
                  setFilters={setStandardFilters}
                  filterOptions={filterOptions}
                />
              </Box>
            ) : null}

            <Box
              sx={{
                bgcolor: '#FFFFFF',
                border: '1px solid rgba(214, 211, 209, 0.8)',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(39, 34, 30, 0.04)',
              }}
            >
              <Box sx={{ px: { xs: 3, md: 5 }, py: { xs: 3, md: 4 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: { xs: '30px', md: '34px' },
                        fontWeight: 600,
                        color: '#1C1917',
                        mb: 0.75,
                        letterSpacing: '-0.04em',
                        lineHeight: 1.05,
                      }}
                    >
                      {selectedStandardReport?.title ?? (customDraft.name || 'Custom Report')}
                    </Typography>
                    <Typography sx={{ color: '#7A746F', fontSize: '14px', lineHeight: 1.6, maxWidth: 720 }}>
                      {selectedReportDescription}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1.25} sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {!selectedStandardReport ? (
                      <>
                        <Button
                          variant="outlined"
                          startIcon={<DeleteOutlineIcon />}
                          disabled={isDeletingReport}
                          onClick={() => {
                            void handleDeleteCustomReport();
                          }}
                          sx={{
                            textTransform: 'none',
                            borderColor: 'rgba(214, 211, 209, 0.9)',
                            color: '#57534E',
                            '&:hover': { borderColor: '#A8A29E', bgcolor: '#FAFAF9' },
                          }}
                        >
                          {customDraft.savedReportId ? 'Delete' : 'Reset'}
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<SaveOutlinedIcon />}
                          disabled={isSavingReport}
                          onClick={() => {
                            void handleSaveCustomReport();
                          }}
                          sx={{
                            textTransform: 'none',
                            bgcolor: '#1C1917',
                            '&:hover': { bgcolor: '#292524' },
                          }}
                        >
                          {isSavingReport ? 'Saving...' : customDraft.savedReportId ? 'Save Changes' : 'Save Report'}
                        </Button>
                      </>
                    ) : null}
                    <Button
                      variant="text"
                      startIcon={<DownloadIcon />}
                      disabled={!selectedViewModel || selectedViewModel.rows.length === 0}
                      onClick={() => selectedViewModel && exportCsv(selectedViewModel.filename, selectedViewModel.rows)}
                      sx={{ textTransform: 'none', color: '#57534E', fontWeight: 600 }}
                    >
                      CSV
                    </Button>
                    <Button
                      variant="text"
                      startIcon={<DownloadIcon />}
                      disabled={!selectedViewModel || selectedViewModel.rows.length === 0}
                      onClick={() => selectedViewModel && exportExcel(selectedViewModel.filename, selectedViewModel.rows)}
                      sx={{ textTransform: 'none', color: '#57534E', fontWeight: 600 }}
                    >
                      Excel
                    </Button>
                  </Stack>
                </Box>

                {saveMessage ? (
                  <Alert severity={saveMessage.toLowerCase().includes('unable') || saveMessage.toLowerCase().includes('choose') ? 'warning' : 'success'} sx={{ mt: 2 }}>
                    {saveMessage}
                  </Alert>
                ) : null}
              </Box>

              {!selectedStandardReport ? (
                <>
                  <Divider sx={{ borderColor: 'rgba(214, 211, 209, 0.7)' }} />
                  <Box sx={{ px: { xs: 3, md: 5 }, py: { xs: 3, md: 4 } }}>
                  <CustomReportBuilder
                    draft={customDraft}
                    setDraft={setCustomDraft}
                    templates={customTemplates}
                    selectedTemplateFields={selectedTemplateFields}
                    selectedFieldType={selectedFieldType}
                    analysisOptions={analysisOptions}
                    filterOptions={filterOptions}
                    previewHeaders={customResultHeaders}
                  />
                  </Box>
                </>
              ) : null}

              <Divider sx={{ borderColor: 'rgba(214, 211, 209, 0.7)' }} />

              <Box sx={{ px: { xs: 3, md: 5 }, py: { xs: 3, md: 4 } }}>
                {selectedViewModel ? (
                  <ReportResultsView model={selectedViewModel} />
                ) : (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <InsightsIcon sx={{ fontSize: 40, color: '#B8B1AC', mb: 1 }} />
                    <Typography sx={{ color: '#4A4542', fontWeight: 700, mb: 0.75 }}>
                      Choose a template field to preview results
                    </Typography>
                    <Typography sx={{ color: '#7A746F', fontSize: '14px' }}>
                      The builder will enable analysis options that fit the selected field type.
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
  action,
  children,
}: {
  title: string;
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
          <Typography sx={{ color: '#A8A29E', fontSize: '12px' }}>{description}</Typography>
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
  subtitle,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
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
  templates,
  selectedTemplateFields,
  selectedFieldType,
  analysisOptions,
  filterOptions,
  previewHeaders,
}: {
  draft: CustomReportDraft;
  setDraft: React.Dispatch<React.SetStateAction<CustomReportDraft>>;
  templates: TemplateDto[];
  selectedTemplateFields: TemplateFieldDto[];
  selectedFieldType: string | null;
  analysisOptions: Array<{ value: CustomAnalysisType; label: string }>;
  filterOptions: {
    clients: ClientDto[];
    providers: ProviderDto[];
    sessionStatuses: string[];
    paymentStatuses: string[];
  };
  previewHeaders: string[];
}) {
  const updateDraft = (updater: (current: CustomReportDraft) => CustomReportDraft) => {
    setDraft((current) => updater(current));
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
        <TextField
          size="small"
          label="Report name"
          value={draft.name}
          onChange={(event) => updateDraft((current) => ({ ...current, name: event.target.value }))}
          placeholder="e.g. Progress Trend by Session"
        />

        <FormControl size="small">
          <InputLabel id="custom-report-template-label">Template</InputLabel>
          <Select
            labelId="custom-report-template-label"
            value={draft.templateId}
            label="Template"
            onChange={(event) =>
              updateDraft((current) => ({
                ...current,
                templateId: event.target.value,
                templateFieldId: null,
                fieldKey: '',
                analysisType: '',
              }))
            }
          >
            <MenuItem value="">Select template</MenuItem>
            {templates.map((template) => (
              <MenuItem key={template.id} value={template.id}>
                {template.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" disabled={!draft.templateId}>
          <InputLabel id="custom-report-field-label">Field</InputLabel>
          <Select
            labelId="custom-report-field-label"
            value={draft.templateFieldId ?? ''}
            label="Field"
            onChange={(event) => {
              const selectedId = Number(event.target.value);
              const selectedField = selectedTemplateFields.find((field) => field.id === selectedId);
              updateDraft((current) => ({
                ...current,
                templateFieldId: selectedId,
                fieldKey: selectedField?.label ?? '',
                analysisType: '',
              }));
            }}
          >
            <MenuItem value="">Select field</MenuItem>
            {selectedTemplateFields.map((field) => (
              <MenuItem key={field.id} value={field.id}>
                {field.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" disabled={!draft.templateFieldId}>
          <InputLabel id="custom-report-analysis-label">Analysis</InputLabel>
          <Select
            labelId="custom-report-analysis-label"
            value={draft.analysisType}
            label="Analysis"
            onChange={(event) =>
              updateDraft((current) => ({
                ...current,
                analysisType: event.target.value as CustomAnalysisType,
              }))
            }
          >
            <MenuItem value="">Select analysis</MenuItem>
            {analysisOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          label={selectedFieldType ? `Field type: ${selectedFieldType}` : 'Choose a field to see analysis options'}
          size="small"
          sx={{ bgcolor: '#F7F4F1', color: '#7A746F' }}
        />
        {draft.savedReportId ? (
          <Chip
            label="Saved custom report"
            size="small"
            sx={{ bgcolor: 'rgba(122, 92, 128, 0.07)', color: '#7A5C80' }}
          />
        ) : null}
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
        title="Custom Report Filters"
        description="These filters are saved with the report so you can reopen the same view later."
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
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
    </Stack>
  );
}

function ReportResultsView({ model }: { model: ReportViewModel }) {
  const headers = Object.keys(model.rows[0] ?? {});
  const chartConfig = getChartConfig(model.rows);

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ fontWeight: 700, color: '#4A4542', fontSize: '15px' }}>
          Results
        </Typography>
        <Typography sx={{ color: '#9A9490', fontSize: '12px' }}>
          {model.rows.length} rows
        </Typography>
      </Box>

      {model.summary.length > 0 ? (
        <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
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

      {model.rows.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <InsightsIcon sx={{ fontSize: 40, color: '#B8B1AC', mb: 1 }} />
          <Typography sx={{ color: '#4A4542', fontWeight: 700, mb: 0.75 }}>No results to show</Typography>
          <Typography sx={{ color: '#7A746F', fontSize: '14px' }}>{model.emptyState}</Typography>
        </Box>
      ) : (
        <>
          {chartConfig ? <ReportBarChart rows={model.rows} {...chartConfig} /> : null}
          <Box sx={{ overflowX: 'auto', border: '1px solid #F0EDEA', borderRadius: '12px' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    <TableCell
                      key={header}
                      sx={{ bgcolor: '#FDFCFB', fontWeight: 700, color: '#7A746F', fontSize: '12px' }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {model.rows.map((row, index) => (
                  <TableRow key={`${index}-${headers[0] ?? 'row'}`}>
                    {headers.map((header) => (
                      <TableCell key={header} sx={{ color: '#4A4542', fontSize: '13px' }}>
                        {row[header]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </>
      )}
    </Stack>
  );
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

function groupRows<T>(
  items: T[],
  keySelector: (item: T) => string,
  rowBuilder: (key: string, items: T[]) => ReportRow,
) {
  const groups = new Map<string, T[]>();
  items.forEach((item) => {
    const key = keySelector(item) || 'Unassigned';
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });

  return [...groups.entries()].map(([key, value]) => rowBuilder(key, value));
}

function getMostCommonValue(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'N/A';
}

function getAnalysisLabel(value: string) {
  switch (value) {
    case 'valueFrequency':
      return 'Frequency of value';
    case 'breakdownByClient':
      return 'Breakdown by client';
    case 'breakdownOverTime':
      return 'Breakdown over time';
    case 'average':
      return 'Average value';
    case 'minimum':
      return 'Minimum value';
    case 'maximum':
      return 'Maximum value';
    case 'trendOverSessions':
      return 'Trend over sessions';
    default:
      return value;
  }
}

function getChartConfig(rows: ReportRow[]) {
  if (rows.length === 0) {
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
