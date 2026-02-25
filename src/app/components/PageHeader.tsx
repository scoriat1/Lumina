import { Box, Typography, Button } from '@mui/material';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, action, actions }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        mb: { xs: 3, sm: 4 },
        gap: { xs: 2, sm: 3 },
        flexDirection: { xs: 'column', sm: 'row' },
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            color: '#1A1A1A',
            fontSize: { xs: '24px', sm: '28px', md: '32px' },
            letterSpacing: '-0.5px',
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            sx={{
              color: '#6B6B6B',
              fontSize: { xs: '14px', sm: '15px' },
              mt: 1,
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {action && (
        <Button
          variant="contained"
          color="primary"
          startIcon={action.icon}
          onClick={action.onClick}
          sx={{
            alignSelf: { xs: 'stretch', sm: 'flex-start' },
          }}
        >
          {action.label}
        </Button>
      )}
      
      {actions && (
        <Box sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}>
          {actions}
        </Box>
      )}
    </Box>
  );
}