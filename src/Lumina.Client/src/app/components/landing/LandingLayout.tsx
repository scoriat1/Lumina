import { useState } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router';
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  Link,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { colors } from '../../theme';
import { LuminaBrand } from '../brand/LuminaBrand';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { label: 'Pricing', to: '/pricing' },
  { label: 'Contact', to: '/contact' },
];

const navLinkSx = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 40,
  fontSize: '15px',
  lineHeight: 1,
  fontWeight: 700,
  px: 0,
  '&::after': {
    content: '""',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 4,
    height: 2,
    borderRadius: 999,
  },
  '&:focus-visible': {
    outline: `2px solid ${colors.brand.purple}`,
    outlineOffset: '4px',
    borderRadius: '6px',
  },
  '&:hover': { color: colors.text.primary },
};

export function LandingLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const authLink = user ? { label: 'Dashboard', to: '/app' } : { label: 'Login', to: '/login' };
  const isAuthLinkActive = location.pathname === authLink.to;

  const navLinks = (
    <>
      {navItems.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            component={RouterLink}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            underline="none"
            aria-current={isActive ? 'page' : undefined}
            sx={{
              color: isActive ? colors.text.primary : colors.text.secondary,
              ...navLinkSx,
              fontWeight: isActive ? 800 : 700,
              '&::after': {
                ...navLinkSx['&::after'],
                bgcolor: isActive ? colors.brand.purple : 'transparent',
              },
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FFFDFB', color: colors.text.primary, overflowX: 'hidden' }}>
      <AppBar
        component="header"
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 253, 251, 0.94)',
          backdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${colors.border.subtle}`,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar component="nav" aria-label="Main navigation" disableGutters sx={{ minHeight: 72, gap: 3 }}>
            <LuminaBrand to="/" markSize={34} sx={{ mr: 'auto' }} />

            <Stack direction="row" spacing={3} sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', ml: 2 }}>
              {navLinks}
              <Link
                component={RouterLink}
                to={authLink.to}
                underline="none"
                aria-current={isAuthLinkActive ? 'page' : undefined}
                sx={{
                  color: isAuthLinkActive ? colors.text.primary : colors.text.secondary,
                  ...navLinkSx,
                  fontWeight: isAuthLinkActive ? 800 : 700,
                  '&::after': {
                    ...navLinkSx['&::after'],
                    bgcolor: isAuthLinkActive ? colors.brand.purple : 'transparent',
                  },
                }}
              >
                {authLink.label}
              </Link>
              <Button
                component={RouterLink}
                to="/signup"
                variant="contained"
                sx={{
                  bgcolor: colors.brand.purple,
                  color: '#fff',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '15px',
                  lineHeight: 1,
                  borderRadius: '10px',
                  height: 40,
                  px: 2.5,
                  py: 0,
                  '&:hover': { bgcolor: colors.brand.purpleDark },
                }}
              >
                Start Free Trial
              </Button>
            </Stack>

            <IconButton
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' }, color: colors.text.primary }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: 'min(86vw, 340px)', p: 3 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <LuminaBrand to="/" markSize={34} onClick={() => setMobileOpen(false)} />
          <IconButton aria-label="Close navigation menu" onClick={() => setMobileOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Stack component="nav" aria-label="Mobile navigation" spacing={3}>
          {navLinks}
          <Button
            component={RouterLink}
            to={authLink.to}
            onClick={() => setMobileOpen(false)}
            variant="outlined"
            aria-current={isAuthLinkActive ? 'page' : undefined}
            sx={{
              textTransform: 'none',
              borderColor: isAuthLinkActive ? colors.brand.purple : undefined,
              color: isAuthLinkActive ? colors.text.primary : undefined,
              fontWeight: isAuthLinkActive ? 800 : 600,
            }}
          >
            {authLink.label}
          </Button>
          <Button
            component={RouterLink}
            to="/signup"
            onClick={() => setMobileOpen(false)}
            variant="contained"
            sx={{ bgcolor: colors.brand.purple, textTransform: 'none', '&:hover': { bgcolor: colors.brand.purpleDark } }}
          >
            Start Free Trial
          </Button>
        </Stack>
      </Drawer>

      <Box component="main">
        <Outlet />
      </Box>

      <Box component="footer" sx={{ borderTop: `1px solid ${colors.border.subtle}`, py: 5 }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}>
            <Typography sx={{ color: colors.text.tertiary, fontSize: '14px' }}>
              © {new Date().getFullYear()} Lumina. Practice management for client work.
            </Typography>
            <Stack direction="row" spacing={3}>
              {navItems.map((item) => (
                <Link key={item.to} component={RouterLink} to={item.to} underline="none" sx={{ color: colors.text.secondary, fontSize: '14px' }}>
                  {item.label}
                </Link>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
