import { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import { format } from 'date-fns';
import { useNavigate } from 'react-router';
import { apiClient } from '../api/client';
import type { SessionDto } from '../api/types';
import { useNotesTemplate } from '../contexts/NotesTemplateContext';

type SessionLike = Omit<SessionDto, 'date'> & { date: string | Date };

interface SessionDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  sessionId: string | null;
  sessions: SessionLike[];
  onUpdateSession?: (sessionId: string, updates: Partial<SessionLike>) => void;
  onSaved?: () => Promise<void> | void;
}

const locationLabelMap: Record<string, string> = { zoom: 'Zoom', phone: 'Phone', office: 'Office' };

export function SessionDetailsDrawer({ open, onClose, sessionId, sessions, onUpdateSession, onSaved }: SessionDetailsDrawerProps) {
  const navigate = useNavigate();
  const { selectedTemplate, getActiveTemplate } = useNotesTemplate();
  const [sessionDetail, setSessionDetail] = useState<SessionDto | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<string[]>([]);
  const [noteMode, setNoteMode] = useState<'free' | 'template' | 'missing'>('free');
  const [saving, setSaving] = useState(false);
  const [savedVisible, setSavedVisible] = useState(false);

  const selectedTemplateLabel = useMemo(() => {
    const template = getActiveTemplate();
    return template ? `${template.name} Template` : null;
  }, [getActiveTemplate, selectedTemplate]);

  useEffect(() => {
    if (!open || !sessionId) return;

    apiClient.getSession(sessionId)
      .then((detail) => {
        setSessionDetail(detail);
        const notes = detail.notes?.split('\n\n').filter(Boolean) ?? [];
        setNoteDrafts(notes.length ? notes : ['']);
      })
      .catch(() => {
        setSessionDetail(null);
        setNoteDrafts(['']);
      });
  }, [open, sessionId]);

  const previousSession = useMemo(() => {
    if (!sessionDetail) return null;
    const currentDate = new Date(sessionDetail.date).getTime();
    return [...sessions]
      .filter((s) => s.clientId === sessionDetail.clientId && s.id !== sessionDetail.id)
      .map((s) => ({ ...s, date: new Date(s.date) }))
      .filter((s) => s.date.getTime() < currentDate)
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0] ?? null;
  }, [sessions, sessionDetail]);

  if (!sessionDetail) return null;

  const handleNoteChange = (index: number, value: string) => {
    setNoteDrafts((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const handleAddNote = () => {
    setNoteDrafts((prev) => [...prev, '']);
  };

  const handleSaveNotes = async () => {
    if (!sessionId) return;
    setSaving(true);
    const cleanedNotes = noteDrafts.map((note) => note.trim()).filter(Boolean);
    const joined = cleanedNotes.join('\n\n');

    try {
      await apiClient.updateSession(sessionId, { notes: joined });
      const refreshed = await apiClient.getSession(sessionId);
      setSessionDetail(refreshed);
      setNoteDrafts(cleanedNotes.length ? cleanedNotes : ['']);
      onUpdateSession?.(sessionId, { notes: joined });
      await onSaved?.();
      setSavedVisible(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer data-testid="session-details-drawer" anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 460 } } }}>
      <Box sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Avatar sx={{ bgcolor: sessionDetail.avatarColor }}>{sessionDetail.initials}</Avatar>
            <Box>
              <Typography variant="subtitle1">{sessionDetail.client}</Typography>
              <Typography variant="body2" color="text.secondary">{sessionDetail.sessionType}</Typography>
            </Box>
          </Stack>
          <IconButton data-testid="session-details-drawer-close" onClick={onClose}><CloseIcon /></IconButton>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ overflow: 'auto', flex: 1 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Session Notes</Typography>
              <Select
                size="small"
                fullWidth
                value={noteMode}
                onChange={(e) => setNoteMode(e.target.value as 'free' | 'template' | 'missing')}
                sx={{ mb: 1.25 }}
              >
                <MenuItem value="free">Free Notes</MenuItem>
                {selectedTemplateLabel ? (
                  <MenuItem value="template">{selectedTemplateLabel}</MenuItem>
                ) : (
                  <MenuItem value="missing" disabled>Choose Template from Settings</MenuItem>
                )}
              </Select>

              <Stack spacing={1}>
                {noteDrafts.map((note, index) => (
                  <TextField
                    key={`note-${index}`}
                    multiline
                    minRows={3}
                    value={note}
                    onChange={(e) => handleNoteChange(index, e.target.value)}
                    placeholder={`Note ${index + 1}`}
                  />
                ))}
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
                <Button size="small" onClick={handleAddNote}>Add another note</Button>
                <Button size="small" variant="contained" onClick={handleSaveNotes} disabled={saving}>Save</Button>
              </Stack>
            </Box>

            <Accordion disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Previous Session Preview</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {previousSession ? (
                  <>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{previousSession.sessionType}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {format(new Date(previousSession.date), 'MMM d, yyyy')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {previousSession.notes?.slice(0, 140) ?? 'No previous notes.'}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">No previous session available.</Typography>
                )}
              </AccordionDetails>
            </Accordion>

            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Details</Typography>
              <Stack spacing={0.75}>
                <Typography variant="body2">Date: {format(new Date(sessionDetail.date), 'MMM d, yyyy')}</Typography>
                <Typography variant="body2">Duration: {sessionDetail.duration} min</Typography>
                <Typography variant="body2">Method/Location: {locationLabelMap[sessionDetail.location] ?? sessionDetail.location}</Typography>
                <Typography variant="body2">Billing/Payment: {sessionDetail.paymentStatus ?? 'N/A'}</Typography>
                <Chip label={sessionDetail.status} size="small" sx={{ width: 'fit-content' }} />
              </Stack>
            </Box>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} sx={{ pt: 2 }}>
          <Button variant="contained" onClick={() => navigate(`/sessions?focusSessionId=${sessionDetail.id}`)}>Open Session</Button>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/sessions?focusSessionId=${sessionDetail.id}`)}>Edit Session</Button>
        </Stack>
      </Box>

      <Snackbar
        open={savedVisible}
        autoHideDuration={2000}
        onClose={() => setSavedVisible(false)}
        message="Saved"
      />
    </Drawer>
  );
}
