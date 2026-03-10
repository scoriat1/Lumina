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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
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
import EventIcon from '@mui/icons-material/Event';
import PlaceIcon from '@mui/icons-material/Place';
import PaidIcon from '@mui/icons-material/Paid';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
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

const clientStatusMap: Record<ClientDto['status'], string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
};

const statusChipColorMap: Record<ClientDto['status'], 'success' | 'warning' | 'default'> = {
  active: 'success',
  paused: 'warning',
  completed: 'default',
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
  const [noteError, setNoteError] = useState<string | null>(null);
  const [isContactEditOpen, setIsContactEditOpen] = useState(false);
  const [contactDraft, setContactDraft] = useState({ email: '', phone: '' });
  const [savingContact, setSavingContact] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
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
    setNoteError(null);
    try {
      await apiClient.createClientNote(id, { content: noteDraft.trim(), type: noteType, source: 'client-detail' });
      setNoteDraft('');
      await loadData();
    } catch {
      setNoteError('Unable to save note. Please try again.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleOpenContactEdit = () => {
    if (!client) return;
    setContactDraft({ email: client.email ?? '', phone: client.phone ?? '' });
    setContactError(null);
    setIsContactEditOpen(true);
  };

  const handleCancelContactEdit = () => {
    setIsContactEditOpen(false);
    setContactError(null);
    if (client) {
      setContactDraft({ email: client.email ?? '', phone: client.phone ?? '' });
    }
  };

  const handleSaveContactEdit = async () => {
    if (!id || !client) return;
    setSavingContact(true);
    setContactError(null);

    try {
      await apiClient.updateClient(id, {
        name: client.name,
        program: client.program,
        startDate: client.startDate,
        status: client.status,
        notes: client.notes?.trim() ? client.notes : null,
        email: contactDraft.email.trim(),
        phone: contactDraft.phone.trim(),
      });
      setIsContactEditOpen(false);
      await loadData();
    } catch {
      setContactError('Unable to save contact information. Please try again.');
    } finally {
      setSavingContact(false);
    }
  };

  if (!id) return <Typography>Client not found.</Typography>;
  if (!client) return <Typography>Loading client...</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/clients')} sx={{ textTransform: 'none', mb: 2 }}>
        Back to Clients
      </Button>

      <Card variant="outlined" sx={{ mb: 2.5, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2.5}>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{client.name}</Typography>
                <Chip
                  size="small"
                  color={statusChipColorMap[client.status]}
                  label={clientStatusMap[client.status] ?? client.status}
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.75, sm: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Client since {format(new Date(client.startDate), 'MMMM d, yyyy')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {detailView?.engagements.length ?? 0} engagements
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {client.totalSessions > 0 ? `${client.sessionsCompleted}/${client.totalSessions} sessions completed` : 'No session package assigned'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Lifetime value {sessions.some((session) => session.packagePrice) ? sessions.find((session) => session.packagePrice)?.packagePrice : 'N/A'}
                </Typography>
              </Stack>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsNewSessionModalOpen(true)}>
              New Session
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1, fontWeight: 700 }}>Next Step</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
            <Box sx={{ pt: 0.5 }}>
              {upcomingSession ? (
                <>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{upcomingSession.sessionType}</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 1.5 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <EventIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">{format(new Date(upcomingSession.date), 'MMM d, yyyy • h:mm a')}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <PlaceIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">{locationLabelMap[upcomingSession.location] ?? upcomingSession.location}</Typography>
                    </Stack>
                  </Stack>
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
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>Engagements</Typography>
          <Stack spacing={1.75}>
            {(detailView?.engagements ?? []).map((engagement) => {
              const progressPercent = engagement.totalSessions > 0
                ? Math.round((engagement.usedSessions / engagement.totalSessions) * 100)
                : 0;

              return (
                <Accordion key={engagement.id} defaultExpanded disableGutters sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, '&:before': { display: 'none' }, overflow: 'hidden' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2, py: 1 }}>
                    <Box sx={{ width: '100%' }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} alignItems={{ sm: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{engagement.name}</Typography>
                        {engagement.price ? (
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <PaidIcon sx={{ color: 'success.main', fontSize: 16 }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{`$${engagement.price.toLocaleString()}`}</Typography>
                          </Stack>
                        ) : null}
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25, mb: 1 }}>
                        {(engagement.startDate || engagement.endDate) && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {engagement.startDate ? format(new Date(engagement.startDate), 'MMM d, yyyy') : 'Unknown'}
                            {' — '}
                            {engagement.endDate ? format(new Date(engagement.endDate), 'MMM d, yyyy') : 'Ongoing'}
                          </Typography>
                        )}
                        <Chip size="small" label={engagement.status} sx={{ textTransform: 'capitalize' }} />
                      </Stack>
                      <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">{engagement.usedSessions}/{engagement.totalSessions} sessions used</Typography>
                          <Typography variant="caption" color="text.secondary">{progressPercent}%</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 7, borderRadius: 3 }} />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 2, pt: 0.5, pb: 1.5 }}>
                    <List disablePadding>
                      {[...(engagement.sessions ?? []), ...(detailView?.timeline.filter((entry) => entry.entryType === 'note' && entry.sessionId === undefined) ?? [])]
                        .slice(0, 20)
                        .map((entry) => {
                          if ('sessionType' in entry) {
                            const session = entry as SessionDto;
                            return (
                              <ListItemButton key={session.id} onClick={() => handleOpenSessionDetails(session.id)} sx={{ borderRadius: 1.5, mb: 0.5, alignItems: 'flex-start' }}>
                                <Box sx={{ width: 6, borderRadius: 3, bgcolor: 'primary.light', alignSelf: 'stretch', mr: 1.25 }} />
                                <ListItemText
                                  primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{session.sessionType}</Typography>}
                                  secondary={`${format(new Date(session.date), 'MMM d, yyyy • h:mm a')} • ${session.duration} min • ${locationLabelMap[session.location] ?? session.location}`}
                                />
                                <Chip label={statusLabelMap[session.status] ?? session.status} size="small" sx={{ mt: 0.5 }} />
                              </ListItemButton>
                            );
                          }

                          return (
                            <Box key={entry.id} sx={{ borderRadius: 1.5, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'divider', px: 1.25, py: 1, mb: 0.75 }}>
                              <Stack direction="row" spacing={1} alignItems="flex-start">
                                <NotesIcon sx={{ color: 'text.secondary', mt: 0.2 }} fontSize="small" />
                                <Box>
                                  <Typography variant="body2" sx={{ mb: 0.25 }}>{entry.content}</Typography>
                                  <Typography variant="caption" color="text.secondary">{format(new Date(entry.createdAt), 'MMM d, yyyy • h:mm a')}</Typography>
                                </Box>
                              </Stack>
                            </Box>
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
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Contact Information</Typography>
                <IconButton size="small" onClick={handleOpenContactEdit}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, px: 1.25, py: 0.9 }}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2">{client.email}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, px: 1.25, py: 0.9 }}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2">{client.phone}</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Client Notes</Typography>
              </Stack>

              <Stack spacing={1} sx={{ mb: 1.5 }}>
                {(detailView?.clientNotes ?? []).length > 0 ? (
                  detailView!.clientNotes.map((note) => (
                    <Box key={note.id} sx={{ border: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50', borderRadius: 2, p: 1.25 }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Chip size="small" label={note.type} sx={{ textTransform: 'capitalize' }} />
                        <Typography variant="caption" color="text.secondary">{format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}</Typography>
                      </Stack>
                      <Typography variant="body2">{note.content}</Typography>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2, px: 2, py: 2.5 }}>
                    <CheckCircleOutlineIcon color="action" sx={{ mb: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">No notes yet. Add one below.</Typography>
                  </Box>
                )}
              </Stack>

              {noteError ? (
                <Alert severity="error" sx={{ mb: 1 }}>
                  {noteError}
                </Alert>
              ) : null}

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

      <Dialog open={isContactEditOpen} onClose={savingContact ? undefined : handleCancelContactEdit} fullWidth maxWidth="xs">
        <DialogTitle>Edit Contact Information</DialogTitle>
        <DialogContent>
          <Stack spacing={1.25} sx={{ pt: 0.5 }}>
            {contactError ? <Alert severity="error">{contactError}</Alert> : null}
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={contactDraft.email}
              onChange={(e) => setContactDraft((prev) => ({ ...prev, email: e.target.value }))}
            />
            <TextField
              label="Phone"
              fullWidth
              value={contactDraft.phone}
              onChange={(e) => setContactDraft((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelContactEdit} disabled={savingContact}>Cancel</Button>
          <Button
            onClick={handleSaveContactEdit}
            variant="contained"
            disabled={savingContact || !contactDraft.email.trim() || !contactDraft.phone.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

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
