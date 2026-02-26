import { Box, Grid, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { PageHeader } from '../../components/layout/PageHeader';
import { Section } from '../../components/layout/Section';
import { MetricCard } from '../../components/common/MetricCard';
import { SessionCard } from '../../components/sessions/SessionCard';
import { colors } from '../../theme';

// Mock data
const metrics = [
  {
    title: 'Active Clients',
    value: '48',
    trend: { value: '+12%', direction: 'up' as const },
    icon: <PeopleIcon />,
    iconColor: colors.brand.purple,
  },
  {
    title: 'Sessions This Month',
    value: '127',
    trend: { value: '+8%', direction: 'up' as const },
    icon: <EventNoteIcon />,
    iconColor: colors.semantic.success.main,
  },
  {
    title: 'Revenue (MTD)',
    value: '$18,400',
    trend: { value: '+15%', direction: 'up' as const },
    icon: <AttachMoneyIcon />,
    iconColor: '#0288D1',
  },
  {
    title: 'Calendar Filled',
    value: '82%',
    trend: { value: '+6%', direction: 'up' as const },
    icon: <CalendarMonthIcon />,
    iconColor: '#0097A7',
    subtitle: 'Based on available working hours',
  },
];

const upcomingSessions = [
  {
    id: '1',
    clientName: 'Avery Fields',
    clientInitials: 'AF',
    clientColor: colors.avatarPalette[0],
    sessionType: 'Values Alignment',
    time: '2:00 PM',
    date: 'Wednesday',
    location: 'zoom' as const,
    status: 'upcoming' as const,
  },
  {
    id: '2',
    clientName: 'Jordan Lee',
    clientInitials: 'JL',
    clientColor: colors.avatarPalette[1],
    sessionType: 'Leadership Growth',
    time: '3:30 PM',
    date: 'Wednesday',
    location: 'zoom' as const,
    status: 'upcoming' as const,
  },
  {
    id: '3',
    clientName: 'Sam Rivera',
    clientInitials: 'SR',
    clientColor: colors.avatarPalette[2],
    sessionType: 'Confidence Reset',
    time: '10:00 AM',
    date: 'Thursday',
    location: 'zoom' as const,
    status: 'upcoming' as const,
  },
];

export function DashboardPage() {
  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening today."
        actions={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
          >
            New Session
          </Button>
        }
      />

      {/* Metrics Grid */}
      <Section>
        <Grid container spacing={3}>
          {metrics.map((metric, index) => (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
              <MetricCard {...metric} />
            </Grid>
          ))}
        </Grid>
      </Section>

      {/* Upcoming Sessions */}
      <Section 
        title="Today's Sessions" 
        subtitle={`${upcomingSessions.length} sessions scheduled`}
        headerActions={
          <Button
            size="small"
            sx={{
              color: colors.text.tertiary,
              '&:hover': {
                bgcolor: colors.surface.elevated,
              },
            }}
          >
            View All
          </Button>
        }
      >
        <Grid container spacing={2}>
          {upcomingSessions.map((session) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={session.id}>
              <SessionCard {...session} />
            </Grid>
          ))}
        </Grid>
      </Section>
    </Box>
  );
}