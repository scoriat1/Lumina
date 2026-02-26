import { Alert, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

const providers = [
  { id: 'google', label: 'Continue with Google' },
  { id: 'microsoft', label: 'Continue with Microsoft' },
  { id: 'github', label: 'Continue with GitHub' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { loginWithOAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleLogin = async (provider: string) => {
    setError(null);
    setLoadingProvider(provider);

    try {
      await loginWithOAuth(provider);
      navigate('/');
    } catch {
      setError('Unable to sign in. Please try again.');
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h4" fontWeight={700}>Lumina</Typography>
            <Typography color="text.secondary">Sign in to access your dashboard.</Typography>

            {error ? <Alert severity="error">{error}</Alert> : null}

            {providers.map((provider) => (
              <Button
                key={provider.id}
                variant="contained"
                onClick={() => handleLogin(provider.id)}
                disabled={loadingProvider !== null}
              >
                {loadingProvider === provider.id ? 'Signing in…' : provider.label}
              </Button>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
