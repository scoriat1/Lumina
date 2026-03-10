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
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import NotesIcon from '@mui/icons-material/Notes';
import { format } from 'date-fns';
import { NewSessionModal } from '../components/NewSessionModal';
import { SessionDetailsDrawer } from '../components/SessionDetailsDrawer';
import { apiClient } from '../api/client';
import type { ClientDetailViewDto, ClientDto, SessionDto } from '../api/types';

type NoteType = 'general' | 'admin' | 'internal';

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
  const [detailView, setDetailView] = useState<ClientDetailViewDto | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('general');
  const [savingNote, setSavingNote] = useState(false);
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

  const upcomingSession = useMemo(
    () => detailView?.nextStep ?? [...sessions].filter((session) => session.status === 'upcoming').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null,
    [sessions, detailView?.nextStep],
  );

  useEffect(() => {
    if (searchParams.get('focus') === 'sessions' && sessionsSectionRef.current) {
      sessionsSectionRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [searchParams, detailView?.engagements.length]);

  useEffect(() => {
    const sessionIdParam = searchParams.get('sessionId');

    if (!sessionIdParam || !sessions.some((session) => session.id === sessionIdParam)) {
      setSelectedSessionId(null);
      return;
    }

    setSelectedSessionId(sessionIdParam);
  }, [searchParams, sessions]);

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
    }, { replace: true });
  };

  const handleAddClientNote = async () => {
    if (!id || !noteDraft.trim()) return;
    setSavingNote(true);
    try {
      await apiClient.createClientNote(id, { content: noteDraft.trim(), type: noteType, source: 'client-detail' });
      setNoteDraft('');
      await loadData();
    } finally {
      setSavingNote(false);
    }
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
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
            <Box>
              <Typography variant="h4">{client.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Client since {format(new Date(client.startDate), 'MMMM d, yyyy')} • {detailView?.engagements.length ?? 0} engagements
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsNewSessionModalOpen(true)}>
              New Session
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="overline" color="text.secondary">Next Step</Typography>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              {upcomingSession ? (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{upcomingSession.sessionType}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(upcomingSession.date), 'MMM d, yyyy • h:mm a')} • {locationLabelMap[upcomingSession.location] ?? upcomingSession.location}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>No upcoming sessions scheduled</Typography>
              )}
            </Box>
            {upcomingSession ? (
              <Button onClick={() => handleOpenSessionDetails(upcomingSession.sessionId ?? upcomingSession.id)}>Open</Button>
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
            {(detailView?.engagements ?? []).map((engagement) => {
              const progressPercent = engagement.totalSessions > 0
                ? Math.round((engagement.usedSessions / engagement.totalSessions) * 100)
                : 0;

              return (
                <Accordion key={engagement.id} defaultExpanded disableGutters>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ width: '100%' }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                        <Typography variant="subtitle1">{engagement.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{engagement.price ? `$${engagement.price.toLocaleString()}` : ''}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {engagement.startDate && <Typography variant="caption" color="text.secondary">{format(new Date(engagement.startDate), 'MMM d, yyyy')}</Typography>}
                        {engagement.endDate && <Typography variant="caption" color="text.secondary">- {format(new Date(engagement.endDate), 'MMM d, yyyy')}</Typography>}
                        <Chip size="small" label={engagement.status} />
                      </Stack>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">{engagement.usedSessions}/{engagement.totalSessions} sessions used</Typography>
                        <LinearProgress variant="determinate" value={progressPercent} sx={{ mt: 0.5 }} />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List disablePadding>
                      {[...(engagement.sessions ?? []), ...(detailView?.timeline.filter((entry) => entry.entryType === 'note' && entry.sessionId === undefined) ?? [])]
                        .slice(0, 20)
                        .map((entry) => {
                          if ('sessionType' in entry) {
                            const session = entry as SessionDto;
                            return (
                              <ListItemButton key={session.id} onClick={() => handleOpenSessionDetails(session.id)}>
                                <ListItemText
                                  primary={session.sessionType}
                                  secondary={`${format(new Date(session.date), 'MMM d, yyyy • h:mm a')} • ${session.duration} min • ${locationLabelMap[session.location] ?? session.location}`}
                                />
                                <Chip label={statusLabelMap[session.status] ?? session.status} size="small" />
                              </ListItemButton>
                            );
                          }

                          return (
                            <ListItemButton key={entry.id} disabled>
                              <NotesIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                              <ListItemText
                                primary={entry.content}
                                secondary={format(new Date(entry.createdAt), 'MMM d, yyyy')}
                              />
                            </ListItemButton>
                          );
                        })}
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
                <IconButton size="small" disabled>
                  <EditIcon fontSize="small" />
                </IconButton>
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
              </Stack>

              <Stack spacing={1} sx={{ mb: 1.5 }}>
                {(detailView?.clientNotes ?? []).length > 0 ? (
                  detailView!.clientNotes.map((note) => (
                    <Box key={note.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.25 }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Chip size="small" label={note.type} />
                        <Typography variant="caption" color="text.secondary">{format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}</Typography>
                      </Stack>
                      <Typography variant="body2">{note.content}</Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">No notes yet.</Typography>
                )}
              </Stack>

              <TextField
                size="small"
                select
                fullWidth
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as NoteType)}
                sx={{ mb: 1 }}
>
                <MenuItem value="general">General</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="internal">Internal</MenuItem>
              </TextField>
              <TextField
                multiline
                minRows={2}
                fullWidth
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Add a note"
                sx={{ mb: 1 }}
              />
              <Button size="small" onClick={handleAddClientNote} disabled={savingNote || !noteDraft.trim()}>Add Note</Button>
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
