import { useState } from 'react';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { PageHeader } from '../components/PageHeader';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';

type SupportFormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export function SupportPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<SupportFormState>({
    name: user?.displayName ?? '',
    email: user?.email ?? '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendError, setSendError] = useState('');

  const handleChange = (field: keyof SupportFormState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((current) => ({ ...current, [field]: event.target.value }));
    if (submitted) {
      setSubmitted(false);
    }
    if (sendError) {
      setSendError('');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSendError('');

    try {
      await apiClient.sendSupportMessage(formData);
      setSubmitted(true);
      setFormData((current) => ({
        ...current,
        subject: '',
        message: '',
      }));
    } catch (error) {
      setSendError(
        error instanceof Error
          ? error.message
          : 'We could not send your message. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Help & Support"
        subtitle="Need help or want to send feedback? We'd love to hear from you."
      />

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          maxWidth: 720,
          bgcolor: colors.surface.card,
          border: `1px solid ${colors.border.medium}`,
          borderRadius: '14px',
          p: { xs: 3, sm: 4 },
          boxShadow: '0 1px 2px rgba(31, 28, 26, 0.04)',
        }}
      >
        <Stack spacing={2.5}>
          {submitted ? (
            <Alert severity="success" sx={{ borderRadius: '10px' }}>
              Thanks for reaching out. Your message has been sent.
            </Alert>
          ) : null}

          {sendError ? (
            <Alert severity="error" sx={{ borderRadius: '10px' }}>
              {sendError}
            </Alert>
          ) : null}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={handleChange('name')}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              required
              fullWidth
            />
          </Box>

          <TextField
            label="Subject"
            value={formData.subject}
            onChange={handleChange('subject')}
            required
            fullWidth
          />

          <TextField
            label="Message"
            value={formData.message}
            onChange={handleChange('message')}
            required
            fullWidth
            multiline
            minRows={6}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Typography sx={{ color: colors.text.tertiary, fontSize: '13px' }}>
              For urgent issues, include the client/session area you were working in.
            </Typography>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{
                bgcolor: colors.brand.purple,
                color: '#FFFFFF',
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                '&:hover': { bgcolor: colors.brand.purpleDark },
              }}
            >
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
