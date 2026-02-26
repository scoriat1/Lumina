import { Chip } from '@mui/material';
import { colors, typography, borderRadius } from '../../theme';

export type SessionStatus = 'upcoming' | 'completed' | 'cancelled';
export type PaymentStatus = 'paid' | 'unpaid' | 'invoiced' | 'package';

interface StatusBadgeProps {
  status: SessionStatus | PaymentStatus;
  size?: 'small' | 'medium';
  type?: 'session' | 'payment';
}

export function StatusBadge({ status, size = 'small', type = 'session' }: StatusBadgeProps) {
  const getStatusStyles = () => {
    if (type === 'session') {
      switch (status as SessionStatus) {
        case 'upcoming':
          return colors.status.upcoming;
        case 'completed':
          return colors.status.completed;
        case 'cancelled':
          return colors.status.cancelled;
        default:
          return colors.status.upcoming;
      }
    } else {
      switch (status as PaymentStatus) {
        case 'paid':
          return colors.payment.paid;
        case 'unpaid':
          return colors.payment.unpaid;
        case 'invoiced':
          return colors.payment.invoiced;
        case 'package':
          return colors.payment.package;
        default:
          return colors.payment.paid;
      }
    }
  };

  const styles = getStatusStyles();
  const label = status.charAt(0).toUpperCase() + status.slice(1);

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
