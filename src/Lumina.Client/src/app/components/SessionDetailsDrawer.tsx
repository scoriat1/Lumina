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
import { format } from 'date-fns';
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

export function SessionDetailsDrawer({ open, onClose, sessionId, sessions, onUpdateSession, onSaved }: SessionDetailsDrawerProps) {
  const { templateMode, getActiveTemplate } = useNotesTemplate();
  const [sessionDetail, setSessionDetail] = useState<SessionDto | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    sessionType: '',
    date: '',
    time: '',
    duration: 60,
    location: 'zoom' as SessionDto['location'],
    focus: '',
  });
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
    setIsEditMode(false);

    Promise.all([apiClient.getSession(sessionId), apiClient.getSessionStructuredNote(sessionId)])
      .then(([detail, structuredNote]) => {
        setSessionDetail(detail);
        setFreeNoteDraft(detail.notes ?? '');
        const parsedDate = new Date(detail.date);
        setSessionForm({
          sessionType: detail.sessionType ?? '',
          date: format(parsedDate, 'yyyy-MM-dd'),
          time: format(parsedDate, 'HH:mm'),
          duration: detail.duration ?? 60,
          location: detail.location ?? 'zoom',
          focus: detail.focus ?? '',
        });

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
        setSessionForm({ sessionType: '', date: '', time: '', duration: 60, location: 'zoom', focus: '' });
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

  const handleSave = async () => {
    if (!sessionId || !sessionDetail) return;

    if (!sessionForm.date || !sessionForm.time || !sessionForm.sessionType.trim()) {
      setError('Session type, date, and time are required.');
      return;
    }

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
      const sessionDateTime = new Date(`${sessionForm.date}T${sessionForm.time}`);
      await apiClient.updateSession(sessionId, {
        sessionType: sessionForm.sessionType.trim(),
        date: sessionDateTime.toISOString(),
        duration: Number(sessionForm.duration),
        location: sessionForm.location,
        focus: sessionForm.focus.trim(),
      });

      await apiClient.saveSessionStructuredNote(sessionId, {
        templateId: noteMode === 'template' && activeTemplate ? Number(activeTemplate.id) : undefined,
        noteType: noteMode,
        content: noteMode === 'template' ? templateContent : JSON.stringify({ freeform: freeNoteDraft }),
        legacyNotes,
      });

      const refreshed = await apiClient.getSession(sessionId);
      setSessionDetail(refreshed);
      setFreeNoteDraft(refreshed.notes ?? '');
      onUpdateSession?.(sessionId, {
        sessionType: refreshed.sessionType,
        date: refreshed.date,
        duration: refreshed.duration,
        location: refreshed.location,
        focus: refreshed.focus,
        notes: refreshed.notes,
      });
      await onSaved?.();
      setIsEditMode(false);
      setSavedVisible(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save session details.');
    } finally {
      setSaving(false);
    }
  };

  if (!sessionDetail) return null;

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
          {loadingNote ? <Typography variant="body2" color="text.secondary">Loading…</Typography> : null}
          <Stack spacing={2.5}>
            {!isEditMode ? (
              <>
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Session Details</Typography>
                  <Stack spacing={0.75}>
                    <Typography variant="body2"><strong>Type:</strong> {sessionDetail.sessionType}</Typography>
                    <Typography variant="body2"><strong>Date:</strong> {format(new Date(sessionDetail.date), 'MMM d, yyyy • h:mm a')}</Typography>
                    <Typography variant="body2"><strong>Duration:</strong> {sessionDetail.duration} min</Typography>
                    <Typography variant="body2"><strong>Location:</strong> {sessionDetail.location}</Typography>
                    <Typography variant="body2"><strong>Focus:</strong> {sessionDetail.focus || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Billing/Payment:</strong> {sessionDetail.paymentStatus ?? 'N/A'}</Typography>
                    <Chip label={sessionDetail.status} size="small" sx={{ width: 'fit-content', textTransform: 'capitalize' }} />
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 0.75 }}>Session Notes</Typography>
                  {sessionDetail.notes ? (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{sessionDetail.notes}</Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No notes yet.</Typography>
                  )}
                </Box>
              </>
            ) : (
              <>
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
                </Box>

                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Details</Typography>
                  <Stack spacing={1.25}>
                    <TextField
                      size="small"
                      label="Session Type"
                      value={sessionForm.sessionType}
                      onChange={(e) => setSessionForm((prev) => ({ ...prev, sessionType: e.target.value }))}
                    />
                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small"
                        type="date"
                        label="Date"
                        InputLabelProps={{ shrink: true }}
                        value={sessionForm.date}
                        onChange={(e) => setSessionForm((prev) => ({ ...prev, date: e.target.value }))}
                        fullWidth
                      />
                      <TextField
                        size="small"
                        type="time"
                        label="Time"
                        InputLabelProps={{ shrink: true }}
                        value={sessionForm.time}
                        onChange={(e) => setSessionForm((prev) => ({ ...prev, time: e.target.value }))}
                        fullWidth
                      />
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small"
                        type="number"
                        label="Duration (min)"
                        value={sessionForm.duration}
                        onChange={(e) => setSessionForm((prev) => ({ ...prev, duration: Number(e.target.value) || 0 }))}
                        fullWidth
                      />
                      <TextField
                        select
                        size="small"
                        label="Location"
                        value={sessionForm.location}
                        onChange={(e) => setSessionForm((prev) => ({ ...prev, location: e.target.value as SessionDto['location'] }))}
                        fullWidth
                      >
                        <MenuItem value="zoom">Zoom</MenuItem>
                        <MenuItem value="phone">Phone</MenuItem>
                        <MenuItem value="office">Office</MenuItem>
                      </TextField>
                    </Stack>
                    <TextField
                      size="small"
                      label="Focus"
                      value={sessionForm.focus}
                      onChange={(e) => setSessionForm((prev) => ({ ...prev, focus: e.target.value }))}
                      multiline
                      minRows={2}
                    />
                  </Stack>
                </Box>
              </>
            )}

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

            {error ? <Typography color="error" variant="caption">{error}</Typography> : null}
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} sx={{ pt: 2 }}>
          {!isEditMode ? (
            <Button variant="outlined" onClick={() => setIsEditMode(true)}>Edit Session</Button>
          ) : (
            <>
              <Button variant="contained" onClick={handleSave} disabled={saving || loadingNote}>Save Changes</Button>
              <Button onClick={() => setIsEditMode(false)} disabled={saving}>Cancel</Button>
            </>
          )}
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
