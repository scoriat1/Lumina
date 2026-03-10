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
  const { templateMode, selectedTemplate, getActiveTemplate } = useNotesTemplate();
  const [sessionDetail, setSessionDetail] = useState<SessionDto | null>(null);
  const [freeNoteDraft, setFreeNoteDraft] = useState('');
  const [templateFieldDraft, setTemplateFieldDraft] = useState<Record<string, string>>({});
  const [noteMode, setNoteMode] = useState<'free' | 'template' | 'missing'>('free');
  const [saving, setSaving] = useState(false);
  const [loadingNote, setLoadingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedVisible, setSavedVisible] = useState(false);

  const activeTemplate = getActiveTemplate();
  const selectedTemplateLabel = activeTemplate ? `${activeTemplate.name} Template` : null;

  useEffect(() => {
    if (!open || !sessionId) return;

    setLoadingNote(true);
    setError(null);

    Promise.all([apiClient.getSession(sessionId), apiClient.getSessionStructuredNote(sessionId)])
      .then(([detail, structuredNote]) => {
        setSessionDetail(detail);
        setFreeNoteDraft(detail.notes ?? '');

        const defaultMode = templateMode === 'template' && activeTemplate ? 'template' : 'free';

        if (structuredNote?.templateId && activeTemplate && structuredNote.templateId === Number(activeTemplate.id)) {
          try {
            const parsed = JSON.parse(structuredNote.content) as Record<string, string>;
            setTemplateFieldDraft(parsed);
            setNoteMode('template');
          } catch {
            setTemplateFieldDraft({});
            setNoteMode(defaultMode);
          }
        } else {
          setTemplateFieldDraft({});
          setNoteMode(defaultMode);
        }
      })
      .catch(() => {
        setSessionDetail(null);
        setFreeNoteDraft('');
        setTemplateFieldDraft({});
        setError('Failed to load session notes.');
      })
      .finally(() => setLoadingNote(false));
  }, [open, sessionId, templateMode, activeTemplate]);

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

  const handleSaveNotes = async () => {
    if (!sessionId) return;
    setSaving(true);
    setError(null);

    const templateContent = JSON.stringify(templateFieldDraft);
    const legacyNotes = noteMode === 'template'
      ? Object.entries(templateFieldDraft)
        .filter(([, value]) => value?.trim())
        .map(([field, value]) => `${field}: ${value.trim()}`)
        .join('\n')
      : freeNoteDraft.trim();

    try {
      await apiClient.saveSessionStructuredNote(sessionId, {
        templateId: noteMode === 'template' && activeTemplate ? Number(activeTemplate.id) : undefined,
        noteType: noteMode,
        content: noteMode === 'template' ? templateContent : JSON.stringify({ freeform: freeNoteDraft }),
        legacyNotes,
      });

      const refreshed = await apiClient.getSession(sessionId);
      setSessionDetail(refreshed);
      setFreeNoteDraft(refreshed.notes ?? '');
      onUpdateSession?.(sessionId, { notes: refreshed.notes });
      await onSaved?.();
      setSavedVisible(true);
    } catch {
      setError('Failed to save notes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 460 } } }}>
      <Box sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Avatar sx={{ bgcolor: sessionDetail.avatarColor }}>{sessionDetail.initials}</Avatar>
            <Box>
              <Typography variant="subtitle1">{sessionDetail.client}</Typography>
              <Typography variant="body2" color="text.secondary">{sessionDetail.sessionType}</Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
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

              {noteMode === 'template' && activeTemplate ? (
                <Stack spacing={1}>
                  {activeTemplate.fields.map((field) => (
                    <TextField
                      key={field}
                      multiline
                      minRows={2}
                      label={field}
                      value={templateFieldDraft[field] ?? ''}
                      onChange={(e) => setTemplateFieldDraft((prev) => ({ ...prev, [field]: e.target.value }))}
                    />
                  ))}
                </Stack>
              ) : (
                <TextField
                  multiline
                  minRows={5}
                  fullWidth
                  value={freeNoteDraft}
                  onChange={(e) => setFreeNoteDraft(e.target.value)}
                  placeholder="Session notes"
                />
              )}

              <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
                <Button size="small" variant="contained" onClick={handleSaveNotes} disabled={saving || loadingNote}>Save</Button>
              </Stack>
              {error && <Typography color="error" variant="caption">{error}</Typography>}
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
