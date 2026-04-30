import { useState } from 'react';
import { Link as RouterLink, Outlet } from 'react-router';
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

const navItems = [
  { label: 'Features', to: '/features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Contact', to: '/contact' },
];

export function LandingLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = (
    <>
      {navItems.map((item) => (
        <Link
          key={item.to}
          component={RouterLink}
          to={item.to}
          onClick={() => setMobileOpen(false)}
          underline="none"
          sx={{
            color: colors.text.secondary,
            fontSize: '15px',
            fontWeight: 600,
            '&:focus-visible': {
              outline: `2px solid ${colors.brand.purple}`,
              outlineOffset: '4px',
              borderRadius: '6px',
            },
            '&:hover': { color: colors.text.primary },
          }}
        >
          {item.label}
        </Link>
      ))}
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
            <Link
              component={RouterLink}
              to="/"
              underline="none"
              sx={{
                color: colors.text.primary,
                fontFamily: '"Crimson Pro", Georgia, serif',
                fontSize: '28px',
                fontWeight: 700,
                mr: 'auto',
              }}
            >
              Lumina
            </Link>

            <Stack direction="row" spacing={4} sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
              {navLinks}
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ display: { xs: 'none', md: 'flex' }, ml: 2 }}>
              <Button component={RouterLink} to="/login" sx={{ color: colors.text.secondary, textTransform: 'none', fontWeight: 700 }}>
                Login
              </Button>
              <Button
                component={RouterLink}
                to="/signup"
                variant="contained"
                sx={{
                  bgcolor: colors.brand.purple,
                  color: '#fff',
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: '10px',
                  px: 2.5,
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
          <Typography sx={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: '26px', fontWeight: 700 }}>
            Lumina
          </Typography>
          <IconButton aria-label="Close navigation menu" onClick={() => setMobileOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Stack component="nav" aria-label="Mobile navigation" spacing={3}>
          {navLinks}
          <Button component={RouterLink} to="/login" onClick={() => setMobileOpen(false)} variant="outlined" sx={{ textTransform: 'none' }}>
            Login
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
