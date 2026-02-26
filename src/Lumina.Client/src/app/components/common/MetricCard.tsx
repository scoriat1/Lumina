import { ReactNode } from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { colors, typography, borderRadius, shadows, transitions } from '../../theme';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  iconColor?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  subtitle?: string;
}

export function MetricCard({ title, value, icon, iconColor, trend, subtitle }: MetricCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: borderRadius.lg,
        boxShadow: shadows.card,
        transition: transitions.base,
        '&:hover': {
          boxShadow: shadows.cardHover,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Typography
            variant="body2"
            sx={{
              color: colors.text.tertiary,
              fontWeight: typography.fontWeight.medium,
              fontSize: typography.fontSize.sm,
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
                bgcolor: iconColor ? `${iconColor}15` : colors.surface.elevated,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: iconColor || colors.text.secondary,
                '& svg': {
                  fontSize: 20,
                },
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        <Typography
          variant="h4"
          sx={{
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            mb: 1,
          }}
        >
          {value}
        </Typography>

        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {trend.direction === 'up' ? (
              <TrendingUpIcon sx={{ fontSize: 16, color: colors.semantic.success.main }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 16, color: colors.semantic.error.main }} />
            )}
            <Typography
              variant="caption"
              sx={{
                color: trend.direction === 'up' ? colors.semantic.success.main : colors.semantic.error.main,
                fontWeight: typography.fontWeight.semibold,
                fontSize: typography.fontSize.sm,
              }}
            >
              {trend.value}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                sx={{
                  color: colors.text.muted,
                  fontSize: typography.fontSize.xs,
                  ml: 0.5,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        )}

        {!trend && subtitle && (
          <Typography
            variant="caption"
            sx={{
              color: colors.text.tertiary,
              fontSize: typography.fontSize.sm,
              display: 'block',
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
