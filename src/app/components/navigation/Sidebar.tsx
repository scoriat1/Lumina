import { Drawer, Box, List, ListItem, ListItemButton, ListItemIcon, Tooltip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import FolderIcon from '@mui/icons-material/Folder';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { colors, themeLayout, borderRadius, transitions } from '../../theme';

const navigationItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Clients', icon: <PeopleIcon />, path: '/clients' },
  { text: 'Calendar', icon: <CalendarMonthIcon />, path: '/calendar' },
  { text: 'Sessions', icon: <EventNoteIcon />, path: '/sessions' },
  { text: 'Billing', icon: <ReceiptLongIcon />, path: '/billing' },
  { text: 'Resources', icon: <FolderIcon />, path: '/resources' },
];

const bottomNavItems = [
  { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        py: 3,
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          px: 2,
          mb: 4,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: borderRadius.xl,
            bgcolor: colors.brand.purple,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '18px',
          }}
        >
          C
        </Box>
      </Box>

      {/* Main navigation */}
      <List sx={{ flex: 1, px: 1.5 }}>
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <Tooltip title={item.text} placement="right" arrow>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: borderRadius.xl,
                    py: 1.5,
                    px: 0,
                    minHeight: 48,
                    display: 'flex',
                    justifyContent: 'center',
                    bgcolor: isActive ? colors.brand.purple : 'transparent',
                    color: isActive ? 'white' : '#D4CFC9',
                    transition: transitions.base,
                    '&:hover': {
                      bgcolor: isActive ? colors.brand.purpleDark : 'rgba(110, 91, 206, 0.2)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 'auto',
                      color: 'inherit',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      {/* Bottom navigation */}
      <List sx={{ px: 1.5 }}>
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <Tooltip title={item.text} placement="right" arrow>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: borderRadius.xl,
                    py: 1.5,
                    px: 0,
                    minHeight: 48,
                    display: 'flex',
                    justifyContent: 'center',
                    bgcolor: isActive ? colors.brand.purple : 'transparent',
                    color: isActive ? 'white' : '#D4CFC9',
                    transition: transitions.base,
                    '&:hover': {
                      bgcolor: isActive ? colors.brand.purpleDark : 'rgba(110, 91, 206, 0.2)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 'auto',
                      color: 'inherit',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer - Temporary */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: themeLayout.sidebarCollapsedWidth,
            boxSizing: 'border-box',
            bgcolor: '#4A433F',
            borderRight: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer - Permanent */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: themeLayout.sidebarCollapsedWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: themeLayout.sidebarCollapsedWidth,
            boxSizing: 'border-box',
            bgcolor: '#4A433F',
            borderRight: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}