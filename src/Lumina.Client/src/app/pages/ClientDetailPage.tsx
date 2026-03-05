import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import { format } from 'date-fns';
import { NewSessionModal } from '../components/NewSessionModal';
import { SessionDetailsDrawer } from '../components/SessionDetailsDrawer';
import { apiClient } from '../api/client';
import type { ClientDto, SessionDto } from '../api/types';

type GroupedEngagement = {
  id: string;
  title: string;
  sessions: SessionDto[];
  totalSessions: number;
  sessionsUsed: number;
  price?: string;
  dateRange?: string;
};

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

export function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [client, setClient] = useState<ClientDto | null>(null);
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const sessionsSectionRef = useRef<HTMLDivElement | null>(null);

  const loadData = async () => {
    if (!id) return;
    const [clientData, sessionData] = await Promise.all([apiClient.getClient(id), apiClient.getClientSessions(id)]);
    setClient(clientData);
    setSessions(sessionData);
  };

  useEffect(() => {
    loadData().catch(() => {
      setClient(null);
      setSessions([]);
    });
  }, [id]);

  const upcomingSession = useMemo(
    () => [...sessions].filter((session) => session.status === 'upcoming').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null,
    [sessions],
  );

  const groupedEngagements = useMemo<GroupedEngagement[]>(() => {
    const groups = new Map<string, GroupedEngagement>();

    for (const session of sessions) {
      const packageId = (session as SessionDto & { packageId?: string | number; clientPackageId?: string | number }).packageId
        ?? (session as SessionDto & { packageId?: string | number; clientPackageId?: string | number }).clientPackageId;
      const key = packageId ? String(packageId) : 'single-sessions';
      const defaultTitle = packageId ? `${client?.program ?? 'Engagement'} Program` : 'Single Sessions';
      const packageTitle = (session as SessionDto & { packageName?: string; engagementName?: string }).packageName
        ?? (session as SessionDto & { packageName?: string; engagementName?: string }).engagementName
        ?? defaultTitle;

      if (!groups.has(key)) {
        groups.set(key, {
          id: key,
          title: packageTitle,
          sessions: [],
          totalSessions: packageId ? 0 : client?.totalSessions ?? 0,
          sessionsUsed: 0,
          price: (session as SessionDto & { packagePrice?: string }).packagePrice,
          dateRange: undefined,
        });
      }

      const group = groups.get(key)!;
      group.sessions.push(session);
      group.sessionsUsed += session.status === 'completed' ? 1 : 0;
    }

    for (const group of groups.values()) {
      const timestamps = group.sessions.map((s) => new Date(s.date).getTime());
      if (timestamps.length > 0) {
        const min = new Date(Math.min(...timestamps));
        const max = new Date(Math.max(...timestamps));
        group.dateRange = `${format(min, 'MMM d, yyyy')} - ${format(max, 'MMM d, yyyy')}`;
      }
      if (!group.totalSessions) group.totalSessions = group.sessions.length;
      group.sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return [...groups.values()];
  }, [sessions, client?.program, client?.totalSessions]);

  useEffect(() => {
    if (searchParams.get('focus') === 'sessions' && sessionsSectionRef.current) {
      sessionsSectionRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [searchParams, groupedEngagements.length]);

  useEffect(() => {
    const sessionIdParam = searchParams.get('sessionId');

    if (!sessionIdParam) {
      setSelectedSessionId(null);
      return;
    }

    setSelectedSessionId(sessionIdParam);
  }, [searchParams]);

  const handleOpenSessionDetails = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('sessionId', sessionId);
      return next;
    });
  };

  const handleCloseSessionDetails = () => {
    setSelectedSessionId(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('sessionId');
      return next;
    });
  };

  if (!id) return <Typography>Client not found.</Typography>;
  if (!client) return <Typography>Loading client...</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/clients')} sx={{ textTransform: 'none', mb: 2 }}>
        Back to Clients
      </Button>

      <Card variant="outlined" sx={{ mb: 2.5 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Avatar sx={{ bgcolor: client.avatarColor }}>{client.initials}</Avatar>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h5">{client.name}</Typography>
                  <Chip label={client.status} size="small" />
                </Stack>
                <Typography variant="body2" color="text.secondary">Client since {format(new Date(client.startDate), 'MMMM d, yyyy')}</Typography>
              </Box>
            </Stack>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsNewSessionModalOpen(true)}>New Session</Button>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} alignItems={{ sm: 'center' }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Next Step</Typography>
              {upcomingSession ? (
                <>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>{upcomingSession.sessionType}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(upcomingSession.date), 'MMM d, yyyy • h:mm a')} • {locationLabelMap[upcomingSession.location] ?? upcomingSession.location}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>No upcoming sessions scheduled</Typography>
              )}
            </Box>
            {upcomingSession ? (
              <Button onClick={() => handleOpenSessionDetails(upcomingSession.id)}>Open</Button>
            ) : (
              <Button onClick={() => setIsNewSessionModalOpen(true)}>Schedule Session</Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3, alignItems: 'start' }}>
        <Box ref={sessionsSectionRef}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>Engagements</Typography>
          <Stack spacing={1.5}>
            {groupedEngagements.map((engagement) => {
              const progressPercent = engagement.totalSessions > 0
                ? Math.round((engagement.sessionsUsed / engagement.totalSessions) * 100)
                : 0;

              return (
                <Accordion key={engagement.id} defaultExpanded disableGutters>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ width: '100%' }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                        <Typography variant="subtitle1">{engagement.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{engagement.price ?? 'Price unavailable'}</Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">{engagement.dateRange ?? 'Date range unavailable'}</Typography>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">{engagement.sessionsUsed}/{engagement.totalSessions} sessions used</Typography>
                        <LinearProgress variant="determinate" value={progressPercent} sx={{ mt: 0.5 }} />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List disablePadding>
                      {engagement.sessions.map((session) => (
                        <ListItemButton key={session.id} onClick={() => handleOpenSessionDetails(session.id)}>
                          <ListItemText
                            primary={session.sessionType}
                            secondary={`${format(new Date(session.date), 'MMM d, yyyy • h:mm a')} • ${session.duration} min • ${locationLabelMap[session.location] ?? session.location}`}
                          />
                          <Chip label={statusLabelMap[session.status] ?? session.status} size="small" />
                        </ListItemButton>
                      ))}
                      {engagement.sessions.length === 0 && <Typography variant="body2">No sessions yet.</Typography>}
                    </List>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Stack>
        </Box>

        <Stack spacing={2}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="h6">Contact Information</Typography>
                <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
              </Stack>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2">{client.email}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2">{client.phone}</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
                <Typography variant="h6">Client Notes</Typography>
                <Button size="small">Add Note</Button>
              </Stack>
              <Stack spacing={1}>
                {(client.notes?.split('\n').filter(Boolean) ?? []).length > 0 ? (
                  client.notes!.split('\n').filter(Boolean).map((note, index) => (
                    <Typography key={`note-${index}`} variant="body2" color="text.secondary">• {note}</Typography>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">No notes yet.</Typography>
                )}
              </Stack>
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
