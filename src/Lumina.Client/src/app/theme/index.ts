/**
 * Lumina Global Theme & Design Tokens
 * Central theme configuration for consistent design system
 */

import { createTheme, ThemeOptions } from '@mui/material/styles';

// ===== DESIGN TOKENS =====

// Color Palette
export const colors = {
  // Brand Colors - Muted lavender purple
  brand: {
    purple: '#9B8B9E',      // Muted lavender-purple
    purpleDark: '#8A7A8D',
    purpleLight: '#B5A5B8',
  },

  // Primary/Secondary for legacy compatibility
  primary: {
    main: '#9B8B9E',
    light: '#B5A5B8',
    dark: '#8A7A8D',
    contrast: '#FFFFFF',
  },

  secondary: {
    main: '#4CAF50',        // More vibrant green
    light: '#66BB6A',
    dark: '#388E3C',
    contrast: '#FFFFFF',
  },

  // Legacy accent colors for backwards compatibility
  accent: {
    sage: '#7B9A6C',        // More vibrant sage
    gold: '#C9A76B',        // More vibrant gold
    slate: {
      bg: 'rgba(139, 111, 191, 0.12)',
      text: '#8B6FBF',
    },
  },

  // Neutrals - Warmer and slightly more saturated
  neutral: {
    50: '#FAF9F7',
    100: '#F5F3F0',
    200: '#EBE8E3',
    300: '#DDD9D2',
    400: '#C5BFB5',
    500: '#9D9388',
    600: '#766D63',
    700: '#5A524A',
    800: '#3D3730',
    900: '#1F1C1A',
    // Legacy keys for backwards compatibility
    gray50: '#FAF9F7',
    gray100: '#F5F3F0',
    gray200: '#EBE8E3',
    gray300: '#DDD9D2',
    gray400: '#C5BFB5',
    gray500: '#9D9388',
    gray600: '#766D63',
    gray700: '#5A524A',
    gray800: '#3D3730',
    gray900: '#1F1C1A',
  },

  // Surface - Warmer backgrounds
  surface: {
    page: '#F5F3F0',        // Warm light background
    drawer: '#FAF9F7',      // Subtle warm white
    card: '#FFFFFF',
    elevated: '#FDFCFB',
  },

  // Background (for legacy compatibility)
  background: {
    default: '#F5F3F0',
    paper: '#FFFFFF',
    pure: '#FFFFFF',
  },

  // Text - Warmer tones
  text: {
    primary: '#1F1C1A',
    secondary: '#5A524A',
    tertiary: '#766D63',
    muted: '#9D9388',
    disabled: '#C5BFB5',
  },

  // Border - Warmer borders
  border: {
    subtle: 'rgba(139, 111, 191, 0.08)',
    medium: 'rgba(139, 111, 191, 0.15)',
    strong: 'rgba(139, 111, 191, 0.25)',
    light: '#DDD9D2',
  },

  // Semantic - More vibrant
  semantic: {
    success: {
      main: '#4CAF50',
      bg: 'rgba(76, 175, 80, 0.12)',
      border: 'rgba(76, 175, 80, 0.30)',
      text: '#388E3C',
    },
    error: {
      main: '#E53935',
      bg: 'rgba(229, 57, 53, 0.12)',
      border: 'rgba(229, 57, 53, 0.30)',
      text: '#C62828',
    },
    warning: {
      main: '#FB8C00',
      bg: 'rgba(251, 140, 0, 0.12)',
      border: 'rgba(251, 140, 0, 0.30)',
      text: '#EF6C00',
    },
    info: {
      main: '#29B6F6',
      bg: 'rgba(41, 182, 246, 0.12)',
      border: 'rgba(41, 182, 246, 0.30)',
      text: '#0288D1',
    },
  },

  // Status (legacy keys for backwards compatibility)
  status: {
    success: '#4CAF50',
    successBg: 'rgba(76, 175, 80, 0.12)',
    successBorder: 'rgba(76, 175, 80, 0.30)',
    // Session status - more vibrant
    upcoming: { bg: 'rgba(139, 111, 191, 0.12)', text: '#8B6FBF', border: 'rgba(139, 111, 191, 0.30)' },
    completed: { bg: 'rgba(76, 175, 80, 0.12)', text: '#388E3C', border: 'rgba(76, 175, 80, 0.30)' },
    cancelled: { bg: 'rgba(229, 57, 53, 0.12)', text: '#C62828', border: 'rgba(229, 57, 53, 0.30)' },
  },

  // Payment status - more vibrant
  payment: {
    paid: { bg: 'rgba(76, 175, 80, 0.12)', text: '#388E3C', border: 'rgba(76, 175, 80, 0.30)' },
    unpaid: { bg: 'rgba(229, 57, 53, 0.12)', text: '#C62828', border: 'rgba(229, 57, 53, 0.30)' },
    invoiced: { bg: 'rgba(251, 140, 0, 0.12)', text: '#EF6C00', border: 'rgba(251, 140, 0, 0.30)' },
    package: { bg: 'rgba(139, 111, 191, 0.08)', text: '#8B6FBF', border: 'rgba(139, 111, 191, 0.20)' },
  },

  // Badge/Status Colors - more vibrant
  badge: {
    primary: { bg: 'rgba(139, 111, 191, 0.12)', text: '#8B6FBF' },
    success: { bg: 'rgba(76, 175, 80, 0.12)', text: '#388E3C' },
    neutral: { bg: 'rgba(93, 82, 74, 0.08)', text: '#5A524A' },
    warning: { bg: 'rgba(251, 140, 0, 0.12)', text: '#EF6C00' },
    error: { bg: 'rgba(229, 57, 53, 0.12)', text: '#C62828' },
    active: { bg: 'rgba(139, 111, 191, 0.12)', text: '#8B6FBF' },
    completed: { bg: 'rgba(76, 175, 80, 0.12)', text: '#388E3C' },
    scheduled: { bg: 'rgba(93, 82, 74, 0.08)', text: '#5A524A' },
  },

  // Interactive States - more vibrant
  interactive: {
    hover: 'rgba(139, 111, 191, 0.10)',
    active: 'rgba(139, 111, 191, 0.16)',
    focus: '#8B6FBF',
    disabled: '#EBE8E3',
    disabledText: '#9D9388',
  },

  // Avatar palette - more vibrant and saturated
  avatarPalette: [
    '#9775D8', // Vibrant lavender
    '#7BB369', // Vibrant sage
    '#6B9BC3', // Vibrant slate blue
    '#E8B862', // Vibrant gold
    '#D97777', // Vibrant coral
    '#5DABA8', // Vibrant teal
  ],
} as const;

// Spacing Scale (8px base)
export const spacing = {
  0: 0,
  0.5: 4,
  1: 8,
  2: 16,
  3: 24,
  4: 32,
  5: 40,
  6: 48,
  8: 64,
  10: 80,
  12: 96,
  16: 128,
} as const;

// Typography
export const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  
  fontSize: {
    xs: '11px',
    sm: '13px',
    base: '14px',
    md: '15px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '28px',
    '5xl': '32px',
  },

  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 1.75,
  },
} as const;

// Border Radius
export const borderRadius = {
  none: '0',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '10px',
  '2xl': '12px',
  '3xl': '16px',
  full: '9999px',
} as const;

// Shadows
export const shadows = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 2px 4px rgba(0, 0, 0, 0.06)',
  md: '0 4px 8px rgba(0, 0, 0, 0.08)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.10)',
  xl: '0 12px 24px rgba(0, 0, 0, 0.12)',
  '2xl': '0 16px 32px rgba(0, 0, 0, 0.14)',
  card: '0 2px 4px rgba(0, 0, 0, 0.06)',
  cardHover: '0 4px 12px rgba(0, 0, 0, 0.10)',
  dropdown: '0 4px 16px rgba(0, 0, 0, 0.12)',
  modal: '0 12px 40px rgba(0, 0, 0, 0.18)',
} as const;

// Transitions
export const transitions = {
  fast: '0.15s ease',
  base: '0.2s ease',
  slow: '0.3s ease',
} as const;

// Breakpoints
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
} as const;

// Layout
export const layout = {
  headerHeight: 64,
  sidebarWidth: 57,
  sidebarCollapsedWidth: 57,
  maxContentWidth: 1200,
  pageGutter: 32,
} as const;

// Z-Index
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
} as const;

// Component Sizes
export const componentSizes = {
  button: {
    sm: { height: 32, px: 12, fontSize: '13px' },
    md: { height: 36, px: 16, fontSize: '14px' },
    lg: { height: 40, px: 20, fontSize: '15px' },
  },
  input: {
    sm: { height: 32, px: 12, fontSize: '13px' },
    md: { height: 36, px: 14, fontSize: '14px' },
    lg: { height: 40, px: 16, fontSize: '15px' },
  },
  chip: {
    sm: { height: 20, px: 8, fontSize: '11px' },
    md: { height: 24, px: 10, fontSize: '12px' },
    lg: { height: 28, px: 12, fontSize: '13px' },
  },
  avatar: {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48,
  },
} as const;

// ===== MATERIAL-UI THEME =====

export const theme = createTheme({
  palette: {
    primary: {
      main: colors.brand.purple,
      light: colors.brand.purpleLight,
      dark: colors.brand.purpleDark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: colors.neutral[700],
      light: colors.neutral[600],
      dark: colors.neutral[800],
      contrastText: '#FFFFFF',
    },
    success: {
      main: colors.semantic.success.main,
      contrastText: '#FFFFFF',
    },
    error: {
      main: colors.semantic.error.main,
      contrastText: '#FFFFFF',
    },
    warning: {
      main: colors.semantic.warning.main,
      contrastText: '#FFFFFF',
    },
    info: {
      main: colors.semantic.info.main,
      contrastText: '#FFFFFF',
    },
    background: {
      default: colors.surface.page,
      paper: colors.surface.card,
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
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.surface.page,
          color: colors.text.primary,
        },
      },
    },
    
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.lg,
          boxShadow: shadows.card,
          backgroundImage: 'none',
          backgroundColor: colors.surface.card,
          transition: transitions.base,
          '&:hover': {
            boxShadow: shadows.cardHover,
          },
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
          transition: transitions.base,
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
        // Primary action button style (for Add/New buttons)
        contained: {
          '&.MuiButton-containedPrimary': {
            backgroundColor: colors.brand.purple,
            color: '#FFFFFF',
            borderRadius: '10px',
            fontWeight: 600,
            height: '56px',
            paddingLeft: 24,
            paddingRight: 24,
            boxShadow: `0 2px 8px ${colors.brand.purple}33`,
            '@media (max-width: 600px)': {
              height: '48px',
              fontSize: '14px',
              paddingLeft: 20,
              paddingRight: 20,
            },
            '&:hover': {
              backgroundColor: colors.brand.purpleDark,
              boxShadow: `0 4px 12px ${colors.brand.purple}4D`,
            },
          },
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
            backgroundColor: colors.surface.card,
            transition: transitions.base,
            '& fieldset': {
              borderColor: colors.border.subtle,
            },
            '&:hover fieldset': {
              borderColor: colors.border.medium,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.brand.purple,
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
          backgroundColor: colors.surface.drawer,
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

// Export all tokens for direct usage
export { 
  colors as themeColors, 
  spacing as themeSpacing, 
  typography as themeTypography,
  borderRadius as themeBorderRadius,
  shadows as themeShadows,
  transitions as themeTransitions,
  breakpoints as themeBreakpoints,
  layout as themeLayout,
  zIndex as themeZIndex,
  componentSizes as themeComponentSizes,
};