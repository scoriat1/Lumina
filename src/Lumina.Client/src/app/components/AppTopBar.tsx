import { AppBar, Toolbar, IconButton, Box, Avatar, Badge } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useAuth } from '../contexts/AuthContext';

interface AppTopBarProps {
  onMenuClick: () => void;
}

export function AppTopBar({ onMenuClick }: AppTopBarProps) {
  const { user } = useAuth();

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: '#FFFFFF',
        borderBottom: '1px solid #ECECEC',
        height: 64,
      }}
    >
      <Toolbar
        sx={{
          minHeight: '64px !important',
          px: { xs: 3, sm: 4 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* LEFT: Mobile Menu (only on mobile) */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            edge="start"
            aria-label="menu"
            sx={{
              display: { xs: 'flex', md: 'none' },
              color: '#6B6B6B',
            }}
            onClick={onMenuClick}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* CENTER: Empty for clean minimal look */}
        <Box sx={{ flex: 1 }} />

        {/* RIGHT: Notifications + Avatar + Dropdown Caret */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Notification Bell */}
          <IconButton 
            aria-label="notifications" 
            sx={{ 
              color: '#6B6B6B',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <Badge 
              badgeContent={3} 
              sx={{
                '& .MuiBadge-badge': {
                  bgcolor: '#8B6B9E',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '11px',
                  minWidth: '18px',
                  height: '18px',
                }
              }}
            >
              <NotificationsIcon sx={{ fontSize: 22 }} />
            </Badge>
          </IconButton>

          {/* User Avatar + Dropdown Caret */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              cursor: 'pointer',
              '&:hover': {
                '& .user-avatar': {
                  borderColor: '#8B6B9E',
                },
              },
            }}
          >
            <Avatar
              className="user-avatar"
              sx={{
                width: 36,
                height: 36,
                bgcolor: '#8B6B9E',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.2s ease',
                border: '2px solid transparent',
              }}
            >
              {user?.initials ?? '??'}
            </Avatar>
            <KeyboardArrowDownIcon 
              sx={{ 
                fontSize: 20, 
                color: '#6B6B6B',
              }} 
            />
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}