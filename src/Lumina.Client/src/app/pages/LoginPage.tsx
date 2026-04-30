import { useState } from 'react';
import { Box, Button, Card, CardContent, Divider, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink, Navigate, useNavigate } from 'react-router';
import GoogleIcon from '@mui/icons-material/Google';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Seo } from '../components/landing/Seo';
import { colors } from '../theme';

export function LoginPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [email, setEmail] = useState('dev@lumina.local');
  const [password, setPassword] = useState('Dev!23456');
  const [error, setError] = useState('');

  if (user) return <Navigate to="/app" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/app');
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <>
      <Seo title="Login | Lumina" description="Login to Lumina to manage clients, sessions, notes, payments, and practice settings." path="/login" />
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#F7F5F3', px: 2, py: 6 }}>
        <Box sx={{ width: '100%', maxWidth: 440 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography component="h1" sx={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: { xs: '38px', sm: '46px' }, fontWeight: 700, mb: 1 }}>
              Welcome back
            </Typography>
            <Typography sx={{ color: colors.text.secondary }}>Good to see you again.</Typography>
          </Box>
          <Card sx={{ borderRadius: '14px', boxShadow: '0 8px 32px rgba(31, 28, 26, 0.08)', border: `1px solid ${colors.border.medium}` }}>
            <CardContent component="form" onSubmit={handleSubmit} sx={{ p: { xs: 3, sm: 4.5 } }}>
              <Stack spacing={2.5}>
                <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <TextField type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                {error && <Typography color="error">{error}</Typography>}
                <Button type="submit" variant="contained" sx={{ bgcolor: colors.brand.purple, py: 1.5, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: colors.brand.purpleDark } }}>
                  Log in
                </Button>
                <Divider>or continue with</Divider>
                <Button type="button" variant="outlined" startIcon={<GoogleIcon />} onClick={() => { window.location.href = apiClient.googleLoginUrl; }} sx={{ py: 1.4, textTransform: 'none', fontWeight: 700 }}>
                  Google
                </Button>
              </Stack>
            </CardContent>
          </Card>
          <Typography sx={{ textAlign: 'center', mt: 3, color: colors.text.secondary }}>
            Do not have an account?{' '}
            <Typography component={RouterLink} to="/signup" sx={{ color: colors.brand.purple, fontWeight: 700, textDecoration: 'none' }}>
              Sign up
            </Typography>
          </Typography>
        </Box>
      </Box>
    </>
  );
}
