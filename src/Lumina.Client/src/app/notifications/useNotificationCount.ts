import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { buildNotifications } from './buildNotifications';
import {
  loadNotificationPreferences,
  notificationPreferencesChangedEvent,
} from './preferences';
import {
  filterUnreadNotifications,
  readNotificationsChangedEvent,
} from './readNotifications';

export function useNotificationCount() {
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const loadNotificationCount = async () => {
      try {
        const [sessions, payments] = await Promise.all([
          apiClient.getSessions(),
          apiClient.getBillingPayments(),
        ]);

        setNotificationCount(filterUnreadNotifications(buildNotifications({
          sessions,
          payments,
          preferences: loadNotificationPreferences(),
        })).length);
      } catch {
        setNotificationCount(0);
      }
    };

    void loadNotificationCount();
    const intervalId = window.setInterval(loadNotificationCount, 60_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadNotificationCount();
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'lumina.notificationPreferences') {
        void loadNotificationCount();
      }

      if (event.key === 'lumina.readNotifications') {
        void loadNotificationCount();
      }
    };

    window.addEventListener('focus', loadNotificationCount);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(notificationPreferencesChangedEvent, loadNotificationCount);
    window.addEventListener(readNotificationsChangedEvent, loadNotificationCount);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', loadNotificationCount);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(notificationPreferencesChangedEvent, loadNotificationCount);
      window.removeEventListener(readNotificationsChangedEvent, loadNotificationCount);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return notificationCount;
}
