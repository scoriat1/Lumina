import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NotesIcon from '@mui/icons-material/Notes';
import PaidIcon from '@mui/icons-material/Paid';
import PhoneIcon from '@mui/icons-material/Phone';
import PlaceIcon from '@mui/icons-material/Place';
import { format } from 'date-fns';
import { NewSessionModal } from '../components/NewSessionModal';
import { SessionDetailsDrawer } from '../components/SessionDetailsDrawer';
import { apiClient } from '../api/client';
import type {
  ClientDetailEngagementDto,
  ClientDetailViewDto,
  ClientDto,
  ClientNoteDto,
  ClientTimelineEntryDto,
  SessionDto,
} from '../api/types';

type NoteType = 'general' | 'admin' | 'internal';
type ChipTone = 'brand' | 'success' | 'warning' | 'neutral' | 'beige' | 'danger';

type EngagementActivity =
  | { id: string; occurredAt: number; kind: 'session'; session: SessionDto }
  | { id: string; occurredAt: number; kind: 'note'; note: ClientTimelineEntryDto };

const statusLabelMap: Record<string, string> = {
  upcoming: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Canceled',
};

const locationLabelMap: Record<string, string> = {
  zoom: 'Zoom',
  phone: 'Phone',
  office: 'Office',
};

const noteTypeLabelMap: Record<NoteType, string> = {
  general: 'General',
  admin: 'Admin',
  internal: 'Internal',
};

const noteToneMap: Record<NoteType, ChipTone> = {
  general: 'brand',
  admin: 'warning',
  internal: 'neutral',
};

const cardContentSx = {
  p: { xs: 1.9, sm: 2.1 },
  '&:last-child': {
    pb: { xs: 1.9, sm: 2.1 },
  },
};

const surfaceCardSx = {
  borderRadius: 3.5,
  bgcolor: 'common.white',
  border: '1px solid',
  borderColor: '#E7E2F1',
  boxShadow: '0 6px 24px rgba(26, 18, 38, 0.04)',
};

const compactFieldSx = {
  '& .MuiInputLabel-root': {
    fontSize: 13,
    fontWeight: 600,
  },
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    bgcolor: (theme: any) => alpha(theme.palette.background.default, 0.72),
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
    '& fieldset': {
      borderColor: (theme: any) => alpha(theme.palette.text.primary, 0.08),
    },
    '&:hover fieldset': {
      borderColor: (theme: any) => alpha(theme.palette.primary.main, 0.28),
    },
    '&.Mui-focused': {
      bgcolor: 'common.white',
      boxShadow: (theme: any) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`,
    },
    '&.Mui-focused fieldset': {
      borderColor: (theme: any) => alpha(theme.palette.primary.main, 0.38),
    },
  },
};

function formatDateTime(value: string) {
  return format(new Date(value), 'MMM d, yyyy, h:mm a');
}

function formatDateOnly(value: string) {
  return format(new Date(value), 'MMM d, yyyy');
}

function formatLongDate(value: string) {
  return format(new Date(value), 'MMMM d, yyyy');
}

function formatDateRange(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return 'Dates not set';
  if (startDate && !endDate) return `${formatDateOnly(startDate)} to Ongoing`;
  if (!startDate && endDate) return `Until ${formatDateOnly(endDate)}`;

  const startLabel = formatDateOnly(startDate!);
  const endLabel = formatDateOnly(endDate!);

  return startLabel === endLabel ? startLabel : `${startLabel} to ${endLabel}`;
}

function formatCurrency(value?: number | string | null) {
  if (value === null || value === undefined || value === '') return null;

  const numericValue =
    typeof value === 'number'
      ? value
      : Number.parseFloat(String(value).replace(/[^0-9.-]/g, ''));

  if (!Number.isFinite(numericValue)) return null;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: Number.isInteger(numericValue) ? 0 : 2,
  }).format(numericValue);
}

function formatLabel(value?: string | null) {
  if (!value) return 'Unknown';

  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(' ');
}

function normalizeNoteType(type?: string | null): NoteType {
  if (type === 'admin' || type === 'internal') return type;
  return 'general';
}

function getEngagementStatusTone(status: string): ChipTone {
  if (status === 'active') return 'brand';
  if (status === 'completed') return 'success';
  if (status === 'paused') return 'warning';
  return 'neutral';
}

function getSessionStatusTone(status: SessionDto['status']): ChipTone {
  if (status === 'completed') return 'success';
  if (status === 'cancelled') return 'neutral';
  return 'brand';
}

function getChipStyles(tone: ChipTone) {
  switch (tone) {
    case 'success':
      return { bg: '#EAF6EC', border: '#CFE6D5', color: '#2F7A42' };
    case 'warning':
      return { bg: '#FFF3E3', border: '#F3DFC0', color: '#A5621C' };
    case 'neutral':
      return { bg: '#F5F1ED', border: '#E4DBD2', color: '#655B52' };
    case 'beige':
      return { bg: '#F8F1E7', border: '#E9D9C4', color: '#8A6B45' };
    case 'danger':
      return { bg: '#FCECEC', border: '#F0D3D3', color: '#B25252' };
    case 'brand':
    default:
      return { bg: '#F1ECF8', border: '#E0D4F0', color: '#6E5E82' };
  }
}

function buildEngagementActivities(
  engagement: ClientDetailEngagementDto,
  timeline: ClientTimelineEntryDto[],
): EngagementActivity[] {
  const engagementSessionIds = new Set(engagement.sessions.map((session) => session.id));

  const sessionActivities: EngagementActivity[] = engagement.sessions.map((session) => ({
    id: `session-${session.id}`,
    occurredAt: new Date(session.date).getTime(),
    kind: 'session',
    session,
  }));

  const noteActivities: EngagementActivity[] = timeline
    .filter((entry) => entry.entryType === 'note' && Boolean(entry.sessionId) && engagementSessionIds.has(entry.sessionId!))
    .map((note) => ({
      id: note.id,
      occurredAt: new Date(note.createdAt).getTime(),
      kind: 'note',
      note,
    }));

  return [...sessionActivities, ...noteActivities].sort((a, b) => b.occurredAt - a.occurredAt);
}

function SoftChip({ label, tone }: { label: string; tone: ChipTone }) {
  const styles = getChipStyles(tone);

  return (
    <Chip
      size="small"
      label={label}
      sx={{
        height: 21,
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.15,
        bgcolor: styles.bg,
        color: styles.color,
        border: '1px solid',
        borderColor: styles.border,
        '& .MuiChip-label': {
          px: 0.95,
        },
      }}
    />
  );
}

function ContactInfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Box
      sx={{
        py: 0.35,
      }}
    >
      <Stack direction="row" spacing={1.1} alignItems="flex-start">
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: '#F4EFFB',
            color: '#8B76B4',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', fontWeight: 600, letterSpacing: 0.15, fontSize: 10.5 }}
          >
            {label}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.2, fontWeight: 500, color: 'text.primary', wordBreak: 'break-word' }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function ClientNoteCard({ note }: { note: ClientNoteDto }) {
  const normalizedType = normalizeNoteType(note.type);

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: '#EEE7F6',
        borderRadius: 2.6,
        px: 1.2,
        py: 1.1,
        bgcolor: '#FAF9FD',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 0.85 }}>
        <SoftChip label={noteTypeLabelMap[normalizedType]} tone={noteToneMap[normalizedType]} />
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: 10.5 }}>
          {formatDateTime(note.createdAt)}
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
        {note.content}
      </Typography>
    </Box>
  );
}

function EngagementActivityCard({
  item,
  onOpenSession,
}: {
  item: EngagementActivity;
  onOpenSession: (sessionId: string) => void;
}) {
  if (item.kind === 'note') {
    const noteType = normalizeNoteType(item.note.category);

    return (
      <Box
        sx={{
          border: '1px solid',
          borderColor: '#F0DFCA',
          borderRadius: 2.6,
          px: 1.3,
          py: 1.15,
          bgcolor: '#FCF5EC',
        }}
      >
        <Stack direction="row" spacing={1.1} alignItems="flex-start">
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: '#F5E5D0',
              color: '#8A6B45',
              flexShrink: 0,
            }}
          >
            <NotesIcon sx={{ fontSize: 16 }} />
          </Box>
          <Box sx={{ minWidth: 0, width: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 0.7 }}>
              <SoftChip label={noteTypeLabelMap[noteType]} tone="beige" />
              <Typography variant="caption" color="text.secondary">
                {formatDateTime(item.note.createdAt)}
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {item.note.content}
            </Typography>
          </Box>
        </Stack>
      </Box>
    );
  }

  const session = item.session;

  return (
    <Box
      onClick={() => onOpenSession(session.id)}
      sx={{
        border: '1px solid',
        borderColor: '#ECE7F4',
        borderRadius: 2.6,
        px: 1.35,
        py: 1.15,
        bgcolor: 'common.white',
        cursor: 'pointer',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        boxShadow: '0 2px 8px rgba(26, 18, 38, 0.02)',
        '&:hover': {
          transform: 'translateY(-1px)',
          borderColor: '#DACCF0',
          boxShadow: '0 8px 18px rgba(26, 18, 38, 0.05)',
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={1.25} alignItems="flex-start">
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {session.sessionType}
          </Typography>
          {session.focus ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.55 }}>
              {session.focus}
            </Typography>
          ) : null}
        </Box>
        <SoftChip
          label={statusLabelMap[session.status] ?? formatLabel(session.status)}
          tone={getSessionStatusTone(session.status)}
        />
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 0.65, sm: 1.2 }}
        sx={{ mt: 0.95, color: 'text.secondary' }}
      >
        <Stack direction="row" spacing={0.65} alignItems="center">
          <EventIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption">{formatDateTime(session.date)}</Typography>
        </Stack>
        <Stack direction="row" spacing={0.65} alignItems="center">
          <AccessTimeRoundedIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption">{`${session.duration} min`}</Typography>
        </Stack>
        <Stack direction="row" spacing={0.65} alignItems="center">
          <PlaceIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption">{locationLabelMap[session.location] ?? formatLabel(session.location)}</Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

export function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [client, setClient] = useState<ClientDto | null>(null);
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [detailView, setDetailView] = useState<ClientDetailViewDto | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('general');
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [isNoteComposerOpen, setIsNoteComposerOpen] = useState(false);
  const [isClientEditOpen, setIsClientEditOpen] = useState(false);
  const [clientDraft, setClientDraft] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'active' as ClientDto['status'],
    startDate: '',
    notes: '',
  });
  const [savingClient, setSavingClient] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [clientFieldErrors, setClientFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    startDate?: string;
  }>({});
  const sessionsSectionRef = useRef<HTMLDivElement | null>(null);

  const loadData = async () => {
    if (!id) return;

    const [clientData, sessionData, detailData] = await Promise.all([
      apiClient.getClient(id),
      apiClient.getClientSessions(id),
      apiClient.getClientDetailView(id),
    ]);

    setClient(clientData);
    setSessions(sessionData);
    setDetailView(detailData);
  };

  useEffect(() => {
    loadData().catch(() => {
      setClient(null);
      setSessions([]);
      setDetailView(null);
    });
  }, [id]);

  const upcomingSession = useMemo(() => {
    if (detailView?.nextStep) return detailView.nextStep;

    return (
      [...sessions]
        .filter((session) => session.status === 'upcoming')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null
    );
  }, [detailView?.nextStep, sessions]);

  const orderedEngagements = useMemo(() => {
    const nextEngagements = [...(detailView?.engagements ?? [])];

    nextEngagements.sort((a, b) => {
      const aPriority = a.status === 'active' ? 0 : 1;
      const bPriority = b.status === 'active' ? 0 : 1;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      const aDate = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bDate = b.startDate ? new Date(b.startDate).getTime() : 0;

      return bDate - aDate;
    });

    return nextEngagements;
  }, [detailView]);

  const lifetimeValue = useMemo(() => {
    const packageTotal = orderedEngagements
      .map((engagement) => engagement.price ?? 0)
      .reduce((total, amount) => total + amount, 0);

    if (packageTotal > 0) return packageTotal;

    return sessions.find((session) => session.packagePrice)?.packagePrice ?? null;
  }, [orderedEngagements, sessions]);

  useEffect(() => {
    if (searchParams.get('focus') === 'sessions' && sessionsSectionRef.current) {
      sessionsSectionRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [orderedEngagements.length, searchParams]);

  const handleOpenSessionDetails = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleCloseSessionDetails = () => {
    setSelectedSessionId(null);
  };

  const handleOpenNoteComposer = () => {
    setNoteError(null);
    setIsNoteComposerOpen(true);
  };

  const handleCloseNoteComposer = () => {
    setNoteDraft('');
    setNoteType('general');
    setNoteError(null);
    setIsNoteComposerOpen(false);
  };

  const handleAddClientNote = async () => {
    if (!id || !noteDraft.trim()) return;

    setSavingNote(true);
    setNoteError(null);

    try {
      await apiClient.createClientNote(id, {
        content: noteDraft.trim(),
        type: noteType,
        source: 'client-detail',
      });
      setNoteDraft('');
      setIsNoteComposerOpen(false);
      await loadData();
    } catch {
      setNoteError('Unable to save note. Please try again.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleOpenClientEdit = () => {
    if (!client) return;

    const [firstName = '', ...rest] = client.name.split(' ');

    setClientDraft({
      firstName,
      lastName: rest.join(' '),
      email: client.email ?? '',
      phone: client.phone ?? '',
      status: client.status,
      startDate: format(new Date(client.startDate), 'yyyy-MM-dd'),
      notes: client.notes ?? '',
    });
    setClientError(null);
    setClientFieldErrors({});
    setIsClientEditOpen(true);
  };

  const handleCancelClientEdit = () => {
    setIsClientEditOpen(false);
    setClientError(null);
    setClientFieldErrors({});
  };

  const handleSaveClientEdit = async () => {
    if (!id || !client) return;

    const nextErrors: { firstName?: string; lastName?: string; email?: string; startDate?: string } = {};
    const firstName = clientDraft.firstName.trim();
    const lastName = clientDraft.lastName.trim();
    const email = clientDraft.email.trim();

    if (!firstName) {
      nextErrors.firstName = 'First name is required.';
    }

    if (!lastName) {
      nextErrors.lastName = 'Last name is required.';
    }

    if (!email) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!clientDraft.startDate) {
      nextErrors.startDate = 'Start date is required.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setClientFieldErrors(nextErrors);
      return;
    }

    setSavingClient(true);
    setClientError(null);
    setClientFieldErrors({});

    try {
      await apiClient.updateClient(id, {
        name: `${firstName} ${lastName}`,
        program: client.program,
        startDate: new Date(clientDraft.startDate).toISOString(),
        status: clientDraft.status,
        notes: clientDraft.notes.trim() ? clientDraft.notes.trim() : null,
        email,
        phone: clientDraft.phone.trim(),
      });
      setIsClientEditOpen(false);
      await loadData();
    } catch (error) {
      setClientError(error instanceof Error ? error.message : 'Unable to save client details. Please try again.');
    } finally {
      setSavingClient(false);
    }
  };

  if (!id) return <Typography>Client not found.</Typography>;
  if (!client) return <Typography>Loading client...</Typography>;

  const upcomingSessionId =
    upcomingSession && 'sessionId' in upcomingSession ? upcomingSession.sessionId : upcomingSession?.id;
  const summaryMetadata = [
    `Client since ${formatLongDate(client.startDate)}`,
    `${orderedEngagements.length} ${orderedEngagements.length === 1 ? 'engagement' : 'engagements'}`,
    `${formatCurrency(lifetimeValue) ?? 'No recorded'} lifetime`,
  ];

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1160,
        mx: 'auto',
        px: { xs: 1.5, sm: 3, xl: 4 },
        pt: { xs: 1.25, sm: 2.25 },
        pb: { xs: 4, lg: 5 },
      }}
    >
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/clients')}
        sx={{
          textTransform: 'none',
          mb: 1.5,
          px: 1,
          color: 'text.secondary',
          '&:hover': {
            bgcolor: 'transparent',
            color: 'text.primary',
          },
        }}
      >
        Back to Clients
      </Button>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ md: 'center' }}
        spacing={{ xs: 2, md: 3 }}
        sx={{ mb: 2.1 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: -0.45, lineHeight: 1.08 }}>
            {client.name}
          </Typography>
          <Stack
            direction="row"
            useFlexGap
            flexWrap="wrap"
            spacing={0}
            sx={{ mt: 1, color: 'text.secondary', rowGap: 0.5, columnGap: 0.8 }}
          >
            {summaryMetadata.map((item, index) => (
              <Stack key={item} direction="row" spacing={0.8} alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                  {item}
                </Typography>
                {index < summaryMetadata.length - 1 ? (
                  <Box
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      bgcolor: (theme) => alpha(theme.palette.text.primary, 0.18),
                    }}
                  />
                ) : null}
              </Stack>
            ))}
          </Stack>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsNewSessionModalOpen(true)}
          sx={{
            textTransform: 'none',
            borderRadius: 2.5,
            px: 2.5,
            py: 1.1,
            minWidth: 160,
            alignSelf: { xs: 'stretch', sm: 'flex-start', md: 'center' },
            fontWeight: 700,
            boxShadow: '0 10px 22px rgba(130, 88, 255, 0.22)',
          }}
        >
          New Session
        </Button>
      </Stack>

      <Card
        variant="outlined"
        sx={{
          ...surfaceCardSx,
          mb: 3,
          borderColor: '#E8E2F4',
          bgcolor: '#FAF9FD',
          boxShadow: 'none',
        }}
      >
        <CardContent sx={cardContentSx}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ md: 'center' }}
            spacing={1.5}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.75, fontWeight: 700, fontSize: 10.5 }}>
                Next Step
              </Typography>
              {upcomingSession ? (
                <>
                  <Typography variant="body2" sx={{ mt: 0.55, fontWeight: 600, color: 'text.primary' }}>
                    {`Next session scheduled ${format(new Date(upcomingSession.date), 'MMM d')} at ${format(new Date(upcomingSession.date), 'h:mm a')}`}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.55 }}>
                  No upcoming sessions scheduled.
                </Typography>
              )}
            </Box>

            {upcomingSession ? (
              <Button
                onClick={() => {
                  if (upcomingSessionId) handleOpenSessionDetails(upcomingSessionId);
                }}
                variant="outlined"
                sx={{
                  textTransform: 'none',
                  borderRadius: 999,
                  px: 1.5,
                  minWidth: 0,
                  borderColor: '#E3DCF0',
                  bgcolor: 'common.white',
                  color: 'text.secondary',
                }}
              >
                Open
              </Button>
            ) : (
              <Button
                onClick={() => setIsNewSessionModalOpen(true)}
                variant="outlined"
                sx={{
                  textTransform: 'none',
                  borderRadius: 999,
                  px: 1.5,
                  minWidth: 0,
                  borderColor: '#E3DCF0',
                  bgcolor: 'common.white',
                  color: 'text.secondary',
                }}
              >
                Schedule
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: (theme) => alpha(theme.palette.text.primary, 0.07),
          mb: 3,
        }}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.78fr) minmax(260px, 0.72fr)' },
          gap: { xs: 2, lg: 2.2 },
          alignItems: 'start',
        }}
      >
        <Box ref={sessionsSectionRef}>
          {orderedEngagements.length > 0 ? (
            <Stack spacing={1.5}>
              {orderedEngagements.map((engagement, index) => {
                const progressPercent =
                  engagement.totalSessions > 0
                    ? Math.round((engagement.usedSessions / engagement.totalSessions) * 100)
                    : 0;

                const activities = buildEngagementActivities(engagement, detailView?.timeline ?? []);
                const engagementValue = formatCurrency(engagement.price);

                return (
                  <Accordion
                    key={engagement.id}
                    defaultExpanded={index === 0}
                    disableGutters
                    sx={{
                      border: '1px solid',
                      borderColor: engagement.status === 'active' ? '#E5DAF6' : '#EEE9F4',
                      borderRadius: 3.5,
                      bgcolor: 'common.white',
                      boxShadow: engagement.status === 'active'
                        ? '0 8px 26px rgba(26, 18, 38, 0.05)'
                        : '0 2px 10px rgba(26, 18, 38, 0.02)',
                      overflow: 'hidden',
                      '&:before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
                      sx={{
                        px: { xs: 1.9, sm: 2.25 },
                        py: 1.7,
                        '& .MuiAccordionSummary-content': {
                          my: 0,
                        },
                      }}
                    >
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={{ xs: 1.5, md: 2 }}
                        justifyContent="space-between"
                        alignItems={{ md: 'center' }}
                        sx={{ width: '100%', minWidth: 0 }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="caption"
                            color={engagement.status === 'active' ? 'primary.main' : 'text.secondary'}
                            sx={{ fontWeight: 700, letterSpacing: 0.6, fontSize: 10.5 }}
                          >
                            {engagement.status === 'active' ? 'CURRENT PHASE' : 'PACKAGE HISTORY'}
                          </Typography>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1}
                            alignItems={{ sm: 'center' }}
                            sx={{ mt: 0.35 }}
                          >
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.05rem' }}>
                              {engagement.name}
                            </Typography>
                          </Stack>
                          <Stack
                            direction="row"
                            useFlexGap
                            flexWrap="wrap"
                            spacing={0}
                            sx={{ mt: 0.95, color: 'text.secondary', rowGap: 0.5, columnGap: 1 }}
                          >
                            <SoftChip
                              label={formatLabel(engagement.status)}
                              tone={getEngagementStatusTone(engagement.status)}
                            />
                            <Stack direction="row" spacing={0.65} alignItems="center">
                              <CalendarTodayOutlinedIcon sx={{ fontSize: 15 }} />
                              <Typography variant="caption">{formatDateRange(engagement.startDate, engagement.endDate)}</Typography>
                            </Stack>
                            {engagementValue ? (
                              <Stack direction="row" spacing={0.65} alignItems="center">
                                <PaidIcon sx={{ fontSize: 16 }} />
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                  {engagementValue}
                                </Typography>
                              </Stack>
                            ) : null}
                          </Stack>
                        </Box>

                        <Box
                          sx={{
                            minWidth: { md: 120 },
                            maxWidth: { md: 142 },
                            width: { xs: '100%', md: 'auto' },
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: { md: 'right' } }}>
                            {`${engagement.usedSessions} of ${engagement.totalSessions} sessions`}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={progressPercent}
                            sx={{
                              mt: 0.7,
                              height: 4,
                              borderRadius: 999,
                              bgcolor: '#EFE8FB',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 999,
                                backgroundColor: '#8E63F8',
                              },
                            }}
                          />
                        </Box>
                      </Stack>
                    </AccordionSummary>

                    <AccordionDetails sx={{ px: { xs: 1.9, sm: 2.25 }, pt: 0, pb: 1.9 }}>
                      <Box
                        sx={{
                          pt: 1.5,
                          borderTop: '1px solid',
                          borderColor: '#F0EBF6',
                        }}
                      >
                        {activities.length > 0 ? (
                          <Stack spacing={1.05}>
                            {activities.map((item) => (
                              <EngagementActivityCard
                                key={item.id}
                                item={item}
                                onOpenSession={handleOpenSessionDetails}
                              />
                            ))}
                          </Stack>
                        ) : (
                          <Box
                            sx={{
                              border: '1px solid',
                              borderColor: '#ECE7F4',
                              borderRadius: 2.75,
                              px: 1.6,
                              py: 1.9,
                              bgcolor: '#FAF9FD',
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              No activity recorded yet.
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45 }}>
                              Session history and package updates will appear here as activity is added.
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Stack>
          ) : (
            <Card variant="outlined" sx={surfaceCardSx}>
              <CardContent sx={cardContentSx}>
                <Stack spacing={1}>
                  <CheckCircleOutlineIcon sx={{ color: 'text.disabled' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    No engagements yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Packages and session history will appear here once work is scheduled for this client.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Box>

        <Stack spacing={1.6}>
          <Card variant="outlined" sx={surfaceCardSx}>
            <CardContent sx={cardContentSx}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.05 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Contact Information
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={isClientEditOpen ? handleCancelClientEdit : handleOpenClientEdit}
                  sx={{
                    color: 'primary.main',
                    bgcolor: '#F6F0FF',
                    '&:hover': {
                      bgcolor: '#F0E8FF',
                    },
                  }}
                >
                  {isClientEditOpen ? <CloseRoundedIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                </IconButton>
              </Stack>

              <Collapse in={!isClientEditOpen} unmountOnExit>
                <Stack spacing={1.2}>
                  <ContactInfoRow
                    icon={<EmailIcon sx={{ fontSize: 17 }} />}
                    label="Email"
                    value={client.email || 'Not provided'}
                  />
                  <ContactInfoRow
                    icon={<PhoneIcon sx={{ fontSize: 17 }} />}
                    label="Phone"
                    value={client.phone || 'Not provided'}
                  />
                </Stack>
              </Collapse>

              <Collapse in={isClientEditOpen} unmountOnExit>
                <Stack spacing={1.2}>
                  {clientError ? <Alert severity="error">{clientError}</Alert> : null}

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 1.1,
                    }}
                  >
                    <TextField
                      label="First Name"
                      size="small"
                      fullWidth
                      value={clientDraft.firstName}
                      onChange={(e) => setClientDraft((prev) => ({ ...prev, firstName: e.target.value }))}
                      error={Boolean(clientFieldErrors.firstName)}
                      helperText={clientFieldErrors.firstName}
                      sx={compactFieldSx}
                    />
                    <TextField
                      label="Last Name"
                      size="small"
                      fullWidth
                      value={clientDraft.lastName}
                      onChange={(e) => setClientDraft((prev) => ({ ...prev, lastName: e.target.value }))}
                      error={Boolean(clientFieldErrors.lastName)}
                      helperText={clientFieldErrors.lastName}
                      sx={compactFieldSx}
                    />
                    <TextField
                      label="Email"
                      type="email"
                      size="small"
                      fullWidth
                      value={clientDraft.email}
                      onChange={(e) => setClientDraft((prev) => ({ ...prev, email: e.target.value }))}
                      error={Boolean(clientFieldErrors.email)}
                      helperText={clientFieldErrors.email}
                      sx={compactFieldSx}
                    />
                    <TextField
                      label="Phone"
                      size="small"
                      fullWidth
                      value={clientDraft.phone}
                      onChange={(e) => setClientDraft((prev) => ({ ...prev, phone: e.target.value }))}
                      sx={compactFieldSx}
                    />
                    <TextField
                      label="Status"
                      select
                      size="small"
                      fullWidth
                      value={clientDraft.status}
                      onChange={(e) => setClientDraft((prev) => ({ ...prev, status: e.target.value as ClientDto['status'] }))}
                      sx={compactFieldSx}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="paused">Paused</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </TextField>
                    <TextField
                      label="Start Date"
                      type="date"
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={clientDraft.startDate}
                      onChange={(e) => setClientDraft((prev) => ({ ...prev, startDate: e.target.value }))}
                      error={Boolean(clientFieldErrors.startDate)}
                      helperText={clientFieldErrors.startDate}
                      sx={compactFieldSx}
                    />
                  </Box>

                  <TextField
                    label="Internal Summary"
                    multiline
                    minRows={3}
                    fullWidth
                    value={clientDraft.notes}
                    onChange={(e) => setClientDraft((prev) => ({ ...prev, notes: e.target.value }))}
                    sx={compactFieldSx}
                  />

                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <Button
                      onClick={handleCancelClientEdit}
                      disabled={savingClient}
                      sx={{ textTransform: 'none', borderRadius: 999 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveClientEdit}
                      variant="contained"
                      disabled={savingClient}
                      sx={{ textTransform: 'none', borderRadius: 999, boxShadow: 'none' }}
                    >
                      Save changes
                    </Button>
                  </Stack>
                </Stack>
              </Collapse>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={surfaceCardSx}>
            <CardContent sx={cardContentSx}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Client Notes
                  </Typography>
                </Box>
                {isNoteComposerOpen ? (
                  <Button
                    size="small"
                    onClick={handleCloseNoteComposer}
                    sx={{ textTransform: 'none', borderRadius: 999 }}
                  >
                    Cancel
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<AddIcon />}
                    onClick={handleOpenNoteComposer}
                    sx={{
                      textTransform: 'none',
                      borderRadius: 999,
                      px: 0.5,
                      minWidth: 0,
                      color: 'primary.main',
                    }}
                  >
                    Add note
                  </Button>
                )}
              </Stack>

              <Stack spacing={1}>
                {(detailView?.clientNotes ?? []).length > 0 ? (
                  detailView!.clientNotes.map((note) => <ClientNoteCard key={note.id} note={note} />)
                ) : (
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: '#EEE7F6',
                      borderRadius: 2.75,
                      px: 1.6,
                      py: 1.8,
                      bgcolor: '#FAF9FD',
                    }}
                  >
                    <Stack spacing={0.8}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: 2.2,
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: '#F4EFFB',
                          color: 'primary.main',
                        }}
                      >
                        <NotesIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        No client notes yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Add a note to capture context, follow-ups, or internal reminders without leaving the page.
                      </Typography>
                    </Stack>
                  </Box>
                )}
              </Stack>

              <Collapse in={isNoteComposerOpen} unmountOnExit>
                <Box
                  sx={{
                    mt: 1.5,
                    pt: 1.5,
                    borderTop: '1px solid',
                    borderColor: '#F0EBF6',
                  }}
                >
                  <Stack spacing={1.1}>
                    {noteError ? <Alert severity="error">{noteError}</Alert> : null}
                    <TextField
                      size="small"
                      select
                      fullWidth
                      label="Category"
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value as NoteType)}
                      sx={compactFieldSx}
                    >
                      <MenuItem value="general">General</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="internal">Internal</MenuItem>
                    </TextField>
                    <TextField
                      multiline
                      minRows={3}
                      fullWidth
                      label="Note"
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Add a concise update or internal note"
                      sx={compactFieldSx}
                    />
                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                      <Button
                        onClick={handleCloseNoteComposer}
                        disabled={savingNote}
                        sx={{ textTransform: 'none', borderRadius: 999 }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleAddClientNote}
                        disabled={savingNote || !noteDraft.trim()}
                        sx={{ textTransform: 'none', borderRadius: 999, boxShadow: 'none' }}
                      >
                        Save note
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      <SessionDetailsDrawer
        open={Boolean(selectedSessionId)}
        onClose={handleCloseSessionDetails}
        sessionId={selectedSessionId}
        sessions={sessions}
        onSaved={loadData}
        surfaceVariant="client-detail"
      />

      <NewSessionModal
        open={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        preselectedClientId={client.id}
        onCreated={async () => {
          await loadData();
        }}
      />
    </Box>
  );
}
