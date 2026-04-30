import { Box, Container, Typography } from '@mui/material';
import { AudienceSection, CTASection, FeatureSection, SectionHeading } from '../components/landing/LandingSections';
import { Seo } from '../components/landing/Seo';
import { colors } from '../theme';

export function FeaturesPage() {
  return (
    <>
      <Seo
        title="Features | Lumina"
        description="Explore Lumina features for client profiles, scheduling, session notes, billing, packages, and practice visibility."
        path="/features"
      />
      <Box component="section" sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography component="h1" sx={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: { xs: '42px', sm: '56px', md: '64px' }, fontWeight: 700, lineHeight: 1.08, mb: 3 }}>
            Everything your practice needs, in one place
          </Typography>
          <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '17px', md: '19px' }, lineHeight: 1.7 }}>
            Lumina keeps daily practice operations organized without forcing you into a heavy enterprise system.
          </Typography>
        </Container>
      </Box>
      <FeatureSection />
      <Box component="section" sx={{ py: { xs: 8, md: 11 } }}>
        <Container maxWidth="lg">
          <SectionHeading eyebrow="Why it works" title="Designed around repeat client work">
            <Typography sx={{ color: colors.text.secondary, fontSize: '17px', lineHeight: 1.7 }}>
              Every workflow starts with the client: their sessions, notes, payments, packages, and next steps stay connected.
            </Typography>
          </SectionHeading>
        </Container>
      </Box>
      <AudienceSection />
      <CTASection title="Ready to simplify your workflow?" />
    </>
  );
}
