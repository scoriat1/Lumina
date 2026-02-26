import { useState, useEffect } from 'react';
import {
  Dialog,
  TextField,
  Button,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VideocamIcon from '@mui/icons-material/Videocam';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import { format } from 'date-fns';

interface EditSessionModalProps {
  open: boolean;
  onClose: () => void;
  session: any;
  onSave: (updates: any) => void;
}

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

const statusOptions = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function EditSessionModal({ open, onClose, session, onSave }: EditSessionModalProps) {
  const [formData, setFormData] = useState({
    sessionType: '',
    date: '',
    time: '',
    duration: 60,
    method: 'zoom' as 'zoom' | 'phone' | 'office',
    status: 'upcoming',
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (session && open) {
      setFormData({
        sessionType: session.sessionType || '',
        date: format(session.date, 'yyyy-MM-dd'),
        time: format(session.date, 'HH:mm'),
        duration: session.duration || 60,
        method: session.location || 'zoom',
        status: session.status || 'upcoming',
      });
    }
  }, [session, open]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine date and time into a single date object
    const updatedDateTime = new Date(`${formData.date}T${formData.time}`);
    
    onSave({
      sessionType: formData.sessionType,
      date: updatedDateTime,
      duration: formData.duration,
      location: formData.method,
      status: formData.status,
    });
    
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#FDFCFB',
          borderRadius: '12px',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2.5,
          borderBottom: '2px solid #9B8B9E',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#9B8B9E', fontSize: '18px' }}>
          Edit Session
        </Typography>

        <IconButton
          onClick={onClose}
          sx={{
            color: '#C7C2BD',
            '&:hover': {
              bgcolor: 'rgba(155, 139, 158, 0.06)',
              color: '#9A9490',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Box sx={{ px: 3, py: 3 }}>
          <Stack spacing={2.5}>
            {/* Session Title */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#4A4542',
                  fontWeight: 600,
                  mb: 0.75,
                  display: 'block',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                }}
              >
                Session Title <Box component="span" sx={{ color: '#9A9490', fontStyle: 'italic', fontWeight: 400 }}>(optional)</Box>
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={formData.sessionType}
                onChange={(e) => handleChange('sessionType', e.target.value)}
                sx={{
                  bgcolor: '#FFFFFF',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: '#E8E5E1',
                      borderWidth: '1.5px',
                    },
                    '&:hover fieldset': {
                      borderColor: '#9B8B9E',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#9B8B9E',
                      borderWidth: '2px',
                    },
                  },
                }}
              >
                <MenuItem value="">
                  <Typography variant="body2" sx={{ fontSize: '14px', color: '#9A9490', fontStyle: 'italic' }}>
                    No title
                  </Typography>
                </MenuItem>
                {sessionTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Date and Time */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#4A4542',
                    fontWeight: 600,
                    mb: 0.75,
                    display: 'block',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                  }}
                >
                  Date
                </Typography>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                  sx={{
                    bgcolor: '#FFFFFF',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      '& fieldset': {
                        borderColor: '#E8E5E1',
                        borderWidth: '1.5px',
                      },
                      '&:hover fieldset': {
                        borderColor: '#9B8B9E',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#9B8B9E',
                        borderWidth: '2px',
                      },
                    },
                  }}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#4A4542',
                    fontWeight: 600,
                    mb: 0.75,
                    display: 'block',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                  }}
                >
                  Time
                </Typography>
                <TextField
                  type="time"
                  fullWidth
                  size="small"
                  value={formData.time}
                  onChange={(e) => handleChange('time', e.target.value)}
                  required
                  sx={{
                    bgcolor: '#FFFFFF',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      '& fieldset': {
                        borderColor: '#E8E5E1',
                        borderWidth: '1.5px',
                      },
                      '&:hover fieldset': {
                        borderColor: '#9B8B9E',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#9B8B9E',
                        borderWidth: '2px',
                      },
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Duration and Method */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Box sx={{ flex: '0 0 40%' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#4A4542',
                    fontWeight: 600,
                    mb: 0.75,
                    display: 'block',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                  }}
                >
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
                    bgcolor: '#FFFFFF',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      '& fieldset': {
                        borderColor: '#E8E5E1',
                        borderWidth: '1.5px',
                      },
                      '&:hover fieldset': {
                        borderColor: '#9B8B9E',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#9B8B9E',
                        borderWidth: '2px',
                      },
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
                <Typography
                  variant="caption"
                  sx={{
                    color: '#4A4542',
                    fontWeight: 600,
                    mb: 0.75,
                    display: 'block',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                  }}
                >
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
                    bgcolor: '#FFFFFF',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      '& fieldset': {
                        borderColor: '#E8E5E1',
                        borderWidth: '1.5px',
                      },
                      '&:hover fieldset': {
                        borderColor: '#9B8B9E',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#9B8B9E',
                        borderWidth: '2px',
                      },
                    },
                  }}
                >
                  <MenuItem value="zoom">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VideocamIcon sx={{ fontSize: 16, color: '#9B8B9E' }} />
                      <span>Zoom</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="phone">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon sx={{ fontSize: 16, color: '#9B8B9E' }} />
                      <span>Phone</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="office">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon sx={{ fontSize: 16, color: '#9B8B9E' }} />
                      <span>In Person</span>
                    </Box>
                  </MenuItem>
                </TextField>
              </Box>
            </Box>

            {/* Status */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#4A4542',
                  fontWeight: 600,
                  mb: 0.75,
                  display: 'block',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                }}
              >
                Status
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                required
                sx={{
                  bgcolor: '#FFFFFF',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: '#E8E5E1',
                      borderWidth: '1.5px',
                    },
                    '&:hover fieldset': {
                      borderColor: '#9B8B9E',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#9B8B9E',
                      borderWidth: '2px',
                    },
                  },
                }}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Stack>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            borderTop: '1.5px solid #E8E5E1',
            display: 'flex',
            gap: 1.5,
          }}
        >
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              flex: 1,
              borderColor: '#E8E5E1',
              color: '#4A4542',
              fontWeight: 600,
              textTransform: 'none',
              py: 1.25,
              '&:hover': {
                borderColor: '#D0CCC7',
                bgcolor: '#F9F8F7',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{
              flex: 1,
              bgcolor: '#9B8B9E',
              color: '#FFFFFF',
              fontWeight: 600,
              textTransform: 'none',
              py: 1.25,
              '&:hover': {
                bgcolor: '#8A7A8D',
              },
            }}
          >
            Save Changes
          </Button>
        </Box>
      </form>
    </Dialog>
  );
}