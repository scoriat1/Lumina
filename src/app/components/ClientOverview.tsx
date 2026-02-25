import { Card, CardContent, Box, Typography, Avatar, Chip, LinearProgress } from '@mui/material';
import { useNavigate } from 'react-router';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import IconButton from '@mui/material/IconButton';
import { colors } from '../styles/colors';

interface Client {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  program: string;
  progress: number;
  sessionsCompleted: number;
  totalSessions: number;
  nextSession?: string;
  status: 'active' | 'paused' | 'completed';
}

interface ClientOverviewProps {
  clients: Client[];
}

export function ClientOverview({ clients }: ClientOverviewProps) {
  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case 'active':
        return { bg: 'rgba(168, 181, 160, 0.12)', text: '#7A8873' };
      case 'paused':
        return { bg: 'rgba(212, 184, 138, 0.12)', text: '#A88F5F' };
      case 'completed':
        return { bg: 'rgba(155, 139, 158, 0.12)', text: '#6D5F70' };
      default:
        return { bg: 'rgba(122, 116, 111, 0.12)', text: '#7A746F' };
    }
  };

  const navigate = useNavigate();

  const handleClientClick = (client: Client) => {
    navigate('/clients', {
      state: {
        clientId: client.id,
        fromDashboard: true,
      }
    });
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
            Active Clients
          </Typography>
          <Typography variant="body2" sx={{
            color: colors.text.secondary,
            fontWeight: 600,
            cursor: 'pointer',
            '&:hover': {
              color: colors.primary.main,
            },
          }}
          onClick={() => navigate('/clients')}
          >
            View All
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}> {/* Increased gap between items */}
          {clients.map((client) => {
            const statusColors = getStatusColor(client.status);
            return (
              <Box
                key={client.id}
                sx={{
                  p: 3.5, // Increased padding inside client items
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
                onClick={() => handleClientClick(client)}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 3, // Increased gap
                  mb: 3, // Increased margin
                }}>
                  <Avatar sx={{
                    width: 52,
                    height: 52,
                    bgcolor: client.avatarColor,
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '16px',
                  }}>
                    {client.initials}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 0.75, // Increased spacing
                    }}>
                      <Typography variant="body1" sx={{
                        fontWeight: 600,
                        color: colors.text.primary,
                      }}>
                        {client.name}
                      </Typography>
                      <IconButton size="small" sx={{ color: colors.text.secondary, mt: -0.5 }}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    <Typography variant="body2" sx={{
                      color: colors.text.secondary,
                      fontSize: '14px',
                      mb: 2, // Increased spacing
                    }}>
                      {client.program}
                    </Typography>

                    <Chip
                      label={client.status.charAt(0).toUpperCase() + client.status.slice(1)}
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
                  </Box>
                </Box>

                <Box>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1.5, // Increased margin
                  }}>
                    <Typography variant="caption" sx={{
                      color: colors.text.secondary,
                      fontSize: '13px',
                      fontWeight: 500,
                    }}>
                      Progress
                    </Typography>
                    <Typography variant="caption" sx={{
                      color: colors.text.primary,
                      fontSize: '13px',
                      fontWeight: 600,
                    }}>
                      {client.sessionsCompleted}/{client.totalSessions} sessions
                    </Typography>
                  </Box>
                  
                  <LinearProgress
                    variant="determinate"
                    value={client.progress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(110, 91, 206, 0.12)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: client.avatarColor,
                        borderRadius: 4,
                      },
                    }}
                  />

                  {client.nextSession && (
                    <Typography variant="caption" sx={{
                      color: colors.text.tertiary,
                      fontSize: '12px',
                      mt: 1.5, // Increased top margin
                      display: 'block',
                    }}>
                      Next session: {client.nextSession}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}