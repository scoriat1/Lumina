import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Collapse,
    Divider,
    FormControl,
    IconButton,
    LinearProgress,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WorkIcon from '@mui/icons-material/Work';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import NoteIcon from '@mui/icons-material/Note';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { format } from 'date-fns';
import { colors } from '../styles/colors';
import { SessionEntryModal } from '../components/SessionEntryModal';
import { SessionDetailsDrawer } from '../components/SessionDetailsDrawer';
import { apiClient } from '../api/client';
import type {
    ClientDetailEngagementDto,
    ClientDetailViewDto,
    ClientDto,
    ClientTimelineEntryDto,
    SessionDto,
} from '../api/types';

type NoteType = 'general' | 'admin' | 'internal';

type EngagementActivity =
    | { id: string; occurredAt: number; kind: 'session'; session: SessionDto }
    | { id: string; occurredAt: number; kind: 'note'; note: ClientTimelineEntryDto };

type ClientFieldErrors = {
    firstName?: string;
    lastName?: string;
    email?: string;
    startDate?: string;
};

const statusLabelMap: Record<string, string> = {
    upcoming: 'Scheduled',
    completed: 'Completed',
    cancelled: 'Canceled',
    noShow: 'No-show',
};

const locationLabelMap: Record<SessionDto['location'], string> = {
    zoom: 'Video Call',
    phone: 'Phone',
    office: 'In Person',
};

function formatDateTime(value: string) {
    return format(new Date(value), 'MMM d, yyyy h:mm a');
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

    return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
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

function normalizeNoteType(type?: string | null): NoteType {
    if (type === 'admin' || type === 'internal') {
        return type;
    }

    return 'general';
}

function getNoteTypeLabel(type: NoteType) {
    switch (type) {
        case 'admin':
            return 'Admin';
        case 'internal':
            return 'Internal';
        case 'general':
        default:
            return 'General';
    }
}

function getTagColor(type: NoteType) {
    switch (type) {
        case 'internal':
            return { bg: 'rgba(110, 91, 206, 0.08)', text: '#6E5BCE' };
        case 'admin':
            return { bg: 'rgba(251, 146, 60, 0.08)', text: '#EA580C' };
        case 'general':
        default:
            return {
                bg: 'rgba(100, 100, 100, 0.08)',
                text: 'rgba(80, 80, 80, 0.8)',
            };
    }
}

function getStatusColor(status: string) {
    switch (status) {
        case 'completed':
            return {
                bg: colors.status.successBg,
                text: colors.status.success,
                border: colors.status.successBorder,
            };
        case 'paused':
            return {
                bg: 'rgba(251, 146, 60, 0.12)',
                text: '#B45309',
                border: 'rgba(251, 146, 60, 0.28)',
            };
        case 'cancelled':
            return {
                bg: colors.semantic.error.bg,
                text: colors.semantic.error.text,
                border: colors.border.subtle,
            };
        case 'active':
            return {
                bg: colors.badge.active.bg,
                text: colors.badge.active.text,
                border: colors.border.subtle,
            };
        case 'upcoming':
        default:
            return {
                bg: colors.badge.scheduled.bg,
                text: colors.badge.scheduled.text,
                border: colors.border.subtle,
            };
    }
}

function getClientStatusLabel(status: ClientDto['status']) {
    switch (status) {
        case 'paused':
            return 'Paused';
        case 'completed':
            return 'Completed';
        case 'active':
        default:
            return 'Active';
    }
}

function buildEngagementActivities(
    engagement: ClientDetailEngagementDto,
    timeline: ClientTimelineEntryDto[],
): EngagementActivity[] {
    const engagementSessionIds = new Set(
        engagement.sessions.map((session) => session.id),
    );

    const sessionActivities: EngagementActivity[] = engagement.sessions.map(
        (session) => ({
            id: `session-${session.id}`,
            occurredAt: new Date(session.date).getTime(),
            kind: 'session',
            session,
        }),
    );

    const noteActivities: EngagementActivity[] = timeline
        .filter(
            (entry) =>
                entry.entryType === 'note' &&
                Boolean(entry.sessionId) &&
                engagementSessionIds.has(entry.sessionId!),
        )
        .map((note) => ({
            id: note.id,
            occurredAt: new Date(note.createdAt).getTime(),
            kind: 'note',
            note,
        }));

    return [...sessionActivities, ...noteActivities].sort(
        (left, right) => right.occurredAt - left.occurredAt,
    );
}

function createClientDraft(client: ClientDto) {
    const [firstName = '', ...rest] = client.name.split(' ');

    return {
        firstName,
        lastName: rest.join(' '),
        email: client.email ?? '',
        phone: client.phone ?? '',
        status: client.status,
        startDate: format(new Date(client.startDate), 'yyyy-MM-dd'),
    };
}

export function ClientDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [client, setClient] = useState<ClientDto | null>(null);
    const [sessions, setSessions] = useState<SessionDto[]>([]);
    const [detailView, setDetailView] = useState<ClientDetailViewDto | null>(
        null,
    );
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
        null,
    );
    const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
    const [expandedEngagements, setExpandedEngagements] = useState<Record<string, boolean>>({});

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
    });
    const [savingClient, setSavingClient] = useState(false);
    const [clientError, setClientError] = useState<string | null>(null);
    const [clientFieldErrors, setClientFieldErrors] = useState<ClientFieldErrors>({});

    const sessionsSectionRef = useRef<HTMLDivElement | null>(null);

    const loadData = async () => {
        if (!id) {
            return;
        }

        const [clientData, sessionData, detailData] = await Promise.all([
            apiClient.getClient(id),
            apiClient.getClientSessions(id),
            apiClient.getClientDetailView(id),
        ]);

        setClient(clientData);
        setSessions(sessionData);
        setDetailView(detailData);
        setLoadError(null);
    };

    useEffect(() => {
        if (!id) {
            return;
        }

        let isActive = true;

        void loadData().catch((error) => {
            if (!isActive) {
                return;
            }

            setClient(null);
            setSessions([]);
            setDetailView(null);
            setLoadError(
                error instanceof Error
                    ? error.message
                    : 'Unable to load client details.',
            );
        });

        return () => {
            isActive = false;
        };
    }, [id]);

    const orderedEngagements = useMemo(() => {
        const nextEngagements = [...(detailView?.engagements ?? [])];

        nextEngagements.sort((left, right) => {
            const leftPriority = left.status === 'active' ? 0 : 1;
            const rightPriority = right.status === 'active' ? 0 : 1;

            if (leftPriority !== rightPriority) {
                return leftPriority - rightPriority;
            }

            const leftDate = left.startDate ? new Date(left.startDate).getTime() : 0;
            const rightDate = right.startDate ? new Date(right.startDate).getTime() : 0;

            return rightDate - leftDate;
        });

        return nextEngagements;
    }, [detailView]);

    useEffect(() => {
        setExpandedEngagements((current) => {
            const next: Record<string, boolean> = {};
            let changed = false;

            for (const engagement of orderedEngagements) {
                const isExpanded = current[engagement.id] ?? engagement.status === 'active';
                next[engagement.id] = isExpanded;

                if (current[engagement.id] !== isExpanded) {
                    changed = true;
                }
            }

            if (Object.keys(current).length !== Object.keys(next).length) {
                changed = true;
            }

            return changed ? next : current;
        });
    }, [orderedEngagements]);

    const upcomingSession = useMemo(() => {
        if (detailView?.nextStep) {
            return detailView.nextStep;
        }

        return (
            [...sessions]
                .filter((session) => session.status === 'upcoming')
                .sort(
                    (left, right) =>
                        new Date(left.date).getTime() -
                        new Date(right.date).getTime(),
                )[0] ?? null
        );
    }, [detailView?.nextStep, sessions]);

    const lifetimeValue = useMemo(() => {
        const packageTotal = orderedEngagements
            .map((engagement) => engagement.price ?? 0)
            .reduce((total, amount) => total + amount, 0);

        if (packageTotal > 0) {
            return packageTotal;
        }

        return sessions.find((session) => session.packagePrice)?.packagePrice ?? null;
    }, [orderedEngagements, sessions]);

    useEffect(() => {
        if (searchParams.get('focus') === 'sessions' && sessionsSectionRef.current) {
            sessionsSectionRef.current.scrollIntoView({
                block: 'center',
                behavior: 'smooth',
            });
        }
    }, [orderedEngagements.length, searchParams]);

    const handleToggleEngagement = (engagementId: string) => {
        setExpandedEngagements((current) => ({
            ...current,
            [engagementId]: !current[engagementId],
        }));
    };

    const handleOpenSessionDetails = (sessionId: string) => {
        setSelectedSessionId(sessionId);
    };

    const handleCloseSessionDetails = () => {
        setSelectedSessionId(null);
    };

    const handleOpenSessionModal = () => {
        setIsNewSessionModalOpen(true);
    };

    const handleCloseSessionModal = () => {
        setIsNewSessionModalOpen(false);
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
        if (!id || !noteDraft.trim()) {
            return;
        }

        setSavingNote(true);
        setNoteError(null);

        try {
            await apiClient.createClientNote(id, {
                content: noteDraft.trim(),
                type: noteType,
                source: 'client-detail',
            });
            handleCloseNoteComposer();
            await loadData();
        } catch {
            setNoteError('Unable to save note. Please try again.');
        } finally {
            setSavingNote(false);
        }
    };

    const handleOpenClientEdit = () => {
        if (!client) {
            return;
        }

        setClientDraft(createClientDraft(client));
        setClientError(null);
        setClientFieldErrors({});
        setIsClientEditOpen(true);
    };

    const handleCancelClientEdit = () => {
        if (client) {
            setClientDraft(createClientDraft(client));
        }

        setIsClientEditOpen(false);
        setClientError(null);
        setClientFieldErrors({});
    };

    const handleSaveClientEdit = async () => {
        if (!id || !client) {
            return;
        }

        const nextErrors: ClientFieldErrors = {};
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
                startDate: clientDraft.startDate,
                status: clientDraft.status,
                notes: client.notes ?? null,
                email,
                phone: clientDraft.phone.trim(),
            });
            setIsClientEditOpen(false);
            await loadData();
        } catch (error) {
            setClientError(
                error instanceof Error
                    ? error.message
                    : 'Unable to save client details. Please try again.',
            );
        } finally {
            setSavingClient(false);
        }
    };

    const upcomingSessionId =
        upcomingSession &&
        ('sessionId' in upcomingSession
            ? upcomingSession.sessionId
            : upcomingSession.id);

    const summaryText = client
        ? `Client since ${formatLongDate(client.startDate)}  •  ${orderedEngagements.length} ${
              orderedEngagements.length === 1 ? 'engagement' : 'engagements'
          }  •  ${formatCurrency(lifetimeValue) ?? 'No recorded'} lifetime`
        : '';

    const nextStepLabel = upcomingSession
        ? `Next session scheduled ${format(
              new Date(upcomingSession.date),
              'MMM d',
          )} at ${format(new Date(upcomingSession.date), 'h:mm a')}`
        : 'No upcoming sessions scheduled.';

    if (!id) {
        return <Typography>Client not found.</Typography>;
    }

    if (!client && !loadError) {
        return <Typography>Loading client...</Typography>;
    }

    if (!client) {
        return (
            <Box>
                <Box sx={{ mb: 5 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/clients')}
                        sx={{
                            color: 'rgba(80, 80, 80, 0.8)',
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '14px',
                            px: 2,
                            py: 1,
                            borderRadius: '8px',
                        }}
                    >
                        Back to Clients
                    </Button>
                </Box>
                <Alert severity="error">{loadError}</Alert>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 5 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/clients')}
                    sx={{
                        color: 'rgba(80, 80, 80, 0.8)',
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '14px',
                        px: 2,
                        py: 1,
                        borderRadius: '8px',
                        transition:
                            'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                            color: colors.text.primary,
                            transform: 'translateX(-4px)',
                        },
                        '&:active': {
                            transform: 'translateX(-2px)',
                        },
                    }}
                >
                    Back to Clients
                </Button>
            </Box>

            <Box sx={{ mb: 8 }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 1.5,
                        gap: 2,
                        flexWrap: 'wrap',
                    }}
                >
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 600,
                            color: '#1A1A1A',
                            fontSize: '32px',
                        }}
                    >
                        {client.name}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenSessionModal}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '14px',
                                bgcolor: '#8B5CF6',
                                color: 'white',
                                height: '42px',
                                px: 3.5,
                                borderRadius: '10px',
                                boxShadow:
                                    '0 2px 12px rgba(139, 92, 246, 0.3)',
                                '&:hover': {
                                    bgcolor: '#7C3AED',
                                    boxShadow:
                                        '0 6px 20px rgba(139, 92, 246, 0.5)',
                                },
                            }}
                        >
                            Add New Session
                        </Button>
                    </Box>
                </Box>

                <Typography
                    variant="body2"
                    sx={{
                        color: 'rgba(100, 100, 100, 0.75)',
                        fontSize: '14px',
                        mb: 3.5,
                    }}
                >
                    {summaryText}
                </Typography>

                {loadError ? (
                    <Alert sx={{ mb: 3 }} severity="error">
                        {loadError}
                    </Alert>
                ) : null}

                <Box
                    onClick={() => {
                        if (upcomingSessionId) {
                            handleOpenSessionDetails(upcomingSessionId);
                        }
                    }}
                    onKeyDown={(event) => {
                        if (
                            upcomingSessionId &&
                            (event.key === 'Enter' || event.key === ' ')
                        ) {
                            event.preventDefault();
                            handleOpenSessionDetails(upcomingSessionId);
                        }
                    }}
                    role={upcomingSessionId ? 'button' : undefined}
                    tabIndex={upcomingSessionId ? 0 : -1}
                    sx={{
                        bgcolor: 'rgba(110, 91, 206, 0.04)',
                        border: '1px solid rgba(110, 91, 206, 0.12)',
                        borderRadius: '10px',
                        px: 3,
                        py: 2,
                        mb: 4,
                        cursor: upcomingSessionId ? 'pointer' : 'default',
                        transition:
                            'border-color 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': upcomingSessionId
                            ? {
                                  borderColor:
                                      'rgba(110, 91, 206, 0.24)',
                                  boxShadow:
                                      '0 2px 10px rgba(110, 91, 206, 0.08)',
                              }
                            : undefined,
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            color: colors.neutral.gray600,
                            fontSize: '10px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            display: 'block',
                            mb: 0.75,
                        }}
                    >
                        Next Step
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '14px',
                            color: colors.text.primary,
                            fontWeight: 500,
                        }}
                    >
                        {nextStepLabel}
                    </Typography>
                </Box>

                <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.06)' }} />
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 4,
                }}
            >
                <Box
                    ref={sessionsSectionRef}
                    sx={{ flex: { xs: 1, md: '0 0 calc(70% - 16px)' } }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6.5,
                        }}
                    >
                        {orderedEngagements.length > 0 ? (
                            orderedEngagements.map((engagement) => {
                                const isExpanded =
                                    expandedEngagements[engagement.id];
                                const statusColors = getStatusColor(
                                    engagement.status,
                                );
                                const isActive =
                                    engagement.status === 'active';
                                const progress =
                                    engagement.totalSessions > 0
                                        ? Math.round(
                                              (engagement.usedSessions /
                                                  engagement.totalSessions) *
                                                  100,
                                          )
                                        : 0;
                                const engagementValue = formatCurrency(
                                    engagement.price,
                                );
                                const activities = buildEngagementActivities(
                                    engagement,
                                    detailView?.timeline ?? [],
                                );

                                return (
                                    <Box key={engagement.id}>
                                        <Box
                                            sx={{
                                                position: 'relative',
                                                overflow: 'hidden',
                                                ...(isActive
                                                    ? {
                                                          bgcolor: 'white',
                                                          borderRadius: '14px',
                                                          p: 4.5,
                                                          boxShadow:
                                                              '0 4px 20px rgba(110, 91, 206, 0.12)',
                                                          border:
                                                              '2px solid rgba(110, 91, 206, 0.15)',
                                                      }
                                                    : {
                                                          bgcolor: '#FAFBFC',
                                                          border:
                                                              '1px solid rgba(0, 0, 0, 0.06)',
                                                          borderRadius: '10px',
                                                          p: 3,
                                                          cursor: 'pointer',
                                                          '&:hover': {
                                                              bgcolor:
                                                                  '#F7F9FA',
                                                              borderColor:
                                                                  'rgba(0, 0, 0, 0.08)',
                                                          },
                                                      }),
                                            }}
                                        >
                                            <Box
                                                sx={{ cursor: 'pointer' }}
                                                onClick={() =>
                                                    handleToggleEngagement(
                                                        engagement.id,
                                                    )
                                                }
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent:
                                                            'space-between',
                                                        alignItems:
                                                            'flex-start',
                                                        mb: isActive ? 3 : 1,
                                                        gap: 2,
                                                    }}
                                                >
                                                    <Box sx={{ flex: 1 }}>
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems:
                                                                    'center',
                                                                gap: 2,
                                                                mb: isActive
                                                                    ? 1
                                                                    : 0.75,
                                                                flexWrap:
                                                                    'wrap',
                                                            }}
                                                        >
                                                            {isActive ? (
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        color: 'rgba(110, 91, 206, 0.7)',
                                                                        fontSize:
                                                                            '10px',
                                                                        fontWeight: 600,
                                                                        textTransform:
                                                                            'uppercase',
                                                                    }}
                                                                >
                                                                    Current
                                                                    Phase
                                                                </Typography>
                                                            ) : null}
                                                            <Typography
                                                                variant="h6"
                                                                sx={{
                                                                    fontWeight:
                                                                        isActive
                                                                            ? 650
                                                                            : 500,
                                                                    color: isActive
                                                                        ? '#1A1A1A'
                                                                        : 'rgba(60, 60, 60, 0.9)',
                                                                    fontSize:
                                                                        isActive
                                                                            ? '20px'
                                                                            : '16px',
                                                                }}
                                                            >
                                                                {
                                                                    engagement.name
                                                                }
                                                            </Typography>
                                                        </Box>

                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems:
                                                                    'center',
                                                                gap: 2,
                                                                flexWrap:
                                                                    'wrap',
                                                            }}
                                                        >
                                                            <Chip
                                                                label={
                                                                    engagement.status ===
                                                                    'active'
                                                                        ? 'Active'
                                                                        : engagement.status ===
                                                                          'paused'
                                                                        ? 'Paused'
                                                                        : 'Completed'
                                                                }
                                                                size="small"
                                                                sx={{
                                                                    bgcolor:
                                                                        statusColors.bg,
                                                                    color: statusColors.text,
                                                                    border: `1px solid ${statusColors.border}`,
                                                                    fontWeight: 600,
                                                                    fontSize:
                                                                        '11px',
                                                                    height:
                                                                        '22px',
                                                                }}
                                                            />
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    fontSize:
                                                                        '13px',
                                                                    color: 'rgba(80, 80, 80, 0.7)',
                                                                }}
                                                            >
                                                                {formatDateRange(
                                                                    engagement.startDate,
                                                                    engagement.endDate,
                                                                )}
                                                            </Typography>
                                                            {engagementValue ? (
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        fontSize:
                                                                            '13px',
                                                                        color: 'rgba(80, 80, 80, 0.7)',
                                                                    }}
                                                                >
                                                                    {
                                                                        engagementValue
                                                                    }
                                                                </Typography>
                                                            ) : null}
                                                        </Box>
                                                    </Box>

                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                            gap: 2,
                                                            ml: 2,
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                textAlign:
                                                                    'right',
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontSize:
                                                                        '13px',
                                                                    color: 'rgba(80, 80, 80, 0.7)',
                                                                    mb: 0.5,
                                                                }}
                                                            >
                                                                {
                                                                    engagement.usedSessions
                                                                }{' '}
                                                                of{' '}
                                                                {
                                                                    engagement.totalSessions
                                                                }{' '}
                                                                sessions
                                                            </Typography>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={
                                                                    progress
                                                                }
                                                                sx={{
                                                                    width: 120,
                                                                    height: 6,
                                                                    borderRadius: 3,
                                                                    bgcolor:
                                                                        'rgba(110, 91, 206, 0.08)',
                                                                    '& .MuiLinearProgress-bar':
                                                                        {
                                                                            bgcolor:
                                                                                isActive
                                                                                    ? '#8B5CF6'
                                                                                    : 'rgba(110, 91, 206, 0.4)',
                                                                            borderRadius: 3,
                                                                        },
                                                                }}
                                                            />
                                                        </Box>
                                                        <IconButton
                                                            size="small"
                                                            sx={{
                                                                color: 'rgba(80, 80, 80, 0.6)',
                                                            }}
                                                        >
                                                            {isExpanded ? (
                                                                <ExpandLessIcon />
                                                            ) : (
                                                                <ExpandMoreIcon />
                                                            )}
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                            </Box>

                                            <Collapse in={isExpanded}>
                                                <Divider
                                                    sx={{
                                                        my: 3,
                                                        borderColor:
                                                            'rgba(0, 0, 0, 0.06)',
                                                    }}
                                                />
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection:
                                                            'column',
                                                        gap: 2,
                                                    }}
                                                >
                                                    {activities.length > 0 ? (
                                                        activities.map(
                                                            (item) => {
                                                                if (
                                                                    item.kind ===
                                                                    'session'
                                                                ) {
                                                                    const session =
                                                                        item.session;
                                                                    const sessionStatusColors =
                                                                        getStatusColor(
                                                                            session.status,
                                                                        );
                                                                    const SessionMethodIcon =
                                                                        session.location ===
                                                                        'office'
                                                                            ? WorkIcon
                                                                            : session.location ===
                                                                              'phone'
                                                                            ? PhoneIcon
                                                                            : VideoCallIcon;

                                                                    return (
                                                                        <Card
                                                                            key={session.id}
                                                                            sx={{
                                                                                cursor: 'pointer',
                                                                                transition:
                                                                                    'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                                                                                border: '1px solid rgba(0, 0, 0, 0.06)',
                                                                                boxShadow:
                                                                                    'none',
                                                                                '&:hover': {
                                                                                    boxShadow:
                                                                                        '0 2px 8px rgba(0, 0, 0, 0.08)',
                                                                                    borderColor:
                                                                                        'rgba(110, 91, 206, 0.2)',
                                                                                    transform:
                                                                                        'translateY(-1px)',
                                                                                },
                                                                            }}
                                                                            onClick={() => handleOpenSessionDetails(session.id)}
                                                                        >
                                                                            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                                                                                    <Box sx={{ flex: 1 }}>
                                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
                                                                                            <SessionMethodIcon sx={{ fontSize: 18, color: 'rgba(110, 91, 206, 0.6)' }} />
                                                                                            <Typography sx={{ fontWeight: 600, fontSize: '14px', color: colors.text.primary }}>
                                                                                                {session.sessionType || 'Session'}
                                                                                            </Typography>
                                                                                            <Chip
                                                                                                label={statusLabelMap[session.status] ?? 'Scheduled'}
                                                                                                size="small"
                                                                                                sx={{
                                                                                                    bgcolor: sessionStatusColors.bg,
                                                                                                    color: sessionStatusColors.text,
                                                                                                    border: `1px solid ${sessionStatusColors.border}`,
                                                                                                    fontWeight: 600,
                                                                                                    fontSize: '10px',
                                                                                                    height: '20px',
                                                                                                }}
                                                                                            />
                                                                                        </Box>
                                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                                                <CalendarTodayIcon sx={{ fontSize: 13, color: 'rgba(80, 80, 80, 0.5)' }} />
                                                                                                <Typography variant="body2" sx={{ fontSize: '12px', color: 'rgba(80, 80, 80, 0.7)' }}>
                                                                                                    {formatDateOnly(session.date)} at {format(new Date(session.date), 'h:mm a')}
                                                                                                </Typography>
                                                                                            </Box>
                                                                                            <Typography variant="body2" sx={{ fontSize: '12px', color: 'rgba(80, 80, 80, 0.7)' }}>
                                                                                                {session.duration} min
                                                                                            </Typography>
                                                                                            <Typography variant="body2" sx={{ fontSize: '12px', color: 'rgba(80, 80, 80, 0.7)' }}>
                                                                                                {locationLabelMap[session.location]}
                                                                                            </Typography>
                                                                                        </Box>
                                                                                    </Box>
                                                                                </Box>
                                                                            </CardContent>
                                                                        </Card>
                                                                    );
                                                                }

                                                                return (
                                                                    <Box
                                                                        key={item.note.id}
                                                                        sx={{
                                                                            bgcolor: 'rgba(251, 146, 60, 0.04)',
                                                                            border: '1px solid rgba(251, 146, 60, 0.15)',
                                                                            borderRadius: '8px',
                                                                            p: 2,
                                                                        }}
                                                                    >
                                                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                                                            <NoteIcon sx={{ fontSize: 16, color: 'rgba(251, 146, 60, 0.7)', mt: 0.25 }} />
                                                                            <Box sx={{ flex: 1 }}>
                                                                                <Typography sx={{ fontSize: '13px', color: colors.text.primary, mb: 0.5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                                                                    {item.note.content}
                                                                                </Typography>
                                                                                <Typography variant="caption" sx={{ fontSize: '11px', color: 'rgba(80, 80, 80, 0.6)' }}>
                                                                                    {formatDateTime(item.note.createdAt)}
                                                                                </Typography>
                                                                            </Box>
                                                                        </Box>
                                                                    </Box>
                                                                );
                                                            },
                                                        )
                                                    ) : (
                                                        <Box
                                                            sx={{
                                                                border: '1px solid rgba(0, 0, 0, 0.06)',
                                                                borderRadius: '8px',
                                                                p: 2,
                                                                bgcolor: 'rgba(0, 0, 0, 0.02)',
                                                            }}
                                                        >
                                                            <Typography sx={{ fontSize: '13px', color: colors.text.primary, mb: 0.5, fontWeight: 600 }}>
                                                                No activity recorded yet
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontSize: '12px', color: 'rgba(80, 80, 80, 0.7)' }}>
                                                                Session history and session-linked notes will appear here.
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Collapse>
                                        </Box>
                                    </Box>
                                );
                            })
                        ) : (
                            <Card sx={{ borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: 'none' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography sx={{ fontSize: '14px', fontWeight: 600, color: colors.text.primary, mb: 0.75 }}>
                                        No engagements yet
                                    </Typography>
                                    <Typography sx={{ fontSize: '13px', color: 'rgba(80, 80, 80, 0.7)' }}>
                                        Packages and session history will appear here once work is scheduled for this client.
                                    </Typography>
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                </Box>

                <Box
                    sx={{
                        flex: {
                            xs: 1,
                            md: isClientEditOpen
                                ? '0 0 calc(38% - 16px)'
                                : '0 0 calc(32% - 16px)',
                        },
                        transition: 'flex-basis 220ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    <Box
                        sx={{
                            position: 'sticky',
                            top: 20,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 3,
                        }}
                    >
                        <Card
                            sx={{
                                borderRadius: '12px',
                                border: '1px solid rgba(0, 0, 0, 0.06)',
                                boxShadow: isClientEditOpen
                                    ? '0 12px 32px rgba(31, 28, 26, 0.08)'
                                    : undefined,
                            }}
                        >
                            <CardContent sx={{ p: isClientEditOpen ? 3.5 : 3 }}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        mb: 2.5,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                            <Box
                                                sx={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: '11px',
                                                    bgcolor: 'rgba(110, 91, 206, 0.12)',
                                                    color: colors.primary.main,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <PersonOutlineIcon sx={{ fontSize: 20 }} />
                                            </Box>
                                            <Typography sx={{ fontWeight: 600, fontSize: '14px', color: colors.text.primary }}>
                                                Client Information
                                            </Typography>
                                        </Box>

                                        {!isClientEditOpen ? (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                <Chip
                                                    label={getClientStatusLabel(client.status)}
                                                    size="small"
                                                    sx={{
                                                        height: 24,
                                                        fontWeight: 600,
                                                        bgcolor: getStatusColor(client.status).bg,
                                                        color: getStatusColor(client.status).text,
                                                        border: `1px solid ${getStatusColor(client.status).border}`,
                                                    }}
                                                />
                                                <Chip
                                                    icon={<CalendarTodayIcon sx={{ fontSize: '14px !important' }} />}
                                                    label={`Started ${formatDateOnly(client.startDate)}`}
                                                    size="small"
                                                    sx={{
                                                        height: 24,
                                                        bgcolor: 'rgba(255, 255, 255, 0.85)',
                                                        color: 'rgba(60, 60, 60, 0.82)',
                                                        border: '1px solid rgba(110, 91, 206, 0.12)',
                                                        '& .MuiChip-label': { px: 1 },
                                                        '& .MuiChip-icon': { color: 'rgba(110, 91, 206, 0.7)' },
                                                    }}
                                                />
                                            </Box>
                                        ) : null}
                                    </Box>
                                    {!isClientEditOpen ? (
                                        <IconButton
                                            size="small"
                                            onClick={handleOpenClientEdit}
                                            data-testid="client-edit-toggle"
                                            disabled={savingClient}
                                            sx={{ color: colors.primary.main }}
                                        >
                                            <EditIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    ) : null}
                                </Box>

                                <Collapse in={!isClientEditOpen} unmountOnExit>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
                                        <Box
                                            sx={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr',
                                                gap: 1.25,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 1.5,
                                                    p: 1.5,
                                                    borderRadius: '12px',
                                                    bgcolor: 'rgba(0, 0, 0, 0.015)',
                                                }}
                                            >
                                                <EmailIcon sx={{ fontSize: 18, color: 'rgba(110, 91, 206, 0.6)', mt: 0.25 }} />
                                                <Box>
                                                    <Typography sx={{ fontSize: '11px', color: 'rgba(80, 80, 80, 0.6)', mb: 0.25 }}>
                                                        Email
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '13px', color: colors.text.primary }}>
                                                        {client.email || 'Not provided'}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 1.5,
                                                    p: 1.5,
                                                    borderRadius: '12px',
                                                    bgcolor: 'rgba(0, 0, 0, 0.015)',
                                                }}
                                            >
                                                <PhoneIcon sx={{ fontSize: 18, color: 'rgba(110, 91, 206, 0.6)', mt: 0.25 }} />
                                                <Box>
                                                    <Typography sx={{ fontSize: '11px', color: 'rgba(80, 80, 80, 0.6)', mb: 0.25 }}>
                                                        Phone
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '13px', color: colors.text.primary }}>
                                                        {client.phone || 'Not provided'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Collapse>

                                <Collapse in={isClientEditOpen} unmountOnExit>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
                                        {clientError ? (
                                            <Alert severity="error">{clientError}</Alert>
                                        ) : null}

                                        <Box
                                            sx={{
                                                py: 0.5,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '1fr',
                                                    rowGap: 2.25,
                                                }}
                                            >
                                                <TextField
                                                    label="First Name"
                                                    fullWidth
                                                    value={clientDraft.firstName}
                                                    onChange={(event) =>
                                                        setClientDraft((current) => ({
                                                            ...current,
                                                            firstName: event.target.value,
                                                        }))
                                                    }
                                                    error={Boolean(clientFieldErrors.firstName)}
                                                    helperText={clientFieldErrors.firstName}
                                                    sx={{
                                                        '& .MuiInputLabel-root': {
                                                            fontSize: '15px',
                                                            fontWeight: 600,
                                                            color: 'rgba(44, 39, 36, 0.82)',
                                                        },
                                                        '& .MuiFormHelperText-root': { mt: 1, fontSize: '12px' },
                                                        '& .MuiOutlinedInput-root': {
                                                            fontSize: '16px',
                                                            borderRadius: '12px',
                                                            minHeight: 62,
                                                            bgcolor: '#FCFBFA',
                                                        },
                                                    }}
                                                />
                                                <TextField
                                                    label="Last Name"
                                                    fullWidth
                                                    value={clientDraft.lastName}
                                                    onChange={(event) =>
                                                        setClientDraft((current) => ({
                                                            ...current,
                                                            lastName: event.target.value,
                                                        }))
                                                    }
                                                    error={Boolean(clientFieldErrors.lastName)}
                                                    helperText={clientFieldErrors.lastName}
                                                    sx={{
                                                        '& .MuiInputLabel-root': {
                                                            fontSize: '15px',
                                                            fontWeight: 600,
                                                            color: 'rgba(44, 39, 36, 0.82)',
                                                        },
                                                        '& .MuiFormHelperText-root': { mt: 1, fontSize: '12px' },
                                                        '& .MuiOutlinedInput-root': {
                                                            fontSize: '16px',
                                                            borderRadius: '12px',
                                                            minHeight: 62,
                                                            bgcolor: '#FCFBFA',
                                                        },
                                                    }}
                                                />
                                                <TextField
                                                    select
                                                    label="Status"
                                                    fullWidth
                                                    value={clientDraft.status}
                                                    onChange={(event) =>
                                                        setClientDraft((current) => ({
                                                            ...current,
                                                            status: event.target.value as ClientDto['status'],
                                                        }))
                                                    }
                                                    sx={{
                                                        '& .MuiInputLabel-root': {
                                                            fontSize: '15px',
                                                            fontWeight: 600,
                                                            color: 'rgba(44, 39, 36, 0.82)',
                                                        },
                                                        '& .MuiOutlinedInput-root': {
                                                            fontSize: '16px',
                                                            borderRadius: '12px',
                                                            minHeight: 62,
                                                            bgcolor: '#FCFBFA',
                                                        },
                                                    }}
                                                >
                                                    <MenuItem value="active">Active</MenuItem>
                                                    <MenuItem value="paused">Paused</MenuItem>
                                                    <MenuItem value="completed">Completed</MenuItem>
                                                </TextField>
                                                <TextField
                                                    label="Start Date"
                                                    type="date"
                                                    fullWidth
                                                    InputLabelProps={{ shrink: true }}
                                                    value={clientDraft.startDate}
                                                    onChange={(event) =>
                                                        setClientDraft((current) => ({
                                                            ...current,
                                                            startDate: event.target.value,
                                                        }))
                                                    }
                                                    error={Boolean(clientFieldErrors.startDate)}
                                                    helperText={clientFieldErrors.startDate}
                                                    sx={{
                                                        '& .MuiInputLabel-root': {
                                                            fontSize: '15px',
                                                            fontWeight: 600,
                                                            color: 'rgba(44, 39, 36, 0.82)',
                                                        },
                                                        '& .MuiFormHelperText-root': { mt: 1, fontSize: '12px' },
                                                        '& .MuiOutlinedInput-root': {
                                                            fontSize: '16px',
                                                            borderRadius: '12px',
                                                            minHeight: 62,
                                                            bgcolor: '#FCFBFA',
                                                        },
                                                    }}
                                                />
                                                <TextField
                                                    label="Email"
                                                    type="email"
                                                    fullWidth
                                                    value={clientDraft.email}
                                                    onChange={(event) =>
                                                        setClientDraft((current) => ({
                                                            ...current,
                                                            email: event.target.value,
                                                        }))
                                                    }
                                                    error={Boolean(clientFieldErrors.email)}
                                                    helperText={clientFieldErrors.email}
                                                    sx={{
                                                        '& .MuiInputLabel-root': {
                                                            fontSize: '15px',
                                                            fontWeight: 600,
                                                            color: 'rgba(44, 39, 36, 0.82)',
                                                        },
                                                        '& .MuiFormHelperText-root': { mt: 1, fontSize: '12px' },
                                                        '& .MuiOutlinedInput-root': {
                                                            fontSize: '16px',
                                                            borderRadius: '12px',
                                                            minHeight: 62,
                                                            bgcolor: '#FCFBFA',
                                                        },
                                                    }}
                                                />
                                                <TextField
                                                    label="Phone"
                                                    fullWidth
                                                    value={clientDraft.phone}
                                                    onChange={(event) =>
                                                        setClientDraft((current) => ({
                                                            ...current,
                                                            phone: event.target.value,
                                                        }))
                                                    }
                                                    sx={{
                                                        '& .MuiInputLabel-root': {
                                                            fontSize: '15px',
                                                            fontWeight: 600,
                                                            color: 'rgba(44, 39, 36, 0.82)',
                                                        },
                                                        '& .MuiOutlinedInput-root': {
                                                            fontSize: '16px',
                                                            borderRadius: '12px',
                                                            minHeight: 62,
                                                            bgcolor: '#FCFBFA',
                                                        },
                                                    }}
                                                />
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 1.5, pt: 0.25 }}>
                                            <Button
                                                variant="contained"
                                                startIcon={<SaveIcon sx={{ fontSize: 16 }} />}
                                                onClick={handleSaveClientEdit}
                                                disabled={savingClient}
                                                sx={{
                                                    flex: 1,
                                                    textTransform: 'none',
                                                    fontSize: '15px',
                                                    fontWeight: 700,
                                                    borderRadius: '12px',
                                                    py: 1.35,
                                                    boxShadow: 'none',
                                                }}
                                            >
                                                Save changes
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                onClick={handleCancelClientEdit}
                                                disabled={savingClient}
                                                sx={{
                                                    flex: 1,
                                                    textTransform: 'none',
                                                    fontSize: '15px',
                                                    fontWeight: 600,
                                                    borderRadius: '12px',
                                                    py: 1.35,
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </Box>
                                    </Box>
                                </Collapse>
                            </CardContent>
                        </Card>

                        <Card sx={{ borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: '14px', color: colors.text.primary }}>
                                        Client Notes
                                    </Typography>
                                    <Button
                                        size="small"
                                        startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                                        onClick={isNoteComposerOpen ? handleCloseNoteComposer : handleOpenNoteComposer}
                                        disabled={savingNote}
                                        sx={{
                                            textTransform: 'none',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: colors.primary.main,
                                            minWidth: 0,
                                            px: 1.5,
                                        }}
                                    >
                                        {isNoteComposerOpen ? 'Cancel' : 'Add'}
                                    </Button>
                                </Box>

                                <Collapse in={isNoteComposerOpen} unmountOnExit>
                                    <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(110, 91, 206, 0.02)', borderRadius: '8px' }}>
                                        {noteError ? (
                                            <Alert severity="error" sx={{ mb: 1.5 }}>
                                                {noteError}
                                            </Alert>
                                        ) : null}

                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={3}
                                            placeholder="Add a note..."
                                            value={noteDraft}
                                            onChange={(event) => setNoteDraft(event.target.value)}
                                            sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                                        />

                                        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                                            <FormControl size="small" fullWidth>
                                                <Select
                                                    value={noteType}
                                                    onChange={(event) => setNoteType(event.target.value as NoteType)}
                                                    sx={{ fontSize: '12px' }}
                                                >
                                                    <MenuItem value="general">General</MenuItem>
                                                    <MenuItem value="internal">Internal</MenuItem>
                                                    <MenuItem value="admin">Admin</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                onClick={handleAddClientNote}
                                                disabled={savingNote || !noteDraft.trim()}
                                                sx={{ textTransform: 'none', fontSize: '12px', bgcolor: colors.primary.main }}
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                onClick={handleCloseNoteComposer}
                                                disabled={savingNote}
                                                sx={{ textTransform: 'none', fontSize: '12px' }}
                                            >
                                                Cancel
                                            </Button>
                                        </Box>
                                    </Box>
                                </Collapse>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {(detailView?.clientNotes ?? []).length > 0 ? (
                                        detailView!.clientNotes.map((note) => {
                                            const normalizedType = normalizeNoteType(note.type);
                                            const tagColors = getTagColor(normalizedType);

                                            return (
                                                <Box
                                                    key={note.id}
                                                    sx={{
                                                        p: 1.5,
                                                        bgcolor: 'rgba(0, 0, 0, 0.02)',
                                                        borderRadius: '8px',
                                                        border: '1px solid rgba(0, 0, 0, 0.04)',
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75, gap: 1 }}>
                                                        <Chip
                                                            label={getNoteTypeLabel(normalizedType)}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: tagColors.bg,
                                                                color: tagColors.text,
                                                                fontWeight: 600,
                                                                fontSize: '10px',
                                                                height: '20px',
                                                            }}
                                                        />
                                                        <Typography variant="caption" sx={{ fontSize: '10px', color: 'rgba(80, 80, 80, 0.5)', textAlign: 'right' }}>
                                                            {formatDateTime(note.updatedAt ?? note.createdAt)}
                                                        </Typography>
                                                    </Box>
                                                    <Typography sx={{ fontSize: '13px', color: colors.text.primary, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                                        {note.content}
                                                    </Typography>
                                                </Box>
                                            );
                                        })
                                    ) : (
                                        <Box sx={{ p: 1.75, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
                                            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: colors.text.primary, mb: 0.5 }}>
                                                No client notes yet
                                            </Typography>
                                            <Typography sx={{ fontSize: '12px', color: 'rgba(80, 80, 80, 0.7)' }}>
                                                Add a note to capture context, follow-ups, or internal reminders without leaving the page.
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </Box>

            <SessionDetailsDrawer
                open={Boolean(selectedSessionId)}
                onClose={handleCloseSessionDetails}
                sessions={sessions}
                sessionId={selectedSessionId}
                onSaved={loadData}
                surfaceVariant="client-detail"
            />

            <SessionEntryModal
                open={isNewSessionModalOpen}
                onClose={handleCloseSessionModal}
                preselectedClientId={client.id}
                onCreated={async () => {
                    await loadData();
                }}
            />
        </Box>
    );
}
