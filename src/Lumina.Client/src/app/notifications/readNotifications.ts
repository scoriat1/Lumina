const storageKey = 'lumina.readNotifications';

export const readNotificationsChangedEvent = 'lumina:read-notifications-changed';

const dispatchReadNotificationsChanged = () => {
  window.dispatchEvent(new Event(readNotificationsChangedEvent));
};

export const loadReadNotificationIds = (): string[] => {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

export const saveReadNotificationIds = (ids: string[]) => {
  window.localStorage.setItem(storageKey, JSON.stringify(Array.from(new Set(ids))));
  dispatchReadNotificationsChanged();
};

export const markNotificationRead = (id: string) => {
  saveReadNotificationIds([...loadReadNotificationIds(), id]);
};

export const markNotificationsRead = (ids: string[]) => {
  saveReadNotificationIds([...loadReadNotificationIds(), ...ids]);
};

export const filterUnreadNotifications = <T extends { id: string }>(notifications: T[]) => {
  const readIds = new Set(loadReadNotificationIds());
  return notifications.filter((notification) => !readIds.has(notification.id));
};
