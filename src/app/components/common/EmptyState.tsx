import { ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { colors, typography, spacing } from '../../theme';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
      }}
    >
      {icon && (
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: colors.surface.elevated,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.text.muted,
            mb: 3,
            '& svg': {
              fontSize: 32,
            },
          }}
        >
          {icon}
        </Box>
      )}

      <Typography
        variant="h6"
        sx={{
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary,
          mb: 1,
        }}
      >
        {title}
      </Typography>

      {description && (
        <Typography
          variant="body2"
          sx={{
            color: colors.text.tertiary,
            maxWidth: 400,
            mb: action ? 3 : 0,
          }}
        >
          {description}
        </Typography>
      )}

      {action && (
        <Button
          variant="contained"
          onClick={action.onClick}
          sx={{
            bgcolor: colors.brand.purple,
            '&:hover': {
              bgcolor: colors.brand.purpleDark,
            },
          }}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
}
