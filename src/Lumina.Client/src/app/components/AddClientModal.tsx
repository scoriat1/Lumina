import { useState, useEffect } from 'react';
import {
  Dialog,
  TextField,
  Button,
  Box,
  Typography,
  MenuItem,
  IconButton,
  Divider,
  InputAdornment,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import { format } from 'date-fns';

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (clientData: ClientFormData) => void;
}

export interface ClientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'active' | 'paused' | 'closed';
  startDate: string;
  notes: string;
}

export function AddClientModal({ open, onClose, onSave }: AddClientModalProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'active',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        status: 'active',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
      });
      setErrors({});
    }
  }, [open]);

  const handleChange = (field: keyof ClientFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave?.(formData);
      onClose();
    }
  };

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      bgcolor: '#FFFFFF',
      borderRadius: '12px',
      transition: 'all 0.2s ease',
      '& fieldset': {
        borderColor: '#E8E5E1',
        borderWidth: '1.5px',
      },
      '&:hover': {
        '& fieldset': {
          borderColor: '#C9C4BF',
        },
      },
      '&.Mui-focused': {
        bgcolor: '#FFFFFF',
        '& fieldset': {
          borderColor: '#9B8B9E',
          borderWidth: '2px',
        },
      },
    },
    '& .MuiInputLabel-root': {
      color: '#7A746F',
      fontWeight: 500,
      '&.Mui-focused': {
        color: '#9B8B9E',
        fontWeight: 600,
      },
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: '#F9FAFB',
          boxShadow: '0 20px 60px rgba(74, 69, 66, 0.18)',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          position: 'relative',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFCFB 100%)',
          borderBottom: '1px solid #E8E5E1',
          pt: 4.5,
          px: 5,
          pb: 4,
        }}
      >
        <IconButton 
          onClick={onClose} 
          sx={{ 
            position: 'absolute',
            top: 20,
            right: 20,
            color: '#9B9691',
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            '&:hover': {
              bgcolor: 'rgba(155, 139, 158, 0.1)',
              color: '#6D5F70',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              bgcolor: 'rgba(155, 139, 158, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PersonOutlineIcon sx={{ fontSize: 24, color: '#9B8B9E' }} />
          </Box>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600, 
                color: '#1F1C1A', 
                fontSize: '26px',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              Add New Client
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Form Content */}
      <Box sx={{ p: 5, maxHeight: '60vh', overflowY: 'auto' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {/* Left Column - Contact Information */}
          <Stack spacing={2.5}>
            <TextField
              label="First Name"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              error={!!errors.firstName}
              required
              fullWidth
              sx={inputStyles}
            />
            
            <TextField
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              error={!!errors.lastName}
              required
              fullWidth
              sx={inputStyles}
            />

            <TextField
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={!!errors.email}
              required
              fullWidth
              placeholder="name@example.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ color: '#9B9691', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />
            
            <TextField
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneOutlinedIcon sx={{ color: '#9B9691', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />

            <TextField
              label="Status"
              select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              fullWidth
              sx={{
                ...inputStyles,
                '& .MuiSelect-select': {
                  fontWeight: 500,
                  color: '#6B6762',
                },
              }}
            >
              <MenuItem value="active">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#7A8873' }} />
                  <Typography sx={{ fontSize: '15px', color: '#4A4542' }}>Active</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="paused">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#A88F5F' }} />
                  <Typography sx={{ fontSize: '15px', color: '#4A4542' }}>Paused</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="closed">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#6D5F70' }} />
                  <Typography sx={{ fontSize: '15px', color: '#4A4542' }}>Closed</Typography>
                </Box>
              </MenuItem>
            </TextField>

            <TextField
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarTodayOutlinedIcon sx={{ color: '#9B9691', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />
          </Stack>

          {/* Right Column - Notes */}
          <Stack spacing={2.5}>
            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Add any important notes about this client..."
              fullWidth
              multiline
              rows={12}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                    <NotesOutlinedIcon sx={{ color: '#9B9691', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                ...inputStyles,
                '& .MuiOutlinedInput-root': {
                  ...inputStyles['& .MuiOutlinedInput-root'],
                  alignItems: 'flex-start',
                },
              }}
            />
          </Stack>
        </Box>
      </Box>

      {/* Footer Actions - Sticky */}
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
          px: 5,
          py: 2.5,
          bgcolor: '#F9FAFB',
          borderTop: '1px solid #E8E5E1',
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: '#D0CCC7',
            color: '#6B6762',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            py: 1.5,
            px: 3,
            fontSize: '15px',
            borderWidth: '1.5px',
            minWidth: '120px',
            '&:hover': {
              borderColor: '#9B8B9E',
              borderWidth: '1.5px',
              bgcolor: 'rgba(155, 139, 158, 0.04)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            bgcolor: '#9B8B9E',
            color: '#FFFFFF',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            py: 1.5,
            px: 3,
            fontSize: '15px',
            minWidth: '120px',
            boxShadow: '0 4px 16px rgba(155, 139, 158, 0.3)',
            '&:hover': {
              bgcolor: '#8A7A8D',
              boxShadow: '0 6px 24px rgba(155, 139, 158, 0.4)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          Add Client
        </Button>
      </Box>
    </Dialog>
  );
}