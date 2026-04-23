import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DownloadIcon from '@mui/icons-material/Download';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import NotesIcon from '@mui/icons-material/Notes';
import { PageHeader } from '../components/PageHeader';
import { apiClient } from '../api/client';
import type {
  BillingPaymentDto,
  ClientDto,
  PaymentStatusValue,
  ProviderDto,
  SessionDto,
  SessionStructuredNoteDto,
  TemplateDto,
  TemplateFieldDto,
} from '../api/types';

type ReportRow = Record<string, string | number>;
type DateRange = 'thisMonth' | 'lastMonth' | 'last90Days' | 'yearToDate' | 'all';

interface ReportFilters {
  dateRange: DateRange;
  providerId: string;
  clientId: string;
  sessionType: string;
  packageName: string;
  status: string;
}

interface StructuredEntry {
  session: SessionDto;
  note: SessionStructuredNoteDto;
  templateId: string;
  templateName: string;
  fieldValues: Record<string, string>;
}

const emptyFilters: ReportFilters = {
  dateRange: 'thisMonth',
  providerId: 'all',
  clientId: 'all',
  sessionType: 'all',
  packageName: 'all',
  status: 'all',
};

const standardReportDefinitions = [
  {
    id: 'revenue',
    title: 'Revenue',
    description: 'Paid revenue by payment source.',
  },
  {
    id: 'paid-unpaid',
    title: 'Paid vs Unpaid Sessions',
    description: 'Session payment status counts and amounts.',
  },
  {
    id: 'sessions-provider',
    title: 'Sessions by Provider',
    description: 'Completed, upcoming, and total sessions by provider.',
  },
  {
    id: 'client-status',
    title: 'Active vs Inactive Clients',
    description: 'Client status distribution.',
  },
  {
    id: 'package-usage',
    title: 'Package Usage',
    description: 'Package sessions used, scheduled, and available.',
  },
  {
    id: 'cancellations',
    title: 'Cancellations / No-Shows',
    description: 'Cancelled and no-show session counts.',
  },
  {
    id: 'upcoming',
    title: 'Upcoming Sessions',
    description: 'Scheduled future sessions in the filtered period.',
  },
  {
    id: 'lifetime-value',
    title: 'Client Lifetime Value',
    description: 'Paid revenue by client.',
  },
] as const;

const notesReportDefinitions = [
  {
    id: 'process-usage',
    title: 'Process Usage Frequency',
    description: 'How many times a structured process, tag, dropdown, or multi-select value was used.',
  },
  {
    id: 'process-month',
    title: 'Most-Used Processes This Month',
    description: 'Top structured process values in the current month.',
  },
  {
    id: 'client-progress',
    title: 'Client Progress Over Sessions',
    description: 'Numeric structured ratings trended by client and session.',
  },
  {
    id: 'incoming-outgoing',
    title: 'Average Incoming vs Outgoing Change',
    description: 'Average numeric change between incoming and outgoing structured rating fields.',
  },
] as const;

const formatCurrency = (amount: number) =>
  amount.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });

const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

const getDateBounds = (range: DateRange) => {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  switch (range) {
    case 'thisMonth':
      return { start: startOfThisMonth, end: now };
    case 'lastMonth':
      return { start: startOfLastMonth, end: endOfLastMonth };
    case 'last90Days': {
      const start = new Date(now);
      start.setDate(start.getDate() - 90);
      return { start, end: now };
    }
    case 'yearToDate':
      return { start: new Date(now.getFullYear(), 0, 1), end: now };
    default:
      return { start: null, end: null };
  }
};

const inRange = (value: string, range: DateRange) => {
  const { start, end } = getDateBounds(range);
  if (!start || !end) return true;
  const date = new Date(value);
  return date >= start && date <= end;
};

const groupRows = <T,>(
  items: T[],
  keySelector: (item: T) => string,
  rowBuilder: (key: string, grouped: T[]) => ReportRow,
) => {
  const grouped = new Map<string, T[]>();
  items.forEach((item) => {
    const key = keySelector(item) || 'Unassigned';
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  });

  return [...grouped.entries()].map(([key, values]) => rowBuilder(key, values));
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
  if (raw.includes('dropdown') || raw.includes('select') || raw.includes('process')) return 'dropdown';
  if (raw.includes('rating') || raw.includes('score') || raw.includes('scale')) return 'rating';
  if (raw.includes('number') || raw.includes('numeric')) return 'numeric';
  if (raw.includes('yes') || raw.includes('no') || raw.includes('boolean')) return 'yes/no';
  return 'structured field';
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
  const headers = Object.keys(rows[0] ?? { report: 'No rows' });
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
  const headers = Object.keys(rows[0] ?? { report: 'No rows' });
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
  if (!note?.content?.trim()) return [];

  const buildEntry = (templateId: string | number | undefined, content: unknown): StructuredEntry | null => {
    if (!templateId || typeof content !== 'string') return null;
    const template = templateById.get(String(templateId));
    if (!template) return null;

    try {
      const parsed = JSON.parse(content) as Record<string, string>;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
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
    // Fall through to legacy single-template content.
  }

  const entry = buildEntry(note.templateId, note.content);
  return entry ? [entry] : [];
};

export function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>(emptyFilters);
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [payments, setPayments] = useState<BillingPaymentDto[]>([]);
  const [providers, setProviders] = useState<ProviderDto[]>([]);
  const [templates, setTemplates] = useState<TemplateDto[]>([]);
  const [structuredEntries, setStructuredEntries] = useState<StructuredEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const [me, sessionData, clientData, paymentData, providerData, presetTemplates] = await Promise.all([
          apiClient.getMe(),
          apiClient.getSessions(),
          apiClient.getClients(),
          apiClient.getBillingPayments(),
          apiClient.getProviders(),
          apiClient.getTemplatePresets(),
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

    void loadReports();
  }, []);

  const filterOptions = useMemo(() => ({
    clients,
    providers,
    sessionTypes: [...new Set(sessions.map((session) => session.sessionType).filter(Boolean))].sort(),
    packages: [...new Set(sessions.map((session) => session.packageName).filter(Boolean) as string[])].sort(),
  }), [clients, providers, sessions]);

  const filteredSessions = useMemo(() => sessions.filter((session) => {
    const matchesDate = inRange(session.date, filters.dateRange);
    const matchesProvider = filters.providerId === 'all' || session.providerId === filters.providerId;
    const matchesClient = filters.clientId === 'all' || session.clientId === filters.clientId;
    const matchesType = filters.sessionType === 'all' || session.sessionType === filters.sessionType;
    const matchesPackage = filters.packageName === 'all' || session.packageName === filters.packageName;
    const matchesStatus = filters.status === 'all' || session.status === filters.status || session.paymentStatus === filters.status;
    return matchesDate && matchesProvider && matchesClient && matchesType && matchesPackage && matchesStatus;
  }), [filters, sessions]);

  const filteredPayments = useMemo(() => payments.filter((payment) => {
    const matchesDate = inRange(payment.serviceDate, filters.dateRange);
    const matchesClient = filters.clientId === 'all' || payment.clientId === filters.clientId;
    const matchesStatus = filters.status === 'all' || payment.paymentStatus === filters.status;
    const matchesPackage = filters.packageName === 'all' || payment.description === filters.packageName || payment.billingSource === 'package';
    return matchesDate && matchesClient && matchesStatus && matchesPackage;
  }), [filters, payments]);

  const filteredEntries = useMemo(() => structuredEntries.filter((entry) =>
    filteredSessions.some((session) => session.id === entry.session.id),
  ), [filteredSessions, structuredEntries]);

  const fieldCatalog = useMemo(() => {
    const fields = new Map<string, TemplateFieldDto & { templateName: string }>();
    templates.forEach((template) => {
      const detail = template.fieldsDetail?.length
        ? template.fieldsDetail
        : template.fields.map((label, index) => ({ id: index, label, sortOrder: index + 1 }));
      detail.forEach((field) => {
        fields.set(`${template.id}:${field.label}`, { ...field, templateName: template.name });
      });
    });
    return fields;
  }, [templates]);

  const standardReports = useMemo(() => {
    const sessionAmount = (session: SessionDto) => session.paymentAmount ?? session.packagePrice ?? 0;
    const revenueRows = groupRows(
      filteredPayments.filter((payment) => payment.paymentStatus === 'paid'),
      (payment) => payment.billingSource,
      (source, rows) => ({
        Source: source,
        Payments: rows.length,
        Revenue: formatCurrency(rows.reduce((sum, payment) => sum + payment.amount, 0)),
      }),
    );

    const paidUnpaidRows = groupRows(
      filteredSessions,
      (session) => session.paymentStatus ?? 'unpaid',
      (status, rows) => ({
        Status: status,
        Sessions: rows.length,
        Amount: formatCurrency(rows.reduce((sum, session) => sum + sessionAmount(session), 0)),
      }),
    );

    return {
      revenue: revenueRows,
      'paid-unpaid': paidUnpaidRows,
      'sessions-provider': groupRows(filteredSessions, (session) => session.providerName ?? 'Unassigned', (provider, rows) => ({
        Provider: provider,
        Total: rows.length,
        Completed: rows.filter((row) => row.status === 'completed').length,
        Upcoming: rows.filter((row) => row.status === 'upcoming').length,
      })),
      'client-status': groupRows(clients, (client) => client.status, (status, rows) => ({
        Status: status,
        Clients: rows.length,
      })),
      'package-usage': groupRows(
        filteredSessions.filter((session) => session.billingSource === 'package'),
        (session) => session.packageName ?? 'Package',
        (packageName, rows) => ({
          Package: packageName,
          Sessions: rows.length,
          Used: rows.filter((row) => row.status === 'completed' || row.status === 'noShow').length,
          Scheduled: rows.filter((row) => row.status === 'upcoming').length,
          Available: Math.max(...rows.map((row) => row.packageRemaining ?? 0), 0),
        }),
      ),
      cancellations: groupRows(
        filteredSessions.filter((session) => session.status === 'cancelled' || session.status === 'noShow'),
        (session) => session.status,
        (status, rows) => ({ Status: status, Sessions: rows.length }),
      ),
      upcoming: filteredSessions
        .filter((session) => session.status === 'upcoming')
        .map((session) => ({
          Client: session.client,
          Date: new Date(session.date).toLocaleString(),
          Type: session.sessionType,
          Provider: session.providerName ?? 'Unassigned',
        })),
      'lifetime-value': groupRows(
        payments.filter((payment) => payment.paymentStatus === 'paid'),
        (payment) => payment.clientName,
        (client, rows) => ({
          Client: client,
          Payments: rows.length,
          'Lifetime Value': formatCurrency(rows.reduce((sum, payment) => sum + payment.amount, 0)),
        }),
      ).sort((a, b) => String(b['Lifetime Value']).localeCompare(String(a['Lifetime Value']))),
    } as Record<string, ReportRow[]>;
  }, [clients, filteredPayments, filteredSessions, payments]);

  const notesReports = useMemo(() => {
    const categoryRows: ReportRow[] = [];
    const numericRows: Array<{ client: string; field: string; date: string; value: number }> = [];

    filteredEntries.forEach((entry) => {
      Object.entries(entry.fieldValues).forEach(([label, value]) => {
        const trimmed = value.trim();
        if (!trimmed) return;

        const catalogField = fieldCatalog.get(`${entry.templateId}:${label}`) ?? {
          id: 0,
          label,
          sortOrder: 0,
          templateName: entry.templateName,
        };
        const fieldType = normalizeFieldType(catalogField);
        const numeric = numericValue(trimmed);

        if (numeric !== null && ['numeric', 'rating'].includes(fieldType)) {
          numericRows.push({
            client: entry.session.client,
            field: label,
            date: entry.session.date,
            value: numeric,
          });
        }

        if (['dropdown', 'multi-select', 'yes/no', 'tags', 'structured field'].includes(fieldType)) {
          splitStructuredValue(trimmed).forEach((part) => {
            categoryRows.push({
              Template: entry.templateName,
              Field: label,
              Type: fieldType,
              Value: part,
              Client: entry.session.client,
              Date: toDateInput(new Date(entry.session.date)),
            });
          });
        }
      });
    });

    const processRows = groupRows(categoryRows, (row) => `${row.Field}: ${row.Value}`, (key, rows) => ({
      'Structured Value': key,
      Count: rows.length,
      Clients: new Set(rows.map((row) => row.Client)).size,
    })).sort((a, b) => Number(b.Count) - Number(a.Count));

    const thisMonthEntries = categoryRows.filter((row) => inRange(String(row.Date), 'thisMonth'));
    const processMonthRows = groupRows(thisMonthEntries, (row) => `${row.Field}: ${row.Value}`, (key, rows) => ({
      'Structured Value': key,
      Count: rows.length,
    })).sort((a, b) => Number(b.Count) - Number(a.Count));

    const clientProgressRows = groupRows(numericRows, (row) => `${row.client} / ${row.field}`, (key, rows) => {
      const ordered = rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const first = ordered[0]?.value ?? 0;
      const latest = ordered[ordered.length - 1]?.value ?? 0;
      return {
        'Client / Field': key,
        Sessions: ordered.length,
        First: first,
        Latest: latest,
        Change: Number((latest - first).toFixed(2)),
      };
    });

    const changePairs: ReportRow[] = [];
    filteredEntries.forEach((entry) => {
      const incoming = Object.entries(entry.fieldValues).find(([label, value]) =>
        label.toLowerCase().includes('incoming') && numericValue(value) !== null);
      const outgoing = Object.entries(entry.fieldValues).find(([label, value]) =>
        label.toLowerCase().includes('outgoing') && numericValue(value) !== null);

      if (incoming && outgoing) {
        const incomingValue = numericValue(incoming[1]) ?? 0;
        const outgoingValue = numericValue(outgoing[1]) ?? 0;
        changePairs.push({
          Client: entry.session.client,
          Date: toDateInput(new Date(entry.session.date)),
          Incoming: incomingValue,
          Outgoing: outgoingValue,
          Change: Number((outgoingValue - incomingValue).toFixed(2)),
        });
      }
    });

    const averageChange = changePairs.length
      ? Number((changePairs.reduce((sum, row) => sum + Number(row.Change), 0) / changePairs.length).toFixed(2))
      : 0;

    return {
      'process-usage': processRows,
      'process-month': processMonthRows.slice(0, 10),
      'client-progress': clientProgressRows,
      'incoming-outgoing': changePairs.length
        ? [{ Metric: 'Average outgoing minus incoming', Sessions: changePairs.length, Change: averageChange }, ...changePairs]
        : [],
    } as Record<string, ReportRow[]>;
  }, [fieldCatalog, filteredEntries]);

  const setFilter = (key: keyof ReportFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader title="Reports" subtitle="Prebuilt operational reports and structured note analytics" />

      {loading ? (
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : null}

      {loadError ? <Alert severity="error" sx={{ mb: 3 }}>{loadError}</Alert> : null}

      {!loading && !loadError ? (
        <Stack spacing={4}>
          <Card sx={{ border: '1px solid #E8E5E1', borderRadius: '14px', boxShadow: '0 8px 24px rgba(39, 34, 30, 0.05)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ color: '#4A4542', fontWeight: 700, mb: 2 }}>Filters</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                <Select size="small" value={filters.dateRange} onChange={(event) => setFilter('dateRange', event.target.value)}>
                  <MenuItem value="thisMonth">This month</MenuItem>
                  <MenuItem value="lastMonth">Last month</MenuItem>
                  <MenuItem value="last90Days">Last 90 days</MenuItem>
                  <MenuItem value="yearToDate">Year to date</MenuItem>
                  <MenuItem value="all">All time</MenuItem>
                </Select>
                <Select size="small" value={filters.providerId} onChange={(event) => setFilter('providerId', event.target.value)}>
                  <MenuItem value="all">All providers</MenuItem>
                  {filterOptions.providers.map((provider) => <MenuItem key={provider.id} value={provider.id}>{provider.name}</MenuItem>)}
                </Select>
                <Select size="small" value={filters.clientId} onChange={(event) => setFilter('clientId', event.target.value)}>
                  <MenuItem value="all">All clients</MenuItem>
                  {filterOptions.clients.map((client) => <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>)}
                </Select>
                <Select size="small" value={filters.sessionType} onChange={(event) => setFilter('sessionType', event.target.value)}>
                  <MenuItem value="all">All session types</MenuItem>
                  {filterOptions.sessionTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                </Select>
                <Select size="small" value={filters.packageName} onChange={(event) => setFilter('packageName', event.target.value)}>
                  <MenuItem value="all">All packages</MenuItem>
                  {filterOptions.packages.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                </Select>
                <Select size="small" value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
                  <MenuItem value="all">All statuses</MenuItem>
                  <MenuItem value="upcoming">Upcoming</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="noShow">No-show</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="unpaid">Unpaid</MenuItem>
                </Select>
              </Box>
            </CardContent>
          </Card>

          <ReportSection
            title="Standard Reports"
            description="Simple prebuilt reports using sessions, clients, billing, packages, providers, and status fields."
            icon={<AssessmentIcon />}
          >
            {standardReportDefinitions.map((report) => (
              <ReportCard
                key={report.id}
                title={report.title}
                description={report.description}
                rows={standardReports[report.id] ?? []}
                filename={`lumina-${report.id}`}
              />
            ))}
          </ReportSection>

          <ReportSection
            title="Notes Reports"
            description="Structured template field analytics only. Free-text note blobs are intentionally excluded from MVP reporting."
            icon={<NotesIcon />}
          >
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Alert severity="info" sx={{ borderRadius: '10px' }}>
                Notes analytics support structured fields such as dropdowns, multi-selects, numeric ratings, yes/no values, and tags. Fully custom report building and AI/free-text analytics are intentionally out of scope for this MVP.
              </Alert>
            </Box>
            {notesReportDefinitions.map((report) => (
              <ReportCard
                key={report.id}
                title={report.title}
                description={report.description}
                rows={notesReports[report.id] ?? []}
                filename={`lumina-notes-${report.id}`}
              />
            ))}
          </ReportSection>
        </Stack>
      ) : null}
    </Box>
  );
}

function ReportSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box sx={{ color: '#7A5C80', display: 'flex' }}>{icon}</Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#4A4542', fontSize: '18px' }}>
            {title}
          </Typography>
          <Typography sx={{ color: '#7A746F', fontSize: '13px' }}>{description}</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 2.5 }}>
        {children}
      </Box>
    </Box>
  );
}

function ReportCard({
  title,
  description,
  rows,
  filename,
}: {
  title: string;
  description: string;
  rows: ReportRow[];
  filename: string;
}) {
  const previewRows = rows.slice(0, 5);
  const headers = Object.keys(previewRows[0] ?? rows[0] ?? {});

  return (
    <Card sx={{ border: '1px solid #E8E5E1', borderRadius: '14px', boxShadow: '0 8px 24px rgba(39, 34, 30, 0.05)' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Box>
            <Typography sx={{ color: '#1F1C1A', fontWeight: 700, fontSize: '16px', mb: 0.5 }}>
              {title}
            </Typography>
            <Typography sx={{ color: '#7A746F', fontSize: '13px', lineHeight: 1.5 }}>
              {description}
            </Typography>
          </Box>
          <Chip label={`${rows.length} rows`} size="small" sx={{ bgcolor: '#F5F3F1', color: '#7A746F', fontWeight: 650 }} />
        </Box>

        {rows.length === 0 ? (
          <Box sx={{ py: 3, color: '#9A9490', fontSize: '13px' }}>No rows for the selected filters.</Box>
        ) : (
          <Box sx={{ overflowX: 'auto', border: '1px solid #F0EDEA', borderRadius: '10px', mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    <TableCell key={header} sx={{ bgcolor: '#FDFCFB', fontWeight: 700, color: '#7A746F', fontSize: '12px' }}>
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {previewRows.map((row, index) => (
                  <TableRow key={index}>
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
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#9B8B9E' }}>
            <QueryStatsIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: '12px', color: '#7A746F' }}>Prebuilt MVP report</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              disabled={rows.length === 0}
              onClick={() => exportCsv(filename, rows)}
              sx={{ color: '#7A5C80', fontWeight: 650, textTransform: 'none' }}
            >
              CSV
            </Button>
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              disabled={rows.length === 0}
              onClick={() => exportExcel(filename, rows)}
              sx={{ color: '#7A5C80', fontWeight: 650, textTransform: 'none' }}
            >
              Excel
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
