import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Drawer,
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
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NotesIcon from '@mui/icons-material/Notes';
import PhoneIcon from '@mui/icons-material/Phone';
import { format } from 'date-fns';
import { NewSessionModal } from '../components/NewSessionModal';
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
  const [searchParams] = useSearchParams();
  const [client, setClient] = useState<ClientDto | null>(null);
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionDto | null>(null);
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

  const nextSessionLabel = useMemo(() => {
    if (!client?.nextSession) return 'No upcoming session';
    return format(new Date(client.nextSession), 'MMM d, yyyy • h:mm a');
  }, [client?.nextSession]);

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
      if (!group.totalSessions) {
        group.totalSessions = group.sessions.length;
      }
      group.sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return [...groups.values()];
  }, [sessions, client?.program, client?.totalSessions]);

  useEffect(() => {
    if (searchParams.get('focus') === 'sessions' && sessionsSectionRef.current) {
      sessionsSectionRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [searchParams, groupedEngagements.length]);

  if (!id) return <Typography>Client not found.</Typography>;
  if (!client) return <Typography>Loading client...</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/clients')} sx={{ textTransform: 'none', mb: 3 }}>
        Back to Clients
      </Button>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3, alignItems: 'start' }}>
        <Stack spacing={3}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
                <Box>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography variant="h5">{client.name}</Typography>
                    <Chip label={client.status} size="small" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Client since {format(new Date(client.startDate), 'MMMM d, yyyy')}
                  </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsNewSessionModalOpen(true)}>
                  New Session
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.75 }}>
                Next Step
              </Typography>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                Next session scheduled
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {nextSessionLabel}
              </Typography>
            </CardContent>
          </Card>

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
                          <Typography variant="body2" color="text.secondary">
                            {engagement.price ?? 'Price unavailable'}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {engagement.dateRange ?? 'Date range unavailable'}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {engagement.sessionsUsed}/{engagement.totalSessions} sessions used
                          </Typography>
                          <LinearProgress variant="determinate" value={progressPercent} sx={{ mt: 0.5 }} />
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List disablePadding>
                        {engagement.sessions.map((session) => (
                          <ListItemButton key={session.id} onClick={() => setSelectedSession(session)}>
                            <ListItemText
                              primary={session.sessionType}
                              secondary={format(new Date(session.date), 'MMM d, yyyy • h:mm a')}
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
        </Stack>

        <Stack spacing={2}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Contact Information</Typography>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2">{client.email}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2">{client.phone}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarTodayIcon fontSize="small" color="action" />
                  <Typography variant="body2">{format(new Date(client.startDate), 'MMM d, yyyy')}</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="h6">Client Notes</Typography>
                <Button size="small">Add Note</Button>
              </Stack>
              <Stack spacing={1}>
                {client.notes ? (
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <NotesIcon fontSize="small" color="action" sx={{ mt: 0.3 }} />
                    <Typography variant="body2" color="text.secondary">{client.notes}</Typography>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">No notes yet.</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      <Drawer
        anchor="right"
        open={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}
      >
        {selectedSession && (
          <Box sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Session Details</Typography>
              <IconButton onClick={() => setSelectedSession(null)} aria-label="close">
                <CloseIcon />
              </IconButton>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1.5}>
              <Typography variant="subtitle1">{selectedSession.sessionType}</Typography>
              <Typography variant="body2" color="text.secondary">
                {format(new Date(selectedSession.date), 'MMM d, yyyy • h:mm a')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Duration: {selectedSession.duration} min
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Location: {locationLabelMap[selectedSession.location] ?? selectedSession.location}
              </Typography>
              <Chip label={statusLabelMap[selectedSession.status] ?? selectedSession.status} size="small" sx={{ width: 'fit-content' }} />
              <Box>
                <Typography variant="subtitle2">Notes</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {selectedSession.notes || 'No notes available.'}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
              <Button variant="contained" onClick={() => navigate('/sessions')}>
                Open Session
              </Button>
              <Button variant="outlined" onClick={() => setSelectedSession(null)}>
                Close
              </Button>
            </Stack>
          </Box>
        )}
      </Drawer>

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
