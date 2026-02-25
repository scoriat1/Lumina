import { Chip as MuiChip, ChipProps as MuiChipProps } from '@mui/material';
import { colors, borderRadius } from './tokens';

export interface ChipProps extends Omit<MuiChipProps, 'color'> {
  /**
   * Chip color variant
   * @default 'default'
   */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default';
}

/**
 * Status chip component with therapeutic design system styling
 * 
 * @example
 * ```tsx
 * <Chip label="Active" color="success" />
 * <Chip label="Scheduled" color="info" />
 * <Chip label="Paused" color="warning" />
 * ```
 */
export function Chip({ color = 'default', sx, ...props }: ChipProps) {
  const colorStyles = {
    primary: {
      bgcolor: 'rgba(155, 139, 158, 0.12)',
      color: colors.primary.dark,
    },
    secondary: {
      bgcolor: colors.semantic.success.bg,
      color: colors.secondary.dark,
    },
    success: {
      bgcolor: colors.semantic.success.bg,
      color: colors.secondary.dark,
    },
    warning: {
      bgcolor: colors.semantic.warning.bg,
      color: '#A88F5F',
    },
    error: {
      bgcolor: colors.semantic.error.bg,
      color: colors.semantic.error.main,
    },
    info: {
      bgcolor: colors.accent.slate.bg,
      color: '#7A8A96',
    },
    default: {
      bgcolor: 'rgba(122, 116, 111, 0.12)',
      color: colors.text.secondary,
    },
  };

  return (
    <MuiChip
      {...props}
      sx={{
        borderRadius: borderRadius.sm,
        fontWeight: 600,
        fontSize: '12px',
        height: 24,
        ...colorStyles[color],
        ...sx,
      }}
    />
  );
}
