import { Box, Card, CardContent, Typography, IconButton } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VideocamIcon from '@mui/icons-material/Videocam';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import { UserAvatar } from '../common/UserAvatar';
import { StatusBadge } from '../common/StatusBadge';
import { colors, typography, borderRadius, shadows, transitions } from '../../theme';

interface SessionCardProps {
  clientName: string;
  clientInitials: string;
  clientColor: string;
  sessionType: string;
  time: string;
  date?: string;
  location: 'zoom' | 'phone' | 'office';
  status: 'upcoming' | 'completed' | 'cancelled';
  onClick?: () => void;
}

export function SessionCard({
  clientName,
  clientInitials,
  clientColor,
  sessionType,
  time,
  date,
  location,
  status,
  onClick,
}: SessionCardProps) {
  const getLocationIcon = () => {
    switch (location) {
      case 'zoom':
        return <VideocamIcon sx={{ fontSize: 16 }} />;
      case 'phone':
        return <PhoneIcon sx={{ fontSize: 16 }} />;
      case 'office':
        return <BusinessIcon sx={{ fontSize: 16 }} />;
    }
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: borderRadius.lg,
        boxShadow: shadows.sm,
        transition: transitions.base,
        '&:hover': onClick
          ? {
              boxShadow: shadows.md,
              transform: 'translateY(-2px)',
            }
          : undefined,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <UserAvatar initials={clientInitials} color={clientColor} size="lg" />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                  fontSize: typography.fontSize.base,
                }}
              >
                {clientName}
              </Typography>
              <IconButton size="small" sx={{ ml: 1 }}>
                <MoreVertIcon sx={{ fontSize: 18, color: colors.text.muted }} />
              </IconButton>
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: colors.text.secondary,
                fontSize: typography.fontSize.sm,
                mb: 1.5,
              }}
            >
              {sessionType}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ color: colors.text.tertiary }}>{getLocationIcon()}</Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: colors.text.tertiary,
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.medium,
                  }}
                >
                  {time}
                  {date && ` • ${date}`}
                </Typography>
              </Box>

              <StatusBadge status={status} type="session" />
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
