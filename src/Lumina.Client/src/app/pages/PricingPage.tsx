import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { PricingCard } from '../components/landing/LandingSections';
import { Seo } from '../components/landing/Seo';
import { publicTopSectionSx } from '../components/landing/publicPageStyles';
import { colors } from '../theme';

export function PricingPage() {
  return (
    <>
      <Seo
        title="Pricing | Lumina"
        description="Simple Lumina pricing for client-based practices that need client profiles, sessions, notes, packages, scheduling, and payments."
        path="/pricing"
      />
      <Box component="section" sx={{ ...publicTopSectionSx, textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Stack spacing={{ xs: 5, md: 6 }} sx={{ alignItems: 'stretch' }}>
            <Box>
              <Typography component="h1" sx={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: { xs: '38px', sm: '48px' }, fontWeight: 700, lineHeight: 1.12, mb: 2 }}>
                What it costs
              </Typography>
              <Typography sx={{ color: colors.text.secondary, fontSize: '16px', lineHeight: 1.7 }}>
                Simple pricing for a complete practice workspace.
              </Typography>
            </Box>

            <PricingCard />

            <Box>
              <Typography component="h2" sx={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: { xs: '30px', sm: '36px' }, fontWeight: 700, lineHeight: 1.18, mb: 1.5 }}>
                Questions?
              </Typography>
              <Typography sx={{ color: colors.text.secondary, mb: 3 }}>We are here to help.</Typography>
              <Button component={RouterLink} to="/contact" variant="outlined" sx={{ color: colors.brand.purple, borderColor: colors.brand.purple, textTransform: 'none', fontWeight: 700, borderRadius: '9px', px: 4 }}>
                Get in touch
              </Button>
            </Box>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
