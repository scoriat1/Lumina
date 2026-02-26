import { ReactNode } from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { colors, typography } from '../../theme';

interface SectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  headerActions?: ReactNode;
  divider?: boolean;
  spacing?: number;
}

export function Section({ 
  title, 
  subtitle, 
  children, 
  headerActions,
  divider = false,
  spacing = 3
}: SectionProps) {
  return (
    <Box sx={{ mb: spacing }}>
      {title && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                mb: subtitle ? 0.5 : 0,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                sx={{
                  color: colors.text.tertiary,
                  fontSize: typography.fontSize.sm,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {headerActions && <Box>{headerActions}</Box>}
        </Box>
      )}

      {divider && <Divider sx={{ mb: 2 }} />}

      {children}
    </Box>
  );
}
