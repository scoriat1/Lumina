import type { SessionStatusValue } from '../api/types';

type SessionVisualStyle = {
  bg: string;
  text: string;
  border: string;
};

type SessionStatusMetadata = {
  label: string;
  badge: SessionVisualStyle;
  calendar: SessionVisualStyle;
};

const sessionStatusMetadata: Record<SessionStatusValue, SessionStatusMetadata> = {
  upcoming: {
    label: 'Scheduled',
    badge: {
      bg: 'rgba(139, 111, 191, 0.12)',
      text: '#7A68AA',
      border: 'rgba(139, 111, 191, 0.24)',
    },
    calendar: {
      bg: 'rgba(139, 111, 191, 0.10)',
      text: '#6F5A9B',
      border: 'rgba(139, 111, 191, 0.22)',
    },
  },
  completed: {
    label: 'Completed',
    badge: {
      bg: 'rgba(168, 181, 160, 0.16)',
      text: '#5B7052',
      border: 'rgba(168, 181, 160, 0.24)',
    },
    calendar: {
      bg: 'rgba(168, 181, 160, 0.18)',
      text: '#50644A',
      border: 'rgba(168, 181, 160, 0.28)',
    },
  },
  cancelled: {
    label: 'Canceled',
    badge: {
      bg: 'rgba(157, 170, 181, 0.16)',
      text: '#66717A',
      border: 'rgba(157, 170, 181, 0.24)',
    },
    calendar: {
      bg: 'rgba(157, 170, 181, 0.14)',
      text: '#66717A',
      border: 'rgba(157, 170, 181, 0.26)',
    },
  },
  noShow: {
    label: 'No-show',
    badge: {
      bg: 'rgba(212, 184, 138, 0.16)',
      text: '#8B7444',
      border: 'rgba(212, 184, 138, 0.26)',
    },
    calendar: {
      bg: 'rgba(212, 184, 138, 0.18)',
      text: '#846B3E',
      border: 'rgba(212, 184, 138, 0.30)',
    },
  },
};

export const allSessionStatusOptions = (
  Object.keys(sessionStatusMetadata) as SessionStatusValue[]
).map((value) => ({
  value,
  label: sessionStatusMetadata[value].label,
}));

export const scheduleSessionStatusOptions = allSessionStatusOptions.filter(
  (option) => option.value === 'upcoming',
);

export const logPastSessionStatusOptions = allSessionStatusOptions.filter(
  (option) => option.value !== 'upcoming',
);

const pastSessionStatusSet = new Set<SessionStatusValue>([
  'completed',
  'cancelled',
  'noShow',
]);

export function getSessionStatusLabel(status: SessionStatusValue) {
  return sessionStatusMetadata[status].label;
}

export function getSessionStatusBadgeStyles(status: SessionStatusValue) {
  return sessionStatusMetadata[status].badge;
}

export function getSessionCalendarStyles(status: SessionStatusValue) {
  return sessionStatusMetadata[status].calendar;
}

export function isPastSessionStatus(status: SessionStatusValue) {
  return pastSessionStatusSet.has(status);
}
