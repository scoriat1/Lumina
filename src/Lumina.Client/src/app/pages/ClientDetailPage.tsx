import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  Avatar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WorkIcon from '@mui/icons-material/Work';
import { format } from 'date-fns';
import { colors } from '../styles/colors';
import { NewSessionModal } from '../components/NewSessionModal';
import { SessionDetailsDrawer } from '../components/SessionDetailsDrawer';
import { apiClient } from '../api/client';
import type { ClientDto, SessionDto } from '../api/types';

export function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientDto | null>(null);
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);

  const loadData = async () => {
    if (!id) return;
    const [clientData, sessionData] = await Promise.all([
      apiClient.getClient(id),
      apiClient.getClientSessions(id),
    ]);
    setClient(clientData);
    setSessions(sessionData);
  };

  useEffect(() => {
    loadData().catch(() => {
      setClient(null);
      setSessions([]);
    });
  }, [id]);

  const nextSessionLabel = useMemo(() => {
    if (!client?.nextSession) return 'No upcoming session';
    return format(new Date(client.nextSession), 'MMM d, yyyy • h:mm a');
  }, [client?.nextSession]);

  if (!id) {
    return <Typography>Client not found.</Typography>;
  }

  if (!client) {
    return <Typography>Loading client...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/clients')} sx={{ textTransform: 'none' }}>
          Back to Clients
        </Button>
      </Box>

      <Box sx={{ bgcolor: 'white', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: client.avatarColor }}>{client.initials}</Avatar>
            <Typography variant="h5">{client.name}</Typography>
            <Chip label={client.status} size="small" />
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsNewSessionModalOpen(true)}>
            New Session
          </Button>
        </Box>

        <Typography variant="body2" sx={{ color: 'rgba(100,100,100,0.8)', mb: 2 }}>
          Client since {format(new Date(client.startDate), 'MMMM d, yyyy')}
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
          <Card variant="outlined"><CardContent><Typography variant="caption">Sessions</Typography><Typography>{client.sessionsCompleted}/{client.totalSessions}</Typography></CardContent></Card>
          <Card variant="outlined"><CardContent><Typography variant="caption">Program</Typography><Typography>{client.program}</Typography></CardContent></Card>
          <Card variant="outlined"><CardContent><Typography variant="caption">Next Session</Typography><Typography>{nextSessionLabel}</Typography></CardContent></Card>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><EmailIcon sx={{ color: colors.text.tertiary }} /><Typography>{client.email}</Typography></Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PhoneIcon sx={{ color: colors.text.tertiary }} /><Typography>{client.phone}</Typography></Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><WorkIcon sx={{ color: colors.text.tertiary }} /><Typography>{client.program}</Typography></Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CalendarTodayIcon sx={{ color: colors.text.tertiary }} /><Typography>{format(new Date(client.startDate), 'MMM d, yyyy')}</Typography></Box>
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Sessions</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {sessions.map((session) => (
            <Card
              key={session.id}
              variant="outlined"
              sx={{ cursor: 'pointer' }}
              onClick={() => {
                setSelectedSessionId(session.id);
                setDrawerOpen(true);
              }}
            >
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>{session.sessionType}</Typography>
                <Typography>{format(new Date(session.date), 'MMM d, yyyy • h:mm a')}</Typography>
              </CardContent>
            </Card>
          ))}
          {sessions.length === 0 && <Typography variant="body2">No sessions yet.</Typography>}
        </Box>
      </Box>

      <SessionDetailsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sessionId={selectedSessionId}
        sessions={sessions.map((s) => ({ ...s, date: new Date(s.date) }))}
        onUpdateSession={async () => {
          await loadData();
        }}
      />

      <NewSessionModal
        open={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        preselectedClientId={client.id}
        onCreated={async () => {
          await loadData();
        }}
      />
    </Box>
  );
}
