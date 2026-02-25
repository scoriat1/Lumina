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
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      transition: 'all 0.2s ease',
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        transform: onClick ? 'translateY(-2px)' : 'none',
      },
    }}
    onClick={onClick}
    >
      <CardContent sx={{ p: { xs: 3, md: 4 } }}> {/* Increased padding */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3.5 }}> {/* Increased margin */}
          <Box sx={{
            width: 52,
            height: 52,
            borderRadius: '12px',
            bgcolor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: `0 4px 12px ${color}40`,
          }}>
            {icon}
          </Box>
          {trend && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1.25,
              py: 0.75,
              borderRadius: '6px',
              bgcolor: trend.direction === 'up' ? colors.status.successBg : colors.status.errorBg,
              border: `1px solid ${trend.direction === 'up' ? colors.status.successBorder : colors.status.errorBorder}`,
            }}>
              {trend.direction === 'up' ? (
                <TrendingUpIcon sx={{ fontSize: 16, color: colors.semantic.success }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 16, color: colors.status.error }} />
              )}
              <Typography variant="caption" sx={{
                fontWeight: 600,
                color: trend.direction === 'up' ? colors.status.success : colors.status.error,
                fontSize: '12px',
              }}>
                {trend.value}
              </Typography>
            </Box>
          )}
        </Box>
        
        <Typography variant="h4" sx={{
          fontWeight: 600,
          color: colors.text.primary,
          mb: 1.5, // Increased margin
        }}>
          {value}
        </Typography>
        
        <Typography variant="body2" sx={{
          color: colors.text.secondary,
          fontWeight: 500,
          mb: subtitle ? 0.75 : 0, // Increased margin
        }}>
          {title}
        </Typography>
        
        {subtitle && (
          <Typography variant="caption" sx={{
            color: colors.text.tertiary,
            fontSize: '12px',
          }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}