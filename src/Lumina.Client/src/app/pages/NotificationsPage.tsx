import { useEffect, useState } from 'react';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { apiClient } from '../api/client';
import { buildNotifications, type AppNotification } from '../notifications/buildNotifications';
import {
  loadNotificationPreferences,
  notificationPreferencesChangedEvent,
} from '../notifications/preferences';

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const [sessions, payments] = await Promise.all([
          apiClient.getSessions(),
          apiClient.getBillingPayments(),
        ]);

        setNotifications(buildNotifications({
          sessions,
          payments,
          preferences: loadNotificationPreferences(),
        }));
        setLoadError(null);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Unable to load notifications.');
      }
    };

    void loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 60_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadNotifications();
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'lumina.notificationPreferences') {
        void loadNotifications();
      }
    };

    window.addEventListener('focus', loadNotifications);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(notificationPreferencesChangedEvent, loadNotifications);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', loadNotifications);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(notificationPreferencesChangedEvent, loadNotifications);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader title="Notifications" />

      {loadError ? (
        <Typography variant="body1" sx={{ color: '#C62828' }}>
          {loadError}
        </Typography>
      ) : null}

      {!loadError && notifications.length === 0 ? (
        <Box
          sx={{
            bgcolor: '#FFFFFF',
            border: '1px solid #E8E5E1',
            borderRadius: '14px',
            p: 4,
          }}
        >
          <Typography sx={{ color: '#4A4542', fontWeight: 650, mb: 0.75 }}>
            No notifications right now
          </Typography>
          <Typography sx={{ color: '#7A746F', fontSize: '14px' }}>
            Upcoming session and billing reminders will appear here based on your Settings preferences.
          </Typography>
        </Box>
      ) : null}

      <Stack spacing={2}>
        {notifications.map((notification) => (
          <Box
            key={notification.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: '#FFFFFF',
              border: '1px solid #E8E5E1',
              borderRadius: '14px',
              p: 3,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#9B8B9E',
                boxShadow: '0 4px 12px rgba(74, 69, 66, 0.08)',
              },
            }}
            onClick={() => navigate(notification.href)}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '10px',
                bgcolor: notification.category === 'session'
                  ? 'rgba(155, 139, 158, 0.12)'
                  : 'rgba(212, 184, 138, 0.14)',
                color: notification.category === 'session' ? '#7A5C80' : '#8B7444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {notification.category === 'session' ? <EventNoteIcon /> : <AccountBalanceWalletIcon />}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                <Typography sx={{ color: '#1F1C1A', fontWeight: 650, fontSize: '15px' }}>
                  {notification.title}
                </Typography>
                <Chip
                  label={notification.category === 'session' ? 'Session' : 'Billing'}
                  size="small"
                  sx={{
                    height: 22,
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 650,
                    bgcolor: '#F5F3F1',
                    color: '#7A746F',
                  }}
                />
              </Box>
              <Typography sx={{ color: '#7A746F', fontSize: '14px' }}>
                {notification.description}
              </Typography>
            </Box>

            <Button
              size="small"
              endIcon={<ArrowForwardIcon />}
              sx={{
                color: '#9B8B9E',
                fontWeight: 650,
                textTransform: 'none',
                flexShrink: 0,
              }}
            >
              View
            </Button>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
