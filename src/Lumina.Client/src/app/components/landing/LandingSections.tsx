import { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import { Box, Button, Card, Container, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import Inventory2Icon from '@mui/icons-material/Inventory2';
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
              Run your client-based practice in one simple system
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
              Keep clients, sessions, notes, scheduling, packages, and payments organized in one calm workspace.
            </MotionTypography>
            <MotionBox {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.2 }}>
              <Button component={RouterLink} to="/signup" variant="contained" sx={landingButtonSx}>
                Start Free Trial
              </Button>
              <Typography sx={{ mt: 2, color: colors.text.secondary, fontSize: '15px', fontWeight: 700 }}>
                Set up your practice workspace in minutes.
              </Typography>
              <Typography sx={{ mt: 0.75, color: colors.text.tertiary, fontSize: '14px' }}>
                14 day free trial - No credit card required
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
            ['9:00 AM', 'Initial consultation', 'Notes saved'],
            ['11:30 AM', 'Intake session', 'Payment pending'],
            ['2:00 PM', 'Follow-up (package)', 'Package: 2 of 6 used'],
          ].map(([time, name, detail]) => (
            <Box key={`${time}-${name}`} sx={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 2, p: 1.5, borderRadius: '10px', bgcolor: colors.neutral.gray50 }}>
              <Typography sx={{ color: colors.brand.purple, fontWeight: 700, fontSize: '13px' }}>{time}</Typography>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '15px' }}>{name}</Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: '13px' }}>{detail}</Typography>
              </Box>
            </Box>
          ))}
        </Stack>
        <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <Metric label="Payments tracked" value="$3,240" />
          <Metric label="Notes organized" value="8" />
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

export function ProblemReliefSection() {
  return (
    <Box component="section" sx={{ py: { xs: 5, md: 7 } }}>
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography component="h2" sx={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: { xs: '30px', md: '38px' }, fontWeight: 700, mb: 1.5 }}>
          Running your practice should not feel scattered.
        </Typography>
        <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '16px', sm: '18px' }, lineHeight: 1.7 }}>
          Lumina gives your client work one steady place to live.
        </Typography>
      </Container>
    </Box>
  );
}

export function FeatureSection() {
  const features = [
    { title: 'Client profiles', icon: <PeopleIcon />, body: "Keep each client's contact details, session history, notes, and next steps easy to find." },
    { title: 'Calendar', icon: <CalendarMonthIcon />, body: 'Schedule sessions, see your week clearly, and reduce back-and-forth around availability.' },
    { title: 'Session notes', icon: <NotesIcon />, body: 'Capture session notes with templates so important details stay connected to the client.' },
    { title: 'Billing', icon: <PaymentsIcon />, body: 'Track paid, pending, and unpaid sessions without maintaining a separate spreadsheet.' },
    { title: 'Packages', icon: <Inventory2Icon />, body: 'Manage session packages and remaining sessions so client commitments stay clear.' },
  ];

  return (
    <Box component="section" sx={{ py: { xs: 8, md: 11 }, bgcolor: colors.neutral.gray50 }}>
      <Container maxWidth="lg">
        <SectionHeading eyebrow="What Lumina does" title="Everything you need to stay organized">
          <Typography sx={{ color: colors.text.secondary, fontSize: '17px', lineHeight: 1.7 }}>
            Stay organized, save time, and keep client work moving without piecing together multiple tools.
          </Typography>
        </SectionHeading>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(5, 1fr)' }, gap: 2.5 }}>
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

export function TrustSection() {
  return (
    <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography sx={{ color: colors.brand.purple, fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
          Designed for growing client-based practices
        </Typography>
        <Typography component="h2" sx={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: { xs: '30px', md: '38px' }, fontWeight: 700, lineHeight: 1.18 }}>
          Built to help practices feel organized from day one.
        </Typography>
      </Container>
    </Box>
  );
}

export function AudienceSection() {
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 11 } }}>
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography component="h2" sx={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: { xs: '32px', md: '42px' }, fontWeight: 700, mb: 2 }}>
          Built for session-based practices
        </Typography>
        <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '16px', sm: '18px' }, lineHeight: 1.75 }}>
          For providers who schedule client sessions, keep notes, manage packages, and track payments - without piecing together multiple tools.
        </Typography>
        <Typography sx={{ color: colors.text.tertiary, fontSize: '15px', lineHeight: 1.7, mt: 2 }}>
          Useful across wellness, education, consulting, therapy, coaching, and other client-based services.
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
            <Typography sx={{ color: colors.text.primary, fontWeight: 700, mb: 1 }}>
              Simple pricing for a complete practice workspace.
            </Typography>
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

export function CTASection({ title = 'Ready to simplify your practice?', body = 'Start with a clean workspace for clients, sessions, notes, and payments.' }: { title?: string; body?: string }) {
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
