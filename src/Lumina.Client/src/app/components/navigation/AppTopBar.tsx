import { useMemo, useState, type MouseEvent } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router';
import { colors, themeLayout, borderRadius, transitions } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';

interface AppTopBarProps {
  onMenuClick?: () => void;
}

function getInitials(name?: string, email?: string) {
  if (name && name.trim().length > 0) {
    const initials = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');

    if (initials.length > 0) {
      return initials;
    }
  }

  if (email && email.length > 0) {
    return email.slice(0, 2).toUpperCase();
  }

  return 'U';
}

export function AppTopBar({ onMenuClick }: AppTopBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const initials = useMemo(() => getInitials(user?.name, user?.email), [user?.name, user?.email]);
  const menuOpen = Boolean(menuAnchorEl);

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleSignOut = () => {
    logout();
    handleMenuClose();
    navigate('/login', { replace: true });
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: colors.surface.card,
        borderBottom: `1px solid ${colors.border.subtle}`,
        height: themeLayout.headerHeight,
      }}
    >
      <Toolbar
        sx={{
          minHeight: `${themeLayout.headerHeight}px !important`,
          px: { xs: 2, sm: 3, md: 4 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ flex: 1 }}>
          <IconButton
            onClick={onMenuClick}
            sx={{
              display: { xs: 'inline-flex', sm: 'none' },
              color: colors.text.secondary,
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          <IconButton
            aria-label="notifications"
            sx={{
              color: colors.text.secondary,
              transition: transitions.base,
              '&:hover': {
                bgcolor: colors.surface.elevated,
              },
            }}
          >
            <Badge
              badgeContent={3}
              sx={{
                '& .MuiBadge-badge': {
                  bgcolor: colors.brand.purple,
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '11px',
                  minWidth: '18px',
                  height: '18px',
                },
              }}
            >
              <NotificationsIcon sx={{ fontSize: 22 }} />
            </Badge>
          </IconButton>

          <Box
            onClick={handleMenuOpen}
            aria-controls={menuOpen ? 'user-menu' : undefined}
            aria-expanded={menuOpen ? 'true' : undefined}
            aria-haspopup="menu"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              borderRadius: borderRadius.lg,
              px: 1,
              py: 0.5,
              transition: transitions.base,
              '&:hover': {
                bgcolor: colors.surface.elevated,
              },
            }}
          >
            <Avatar
              sx={{
                width: { xs: 32, sm: 36 },
                height: { xs: 32, sm: 36 },
                bgcolor: colors.brand.purple,
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {initials}
            </Avatar>
            <KeyboardArrowDownIcon
              sx={{
                display: { xs: 'none', sm: 'block' },
                fontSize: 20,
                color: colors.text.muted,
              }}
            />
          </Box>

          <Menu
            id="user-menu"
            anchorEl={menuAnchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleSignOut}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Sign out</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
