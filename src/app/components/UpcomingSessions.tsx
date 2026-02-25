import { Card, CardContent, Box, Typography, Chip, IconButton } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import PersonIcon from '@mui/icons-material/Person';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useNavigate } from 'react-router';
import { colors } from '../styles/colors';

interface Session {
  id: string;
  clientName: string;
  sessionType: string;
  time: string;
  date: string;
  fullDate: Date;
  status: 'scheduled' | 'upcoming' | 'completed';
  platform?: string;
}

interface UpcomingSessionsProps {
  sessions: Session[];
}

export function UpcomingSessions({ sessions }: UpcomingSessionsProps) {
  const navigate = useNavigate();

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'scheduled':
        return { bg: 'rgba(157, 170, 181, 0.12)', text: '#7A8A96' };
      case 'upcoming':
        return { bg: 'rgba(168, 181, 160, 0.12)', text: '#7A8873' };
      case 'completed':
        return { bg: 'rgba(155, 139, 158, 0.12)', text: '#6D5F70' };
      default:
        return { bg: 'rgba(122, 116, 111, 0.12)', text: '#7A746F' };
    }
  };

  const handleSessionClick = (session: Session) => {
    navigate('/sessions', { 
      state: { 
        sessionId: session.id,
        fromDashboard: true,
      }
    });
  };

  const handleViewAll = () => {
    navigate('/sessions');
  };

  return (
    <Card sx={{
      bgcolor: 'white',
      border: `1px solid ${colors.border.subtle}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      height: '100%', // Match height with sibling card
      display: 'flex',
      flexDirection: 'column',
    }}>
      <CardContent sx={{ p: { xs: 4, md: 5 }, flex: 1, display: 'flex', flexDirection: 'column' }}> {/* Increased padding for more breathing room */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 5, // Increased margin below header
        }}>
          <Typography variant="h6" sx={{
            fontWeight: 600,
            color: colors.text.primary,
          }}>
            Upcoming Sessions
          </Typography>
          <Typography variant="body2" sx={{
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

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}> {/* Increased gap between items */}
          {sessions.map((session) => {
            const statusColors = getStatusColor(session.status);
            return (
              <Box
                key={session.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3, // Increased gap inside session items
                  p: 3, // Increased padding inside session items
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
                <Box sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '10px',
                  bgcolor: colors.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}>
                  <PersonIcon />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body1" sx={{
                    fontWeight: 600,
                    color: colors.text.primary,
                    mb: 0.5, // Increased spacing
                  }}>
                    {session.clientName}
                  </Typography>
                  <Typography variant="body2" sx={{
                    color: colors.text.secondary,
                    fontSize: '14px',
                  }}>
                    {session.sessionType}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    mt: 0.75, // Increased top margin
                    flexWrap: 'wrap',
                  }}>
                    <Typography variant="caption" sx={{
                      color: colors.text.tertiary,
                      fontSize: '12px',
                    }}>
                      {session.date} • {session.time}
                    </Typography>
                    {session.platform && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <VideocamIcon sx={{ fontSize: 14, color: colors.text.tertiary }} />
                        <Typography variant="caption" sx={{
                          color: colors.text.tertiary,
                          fontSize: '12px',
                        }}>
                          {session.platform}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    size="small"
                    sx={{
                      bgcolor: statusColors.bg,
                      color: statusColors.text,
                      fontWeight: 600,
                      fontSize: '12px',
                      height: 24,
                      borderRadius: '6px',
                    }}
                  />
                  <IconButton size="small" sx={{ color: colors.text.secondary }}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}