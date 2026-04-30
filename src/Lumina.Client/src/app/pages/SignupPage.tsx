import { useState } from 'react';
import { Box, Button, Card, Container, Divider, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import GoogleIcon from '@mui/icons-material/Google';
import { Seo } from '../components/landing/Seo';
import { colors } from '../theme';

export function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    practiceName: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (field: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({ ...current, [field]: event.target.value }));
    if (message) setMessage('');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('Signup wiring is coming soon. Your workspace form is ready for backend connection.');
  };

  return (
    <>
      <Seo
        title="Start Free Trial | Lumina"
        description="Start a free Lumina trial for session-based practice management, including clients, scheduling, notes, packages, and payments."
        path="/signup"
      />
      <Box component="section" sx={{ minHeight: 'calc(100vh - 220px)', display: 'flex', alignItems: 'center', py: { xs: 7, md: 10 } }}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography component="h1" sx={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: { xs: '38px', sm: '48px' }, fontWeight: 700, lineHeight: 1.12, mb: 2 }}>
              Start your free trial
            </Typography>
            <Typography sx={{ color: colors.text.secondary, fontSize: '16px' }}>
              Create your Lumina workspace. No credit card required.
            </Typography>
          </Box>
          <Card sx={{ p: { xs: 3, sm: 4.5 }, borderRadius: '14px', boxShadow: '0 8px 32px rgba(31, 28, 26, 0.08)', border: `1px solid ${colors.border.medium}` }}>
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField label="Name" value={formData.name} onChange={handleChange('name')} required fullWidth />
                <TextField label="Email" type="email" value={formData.email} onChange={handleChange('email')} required fullWidth />
                <TextField label="Password" type="password" value={formData.password} onChange={handleChange('password')} required fullWidth />
                <TextField label="Practice name" value={formData.practiceName} onChange={handleChange('practiceName')} required fullWidth />
                {message ? <Typography sx={{ color: colors.text.secondary, fontSize: '14px' }}>{message}</Typography> : null}
                <Button type="submit" variant="contained" sx={{ bgcolor: colors.brand.purple, py: 1.5, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: colors.brand.purpleDark } }}>
                  Start Free Trial
                </Button>
                <Divider>or continue with</Divider>
                <Button type="button" variant="outlined" startIcon={<GoogleIcon />} sx={{ py: 1.4, textTransform: 'none', fontWeight: 700 }}>
                  Continue with Google
                </Button>
                <Button component={RouterLink} to="/login" variant="text" sx={{ color: colors.brand.purple, textTransform: 'none', fontWeight: 700 }}>
                  Already have an account? Log in
                </Button>
              </Stack>
            </Box>
          </Card>
        </Container>
      </Box>
    </>
  );
}
