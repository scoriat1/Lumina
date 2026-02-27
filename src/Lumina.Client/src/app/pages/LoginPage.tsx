import { useState } from 'react';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { Navigate, useNavigate } from 'react-router';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [email, setEmail] = useState('dev@lumina.local');
  const [password, setPassword] = useState('Dev!23456');
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#F7F5F3' }}>
      <Card sx={{ width: 420, borderRadius: 3 }}>
        <CardContent component="form" onSubmit={handleSubmit} sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h5">Login</Typography>
            <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextField type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <Typography color="error">{error}</Typography>}
            <Button type="submit" variant="contained">Sign in</Button>
            <Button type="button" variant="outlined" onClick={() => { window.location.href = apiClient.googleLoginUrl; }}>
              Continue with Google
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
