import { ReactNode } from 'react';
import { Box } from '@mui/material';
import { Sidebar } from '../navigation/Sidebar';
import { AppTopBar } from '../navigation/AppTopBar';
import { themeLayout } from '../../theme';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <Sidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          ml: `${themeLayout.sidebarWidth}px`,
        }}
      >
        <AppTopBar />
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            position: 'relative',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
