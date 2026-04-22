import { Card, CardContent, Box, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { colors } from '../styles/colors';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

export function MetricCard({ title, value, subtitle, trend, icon, color, onClick }: MetricCardProps) {
  return (
    <Card sx={{
      height: '100%',
      bgcolor: 'white',
      border: `1px solid ${colors.border.subtle}`,
      borderRadius: '14px',
      boxShadow: '0 12px 32px rgba(39, 34, 30, 0.06)',
      transition: 'all 0.2s ease',
      cursor: onClick ? 'pointer' : 'default',
      overflow: 'hidden',
      '&:hover': {
        boxShadow: '0 18px 40px rgba(39, 34, 30, 0.10)',
        transform: onClick ? 'translateY(-2px)' : 'none',
        borderColor: 'rgba(155, 139, 158, 0.34)',
      },
    }}
    onClick={onClick}
    >
      <CardContent sx={{ p: { xs: 3, md: 3.25 }, height: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', height: '100%', minHeight: 146 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', mb: 2.25 }}>
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            bgcolor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: `0 8px 18px ${color}30`,
            flexShrink: 0,
            '& .MuiSvgIcon-root': {
              fontSize: 21,
            },
          }}>
            {icon}
          </Box>
          <Typography variant="body2" sx={{
            color: colors.text.secondary,
            fontWeight: 650,
            fontSize: '14px',
            lineHeight: 1.25,
          }}>
            {title}
          </Typography>
          <Box sx={{ flex: 1 }} />
          {trend && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1,
              py: 0.5,
              borderRadius: '6px',
              bgcolor: trend.direction === 'up' ? colors.status.successBg : colors.status.errorBg,
              border: `1px solid ${trend.direction === 'up' ? colors.status.successBorder : colors.status.errorBorder}`,
              flexShrink: 0,
            }}>
              {trend.direction === 'up' ? (
                <TrendingUpIcon sx={{ fontSize: 15, color: colors.semantic.success }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 15, color: colors.status.error }} />
              )}
              <Typography variant="caption" sx={{
                fontWeight: 700,
                color: trend.direction === 'up' ? colors.status.success : colors.status.error,
                fontSize: '11px',
                lineHeight: 1,
              }}>
                {trend.value}
              </Typography>
            </Box>
          )}
          </Box>
        
        <Typography variant="h3" sx={{
          fontWeight: 600,
          color: colors.text.primary,
          fontSize: { xs: '28px', md: '31px' },
          lineHeight: 1.05,
          letterSpacing: 0,
          mb: subtitle ? 1 : 0,
        }}>
          {value}
        </Typography>
        
        {subtitle && (
          <Typography variant="caption" sx={{
            color: colors.text.tertiary,
            fontSize: '12px',
            lineHeight: 1.55,
            fontWeight: 500,
            maxWidth: 220,
          }}>
            {subtitle}
          </Typography>
        )}
        </Box>
      </CardContent>
    </Card>
  );
}
