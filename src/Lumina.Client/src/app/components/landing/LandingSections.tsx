import { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import { Box, Button, Card, Container, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import NotesIcon from '@mui/icons-material/Notes';
import PaymentsIcon from '@mui/icons-material/Payments';
import PeopleIcon from '@mui/icons-material/People';
import { motion } from 'motion/react';
import { colors } from '../../theme';

const MotionBox = motion.create(Box);
const MotionTypography = motion.create(Typography);

const fadeIn = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

export const landingButtonSx = {
  bgcolor: colors.brand.purple,
  color: '#fff',
  fontSize: { xs: '16px', sm: '17px' },
  fontWeight: 700,
  textTransform: 'none',
  px: { xs: 4, sm: 5 },
  py: 1.6,
  borderRadius: '10px',
  boxShadow: `0 4px 16px ${colors.brand.purple}40`,
  '&:hover': {
    bgcolor: colors.brand.purpleDark,
    boxShadow: `0 6px 20px ${colors.brand.purple}55`,
  },
};

export function Hero() {
  return (
    <Box component="section" sx={{ position: 'relative', pt: { xs: 8, md: 13 }, pb: { xs: 8, md: 12 }, overflow: 'hidden' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 0.9fr' }, gap: { xs: 6, lg: 8 }, alignItems: 'center' }}>
          <Box sx={{ textAlign: { xs: 'center', lg: 'left' } }}>
            <MotionTypography
              component="h1"
              {...fadeIn}
              sx={{
                fontFamily: '"Crimson Pro", Georgia, serif',
                fontSize: { xs: '42px', sm: '56px', md: '68px' },
                fontWeight: 700,
                lineHeight: 1.06,
                color: colors.text.primary,
                mb: 3,
              }}
            >
              Stop using five apps to run your practice
            </MotionTypography>
            <MotionTypography
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: 0.1 }}
              sx={{
                fontSize: { xs: '18px', md: '21px' },
                lineHeight: 1.65,
                color: colors.text.secondary,
                mb: 4,
                maxWidth: 720,
                mx: { xs: 'auto', lg: 0 },
              }}
            >
              Client info, calendar, notes, and payments get scattered fast. Lumina brings them together in one calm system for client-based practices.
            </MotionTypography>
            <MotionBox {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.2 }}>
              <Button component={RouterLink} to="/signup" variant="contained" sx={landingButtonSx}>
                Start Free Trial
              </Button>
              <Typography sx={{ mt: 2.5, color: colors.text.tertiary, fontSize: '14px' }}>
                14 day free trial · No credit card required
              </Typography>
            </MotionBox>
          </Box>
          <ProductPreview />
        </Box>
      </Container>
    </Box>
  );
}

function ProductPreview() {
  return (
    <MotionBox
      {...fadeIn}
      transition={{ ...fadeIn.transition, delay: 0.25 }}
      aria-label="Lumina dashboard preview"
      sx={{
        border: `1px solid ${colors.border.medium}`,
        borderRadius: '18px',
        bgcolor: '#fff',
        boxShadow: '0 24px 70px rgba(31, 28, 26, 0.12)',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ bgcolor: colors.neutral.gray50, borderBottom: `1px solid ${colors.border.subtle}`, px: 2.5, py: 1.5, display: 'flex', gap: 1 }}>
        {[0, 1, 2].map((dot) => <Box key={dot} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: colors.neutral.gray300 }} />)}
      </Box>
      <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Typography sx={{ fontSize: '13px', fontWeight: 700, color: colors.text.tertiary, mb: 2 }}>
          TODAY
        </Typography>
        <Stack spacing={1.5}>
          {[
            ['9:00 AM', 'Alex Thompson', 'Leadership session'],
            ['11:30 AM', 'Taylor Chen', 'Career transition'],
            ['2:00 PM', 'Jamie Patel', 'Progress review'],
          ].map(([time, name, detail]) => (
            <Box key={name} sx={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 2, p: 1.5, borderRadius: '10px', bgcolor: colors.neutral.gray50 }}>
              <Typography sx={{ color: colors.brand.purple, fontWeight: 700, fontSize: '13px' }}>{time}</Typography>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '15px' }}>{name}</Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: '13px' }}>{detail}</Typography>
              </Box>
            </Box>
          ))}
        </Stack>
        <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <Metric label="Paid this month" value="$3,240" />
          <Metric label="Open notes" value="8" />
        </Box>
      </Box>
    </MotionBox>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ p: 2, borderRadius: '10px', border: `1px solid ${colors.border.subtle}` }}>
      <Typography sx={{ color: colors.text.tertiary, fontSize: '12px', mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ color: colors.text.primary, fontWeight: 800, fontSize: '22px' }}>{value}</Typography>
    </Box>
  );
}

export function FeatureSection() {
  const features = [
    { title: 'Client profiles', icon: <PeopleIcon />, body: "See every client's contact info, session history, and notes in one place." },
    { title: 'Calendar', icon: <CalendarMonthIcon />, body: 'Book sessions, check availability, and see your week without switching tools.' },
    { title: 'Session notes', icon: <NotesIcon />, body: 'Write structured notes, use templates, add timestamps, and search across everything later.' },
    { title: 'Billing', icon: <PaymentsIcon />, body: 'Track who paid, who owes what, and manage session packages without spreadsheets.' },
  ];

  return (
    <Box component="section" sx={{ py: { xs: 8, md: 11 }, bgcolor: colors.neutral.gray50 }}>
      <Container maxWidth="lg">
        <SectionHeading eyebrow="What Lumina does" title="One system for your client work" />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2.5 }}>
          {features.map((feature) => (
            <Card key={feature.title} sx={{ p: 3, borderRadius: '12px', boxShadow: 'none', border: `1px solid ${colors.border.subtle}` }}>
              <Box sx={{ color: colors.brand.purple, mb: 2, '& svg': { fontSize: 28 } }}>{feature.icon}</Box>
              <Typography component="h3" sx={{ fontSize: '18px', fontWeight: 800, mb: 1 }}>{feature.title}</Typography>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.65, fontSize: '15px' }}>{feature.body}</Typography>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

export function AudienceSection() {
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 11 } }}>
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography component="h2" sx={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: { xs: '32px', md: '42px' }, fontWeight: 700, mb: 2 }}>
          Built for people who work one-on-one
        </Typography>
        <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '16px', sm: '18px' }, lineHeight: 1.75 }}>
          Coaches, therapists, tutors, consultants, nutritionists, music teachers, speech therapists, and any practice that schedules sessions and keeps client notes.
        </Typography>
      </Container>
    </Box>
  );
}

export function PricingSection({ compact = false }: { compact?: boolean }) {
  const features = ['Unlimited clients', 'Unlimited sessions', 'Session notes with templates', 'Calendar and scheduling', 'Billing and payment tracking', 'Package management', 'Mobile-friendly access'];

  return (
    <Box component="section" sx={{ py: { xs: 8, md: compact ? 8 : 12 } }}>
      <Container maxWidth="sm">
        <Card sx={{ p: { xs: 3, sm: 5 }, borderRadius: '16px', border: `3px solid ${colors.brand.purple}`, boxShadow: `0 20px 60px ${colors.brand.purple}20` }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography component={compact ? 'h2' : 'p'} sx={{ color: colors.text.tertiary, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 2 }}>
              Lumina
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', mb: 2 }}>
              <Typography sx={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: { xs: '56px', sm: '66px' }, fontWeight: 700, lineHeight: 1 }}>$30</Typography>
              <Typography sx={{ ml: 1, color: colors.text.tertiary, fontSize: '18px' }}>/month</Typography>
            </Box>
            <Typography sx={{ color: colors.text.secondary, mb: 3 }}>14 day free trial. No credit card needed.</Typography>
            <Button component={RouterLink} to="/signup" variant="contained" fullWidth sx={landingButtonSx}>
              Start Free Trial
            </Button>
          </Box>
          <Stack spacing={1.8} sx={{ pt: 4, borderTop: `1px solid ${colors.border.subtle}` }}>
            {features.map((feature) => (
              <Box key={feature} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <CheckCircleIcon sx={{ color: colors.brand.purple, fontSize: 21 }} />
                <Typography sx={{ color: colors.text.secondary, fontSize: '15px' }}>{feature}</Typography>
              </Box>
            ))}
          </Stack>
        </Card>
      </Container>
    </Box>
  );
}

export function CTASection({ title = 'Try it free, then $30/month', body = 'Start with a clean practice workspace today. No credit card required.' }: { title?: string; body?: string }) {
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 11 }, bgcolor: colors.neutral.gray50 }}>
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography component="h2" sx={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: { xs: '34px', md: '46px' }, fontWeight: 700, mb: 2 }}>
          {title}
        </Typography>
        <Typography sx={{ color: colors.text.secondary, fontSize: '17px', mb: 4 }}>{body}</Typography>
        <Button component={RouterLink} to="/signup" variant="contained" sx={landingButtonSx}>
          Start Free Trial
        </Button>
      </Container>
    </Box>
  );
}

export function SectionHeading({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <Box sx={{ textAlign: 'center', maxWidth: 720, mx: 'auto', mb: { xs: 4, md: 6 } }}>
      {eyebrow ? <Typography sx={{ color: colors.brand.purple, fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>{eyebrow}</Typography> : null}
      <Typography component="h2" sx={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: { xs: '34px', md: '46px' }, fontWeight: 700, lineHeight: 1.15, mb: children ? 2 : 0 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}
