import { Chip } from '@mui/material';
import type { SessionStatusValue } from '../../api/types';
import { getSessionStatusBadgeStyles, getSessionStatusLabel } from '../../lib/sessionStatus';
import { colors, typography, borderRadius } from '../../theme';

export type SessionStatus = SessionStatusValue;
export type PaymentStatus = 'paid' | 'pending';

interface StatusBadgeProps {
  status: SessionStatus | PaymentStatus;
  size?: 'small' | 'medium';
  type?: 'session' | 'payment';
}

export function StatusBadge({ status, size = 'small', type = 'session' }: StatusBadgeProps) {
  const getStatusStyles = () => {
    if (type === 'session') {
      return getSessionStatusBadgeStyles(status as SessionStatus);
    } else {
      switch (status as PaymentStatus) {
        case 'paid':
          return colors.payment.paid;
        case 'pending':
          return colors.payment.unpaid;
        default:
          return colors.payment.paid;
      }
    }
  };

  const styles = getStatusStyles();
  const label =
    type === 'session'
      ? getSessionStatusLabel(status as SessionStatus)
      : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Chip
      label={label}
      size={size}
      sx={{
        bgcolor: styles.bg,
        color: styles.text,
        border: `1px solid ${styles.border}`,
        fontWeight: typography.fontWeight.semibold,
        borderRadius: borderRadius.sm,
        height: size === 'small' ? 24 : 28,
        fontSize: size === 'small' ? typography.fontSize.xs : typography.fontSize.sm,
      }}
    />
  );
}
