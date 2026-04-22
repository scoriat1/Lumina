import type { BillingPaymentDto, SessionDto } from '../api/types';
import type { NotificationPreferences } from './preferences';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  category: 'session' | 'billing';
  href: string;
  createdAt: string;
}

const formatCurrency = (amount: number) =>
  amount.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });

const formatSessionTime = (value: Date) =>
  value.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export const buildNotifications = ({
  sessions,
  payments,
  preferences,
  now = new Date(),
}: {
  sessions: SessionDto[];
  payments: BillingPaymentDto[];
  preferences: NotificationPreferences;
  now?: Date;
}): AppNotification[] => {
  const notifications: AppNotification[] = [];
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  if (preferences.sessionReminders) {
    sessions
      .filter((session) => {
        const sessionDate = new Date(session.date);
        return session.status === 'upcoming' && sessionDate >= now && sessionDate <= next24Hours;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((session) => {
        const sessionDate = new Date(session.date);
        notifications.push({
          id: `session-${session.id}`,
          title: `Upcoming session with ${session.client}`,
          description: `${session.sessionType} is scheduled for ${formatSessionTime(sessionDate)}.`,
          category: 'session',
          href: `/sessions?focusSessionId=${session.id}`,
          createdAt: session.date,
        });
      });
  }

  if (preferences.billingReminders) {
    payments
      .filter((payment) => payment.paymentStatus !== 'paid')
      .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())
      .forEach((payment) => {
        notifications.push({
          id: `billing-${payment.id}`,
          title: `${formatCurrency(payment.amount)} unpaid from ${payment.clientName}`,
          description: `${payment.description} is marked ${payment.paymentStatus}.`,
          category: 'billing',
          href: '/billing',
          createdAt: payment.serviceDate,
        });
      });
  }

  return notifications;
};
