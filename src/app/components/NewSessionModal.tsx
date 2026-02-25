import { useState, useEffect } from 'react';
import {
  Dialog,
  TextField,
  Button,
  MenuItem,
  Box,
  Typography,
  Avatar,
  IconButton,
  Fade,
  Collapse,
  Autocomplete,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VideocamIcon from '@mui/icons-material/Videocam';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import RepeatIcon from '@mui/icons-material/Repeat';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { format, parse, addWeeks } from 'date-fns';
import { TimelineAvailability } from './TimelineAvailability';
import { calendarEvents } from '../data/calendarEvents';
import { colors } from '../styles/colors';

interface NewSessionModalProps {
  open: boolean;
  onClose: () => void;
  preselectedClientId?: string; // Optional: pre-populate the client dropdown
  initialDate?: string; // Optional: pre-populate date in yyyy-MM-dd format
  initialTime?: string; // Optional: pre-populate time in HH:mm format
}

// Mock clients data
const clients = [
  {
    id: '1',
    name: 'Avery Fields',
    initials: 'AF',
    avatarColor: colors.brand.purple,
    packages: [
      { id: 'pkg1', name: 'Confidence Package', remaining: 3, total: 8 },
      { id: 'pkg2', name: 'Career Growth Package', remaining: 5, total: 10 },
    ],
    hasBillingPlan: false,
  },
  {
    id: '2',
    name: 'Jordan Lee',
    initials: 'JL',
    avatarColor: colors.semantic.success.main,
    packages: [{ id: 'pkg3', name: 'Leadership Package', remaining: 7, total: 12 }],
    hasBillingPlan: true,
    billingPlanName: 'Monthly Wellness Plan',
  },
  { id: '3', name: 'Riley Harper', initials: 'RH', avatarColor: colors.brand.purple, packages: [], hasBillingPlan: false },
  { id: '4', name: 'Dakota Smith', initials: 'DS', avatarColor: colors.neutral[600], packages: [], hasBillingPlan: false },
  {
    id: '5',
    name: 'Sam Rivera',
    initials: 'SR',
    avatarColor: colors.neutral[600],
    packages: [],
    hasBillingPlan: false,
  },
  { id: '6', name: 'Morgan Blake', initials: 'MB', avatarColor: colors.brand.purple, packages: [], hasBillingPlan: false },
  { id: '7', name: 'Alex Thompson', initials: 'AT', avatarColor: colors.brand.purple, packages: [], hasBillingPlan: false },
  { id: '8', name: 'Taylor Chen', initials: 'TC', avatarColor: colors.semantic.success.main, packages: [], hasBillingPlan: false },
];

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

export function NewSessionModal({ open, onClose, preselectedClientId, initialDate, initialTime }: NewSessionModalProps) {
  const [formData, setFormData] = useState({
    clientId: preselectedClientId || '',
    sessionType: '',
    date: initialDate || format(new Date(), 'yyyy-MM-dd'),
    time: initialTime || '',
    duration: 60,
    method: 'zoom' as 'zoom' | 'phone' | 'office',
    billingSource: 'pay-per-session' as 'pay-per-session' | 'package' | 'billing-plan',
    packageId: '',
  });

  const [recurringData, setRecurringData] = useState({
    enabled: false,
    repeat: 'weekly' as 'weekly' | 'biweekly' | 'monthly',
    occurrences: 6,
  });

  const selectedClient = clients.find((c) => c.id === formData.clientId);

  // Initialize billing source when modal opens with a preselected client
  useEffect(() => {
    if (preselectedClientId && open) {
      const client = clients.find((c) => c.id === preselectedClientId);
      if (client) {
        setFormData((prev) => {
          let billingSource: 'pay-per-session' | 'package' | 'billing-plan' = 'pay-per-session';
          let packageId = '';
          
          if (client.hasBillingPlan) {
            billingSource = 'billing-plan';
          } else if (client.packages && client.packages.length > 0) {
            billingSource = 'package';
            packageId = client.packages[0].id;
          }
          
          return {
            ...prev,
            clientId: preselectedClientId,
            billingSource,
            packageId,
          };
        });
      }
    }
  }, [preselectedClientId, open]);

  // Update date and time when modal opens with initial values from calendar
  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        date: initialDate || format(new Date(), 'yyyy-MM-dd'),
        time: initialTime || '',
      }));
    }
  }, [initialDate, initialTime, open]);

  const selectedDateTime =
    formData.date && formData.time
      ? parse(`${formData.date} ${formData.time}`, 'yyyy-MM-dd HH:mm', new Date())
      : parse(formData.date, 'yyyy-MM-dd', new Date());

  const isTimeSelected = Boolean(formData.time);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating session:', { formData, recurringData });
    onClose();
    // Reset
    setFormData({
      clientId: '',
      sessionType: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '',
      duration: 60,
      method: 'zoom',
      billingSource: 'pay-per-session',
      packageId: '',
    });
    setRecurringData({ enabled: false, repeat: 'weekly', occurrences: 6 });
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-select billing source based on client
    if (field === 'clientId') {
      const client = clients.find((c) => c.id === value);
      if (client?.hasBillingPlan) {
        setFormData((prev) => ({ ...prev, billingSource: 'billing-plan', packageId: '' }));
      } else if (client?.packages && client.packages.length > 0) {
        setFormData((prev) => ({ ...prev, billingSource: 'package', packageId: client.packages[0].id }));
      } else {
        setFormData((prev) => ({ ...prev, billingSource: 'pay-per-session', packageId: '' }));
      }
    }
  };

  const handleRecurringChange = (field: string, value: any) => {
    setRecurringData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (newDate: Date) => {
    setFormData((prev) => ({ ...prev, date: format(newDate, 'yyyy-MM-dd') }));
  };

  const handleTimeSelect = (time: string) => {
    setFormData((prev) => ({ ...prev, time }));
  };

  const getBillingLabel = () => {
    if (formData.billingSource === 'billing-plan' && selectedClient?.hasBillingPlan) {
      return selectedClient.billingPlanName;
    }
    if (formData.billingSource === 'package' && formData.packageId) {
      const pkg = selectedClient?.packages?.find((p) => p.id === formData.packageId);
      return pkg ? `${pkg.name} (${pkg.remaining} left)` : 'Package';
    }
    return 'Pay per session — $150';
  };

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
          maxWidth: '1200px',
          maxHeight: '90vh',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      // Modal scrolls, not content
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'flex-start',
          pt: 4,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 4,
          py: 2.5,
          borderBottom: `2px solid ${colors.brand.purple}`,
          flexShrink: 0,
          background: 'white',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.brand.purple, fontSize: '21px', letterSpacing: '-0.3px' }}>
          Schedule Session
        </Typography>

        <IconButton
          onClick={onClose}
          sx={{
            color: colors.text.tertiary,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: colors.surface.elevated,
              color: colors.brand.purple,
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Content - 40/60 split, NO nested scrollbars */}
        <Box
          sx={{
            display: 'flex',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {/* LEFT COLUMN - Form 40% width, NO internal scrolling */}
          <Box
            sx={{
              flex: '0 0 40%',
              px: 4,
              py: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            {/* Client */}
            <Box>
              <Typography variant="caption" sx={{ color: colors.text.primary, fontWeight: 600, mb: 0.75, display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Client
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={formData.clientId}
                onChange={(e) => handleChange('clientId', e.target.value)}
                placeholder="Select client"
                required
                sx={{
                  bgcolor: colors.background.pure,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    minHeight: '42px',
                    '& fieldset': {
                      borderColor: colors.border.medium,
                      borderWidth: '1.5px',
                    },
                    '&:hover fieldset': {
                      borderColor: colors.primary.lavenderLight,
                      borderWidth: '1.5px',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: colors.primary.lavender,
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiSelect-select': {
                    py: 1,
                    fontWeight: 500,
                    color: colors.text.primary,
                  },
                }}
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', overflow: 'hidden' }}>
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          bgcolor: client.avatarColor,
                          fontSize: '11px',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {client.initials}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {client.name}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Session Title */}
            <Box>
              <Typography variant="caption" sx={{ color: colors.text.primary, fontWeight: 600, mb: 0.75, display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Session Title <Box component="span" sx={{ color: colors.text.tertiary, fontStyle: 'italic', fontWeight: 400 }}>(optional)</Box>
              </Typography>
              <Autocomplete
                freeSolo
                options={sessionTypes}
                value={formData.sessionType}
                onChange={(event, newValue) => {
                  handleChange('sessionType', newValue || '');
                }}
                onInputChange={(event, newInputValue) => {
                  handleChange('sessionType', newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="No title"
                    sx={{
                      bgcolor: colors.background.pure,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        minHeight: '42px',
                        '& fieldset': {
                          borderColor: colors.border.medium,
                          borderWidth: '1.5px',
                        },
                        '&:hover fieldset': {
                          borderColor: colors.primary.lavenderLight,
                          borderWidth: '1.5px',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.primary.lavender,
                          borderWidth: '2px',
                        },
                      },
                    }}
                  />
                )}
              />
            </Box>

            {/* Duration & Method in a row */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Box sx={{ flex: '0 0 40%' }}>
                <Typography variant="caption" sx={{ color: colors.text.primary, fontWeight: 600, mb: 0.75, display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Duration
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  required
                  sx={{
                    bgcolor: colors.background.pure,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      minHeight: '42px',
                      '& fieldset': {
                        borderColor: colors.border.medium,
                        borderWidth: '1.5px',
                      },
                      '&:hover fieldset': {
                        borderColor: colors.primary.lavenderLight,
                        borderWidth: '1.5px',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: colors.primary.lavender,
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiSelect-select': {
                      py: 1,
                      fontWeight: 500,
                      color: colors.text.primary,
                    },
                  }}
                >
                  {durations.map((duration) => (
                    <MenuItem key={duration.value} value={duration.value}>
                      {duration.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box sx={{ flex: '0 0 60%' }}>
                <Typography variant="caption" sx={{ color: colors.text.primary, fontWeight: 600, mb: 0.75, display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Method
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formData.method}
                  onChange={(e) => handleChange('method', e.target.value)}
                  required
                  sx={{
                    bgcolor: colors.background.pure,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      minHeight: '42px',
                      '& fieldset': {
                        borderColor: colors.border.medium,
                        borderWidth: '1.5px',
                      },
                      '&:hover fieldset': {
                        borderColor: colors.primary.lavenderLight,
                        borderWidth: '1.5px',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: colors.primary.lavender,
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiSelect-select': {
                      py: 1,
                      fontWeight: 500,
                      color: colors.text.primary,
                    },
                  }}
                >
                  <MenuItem value="zoom">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VideocamIcon sx={{ fontSize: 16, color: colors.primary.lavender }} />
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

            {/* Divider */}
            <Box sx={{ borderTop: '1px solid #F2F0EE', my: 1 }} />

            {/* Instruction text when no time selected */}
            {!isTimeSelected && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: '#F9F8F7',
                  borderRadius: '10px',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" sx={{ color: '#7A746F', fontSize: '13px', lineHeight: 1.5 }}>
                  Select a time slot from the calendar to continue
                </Typography>
              </Box>
            )}

            {/* Progressive Disclosure: Billing (only after time selected) */}
            <Collapse in={isTimeSelected}>
              <Box>
                <Typography variant="caption" sx={{ color: colors.text.primary, fontWeight: 600, mb: 0.75, display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Billing
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formData.billingSource}
                  onChange={(e) => handleChange('billingSource', e.target.value)}
                  required
                  disabled={!formData.clientId}
                  sx={{
                    bgcolor: colors.background.pure,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      minHeight: '42px',
                      '& fieldset': {
                        borderColor: colors.border.medium,
                        borderWidth: '1.5px',
                      },
                      '&:hover fieldset': {
                        borderColor: colors.primary.lavenderLight,
                        borderWidth: '1.5px',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: colors.primary.lavender,
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiSelect-select': {
                      py: 1,
                      fontWeight: 500,
                      color: colors.text.primary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                  }}
                >
                  <MenuItem value="pay-per-session">Pay per session</MenuItem>
                  <MenuItem value="package" disabled={!selectedClient?.packages || selectedClient.packages.length === 0}>
                    Package
                  </MenuItem>
                  <MenuItem value="billing-plan" disabled={!selectedClient?.hasBillingPlan}>
                    Included in plan
                  </MenuItem>
                </TextField>

                {/* Package Selection */}
                {formData.billingSource === 'package' &&
                  selectedClient?.packages &&
                  selectedClient.packages.length > 0 && (
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={formData.packageId}
                      onChange={(e) => handleChange('packageId', e.target.value)}
                      placeholder="Select package"
                      sx={{
                        mt: 1.5,
                        bgcolor: colors.background.pure,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                          minHeight: '42px',
                          '& fieldset': {
                            borderColor: colors.border.medium,
                            borderWidth: '1.5px',
                          },
                          '&:hover fieldset': {
                            borderColor: colors.primary.lavenderLight,
                            borderWidth: '1.5px',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: colors.primary.lavender,
                            borderWidth: '2px',
                          },
                        },
                        '& .MuiSelect-select': {
                          py: 1,
                        },
                      }}
                    >
                      {selectedClient.packages.map((pkg) => (
                        <MenuItem key={pkg.id} value={pkg.id}>
                          <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {pkg.name} — {pkg.remaining} of {pkg.total} left
                          </Typography>
                        </MenuItem>
                      ))}
                    </TextField>
                  )}

                {/* Billing Plan Info */}
                {formData.billingSource === 'billing-plan' && selectedClient?.hasBillingPlan && (
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1.5,
                      bgcolor: colors.status.successBg,
                      borderRadius: '8px',
                      border: `1px solid ${colors.status.successBorder}`,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: colors.status.success, fontSize: '12px', fontWeight: 600 }}>
                      ✓ Covered by plan
                    </Typography>
                  </Box>
                )}
              </Box>
            </Collapse>

            {/* Progressive Disclosure: Recurring (only after time selected) */}
            <Collapse in={isTimeSelected}>
              <Box sx={{ mt: 1 }}>
                <Button
                  startIcon={<RepeatIcon />}
                  onClick={() => handleRecurringChange('enabled', !recurringData.enabled)}
                  sx={{
                    color: recurringData.enabled ? '#9B8B9E' : '#7A746F',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '13px',
                    px: 1.5,
                    py: 0.75,
                    borderRadius: '8px',
                    bgcolor: recurringData.enabled ? 'rgba(155, 139, 158, 0.08)' : 'transparent',
                    '&:hover': {
                      bgcolor: recurringData.enabled ? 'rgba(155, 139, 158, 0.12)' : '#F9F8F7',
                    },
                  }}
                >
                  {recurringData.enabled ? 'Repeating' : 'Make recurring'}
                </Button>

                <Collapse in={recurringData.enabled}>
                  <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
                    <Box sx={{ flex: '0 0 58%' }}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={recurringData.repeat}
                        onChange={(e) => handleRecurringChange('repeat', e.target.value)}
                        sx={{
                          bgcolor: '#FDFCFB',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            minHeight: '38px',
                            '& fieldset': {
                              borderColor: '#E8E5E1',
                            },
                          },
                          '& .MuiSelect-select': {
                            py: 0.75,
                            fontSize: '13px',
                          },
                        }}
                      >
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="biweekly">Biweekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                      </TextField>
                    </Box>
                    <Box sx={{ flex: '0 0 42%' }}>
                      <TextField
                        type="number"
                        fullWidth
                        size="small"
                        value={recurringData.occurrences}
                        onChange={(e) => handleRecurringChange('occurrences', parseInt(e.target.value))}
                        inputProps={{ min: 2, max: 24 }}
                        placeholder="# times"
                        sx={{
                          bgcolor: '#FDFCFB',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            minHeight: '38px',
                            '& fieldset': {
                              borderColor: '#E8E5E1',
                            },
                          },
                          '& .MuiOutlinedInput-input': {
                            py: 0.75,
                            fontSize: '13px',
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Collapse>
              </Box>
            </Collapse>
          </Box>

          {/* RIGHT COLUMN - Timeline with 60% width */}
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
            {/* Large Date Header with Navigation Arrows */}
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
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    color: colors.text.primary,
                    fontSize: '24px',
                    mb: 0.5,
                    letterSpacing: '-0.3px',
                  }}
                >
                  {format(selectedDateTime, 'EEEE, MMMM d')}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.text.tertiary,
                    fontSize: '13px',
                  }}
                >
                  {isTimeSelected
                    ? `Selected: ${format(parse(formData.time, 'HH:mm', new Date()), 'h:mm a')} • ${formData.duration} min`
                    : 'Click a time slot to schedule'}
                </Typography>
              </Box>

              {/* Date Navigation Arrows */}
              <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                <IconButton
                  onClick={() => handleDateChange(new Date(selectedDateTime.getTime() - 24 * 60 * 60 * 1000))}
                  size="small"
                  sx={{
                    color: colors.text.tertiary,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: colors.interactive.hover,
                      color: colors.primary.lavender,
                    },
                  }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton
                  onClick={() => handleDateChange(new Date(selectedDateTime.getTime() + 24 * 60 * 60 * 1000))}
                  size="small"
                  sx={{
                    color: colors.text.tertiary,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: colors.interactive.hover,
                      color: colors.primary.lavender,
                    },
                  }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Timeline */}
            <Box sx={{ flex: 1, px: 4, pb: 3, overflow: 'hidden' }}>
              <TimelineAvailability
                selectedDate={selectedDateTime}
                events={calendarEvents}
                selectedTime={formData.time}
                onDateChange={handleDateChange}
                onTimeSelect={handleTimeSelect}
              />
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 4,
            py: 2.5,
            borderTop: '1px solid #F2F0EE',
            flexShrink: 0,
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
              '&:hover': {
                bgcolor: '#F2F0EE',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!formData.clientId || !formData.time}
            sx={{
              bgcolor: '#9B8B9E',
              color: '#FFFFFF',
              fontWeight: 700,
              textTransform: 'none',
              px: 4.5,
              py: 1.5,
              borderRadius: '10px',
              fontSize: '15px',
              letterSpacing: '-0.01em',
              boxShadow: '0 3px 10px rgba(155, 139, 158, 0.3)',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: '#8A7A8D',
                boxShadow: '0 6px 16px rgba(155, 139, 158, 0.35)',
                transform: 'translateY(-1px)',
              },
              '&:disabled': {
                bgcolor: '#E8E5E1',
                color: '#C7C2BD',
                boxShadow: 'none',
              },
            }}
          >
            {recurringData.enabled
              ? `Schedule ${recurringData.occurrences} Sessions`
              : 'Schedule Session'}
          </Button>
        </Box>
      </form>
    </Dialog>
  );
}