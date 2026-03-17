import { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
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
import { alpha } from '@mui/material/styles';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
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
  surfaceVariant?: 'default' | 'client-detail';
}

const locationLabelMap: Record<string, string> = {
  zoom: 'Zoom',
  phone: 'Phone',
  office: 'Office',
};

function formatLabel(value?: string | null) {
  if (!value) return 'N/A';

  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(' ');
}

function formatSessionDate(value: string | Date) {
  return format(new Date(value), 'MMM d, yyyy, h:mm a');
}

function getStatusChipSx(status?: string) {
  switch (status) {
    case 'completed':
      return {
        bgcolor: '#EAF6EC',
        borderColor: '#CFE6D5',
        color: '#2F7A42',
      };
    case 'cancelled':
      return {
        bgcolor: '#F5F1ED',
        borderColor: '#E4DBD2',
        color: '#655B52',
      };
    default:
      return {
        bgcolor: '#F1ECF8',
        borderColor: '#E0D4F0',
        color: '#6E5E82',
      };
  }
}

export function SessionDetailsDrawer({
  open,
  onClose,
  sessionId,
  sessions,
  onUpdateSession,
  onSaved,
  surfaceVariant = 'default',
}: SessionDetailsDrawerProps) {
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

  const isClientDetailVariant = surfaceVariant === 'client-detail';
  const statusChipSx = getStatusChipSx(sessionDetail.status);
  const drawerCardSx = {
    border: '1px solid',
    borderColor: (theme: any) => alpha(theme.palette.text.primary, 0.07),
    borderRadius: 3,
    bgcolor: 'common.white',
    boxShadow: (theme: any) => `0 10px 26px ${alpha(theme.palette.common.black, 0.04)}`,
  };
  const drawerFieldSx = {
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
        borderColor: (theme: any) => alpha(theme.palette.primary.main, 0.26),
      },
      '&.Mui-focused': {
        bgcolor: 'common.white',
        boxShadow: (theme: any) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`,
      },
      '&.Mui-focused fieldset': {
        borderColor: (theme: any) => alpha(theme.palette.primary.main, 0.34),
      },
    },
  };

  if (!isClientDetailVariant) {
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
            {loadingNote ? <Typography variant="body2" color="text.secondary">Loading...</Typography> : null}
            <Stack spacing={2.5}>
              {!isEditMode ? (
                <>
                  <Box>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Session Details</Typography>
                    <Stack spacing={0.75}>
                      <Typography variant="body2"><strong>Type:</strong> {sessionDetail.sessionType}</Typography>
                      <Typography variant="body2"><strong>Date:</strong> {formatSessionDate(sessionDetail.date)}</Typography>
                      <Typography variant="body2"><strong>Duration:</strong> {sessionDetail.duration} min</Typography>
                      <Typography variant="body2"><strong>Location:</strong> {locationLabelMap[sessionDetail.location] ?? formatLabel(sessionDetail.location)}</Typography>
                      <Typography variant="body2"><strong>Focus:</strong> {sessionDetail.focus || 'N/A'}</Typography>
                      <Typography variant="body2"><strong>Billing/Payment:</strong> {sessionDetail.paymentStatus ?? 'N/A'}</Typography>
                      <Chip label={formatLabel(sessionDetail.status)} size="small" sx={{ width: 'fit-content', textTransform: 'capitalize' }} />
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

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 520 },
          borderLeft: '1px solid',
          borderColor: (theme) => alpha(theme.palette.text.primary, 0.08),
          bgcolor: '#FAF8F5',
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,244,239,0.98) 100%)',
        },
      }}
    >
      <Box sx={{ p: { xs: 1.5, sm: 2 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ ...drawerCardSx, px: { xs: 1.75, sm: 2 }, py: { xs: 1.6, sm: 1.85 }, mb: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
            <Stack direction="row" spacing={1.35} alignItems="center" sx={{ minWidth: 0 }}>
              <Avatar
                sx={{
                  width: 46,
                  height: 46,
                  bgcolor: sessionDetail.avatarColor,
                  boxShadow: (theme) => `0 0 0 6px ${alpha(theme.palette.primary.main, 0.08)}`,
                }}
              >
                {sessionDetail.initials}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, letterSpacing: 0.8 }}>
                  Session Record
                </Typography>
                <Typography variant="h6" sx={{ mt: 0.3, fontWeight: 700, letterSpacing: -0.2 }}>
                  {sessionDetail.client}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  {sessionDetail.sessionType}
                </Typography>
              </Box>
            </Stack>
            <IconButton
              onClick={onClose}
              sx={{
                border: '1px solid',
                borderColor: (theme) => alpha(theme.palette.text.primary, 0.08),
                bgcolor: (theme) => alpha(theme.palette.background.default, 0.72),
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Stack
            direction="row"
            useFlexGap
            flexWrap="wrap"
            spacing={0}
            sx={{ mt: 1.5, rowGap: 0.8, columnGap: 0.85 }}
          >
            <Stack
              direction="row"
              spacing={0.7}
              alignItems="center"
              sx={{
                px: 1.1,
                py: 0.7,
                borderRadius: 999,
                bgcolor: (theme) => alpha(theme.palette.background.default, 0.72),
              }}
            >
              <CalendarTodayOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {formatSessionDate(sessionDetail.date)}
              </Typography>
            </Stack>
            <Stack
              direction="row"
              spacing={0.7}
              alignItems="center"
              sx={{
                px: 1.1,
                py: 0.7,
                borderRadius: 999,
                bgcolor: (theme) => alpha(theme.palette.background.default, 0.72),
              }}
            >
              <AccessTimeRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {`${sessionDetail.duration} min`}
              </Typography>
            </Stack>
            <Stack
              direction="row"
              spacing={0.7}
              alignItems="center"
              sx={{
                px: 1.1,
                py: 0.7,
                borderRadius: 999,
                bgcolor: (theme) => alpha(theme.palette.background.default, 0.72),
              }}
            >
              <PlaceOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {locationLabelMap[sessionDetail.location] ?? formatLabel(sessionDetail.location)}
              </Typography>
            </Stack>
            <Chip
              size="small"
              label={formatLabel(sessionDetail.status)}
              sx={{
                height: 28,
                borderRadius: 999,
                border: '1px solid',
                fontWeight: 700,
                letterSpacing: 0.2,
                ...statusChipSx,
              }}
            />
          </Stack>
        </Box>

        <Box sx={{ overflow: 'auto', flex: 1, pr: 0.25, pb: 0.4 }}>
          {loadingNote ? (
            <Box
              sx={{
                ...drawerCardSx,
                px: 1.7,
                py: 1.15,
                mb: 1.5,
                bgcolor: (theme) => alpha(theme.palette.background.default, 0.62),
                boxShadow: 'none',
              }}
            >
              <Typography variant="body2" color="text.secondary">Loading session details...</Typography>
            </Box>
          ) : null}

          <Stack spacing={1.5}>
            {!isEditMode ? (
              <>
                <Box sx={{ ...drawerCardSx, px: { xs: 1.6, sm: 1.85 }, py: { xs: 1.5, sm: 1.7 } }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, letterSpacing: 0.8 }}>
                    Session Details
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                      gap: 1,
                      mt: 1.25,
                    }}
                  >
                    {[
                      { label: 'Type', value: sessionDetail.sessionType || 'N/A' },
                      { label: 'Date', value: formatSessionDate(sessionDetail.date) },
                      { label: 'Duration', value: `${sessionDetail.duration} min` },
                      { label: 'Location', value: locationLabelMap[sessionDetail.location] ?? formatLabel(sessionDetail.location) },
                      { label: 'Billing/Payment', value: sessionDetail.paymentStatus ?? 'N/A' },
                    ].map((item) => (
                      <Box
                        key={item.label}
                        sx={{
                          border: '1px solid',
                          borderColor: (theme) => alpha(theme.palette.text.primary, 0.06),
                          borderRadius: 2.5,
                          px: 1.3,
                          py: 1.15,
                          bgcolor: (theme) => alpha(theme.palette.background.default, 0.48),
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700 }}>
                          {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.35, fontWeight: 600, lineHeight: 1.5 }}>
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                    <Box
                      sx={{
                        border: '1px solid',
                        borderColor: (theme) => alpha(theme.palette.text.primary, 0.06),
                        borderRadius: 2.5,
                        px: 1.3,
                        py: 1.15,
                        bgcolor: (theme) => alpha(theme.palette.background.default, 0.48),
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700 }}>
                        Status
                      </Typography>
                      <Chip
                        size="small"
                        label={formatLabel(sessionDetail.status)}
                        sx={{
                          mt: 0.55,
                          height: 26,
                          borderRadius: 999,
                          border: '1px solid',
                          fontWeight: 700,
                          ...statusChipSx,
                        }}
                      />
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      mt: 1,
                      border: '1px solid',
                      borderColor: (theme) => alpha(theme.palette.text.primary, 0.06),
                      borderRadius: 2.5,
                      px: 1.3,
                      py: 1.15,
                      bgcolor: (theme) => alpha(theme.palette.background.default, 0.48),
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700 }}>
                      Focus
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.4, fontWeight: 500, lineHeight: 1.65 }}>
                      {sessionDetail.focus || 'No focus set for this session.'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ ...drawerCardSx, px: { xs: 1.6, sm: 1.85 }, py: { xs: 1.5, sm: 1.7 } }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, letterSpacing: 0.8 }}>
                    Session Notes
                  </Typography>
                  {sessionDetail.notes ? (
                    <Typography variant="body2" sx={{ mt: 1.1, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                      {sessionDetail.notes}
                    </Typography>
                  ) : (
                    <Box
                      sx={{
                        mt: 1.15,
                        border: '1px solid',
                        borderColor: (theme) => alpha(theme.palette.text.primary, 0.06),
                        borderRadius: 2.5,
                        px: 1.35,
                        py: 1.3,
                        bgcolor: (theme) => alpha(theme.palette.background.default, 0.46),
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No notes yet.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </>
            ) : (
              <>
                <Box sx={{ ...drawerCardSx, px: { xs: 1.6, sm: 1.85 }, py: { xs: 1.5, sm: 1.7 } }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, letterSpacing: 0.8 }}>
                    Session Notes
                  </Typography>
                  <Select
                    size="small"
                    fullWidth
                    value={noteMode}
                    onChange={(e) => setNoteMode(e.target.value as 'free' | 'template' | 'missing')}
                    sx={{ ...drawerFieldSx, mt: 1.2, mb: 1.2 }}
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
                          sx={drawerFieldSx}
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
                      sx={drawerFieldSx}
                    />
                  )}
                </Box>

                <Box sx={{ ...drawerCardSx, px: { xs: 1.6, sm: 1.85 }, py: { xs: 1.5, sm: 1.7 } }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, letterSpacing: 0.8 }}>
                    Details
                  </Typography>
                  <Stack spacing={1.1} sx={{ mt: 1.2 }}>
                    <TextField
                      size="small"
                      label="Session Type"
                      value={sessionForm.sessionType}
                      onChange={(e) => setSessionForm((prev) => ({ ...prev, sessionType: e.target.value }))}
                      fullWidth
                      sx={drawerFieldSx}
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <TextField
                        size="small"
                        type="date"
                        label="Date"
                        InputLabelProps={{ shrink: true }}
                        value={sessionForm.date}
                        onChange={(e) => setSessionForm((prev) => ({ ...prev, date: e.target.value }))}
                        fullWidth
                        sx={drawerFieldSx}
                      />
                      <TextField
                        size="small"
                        type="time"
                        label="Time"
                        InputLabelProps={{ shrink: true }}
                        value={sessionForm.time}
                        onChange={(e) => setSessionForm((prev) => ({ ...prev, time: e.target.value }))}
                        fullWidth
                        sx={drawerFieldSx}
                      />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <TextField
                        size="small"
                        type="number"
                        label="Duration (min)"
                        value={sessionForm.duration}
                        onChange={(e) => setSessionForm((prev) => ({ ...prev, duration: Number(e.target.value) || 0 }))}
                        fullWidth
                        sx={drawerFieldSx}
                      />
                      <TextField
                        select
                        size="small"
                        label="Location"
                        value={sessionForm.location}
                        onChange={(e) => setSessionForm((prev) => ({ ...prev, location: e.target.value as SessionDto['location'] }))}
                        fullWidth
                        sx={drawerFieldSx}
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
                      minRows={3}
                      fullWidth
                      sx={drawerFieldSx}
                    />
                  </Stack>
                </Box>
              </>
            )}

            <Accordion
              disableGutters
              sx={{
                ...drawerCardSx,
                overflow: 'hidden',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
                sx={{
                  px: { xs: 1.6, sm: 1.85 },
                  py: 0.5,
                  '& .MuiAccordionSummary-content': {
                    my: 0.75,
                  },
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, letterSpacing: 0.8 }}>
                    Context
                  </Typography>
                  <Typography variant="subtitle2" sx={{ mt: 0.25, fontWeight: 700 }}>
                    Previous Session Preview
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: { xs: 1.6, sm: 1.85 }, pt: 0, pb: 1.6 }}>
                {previousSession ? (
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: (theme) => alpha(theme.palette.text.primary, 0.06),
                      borderRadius: 2.5,
                      px: 1.35,
                      py: 1.25,
                      bgcolor: (theme) => alpha(theme.palette.background.default, 0.46),
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{previousSession.sessionType}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45 }}>
                      {format(new Date(previousSession.date), 'MMM d, yyyy')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.9, lineHeight: 1.65 }}>
                      {previousSession.notes?.slice(0, 140) ?? 'No previous notes.'}
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: (theme) => alpha(theme.palette.text.primary, 0.06),
                      borderRadius: 2.5,
                      px: 1.35,
                      py: 1.25,
                      bgcolor: (theme) => alpha(theme.palette.background.default, 0.46),
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">No previous session available.</Typography>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            {error ? <Alert severity="error" variant="outlined">{error}</Alert> : null}
          </Stack>
        </Box>

        <Box
          sx={{
            pt: 1.5,
            mt: 1.5,
            borderTop: '1px solid',
            borderColor: (theme) => alpha(theme.palette.text.primary, 0.08),
          }}
        >
          {!isEditMode ? (
            <Button
              variant="contained"
              onClick={() => setIsEditMode(true)}
              sx={{
                textTransform: 'none',
                borderRadius: 999,
                px: 2,
                fontWeight: 700,
                boxShadow: (theme) => `0 10px 20px ${alpha(theme.palette.primary.main, 0.18)}`,
              }}
            >
              Edit Session
            </Button>
          ) : (
            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1} justifyContent="flex-end">
              <Button
                onClick={() => setIsEditMode(false)}
                disabled={saving}
                sx={{ textTransform: 'none', borderRadius: 999, px: 1.8 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving || loadingNote}
                sx={{
                  textTransform: 'none',
                  borderRadius: 999,
                  px: 2,
                  fontWeight: 700,
                  boxShadow: (theme) => `0 10px 20px ${alpha(theme.palette.primary.main, 0.18)}`,
                }}
              >
                Save Changes
              </Button>
            </Stack>
          )}
        </Box>
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
