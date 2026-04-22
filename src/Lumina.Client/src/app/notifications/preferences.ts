export interface NotificationPreferences {
  sessionReminders: boolean;
  billingReminders: boolean;
}

const storageKey = 'lumina.notificationPreferences';
export const notificationPreferencesChangedEvent = 'lumina:notification-preferences-changed';

export const defaultNotificationPreferences: NotificationPreferences = {
  sessionReminders: true,
  billingReminders: true,
};

export const loadNotificationPreferences = (): NotificationPreferences => {
  if (typeof window === 'undefined') {
    return defaultNotificationPreferences;
  }

  const stored = window.localStorage.getItem(storageKey);
  if (!stored) {
    return defaultNotificationPreferences;
  }

  try {
    return {
      ...defaultNotificationPreferences,
      ...(JSON.parse(stored) as Partial<NotificationPreferences>),
    };
  } catch {
    return defaultNotificationPreferences;
  }
};

export const saveNotificationPreferences = (preferences: NotificationPreferences) => {
  window.localStorage.setItem(storageKey, JSON.stringify(preferences));
  window.dispatchEvent(new Event(notificationPreferencesChangedEvent));
};
