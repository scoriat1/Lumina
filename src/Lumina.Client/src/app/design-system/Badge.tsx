import { Chip, ChipProps } from '@mui/material';
import { colors } from './tokens';

// ===== BADGE COMPONENT =====
// Consistent badge/chip styling for status, tags, and labels

export type BadgeVariant = 'primary' | 'success' | 'neutral' | 'warning' | 'error';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactElement;
  onDelete?: () => void;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: colors.badge.primary,
  success: colors.badge.success,
  neutral: colors.badge.neutral,
  warning: colors.badge.warning,
  error: colors.badge.error,
};

const sizeStyles = {
  sm: {
    height: 20,
    fontSize: '11px',
    px: 8,
  },
  md: {
    height: 24,
    fontSize: '12px',
    px: 10,
  },
  lg: {
    height: 28,
    fontSize: '13px',
    px: 12,
  },
};

export function Badge({ 
  label, 
  variant = 'neutral', 
  size = 'md',
  icon,
  onDelete,
}: BadgeProps) {
  const styles = variantStyles[variant];
  const sizeConfig = sizeStyles[size];

  return (
    <Chip
      label={label}
      icon={icon}
      onDelete={onDelete}
      size={size === 'sm' ? 'small' : 'medium'}
      sx={{
        bgcolor: styles.bg,
        color: styles.text,
        height: sizeConfig.height,
        fontSize: sizeConfig.fontSize,
        fontWeight: 500,
        border: 'none',
        '& .MuiChip-label': {
          px: sizeConfig.px / 8, // Convert to MUI spacing units
        },
        '& .MuiChip-icon': {
          color: styles.text,
          fontSize: sizeConfig.fontSize,
          marginLeft: 1,
        },
        '& .MuiChip-deleteIcon': {
          color: styles.text,
          fontSize: sizeConfig.fontSize,
          '&:hover': {
            color: styles.text,
            opacity: 0.7,
          },
        },
      }}
    />
  );
}

// ===== STATUS BADGE =====
// Specialized badge for status indicators
export type StatusType = 'active' | 'completed' | 'scheduled' | 'paused' | 'cancelled';

interface StatusBadgeProps {
  status: StatusType;
  size?: BadgeSize;
}

const statusMapping: Record<StatusType, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Active', variant: 'primary' },
  completed: { label: 'Completed', variant: 'success' },
  scheduled: { label: 'Scheduled', variant: 'neutral' },
  paused: { label: 'Paused', variant: 'warning' },
  cancelled: { label: 'Cancelled', variant: 'error' },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusMapping[status];
  return <Badge label={config.label} variant={config.variant} size={size} />;
}

// ===== PAYMENT BADGE =====
// Specialized badge for payment status
export type PaymentStatus = 'paid' | 'pending' | 'unpaid';

interface PaymentBadgeProps {
  status: PaymentStatus;
  size?: BadgeSize;
}

const paymentMapping: Record<PaymentStatus, { label: string; variant: BadgeVariant }> = {
  paid: { label: 'Paid', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  unpaid: { label: 'Unpaid', variant: 'error' },
};

export function PaymentBadge({ status, size = 'md' }: PaymentBadgeProps) {
  const config = paymentMapping[status];
  return <Badge label={config.label} variant={config.variant} size={size} />;
}
