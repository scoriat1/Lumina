import { Outlet } from 'react-router';
import { Box } from '@mui/material';
import { Sidebar } from './components/navigation/Sidebar';
import { AppTopBar } from './components/navigation/AppTopBar';
import { themeLayout, colors } from './theme';
import { useState } from 'react';

export function RootLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: colors.surface.page,
      }}
    >
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <Box
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          width: { xs: '100%', sm: `calc(100% - ${themeLayout.sidebarCollapsedWidth}px)` },
        }}
      >
        {/* Top Bar - Full width header */}
        <AppTopBar onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Scrollable Content Area */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            overflowY: 'auto',
          }}
        >
          {/* Content Container with consistent layout constraints */}
          <Box
            component="main"
            sx={{
              width: '100%',
              maxWidth: themeLayout.maxContentWidth,
              px: { xs: 2, sm: 3, md: 4 }, // Responsive padding: 16px mobile, 24px tablet, 32px desktop
              pt: { xs: 3, sm: 4, md: 5 }, // 24px mobile, 32px tablet, 40px desktop
              pb: { xs: 4, sm: 6, md: 8 }, // 32px mobile, 48px tablet, 64px desktop
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}