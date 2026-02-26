import { ReactNode } from 'react';
import { Box, Container } from '@mui/material';
import { themeLayout, themeSpacing } from '../../theme';

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: number | 'full';
  disableGutters?: boolean;
}

export function PageContainer({ 
  children, 
  maxWidth = themeLayout.maxContentWidth,
  disableGutters = false 
}: PageContainerProps) {
  return (
    <Box
      sx={{
        width: '100%',
        px: disableGutters ? 0 : { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Box
        sx={{
          maxWidth: maxWidth === 'full' ? '100%' : maxWidth,
          mx: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
