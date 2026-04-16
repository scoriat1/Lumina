import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Dialog,
  IconButton,
  MenuItem,
  InputAdornment,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VideocamIcon from '@mui/icons-material/Videocam';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import {
  addDays,
  format,
  isAfter,
  isBefore,
  parse,
  startOfDay,
  subDays,
} from 'date-fns';
import { TimelineAvailability } from './TimelineAvailability';
import { apiClient } from '../api/client';
import { usePracticePackages } from '../contexts/PracticePackagesContext';
import type {
  SessionDto,
  SessionBillingModeValue,
  SessionEntryMode,
  SessionLocationValue,
  SessionStatusValue,
} from '../api/types';
import { colors } from '../styles/colors';
import {
  allSessionStatusOptions,
  getSessionStatusLabel,
} from '../lib/sessionStatus';

export interface SessionEntryModalProps {
  open: boolean;
  mode?: SessionEntryMode;
  onClose: () => void;
  onCreated?: (sessionId: string) => void | Promise<void>;
  preselectedClientId?: string;
  initialDate?: string;
  initialTime?: string;
}

type ModalClient = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
};

type AvailabilityEvent = Pick<
  SessionDto,
  'id' | 'client' | 'sessionType' | 'duration' | 'status' | 'avatarColor'
> & {
  date: Date;
};

type SessionFormState = {
  clientId: string;
  billingMode: SessionBillingModeValue;
  packageId: string;
  amount: string;
  sessionType: string;
  date: string;
  time: string;
  duration: number;
  location: SessionLocationValue;
  status: SessionStatusValue;
};

type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly';

const sessionTypes = [
  'Initial Consultation',
  'Weekly Check-in',
  'Progress Check-in',
  'Follow-up Session',
  'Values Alignment',
  'Leadership Growth',
  'Career Strategy',
  'Confidence Building',
  'Work-Life Balance',
];

const durations = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
];

const LAST_PAST_SLOT = { hour: 17, minute: 30 };
const BUSINESS_START_HOUR = 8;

function formatSessionCount(count: number) {
  return `${count} ${count === 1 ? 'session' : 'sessions'}`;
}

function clampRecurringCount(value: string, max?: number | null) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return '1';
  }

  const normalized = Math.max(1, Math.floor(numericValue));
  if (max == null) {
    return String(normalized);
  }

  return String(Math.min(normalized, max));
}

function setTimeForDay(day: Date, hour: number, minute: number) {
  const next = new Date(day);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function getLatestPastSlot(now: Date) {
  const startOfToday = startOfDay(now);
  const earliestToday = setTimeForDay(startOfToday, BUSINESS_START_HOUR, 0);
  const latestToday = setTimeForDay(
    startOfToday,
    LAST_PAST_SLOT.hour,
    LAST_PAST_SLOT.minute,
  );

  const candidate = new Date(now);
  candidate.setSeconds(0, 0);
  candidate.setMinutes(candidate.getMinutes() >= 30 ? 30 : 0);

  if (candidate > latestToday) {
    return latestToday;
  }

  if (candidate < earliestToday) {
    return setTimeForDay(
      subDays(startOfToday, 1),
      LAST_PAST_SLOT.hour,
      LAST_PAST_SLOT.minute,
    );
  }

  return candidate;
}

function getDefaultDateSelection(
  mode: SessionEntryMode,
  initialDate?: string,
  initialTime?: string,
) {
  const now = new Date();
  const today = startOfDay(now);

  if (mode === 'schedule') {
    const requestedDate = initialDate
      ? parse(initialDate, 'yyyy-MM-dd', now)
      : today;
    const safeDate = isBefore(startOfDay(requestedDate), today)
      ? today
      : startOfDay(requestedDate);

    return {
      date: format(safeDate, 'yyyy-MM-dd'),
      time: initialTime ?? '',
    };
  }

  if (initialDate && initialTime) {
    const requestedDateTime = parse(
      `${initialDate} ${initialTime}`,
      'yyyy-MM-dd HH:mm',
      now,
    );

    if (!isAfter(requestedDateTime, now)) {
      return { date: initialDate, time: initialTime };
    }
  }

  const fallback = getLatestPastSlot(now);
  return {
    date: format(fallback, 'yyyy-MM-dd'),
    time: format(fallback, 'HH:mm'),
  };
}

function createInitialFormState(
  mode: SessionEntryMode,
  preselectedClientId?: string,
  initialDate?: string,
  initialTime?: string,
): SessionFormState {
  const selection = getDefaultDateSelection(mode, initialDate, initialTime);

  return {
    clientId: preselectedClientId ?? '',
    billingMode: 'payPerSession',
    packageId: '',
    amount: '',
    sessionType: '',
    date: selection.date,
    time: selection.time,
    duration: 60,
    location: 'zoom',
    status: mode === 'logPast' ? 'completed' : 'upcoming',
  };
}

function adjustFormDataForMode(
  current: SessionFormState,
  nextMode: SessionEntryMode,
  nextStatus: SessionStatusValue,
  initialDate?: string,
  initialTime?: string,
) {
  const fallbackSelection = getDefaultDateSelection(
    nextMode,
    initialDate,
    initialTime,
  );

  const nextDate = parse(current.date, 'yyyy-MM-dd', new Date());
  const hasValidDate = isDateAllowedForMode(nextDate, nextMode);
  const currentDateTime = current.time
    ? parse(`${current.date} ${current.time}`, 'yyyy-MM-dd HH:mm', new Date())
    : null;
  const hasValidTime =
    currentDateTime !== null &&
    isDateTimeAllowedForMode(currentDateTime, nextMode);

  return {
    ...current,
    date: hasValidDate ? current.date : fallbackSelection.date,
    time: hasValidTime ? current.time : fallbackSelection.time,
    status: nextStatus,
  };
}

function isDateAllowedForMode(date: Date, mode: SessionEntryMode) {
  const today = startOfDay(new Date());
  const candidate = startOfDay(date);
  return mode === 'schedule'
    ? !isBefore(candidate, today)
    : !isAfter(candidate, today);
}

function isDateTimeAllowedForMode(date: Date, mode: SessionEntryMode) {
  const now = new Date();
  return mode === 'schedule' ? isAfter(date, now) : !isAfter(date, now);
}

function isSlotBlockedByEvent(
  events: AvailabilityEvent[],
  dateLabel: string,
  timeLabel: string,
) {
  const slot = parse(`${dateLabel} ${timeLabel}`, 'yyyy-MM-dd HH:mm', new Date());
  const slotMinutes = slot.getHours() * 60 + slot.getMinutes();

  return events
    .filter((event) => format(event.date, 'yyyy-MM-dd') === dateLabel)
    .some((event) => {
      const startMinutes = event.date.getHours() * 60 + event.date.getMinutes();
      const endMinutes = startMinutes + event.duration;
      return slotMinutes >= startMinutes && slotMinutes < endMinutes;
    });
}

export function SessionEntryModal({
  open,
  mode = 'schedule',
  onClose,
  onCreated,
  preselectedClientId,
  initialDate,
  initialTime,
}: SessionEntryModalProps) {
  const { packages } = usePracticePackages();
  const [formData, setFormData] = useState<SessionFormState>(() =>
    createInitialFormState(mode, preselectedClientId, initialDate, initialTime),
  );
  const [clients, setClients] = useState<ModalClient[]>([]);
  const [events, setEvents] = useState<AvailabilityEvent[]>([]);
  const [defaultSessionAmount, setDefaultSessionAmount] = useState('125');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] =
    useState<RecurringFrequency>('weekly');
  const [recurringCount, setRecurringCount] = useState('6');
  const enabledPracticePackages = useMemo(
    () => packages.filter((pkg) => pkg.enabled),
    [packages],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormData(
      createInitialFormState(mode, preselectedClientId, initialDate, initialTime),
    );
    setSubmitError(null);
    setIsSubmitting(false);
    setIsRecurring(false);
    setRecurringFrequency('weekly');
    setRecurringCount('6');
  }, [open, mode, preselectedClientId, initialDate, initialTime]);

  useEffect(() => {
    if (!open) {
      return;
    }

    Promise.allSettled([
      apiClient.getClients(),
      apiClient.getSessions(),
      apiClient.getBillingSettings(),
    ]).then(([clientsResult, sessionsResult, billingResult]) => {
      if (clientsResult.status === 'fulfilled') {
        setClients(
          clientsResult.value.map((client) => ({
            id: client.id,
            name: client.name,
            initials: client.initials,
            avatarColor: client.avatarColor,
          })),
        );
      } else {
        setClients([]);
      }

      if (sessionsResult.status === 'fulfilled') {
        setEvents(
          sessionsResult.value.map((session) => ({
            id: session.id,
            client: session.client,
            sessionType: session.sessionType,
            duration: session.duration,
            status: session.status,
            avatarColor: session.avatarColor,
            date: new Date(session.date),
          })),
        );
      } else {
        setEvents([]);
      }

      const nextDefaultAmount =
        billingResult.status === 'fulfilled'
          ? String(billingResult.value.defaultSessionAmount)
          : '125';

      setDefaultSessionAmount(nextDefaultAmount);
      setFormData((current) =>
        current.amount ? current : { ...current, amount: nextDefaultAmount },
      );
    });
  }, [open]);

  const selectedDate = useMemo(
    () => parse(formData.date, 'yyyy-MM-dd', new Date()),
    [formData.date],
  );
  const entryMode: SessionEntryMode =
    formData.status === 'upcoming' ? 'schedule' : 'logPast';
  const statusOptions = allSessionStatusOptions;
  const isTimeSelected = Boolean(formData.time);
  const selectedPracticePackage = useMemo(
    () => enabledPracticePackages.find((pkg) => pkg.id === formData.packageId) ?? null,
    [enabledPracticePackages, formData.packageId],
  );
  const packageSessionLimit =
    formData.billingMode === 'package' && selectedPracticePackage
      ? selectedPracticePackage.sessionCount
      : null;
  const recurringSessionCount = isRecurring
    ? Number.parseInt(recurringCount, 10) || 1
    : 1;
  const selectionMode = entryMode === 'schedule' ? 'future' : 'past';
  const title = 'Add New Session';
  const primaryActionLabel =
    entryMode === 'schedule' ? 'Schedule Session' : 'Log Session';
  const showRecurringControls = entryMode === 'schedule';

  useEffect(() => {
    if (entryMode !== 'schedule') {
      return;
    }

    if (formData.billingMode === 'package' && selectedPracticePackage) {
      setIsRecurring(true);
      setRecurringCount(String(selectedPracticePackage.sessionCount));
      return;
    }

    if (formData.billingMode !== 'package') {
      setRecurringCount((current) => clampRecurringCount(current));
    }
  }, [
    entryMode,
    formData.billingMode,
    selectedPracticePackage,
  ]);
  const previousDateDisabled =
    entryMode === 'schedule' &&
    !isAfter(startOfDay(selectedDate), startOfDay(new Date()));
  const nextDateDisabled =
    entryMode === 'logPast' &&
    !isBefore(startOfDay(selectedDate), startOfDay(new Date()));

  const handleChange = <K extends keyof SessionFormState>(
    field: K,
    value: SessionFormState[K],
  ) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleStatusChange = (nextStatus: SessionStatusValue) => {
    const nextMode: SessionEntryMode =
      nextStatus === 'upcoming' ? 'schedule' : 'logPast';

    setSubmitError(null);
    setFormData((current) =>
      adjustFormDataForMode(
        current,
        nextMode,
        nextStatus,
        initialDate,
        initialTime,
      ),
    );
  };

  const handleDateChange = (nextDate: Date) => {
    if (!isDateAllowedForMode(nextDate, entryMode)) {
      return;
    }

    const nextDateLabel = format(nextDate, 'yyyy-MM-dd');

    setFormData((current) => {
      let nextTime = current.time;

      if (nextTime) {
        const nextDateTime = parse(
          `${nextDateLabel} ${nextTime}`,
          'yyyy-MM-dd HH:mm',
          new Date(),
        );

        if (
          !isDateTimeAllowedForMode(nextDateTime, entryMode) ||
          isSlotBlockedByEvent(events, nextDateLabel, nextTime)
        ) {
          nextTime = '';
        }
      }

      return {
        ...current,
        date: nextDateLabel,
        time: nextTime,
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!formData.clientId || !formData.time) {
      setSubmitError('Select a client and time to continue.');
      return;
    }

    if (formData.billingMode === 'package') {
      if (!formData.packageId) {
        setSubmitError('Select a package to continue.');
        return;
      }

      if (!selectedPracticePackage) {
        setSubmitError('Selected package is not available.');
        return;
      }

      if (
        entryMode === 'schedule' &&
        isRecurring &&
        recurringSessionCount > selectedPracticePackage.sessionCount
      ) {
        setSubmitError(
          `This package includes ${formatSessionCount(selectedPracticePackage.sessionCount)}.`,
        );
        return;
      }
    }

    if (formData.billingMode === 'payPerSession') {
      const amount = Number(formData.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        setSubmitError('Enter a positive amount for pay-per-session billing.');
        return;
      }
    }

    const localDateTime = new Date(`${formData.date}T${formData.time}:00`);

    if (!isDateTimeAllowedForMode(localDateTime, entryMode)) {
      setSubmitError(
        entryMode === 'schedule'
          ? 'Scheduled sessions must be created in the future.'
          : 'Past sessions must be logged with a past date and time.',
      );
      return;
    }

    if (isSlotBlockedByEvent(events, formData.date, formData.time)) {
      setSubmitError('That time slot is already occupied.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiClient.createSession({
        clientId: formData.clientId,
        date: localDateTime.toISOString(),
        duration: formData.duration,
        sessionType: formData.sessionType.trim() || 'Session',
        focus: '',
        location: formData.location,
        status: formData.status,
        mode: entryMode,
        billingMode: formData.billingMode,
        packageId:
          formData.billingMode === 'package' ? formData.packageId : undefined,
        amount:
          formData.billingMode === 'payPerSession'
            ? Number(formData.amount)
            : undefined,
        recurrenceFrequency:
          entryMode === 'schedule' && isRecurring ? recurringFrequency : undefined,
        recurrenceCount:
          entryMode === 'schedule' && isRecurring ? recurringSessionCount : undefined,
      });

      await onCreated?.(response.id);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Unable to save the session. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const timelineSummary = isTimeSelected
    ? `Selected: ${format(parse(formData.time, 'HH:mm', new Date()), 'h:mm a')} | ${formData.duration} min`
    : entryMode === 'schedule'
      ? 'Click a future time slot to schedule'
      : 'Click a past time slot to log';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '1120px',
          maxHeight: '90vh',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'flex-start',
          pt: 4,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 4,
          py: 2.5,
          borderBottom: `2px solid ${colors.brand.purple}`,
          background: '#FFFFFF',
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: colors.brand.purple,
            fontSize: '21px',
            letterSpacing: '-0.3px',
          }}
        >
          {title}
        </Typography>

        <IconButton
          onClick={onClose}
          sx={{
            color: colors.text.tertiary,
            '&:hover': {
              bgcolor: colors.surface.elevated,
              color: colors.brand.purple,
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
      >
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            width: '100%',
          }}
        >
          <Box
            sx={{
              flex: '0 0 40%',
              px: 4,
              pt: 4,
              pb: 5,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              '&::after': {
                content: '""',
                display: 'block',
                height: '24px',
                flexShrink: 0,
              },
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: colors.text.primary, fontWeight: 600, mb: 0.75, display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Client
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={formData.clientId}
                onChange={(event) => {
                  handleChange('clientId', event.target.value);
                }}
                required
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: client.avatarColor, fontSize: '11px', fontWeight: 600 }}>
                        {client.initials}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontSize: '14px' }}>
                        {client.name}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: colors.text.primary, fontWeight: 600, mb: 0.75, display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Billing
              </Typography>
              <ToggleButtonGroup
                value={formData.billingMode}
                exclusive
                fullWidth
                onChange={(_, value: SessionBillingModeValue | null) => {
                  if (!value) {
                    return;
                  }

                  const shouldUsePackage = value === 'package';
                  setFormData((current) => ({
                    ...current,
                    billingMode: value,
                    packageId: value === 'package' ? current.packageId : '',
                    amount:
                      value === 'payPerSession'
                        ? current.amount || defaultSessionAmount
                        : current.amount,
                  }));

                  if (!shouldUsePackage) {
                    return;
                  }

                  setIsRecurring(true);
                  setRecurringCount((current) =>
                    clampRecurringCount(current, packageSessionLimit),
                  );
                }}
                sx={{
                  width: '100%',
                  '& .MuiToggleButton-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    borderColor: '#E8E5E1',
                    color: '#7A746F',
                    py: 1,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(155, 139, 158, 0.12)',
                      color: '#6D5F70',
                      borderColor: '#CFC5D1',
                      '&:hover': {
                        bgcolor: 'rgba(155, 139, 158, 0.16)',
                      },
                    },
                    '&:hover': {
                      bgcolor: '#F9F8F7',
                    },
                  },
                }}
              >
                <ToggleButton value="payPerSession">Pay per session</ToggleButton>
                <ToggleButton value="package">Package</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {formData.billingMode === 'payPerSession' ? (
              <Box>
                <Typography variant="caption" sx={{ color: colors.text.primary, fontWeight: 600, mb: 0.75, display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Invoice Amount
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={formData.amount}
                  onChange={(event) => handleChange('amount', event.target.value)}
                  inputProps={{ min: 0, step: '0.01' }}
                  placeholder={defaultSessionAmount}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Box>
            ) : (
              <Box>
                <Typography variant="caption" sx={{ color: colors.text.primary, fontWeight: 600, mb: 0.75, display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Package
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formData.packageId}
                  onChange={(event) => handleChange('packageId', event.target.value)}
                  disabled={enabledPracticePackages.length === 0}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (value) => {
                      if (!value) {
                        return (
                          <Typography sx={{ color: '#8A837D', fontSize: '14px' }}>
                            {enabledPracticePackages.length === 0
                              ? 'No packages available'
                              : 'Select an enabled package from Settings.'}
                          </Typography>
                        );
                      }

                      const selectedPackage = enabledPracticePackages.find(
                        (pkg) => pkg.id === value,
                      );

                      return selectedPackage
                        ? `${selectedPackage.name} - ${formatSessionCount(selectedPackage.sessionCount)}`
                        : value;
                    },
                  }}
                >
                  {enabledPracticePackages.map((pkg) => (
                    <MenuItem
                      key={pkg.id}
                      value={pkg.id}
                    >
                      {pkg.name} - {formatSessionCount(pkg.sessionCount)}
                    </MenuItem>
                  ))}
                </TextField>
                {selectedPracticePackage ? (
                  <Typography
                    variant="body2"
                    sx={{ color: '#7A746F', fontSize: '12px', mt: 1 }}
                  >
                    {`This package includes ${formatSessionCount(selectedPracticePackage.sessionCount)}.`}
                  </Typography>
                ) : null}
              </Box>
            )}

            <Box>
              <Typography variant="caption" sx={{ color: colors.text.primary, fontWeight: 600, mb: 0.75, display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Session Title
              </Typography>
              <Autocomplete
                freeSolo
                options={sessionTypes}
                value={formData.sessionType}
                onChange={(_, value) => handleChange('sessionType', value || '')}
                onInputChange={(_, value) => handleChange('sessionType', value)}
                renderInput={(params) => (
                  <TextField {...params} size="small" placeholder="No title" />
                )}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Box sx={{ flex: '0 0 38%' }}>
                <Typography variant="caption" sx={{ color: colors.text.primary, fontWeight: 600, mb: 0.75, display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Duration
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formData.duration}
                  onChange={(event) => handleChange('duration', Number(event.target.value))}
                >
                  {durations.map((duration) => (
                    <MenuItem key={duration.value} value={duration.value}>
                      {duration.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box sx={{ flex: '0 0 62%' }}>
                <Typography variant="caption" sx={{ color: colors.text.primary, fontWeight: 600, mb: 0.75, display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Method
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formData.location}
                  onChange={(event) =>
                    handleChange('location', event.target.value as SessionLocationValue)
                  }
                >
                  <MenuItem value="zoom">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VideocamIcon sx={{ fontSize: 16, color: colors.brand.purple }} />
                      <span>Zoom</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="phone">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon sx={{ fontSize: 16, color: colors.accent.sage }} />
                      <span>Phone</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="office">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon sx={{ fontSize: 16, color: colors.accent.gold }} />
                      <span>In Person</span>
                    </Box>
                  </MenuItem>
                </TextField>
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: colors.text.primary, fontWeight: 600, mb: 0.75, display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Status
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={formData.status}
                onChange={(event) =>
                  handleStatusChange(event.target.value as SessionStatusValue)
                }
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box
              sx={{
                p: 2.5,
                background:
                  'linear-gradient(135deg, rgba(155, 139, 158, 0.10) 0%, rgba(212, 184, 138, 0.08) 100%)',
                border: '1px solid rgba(155, 139, 158, 0.12)',
                borderRadius: '14px',
                textAlign: 'left',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.65)',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: '#8B7F87',
                  fontWeight: 700,
                  display: 'block',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  mb: 0.75,
                }}
              >
                {isTimeSelected
                  ? entryMode === 'schedule'
                    ? 'Scheduled for'
                    : `${getSessionStatusLabel(formData.status)} on`
                  : 'Date & time'}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#4E444D',
                  fontSize: '15px',
                  fontWeight: 600,
                  lineHeight: 1.35,
                  letterSpacing: '-0.1px',
                }}
              >
                {isTimeSelected
                  ? `${format(parse(`${formData.date} ${formData.time}`, 'yyyy-MM-dd HH:mm', new Date()), 'EEEE, MMMM d')} at ${format(parse(formData.time, 'HH:mm', new Date()), 'h:mm a')}`
                  : entryMode === 'schedule'
                    ? 'Choose a future time from the timeline.'
                    : 'Choose a past time from the timeline.'}
              </Typography>
              {isTimeSelected ? (
                <Box sx={{ mt: 0.75 }} />
              ) : null}
            </Box>

            {showRecurringControls ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  onClick={() => {
                    if (!isRecurring && packageSessionLimit != null) {
                      setRecurringCount(String(packageSessionLimit));
                    }
                    setIsRecurring((current) => !current);
                  }}
                  startIcon={<SwapHorizIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    alignSelf: 'flex-start',
                    minWidth: 0,
                    px: 1.75,
                    py: 1,
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: isRecurring ? '#8F7C98' : '#6F6964',
                    bgcolor: isRecurring ? 'rgba(155, 139, 158, 0.12)' : 'transparent',
                    border: isRecurring
                      ? '1px solid rgba(155, 139, 158, 0.18)'
                      : '1px solid transparent',
                    '&:hover': {
                      bgcolor: isRecurring
                        ? 'rgba(155, 139, 158, 0.16)'
                        : '#F9F8F7',
                    },
                  }}
                >
                  {isRecurring ? 'Repeating' : 'Make recurring'}
                </Button>

                {isRecurring ? (
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={recurringFrequency}
                      onChange={(event) =>
                        setRecurringFrequency(event.target.value as RecurringFrequency)
                      }
                    >
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="biweekly">Biweekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </TextField>
                    <TextField
                      size="small"
                      type="number"
                      value={recurringCount}
                      onChange={(event) =>
                        setRecurringCount(
                          clampRecurringCount(event.target.value, packageSessionLimit),
                        )
                      }
                      inputProps={{
                        min: 1,
                        max: packageSessionLimit ?? undefined,
                        step: 1,
                      }}
                      sx={{ width: '176px', flexShrink: 0 }}
                      helperText={
                        packageSessionLimit != null
                          ? `Max ${formatSessionCount(packageSessionLimit)}`
                          : 'Number of sessions'
                      }
                    />
                  </Box>
                ) : null}
              </Box>
            ) : null}

            {submitError ? <Alert severity="error">{submitError}</Alert> : null}
          </Box>

          <Box
            sx={{
              flex: '0 0 60%',
              minWidth: 0,
              bgcolor: '#FDFCFB',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              pl: 5,
            }}
          >
            <Box
              sx={{
                px: 4,
                pt: 3,
                pb: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: colors.text.primary, fontSize: '24px', mb: 0.5, letterSpacing: '-0.3px' }}>
                  {format(selectedDate, 'EEEE, MMMM d')}
                </Typography>
                <Typography variant="body2" sx={{ color: colors.text.tertiary, fontSize: '13px' }}>
                  {timelineSummary}
                  {entryMode === 'logPast' ? ` | ${getSessionStatusLabel(formData.status)}` : ''}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                <IconButton
                  onClick={() => handleDateChange(addDays(selectedDate, -1))}
                  disabled={previousDateDisabled}
                  size="small"
                >
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton
                  onClick={() => handleDateChange(addDays(selectedDate, 1))}
                  disabled={nextDateDisabled}
                  size="small"
                >
                  <ChevronRightIcon />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ flex: 1, px: 4, pb: 3, overflow: 'hidden' }}>
              <TimelineAvailability
                selectedDate={selectedDate}
                events={events}
                selectedTime={formData.time}
                onDateChange={handleDateChange}
                onTimeSelect={(time) => handleChange('time', time)}
                selectionMode={selectionMode}
              />
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 4,
            py: 2.5,
            borderTop: '1px solid #F2F0EE',
            bgcolor: '#FDFCFB',
          }}
        >
          <Button
            onClick={onClose}
            sx={{
              color: '#7A746F',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '14px',
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!formData.clientId || !formData.time || isSubmitting}
            sx={{
              bgcolor: '#9B8B9E',
              color: '#FFFFFF',
              fontWeight: 700,
              textTransform: 'none',
              px: 4.5,
              py: 1.5,
              borderRadius: '10px',
              fontSize: '15px',
              '&:hover': {
                bgcolor: '#8A7A8D',
              },
              '&:disabled': {
                bgcolor: '#E8E5E1',
                color: '#C7C2BD',
              },
            }}
          >
            {primaryActionLabel}
          </Button>
        </Box>
      </form>
    </Dialog>
  );
}



