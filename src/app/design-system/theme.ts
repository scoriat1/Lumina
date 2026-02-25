import { createTheme } from '@mui/material/styles';
import { colors, typography, borderRadius, shadows, componentSizes } from './tokens';

/**
 * Material UI theme configuration for Lumina
 * Integrates executive design tokens into MUI's theming system
 */
export const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: colors.neutral.gray700,
      light: colors.neutral.gray600,
      dark: colors.neutral.gray800,
      contrastText: '#FFFFFF',
    },
    success: {
      main: colors.semantic.success.main,
      light: '#4CAF50',
      dark: '#1B5E20',
      contrastText: '#FFFFFF',
    },
    error: {
      main: colors.semantic.error.main,
      light: '#E53935',
      dark: '#B71C1C',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: colors.semantic.warning.main,
      light: '#FF9800',
      dark: '#F57C00',
      contrastText: '#FFFFFF',
    },
    info: {
      main: colors.semantic.info.main,
      light: colors.neutral.gray500,
      dark: colors.neutral.gray700,
      contrastText: '#FFFFFF',
    },
    background: {
      default: colors.surface.page,
      paper: colors.background.paper,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
      disabled: colors.text.disabled,
    },
    divider: colors.border.medium,
  },
  typography: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    h1: {
      fontSize: typography.fontSize['5xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
      color: colors.text.primary,
    },
    h2: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
      color: colors.text.primary,
    },
    h3: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.snug,
      color: colors.text.primary,
    },
    h4: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.snug,
      color: colors.text.primary,
    },
    h5: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.normal,
      color: colors.text.primary,
    },
    h6: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.normal,
      color: colors.text.primary,
    },
    body1: {
      fontSize: typography.fontSize.base,
      lineHeight: typography.lineHeight.normal,
      color: colors.text.primary,
    },
    body2: {
      fontSize: typography.fontSize.sm,
      lineHeight: typography.lineHeight.normal,
      color: colors.text.secondary,
    },
    caption: {
      fontSize: typography.fontSize.xs,
      lineHeight: typography.lineHeight.snug,
      color: colors.text.tertiary,
    },
    button: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.medium,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.lg,
          boxShadow: shadows.card,
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.md,
          textTransform: 'none',
          fontWeight: typography.fontWeight.medium,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        sizeMedium: {
          height: componentSizes.button.md.height,
          padding: `0 ${componentSizes.button.md.px}px`,
          fontSize: componentSizes.button.md.fontSize,
        },
        sizeSmall: {
          height: componentSizes.button.sm.height,
          padding: `0 ${componentSizes.button.sm.px}px`,
          fontSize: componentSizes.button.sm.fontSize,
        },
        sizeLarge: {
          height: componentSizes.button.lg.height,
          padding: `0 ${componentSizes.button.lg.px}px`,
          fontSize: componentSizes.button.lg.fontSize,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.sm,
          fontWeight: typography.fontWeight.medium,
        },
        sizeMedium: {
          height: componentSizes.chip.md.height,
          fontSize: componentSizes.chip.md.fontSize,
        },
        sizeSmall: {
          height: componentSizes.chip.sm.height,
          fontSize: componentSizes.chip.sm.fontSize,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: borderRadius.md,
            backgroundColor: colors.background.paper,
            '& fieldset': {
              borderColor: colors.border.subtle,
            },
            '&:hover fieldset': {
              borderColor: colors.border.medium,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary.main,
              borderWidth: 1,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: borderRadius.lg,
        },
        elevation1: {
          boxShadow: shadows.sm,
        },
        elevation2: {
          boxShadow: shadows.md,
        },
        elevation3: {
          boxShadow: shadows.lg,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: shadows.lg,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: borderRadius.lg,
          boxShadow: shadows.modal,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${colors.border.subtle}`,
        },
        head: {
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.tertiary,
          textTransform: 'uppercase',
          fontSize: typography.fontSize.xs,
          letterSpacing: '0.5px',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: typography.fontWeight.semibold,
        },
      },
    },
  },
});