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
import { colors } from '../styles/colors';

const DRAWER_WIDTH = 72; // Icon-only navigation rail

interface SidebarProps {
  mobileOpen?: boolean;
  onDrawerToggle?: () => void;
}

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

export function Sidebar({ mobileOpen, onDrawerToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const drawerContent = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      bgcolor: '#4A433F',
      py: 3,
    }}>
      {/* Logo icon only */}
      <Box sx={{ px: 2, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          bgcolor: colors.brand.purple,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
          fontSize: '18px',
          mb: 6,
        }}>
          L
        </Box>
      </Box>

      {/* Main navigation - icon only */}
      <List sx={{ flex: 1, px: 1.5 }}>
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <Tooltip title={item.text} placement="right" arrow>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: '10px',
                    py: 1.5,
                    px: 0,
                    minHeight: 48,
                    display: 'flex',
                    justifyContent: 'center',
                    bgcolor: isActive ? colors.brand.purple : 'transparent',
                    color: isActive ? 'white' : '#D4CFC9',
                    '&:hover': {
                      bgcolor: isActive ? colors.brand.purpleDark : 'rgba(167, 143, 217, 0.15)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 'auto',
                    color: 'inherit',
                    display: 'flex',
                    justifyContent: 'center',
                  }}>
                    {item.icon}
                  </ListItemIcon>
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      {/* Bottom navigation - icon only */}
      <List sx={{ px: 1.5, pb: 2 }}>
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <Tooltip title={item.text} placement="right" arrow>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: '10px',
                    py: 1.5,
                    px: 0,
                    minHeight: 48,
                    display: 'flex',
                    justifyContent: 'center',
                    bgcolor: isActive ? colors.brand.purple : 'transparent',
                    color: isActive ? 'white' : '#D4CFC9',
                    '&:hover': {
                      bgcolor: isActive ? colors.brand.purpleDark : 'rgba(167, 143, 217, 0.15)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 'auto',
                    color: 'inherit',
                    display: 'flex',
                    justifyContent: 'center',
                  }}>
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
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: DRAWER_WIDTH,
            border: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: DRAWER_WIDTH,
            border: 'none',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
}

export const SIDEBAR_WIDTH = DRAWER_WIDTH;