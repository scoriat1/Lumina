import { Box, Stack } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useNavigate } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { MetricCard } from '../components/MetricCard';
import { UpcomingSessions } from '../components/UpcomingSessions';
import { ClientOverview } from '../components/ClientOverview';
import { colors } from '../styles/colors';

// Mock data for metrics
const metrics = [
  {
    title: 'Active Clients',
    value: '48',
    trend: { value: '+12%', direction: 'up' as const },
    icon: <PeopleIcon />,
    color: '#6E5BCE', // Purple
  },
  {
    title: 'Sessions This Month',
    value: '127',
    trend: { value: '+8%', direction: 'up' as const },
    icon: <EventNoteIcon />,
    color: '#2E7D32', // Green
  },
  {
    title: 'Revenue (MTD)',
    value: '$18,400',
    trend: { value: '+15%', direction: 'up' as const },
    icon: <AttachMoneyIcon />,
    color: '#0288D1', // Blue
  },
  {
    title: 'Calendar Filled',
    value: '82%',
    trend: { value: '+6%', direction: 'up' as const },
    icon: <CalendarMonthIcon />,
    color: '#0097A7', // Deep teal
    subtitle: 'Based on available working hours this month',
  },
];

// Mock data for upcoming sessions
const upcomingSessions = [
  {
    id: '1',
    clientName: 'Avery Fields',
    sessionType: 'Values Alignment',
    time: '2:00 PM',
    date: 'Wednesday',
    fullDate: new Date(2026, 1, 11, 14, 0), // Feb 11, 2026, 2:00 PM
    status: 'upcoming' as const,
    platform: 'Zoom',
  },
  {
    id: '2',
    clientName: 'Jordan Lee',
    sessionType: 'Leadership Growth',
    time: '3:30 PM',
    date: 'Wednesday',
    fullDate: new Date(2026, 1, 11, 15, 30), // Feb 11, 2026, 3:30 PM
    status: 'upcoming' as const,
    platform: 'Zoom',
  },
  {
    id: '3',
    clientName: 'Sam Rivera',
    sessionType: 'Confidence Reset',
    time: '10:00 AM',
    date: 'Thursday',
    fullDate: new Date(2026, 1, 12, 10, 0), // Feb 12, 2026, 10:00 AM
    status: 'upcoming' as const,
    platform: 'Zoom',
  },
  {
    id: '4',
    clientName: 'Morgan Blake',
    sessionType: 'Career Transition',
    time: '1:00 PM',
    date: 'Thursday',
    fullDate: new Date(2026, 1, 12, 13, 0), // Feb 12, 2026, 1:00 PM
    status: 'upcoming' as const,
    platform: 'Zoom',
  },
];

// Mock data for clients
const clients = [
  {
    id: '1',
    name: 'Alex Thompson',
    initials: 'AT',
    avatarColor: '#9B8B9E',
    program: 'Executive Leadership',
    progress: 75,
    sessionsCompleted: 9,
    totalSessions: 12,
    nextSession: 'Feb 12, 2:00 PM',
    status: 'active' as const,
  },
  {
    id: '2',
    name: 'Taylor Chen',
    initials: 'TC',
    avatarColor: '#A8B5A0',
    program: 'Career Development',
    progress: 50,
    sessionsCompleted: 6,
    totalSessions: 12,
    nextSession: 'Feb 14, 4:00 PM',
    status: 'active' as const,
  },
  {
    id: '3',
    name: 'Jamie Patel',
    initials: 'JP',
    avatarColor: '#9DAAB5',
    program: 'Work-Life Balance',
    progress: 33,
    sessionsCompleted: 4,
    totalSessions: 12,
    nextSession: 'Feb 15, 11:00 AM',
    status: 'active' as const,
  },
  {
    id: '4',
    name: 'Casey Martinez',
    initials: 'CM',
    avatarColor: '#D4B88A',
    program: 'Confidence & Communication',
    progress: 67,
    sessionsCompleted: 8,
    totalSessions: 12,
    nextSession: 'Feb 16, 3:00 PM',
    status: 'active' as const,
  },
];

export function DashboardPage() {
  const navigate = useNavigate();
  
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const metricLinks = [
    () => navigate('/clients', { state: { statusFilter: 'active', fromDashboard: true } }),  // Active Clients
    () => navigate('/sessions', { state: { dateRange: 'this-month', fromDashboard: true } }), // Sessions This Month
    () => navigate('/billing'),  // Revenue this Month
    () => navigate('/calendar', { state: { viewMonth: 'current', fromDashboard: true } }),  // Calendar Filled
  ];

  return (
    <>
      <PageHeader 
        title="Dashboard" 
        subtitle={currentDate}
      />

      {/* 12-Column Grid Container - All content aligns to this grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(12, 1fr)', // 12-column grid for perfect alignment
          },
          gap: { xs: 3, sm: 4, md: 4 }, // Consistent gap throughout
          columnGap: { lg: 4 }, // Explicit column gap for precision
        }}
      >
        {/* Metric Cards - Each spans 3 columns (3+3+3+3 = 12) */}
        {metrics.map((metric, index) => (
          <Box
            key={index}
            sx={{
              gridColumn: {
                xs: 'span 1',
                sm: 'span 1',
                lg: 'span 3', // Each metric card takes 3 columns
              },
            }}
          >
            <MetricCard {...metric} onClick={metricLinks[index]} />
          </Box>
        ))}

        {/* Upcoming Sessions - Spans 7 columns */}
        <Box
          sx={{
            gridColumn: {
              xs: 'span 1',
              sm: 'span 2',
              lg: 'span 7', // 7 columns to match metric alignment
            },
            mt: { xs: 2, md: 2 }, // Consistent spacing after metrics
          }}
        >
          <UpcomingSessions sessions={upcomingSessions} />
        </Box>

        {/* Active Clients - Spans 5 columns */}
        <Box
          sx={{
            gridColumn: {
              xs: 'span 1',
              sm: 'span 2',
              lg: 'span 5', // 5 columns (7+5 = 12)
            },
            mt: { xs: 0, sm: 0, md: 2 }, // Consistent spacing after metrics
          }}
        >
          <ClientOverview clients={clients} />
        </Box>
      </Box>
    </>
  );
}