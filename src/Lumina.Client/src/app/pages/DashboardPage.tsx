import { useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { format } from 'date-fns';
import { useNavigate } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { MetricCard } from '../components/MetricCard';
import { UpcomingSessions } from '../components/UpcomingSessions';
import { ClientOverview } from '../components/ClientOverview';
import { apiClient } from '../api/client';
import type { DashboardDto } from '../api/types';

export function DashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardDto | null>(null);

  useEffect(() => {
    apiClient.getDashboard().then(setDashboard).catch(() => setDashboard(null));
  }, []);

  const metrics = useMemo(() => ([
    {
      title: 'Active Clients',
      value: String(dashboard?.activeClients ?? 0),
      trend: { value: '+0%', direction: 'up' as const },
      icon: <PeopleIcon />,
      color: '#6E5BCE',
    },
    {
      title: 'Sessions This Month',
      value: String(dashboard?.sessionsThisMonth ?? 0),
      trend: { value: '+0%', direction: 'up' as const },
      icon: <EventNoteIcon />,
      color: '#2E7D32',
    },
    {
      title: 'Revenue (MTD)',
      value: `$${dashboard?.revenueMtd?.toLocaleString() ?? '0'}`,
      trend: { value: '+0%', direction: 'up' as const },
      icon: <AttachMoneyIcon />,
      color: '#0288D1',
    },
    {
      title: 'Calendar Filled',
      value: `${dashboard?.calendarFilledPercent ?? 0}%`,
      trend: { value: '+0%', direction: 'up' as const },
      icon: <CalendarMonthIcon />,
      color: '#0097A7',
      subtitle: 'Based on available working hours this month',
    },
  ]), [dashboard]);

  const upcomingSessions = (dashboard?.upcomingSessions ?? []).map((session) => ({
    id: session.id,
    clientName: session.client,
    sessionType: session.sessionType,
    time: format(new Date(session.date), 'h:mm a'),
    date: format(new Date(session.date), 'EEEE'),
    fullDate: new Date(session.date),
    status: session.status === 'upcoming' ? 'upcoming' : 'completed',
    platform: session.location === 'zoom' ? 'Zoom' : session.location,
  }));

  const clients = dashboard?.activeClientPreview ?? [];

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const metricLinks = [
    () => navigate('/clients', { state: { statusFilter: 'active', fromDashboard: true } }),
    () => navigate('/sessions', { state: { dateRange: 'this-month', fromDashboard: true } }),
    () => navigate('/billing'),
    () => navigate('/calendar', { state: { viewMonth: 'current', fromDashboard: true } }),
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle={currentDate} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(12, 1fr)' }, gap: { xs: 3, sm: 4, md: 4 }, columnGap: { lg: 4 } }}>
        {metrics.map((metric, index) => (
          <Box key={index} sx={{ gridColumn: { xs: 'span 1', sm: 'span 1', lg: 'span 3' } }}>
            <MetricCard {...metric} onClick={metricLinks[index]} />
          </Box>
        ))}
        <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2', lg: 'span 7' }, mt: { xs: 2, md: 2 } }}>
          <UpcomingSessions sessions={upcomingSessions} />
        </Box>
        <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2', lg: 'span 5' }, mt: { xs: 0, sm: 0, md: 2 } }}>
          <ClientOverview clients={clients} />
        </Box>
      </Box>
    </>
  );
}
