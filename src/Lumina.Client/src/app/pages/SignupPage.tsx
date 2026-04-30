import { Box, Button, Card, Container, TextField, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { Seo } from '../components/landing/Seo';
import { colors } from '../theme';

export function SignupPage() {
  return (
    <>
      <Seo
        title="Start Free Trial | Lumina"
        description="Start a free Lumina trial for client profiles, scheduling, notes, billing, and packages."
        path="/signup"
      />
      <Box component="section" sx={{ minHeight: 'calc(100vh - 220px)', display: 'flex', alignItems: 'center', py: { xs: 7, md: 10 } }}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography component="h1" sx={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: { xs: '38px', sm: '48px' }, fontWeight: 700, lineHeight: 1.12, mb: 2 }}>
              Start your free trial
            </Typography>
            <Typography sx={{ color: colors.text.secondary, fontSize: '16px' }}>
              Signup is coming soon. Use login if you already have access.
            </Typography>
          </Box>
          <Card sx={{ p: { xs: 3, sm: 4.5 }, borderRadius: '14px', boxShadow: '0 8px 32px rgba(31, 28, 26, 0.08)', border: `1px solid ${colors.border.medium}` }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField label="Name" disabled fullWidth />
              <TextField label="Email" disabled fullWidth />
              <Button disabled variant="contained" sx={{ py: 1.5, textTransform: 'none', fontWeight: 700 }}>
                Signup coming soon
              </Button>
              <Button component={RouterLink} to="/login" variant="text" sx={{ color: colors.brand.purple, textTransform: 'none', fontWeight: 700 }}>
                Already have access? Login
              </Button>
            </Box>
          </Card>
        </Container>
      </Box>
    </>
  );
}
