import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import { ReactNode } from 'react';
import { colors, shadows, borderRadius } from './tokens';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

// ===== STAT CARD COMPONENT =====
// Metric/statistics card for dashboard and overview pages

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  color?: string;
  loading?: boolean;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = colors.primary.main,
  loading = false,
  onClick,
}: StatCardProps) {
  if (loading) {
    return (
      <Card
        sx={{
          bgcolor: colors.background.paper,
          boxShadow: shadows.card,
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.border.subtle}`,
          height: '100%',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={40} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="50%" height={16} sx={{ mt: 1 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      onClick={onClick}
      sx={{
        bgcolor: colors.background.paper,
        boxShadow: shadows.card,
        borderRadius: borderRadius.lg,
        border: `1px solid ${colors.border.subtle}`,
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': onClick
          ? {
              boxShadow: shadows.cardHover,
              transform: 'translateY(-2px)',
            }
          : {},
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header with icon */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: colors.text.tertiary,
              fontSize: '13px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {title}
          </Typography>
          {icon && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: borderRadius.lg,
                bgcolor: `${color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: color,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        {/* Value */}
        <Typography
          variant="h3"
          sx={{
            fontSize: '32px',
            fontWeight: 600,
            color: colors.text.primary,
            mb: 0.5,
          }}
        >
          {value}
        </Typography>

        {/* Subtitle or Trend */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {trend && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color:
                  trend.direction === 'up'
                    ? colors.semantic.success.main
                    : colors.semantic.error.main,
              }}
            >
              {trend.direction === 'up' ? (
                <TrendingUpIcon sx={{ fontSize: 16 }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 16 }} />
              )}
              <Typography
                variant="body2"
                sx={{
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                {trend.value}
              </Typography>
            </Box>
          )}
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                color: colors.text.tertiary,
                fontSize: '13px',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// ===== SIMPLE STAT CARD =====
// Simplified version without icons and trends
interface SimpleStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  loading?: boolean;
  onClick?: () => void;
}

export function SimpleStatCard({
  title,
  value,
  subtitle,
  loading = false,
  onClick,
}: SimpleStatCardProps) {
  return <StatCard title={title} value={value} subtitle={subtitle} loading={loading} onClick={onClick} />;
}
