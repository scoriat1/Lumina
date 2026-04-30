import { Box, Button, Container, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { CTASection, PricingSection } from '../components/landing/LandingSections';
import { Seo } from '../components/landing/Seo';
import { colors } from '../theme';

export function PricingPage() {
  return (
    <>
      <Seo
        title="Pricing | Lumina"
        description="Simple Lumina pricing for client-based practices that need client profiles, sessions, notes, packages, scheduling, and payments."
        path="/pricing"
      />
      <Box component="section" sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography component="h1" sx={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: { xs: '42px', sm: '56px', md: '64px' }, fontWeight: 700, lineHeight: 1.08, mb: 3 }}>
            What it costs
          </Typography>
          <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '17px', md: '19px' }, lineHeight: 1.7 }}>
            Simple pricing for a complete practice workspace.
          </Typography>
        </Container>
      </Box>
      <PricingSection />
      <Box component="section" sx={{ pb: { xs: 8, md: 12 } }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography component="h2" sx={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: { xs: '32px', md: '40px' }, fontWeight: 700, mb: 2 }}>
            Questions?
          </Typography>
          <Typography sx={{ color: colors.text.secondary, mb: 3 }}>We are here to help.</Typography>
          <Button component={RouterLink} to="/contact" variant="outlined" sx={{ color: colors.brand.purple, borderColor: colors.brand.purple, textTransform: 'none', fontWeight: 700, borderRadius: '9px', px: 4 }}>
            Get in touch
          </Button>
        </Container>
      </Box>
      <CTASection title="Start with a free trial" body="Set up clients, sessions, notes, and payments in one calm workspace." />
    </>
  );
}
