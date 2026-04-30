import { Card, CardContent, Box, Typography, Chip, IconButton } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import PersonIcon from '@mui/icons-material/Person';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { endOfDay, isAfter, isSameMonth, isToday } from 'date-fns';
import { useNavigate } from 'react-router';
import type { SessionStatusValue } from '../api/types';
import { getSessionStatusBadgeStyles, getSessionStatusLabel } from '../lib/sessionStatus';
import { colors } from '../styles/colors';

interface Session {
  id: string;
  clientName: string;
  sessionType: string;
  time: string;
  date: string;
  fullDate: Date;
  status: SessionStatusValue;
  platform?: string;
}

interface UpcomingSessionsProps {
  sessions: Session[];
}

export function UpcomingSessions({ sessions }: UpcomingSessionsProps) {
  const navigate = useNavigate();
  const now = new Date();
  const todaysSessions = sessions.filter((session) => isToday(session.fullDate));
  const remainingMonthSessions = sessions.filter(
    (session) => isSameMonth(session.fullDate, now) && isAfter(session.fullDate, endOfDay(now)),
  );

  const handleSessionClick = (session: Session) => {
    navigate(`/sessions?focusSessionId=${session.id}`);
  };

  const handleViewAll = () => {
    navigate('/sessions?range=thisMonth');
  };

  const renderSession = (session: Session) => {
    const statusColors = getSessionStatusBadgeStyles(session.status);

    return (
      <Box
        key={session.id}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          p: 3,
          borderRadius: '12px',
          bgcolor: colors.neutral.gray50,
          border: `1px solid ${colors.border.subtle}`,
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: colors.neutral.gray100,
            borderColor: colors.neutral.gray300,
            transform: 'translateY(-2px)',
          },
        }}
        onClick={() => handleSessionClick(session)}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '10px',
            bgcolor: colors.primary.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <PersonIcon />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              color: colors.text.primary,
              mb: 0.5,
            }}
          >
            {session.clientName}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: colors.text.secondary,
              fontSize: '14px',
            }}
          >
            {session.sessionType}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: 0.75,
              flexWrap: 'wrap',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: colors.text.tertiary,
                fontSize: '12px',
              }}
            >
              {session.date} • {session.time}
            </Typography>
            {session.platform && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <VideocamIcon sx={{ fontSize: 14, color: colors.text.tertiary }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: colors.text.tertiary,
                    fontSize: '12px',
                  }}
                >
                  {session.platform}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={getSessionStatusLabel(session.status)}
            size="small"
            sx={{
              bgcolor: statusColors.bg,
              color: statusColors.text,
              border: `1px solid ${statusColors.border}`,
              fontWeight: 600,
              fontSize: '12px',
              height: 24,
              borderRadius: '6px',
            }}
          />
          <IconButton size="small" disabled sx={{ color: colors.text.secondary }}>
            {/* TODO(nav): wire upcoming session row overflow actions when actions menu is implemented. */}
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    );
  };

  const renderEmptyState = (message: string) => (
    <Box sx={{ p: 3, borderRadius: '12px', bgcolor: colors.neutral.gray50 }}>
      <Typography variant="body2" sx={{ color: colors.text.tertiary }}>
        {message}
      </Typography>
    </Box>
  );

  return (
    <Card
      sx={{
        bgcolor: 'white',
        border: `1px solid ${colors.border.subtle}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ p: { xs: 4, md: 5 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 5,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: colors.text.primary,
            }}
          >
            Today's Sessions
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: colors.text.secondary,
              fontWeight: 600,
              cursor: 'pointer',
              '&:hover': {
                color: colors.primary.main,
              },
            }}
            onClick={handleViewAll}
          >
            View All
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {todaysSessions.length > 0
              ? todaysSessions.map(renderSession)
              : renderEmptyState('No sessions scheduled for today.')}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: colors.text.primary,
              }}
            >
              Upcoming Sessions
            </Typography>
            {remainingMonthSessions.length > 0
              ? remainingMonthSessions.map(renderSession)
              : renderEmptyState('No more sessions scheduled this month.')}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
