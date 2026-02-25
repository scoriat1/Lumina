import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { colors, borderRadius, shadows, componentSizes } from './tokens';

export type ButtonColor = 'primary' | 'secondary' | 'neutral';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<MuiButtonProps, 'color' | 'size'> {
  color?: ButtonColor;
  size?: ButtonSize;
}

/**
 * Primary button component with executive design system styling
 * 
 * @example
 * ```tsx
 * <Button variant="contained" color="primary">
 *   Save Changes
 * </Button>
 * 
 * <Button variant="outlined" color="neutral">
 *   Cancel
 * </Button>
 * 
 * <Button variant="text" size="sm">
 *   Learn More
 * </Button>
 * ```
 */
export function Button({ 
  color = 'primary', 
  size = 'md',
  children, 
  sx, 
  ...props 
}: ButtonProps) {
  const sizeConfig = componentSizes.button[size];

  const getColorStyles = () => {
    const colorMap = {
      primary: {
        contained: {
          bgcolor: colors.primary.main,
          color: '#FFFFFF',
          '&:hover': {
            bgcolor: colors.primary.dark,
            boxShadow: shadows.md,
          },
          '&:active': {
            bgcolor: colors.primary.dark,
          },
          '&:disabled': {
            bgcolor: colors.interactive.disabled,
            color: colors.interactive.disabledText,
          },
        },
        outlined: {
          borderColor: colors.primary.main,
          color: colors.primary.main,
          '&:hover': {
            bgcolor: colors.interactive.hover,
            borderColor: colors.primary.main,
          },
          '&:disabled': {
            borderColor: colors.border.subtle,
            color: colors.interactive.disabledText,
          },
        },
        text: {
          color: colors.primary.main,
          '&:hover': {
            bgcolor: colors.interactive.hover,
          },
          '&:disabled': {
            color: colors.interactive.disabledText,
          },
        },
      },
      secondary: {
        contained: {
          bgcolor: colors.neutral.gray700,
          color: '#FFFFFF',
          '&:hover': {
            bgcolor: colors.neutral.gray800,
            boxShadow: shadows.md,
          },
          '&:disabled': {
            bgcolor: colors.interactive.disabled,
            color: colors.interactive.disabledText,
          },
        },
        outlined: {
          borderColor: colors.neutral.gray300,
          color: colors.text.primary,
          '&:hover': {
            bgcolor: colors.surface.elevated,
            borderColor: colors.neutral.gray400,
          },
          '&:disabled': {
            borderColor: colors.border.subtle,
            color: colors.interactive.disabledText,
          },
        },
        text: {
          color: colors.text.primary,
          '&:hover': {
            bgcolor: colors.surface.elevated,
          },
          '&:disabled': {
            color: colors.interactive.disabledText,
          },
        },
      },
      neutral: {
        contained: {
          bgcolor: colors.neutral.gray100,
          color: colors.text.primary,
          '&:hover': {
            bgcolor: colors.neutral.gray200,
          },
          '&:disabled': {
            bgcolor: colors.interactive.disabled,
            color: colors.interactive.disabledText,
          },
        },
        outlined: {
          borderColor: colors.border.medium,
          color: colors.text.secondary,
          '&:hover': {
            bgcolor: colors.surface.elevated,
            borderColor: colors.border.strong,
          },
          '&:disabled': {
            borderColor: colors.border.subtle,
            color: colors.interactive.disabledText,
          },
        },
        text: {
          color: colors.text.secondary,
          '&:hover': {
            bgcolor: colors.surface.elevated,
            color: colors.text.primary,
          },
          '&:disabled': {
            color: colors.interactive.disabledText,
          },
        },
      },
    };

    return colorMap[color][props.variant || 'contained'];
  };

  return (
    <MuiButton
      {...props}
      sx={{
        borderRadius: borderRadius.md,
        textTransform: 'none',
        fontWeight: 500,
        height: sizeConfig.height,
        px: sizeConfig.px / 8, // Convert to MUI spacing units
        fontSize: sizeConfig.fontSize,
        boxShadow: props.variant === 'contained' ? 'none' : undefined,
        transition: 'all 0.2s ease',
        ...getColorStyles(),
        ...sx,
      }}
    >
      {children}
    </MuiButton>
  );
}

/**
 * Icon button component with executive design system styling
 */
export function IconButton({ children, sx, ...props }: MuiButtonProps) {
  return (
    <MuiButton
      {...props}
      sx={{
        minWidth: 'unset',
        width: 36,
        height: 36,
        p: 0,
        borderRadius: borderRadius.md,
        bgcolor: 'transparent',
        color: colors.text.secondary,
        '&:hover': {
          bgcolor: colors.interactive.hover,
        },
        ...sx,
      }}
    >
      {children}
    </MuiButton>
  );
}
