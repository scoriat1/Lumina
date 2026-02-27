import { AppBar, Toolbar, IconButton, Box, Avatar, Badge, Menu, MenuItem } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import { colors, themeLayout, borderRadius, transitions } from '../../theme';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router';

interface AppTopBarProps {
  onMenuClick?: () => void;
}

export function AppTopBar({ onMenuClick }: AppTopBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: colors.surface.card, borderBottom: `1px solid ${colors.border.subtle}`, height: themeLayout.headerHeight }}>
      <Toolbar sx={{ minHeight: `${themeLayout.headerHeight}px !important`, px: { xs: 2, sm: 3, md: 4 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <IconButton onClick={onMenuClick} sx={{ display: { xs: 'inline-flex', sm: 'none' }, color: colors.text.secondary }}>
            <MenuIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          <IconButton aria-label="notifications" sx={{ color: colors.text.secondary, transition: transitions.base, '&:hover': { bgcolor: colors.surface.elevated } }}>
            <Badge badgeContent={3} sx={{ '& .MuiBadge-badge': { bgcolor: colors.brand.purple, color: '#FFFFFF', fontWeight: 600, fontSize: '11px', minWidth: '18px', height: '18px' } }}>
              <NotificationsIcon sx={{ fontSize: 22 }} />
            </Badge>
          </IconButton>

          <Box onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', borderRadius: borderRadius.lg, px: 1, py: 0.5, transition: transitions.base, '&:hover': { bgcolor: colors.surface.elevated } }}>
            <Avatar sx={{ width: { xs: 32, sm: 36 }, height: { xs: 32, sm: 36 }, bgcolor: colors.brand.purple, fontSize: '14px', fontWeight: 600 }}>
              {user?.initials ?? '??'}
            </Avatar>
            <KeyboardArrowDownIcon sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 20, color: colors.text.muted }} />
          </Box>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={async () => { await logout(); navigate('/login'); }}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
