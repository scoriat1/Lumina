/**
 * Lumina Design System Tokens
 * Calm Executive SaaS Aesthetic - Refined Purple Brand Accent
 * 
 * Design Philosophy:
 * - Industry-agnostic, scalable, neutral but premium
 * - Stripe Dashboard/Linear-inspired design
 * - ONE refined purple brand accent (#6E5BCE)
 * - Executive neutral gray surfaces
 * - Restrained, premium color system
 */

// ===== COLOR PALETTE =====
export const colors = {
  // Brand Accent (Use sparingly - CTAs, focus states, key highlights)
  primary: {
    main: '#6E5BCE',          // Deep refined purple
    light: '#8B7BD8',         // Lighter variant
    dark: '#5847A8',          // Darker variant
    contrast: '#FFFFFF',
  },

  // Executive Neutrals - Primary palette
  neutral: {
    gray50: '#F7F8FA',        // Primary page background
    gray100: '#F1F2F4',       // Icon containers, button backgrounds
    gray200: '#E5E7EB',       // Subtle borders
    gray300: '#D1D5DB',       // Medium borders
    gray400: '#9CA3AF',       // Secondary text
    gray500: '#6B7280',       // Section labels
    gray600: '#5F6368',       // Icons, muted text
    gray700: '#374151',       // Body text
    gray800: '#1F2937',       // Emphasis text
    gray900: '#1A1A1A',       // Primary text
  },

  // Surface Colors
  surface: {
    page: '#F7F8FA',          // Primary page background
    drawer: '#FBFCFD',        // Drawer background (subtle cool tint)
    card: '#FFFFFF',          // Pure white cards
    elevated: '#FAFAFB',      // Hover state background
  },

  // Background Colors (MUI compatibility)
  background: {
    default: '#F7F8FA',       // Primary page background
    paper: '#FFFFFF',         // Paper/card backgrounds
    pure: '#FFFFFF',          // Pure white
  },

  // Text Colors
  text: {
    primary: '#1A1A1A',       // Primary text
    secondary: '#5F6368',     // Secondary text
    tertiary: '#6B7280',      // Tertiary/label text
    muted: '#9CA3AF',         // Muted text
    disabled: '#C5C0BC',      // Disabled text
  },

  // Border Colors
  border: {
    subtle: 'rgba(0, 0, 0, 0.06)',
    medium: 'rgba(0, 0, 0, 0.10)',
    strong: 'rgba(0, 0, 0, 0.15)',
    light: '#E8E5E1',         // Legacy support
  },

  // Semantic Colors (Minimal)
  semantic: {
    success: {
      main: '#2E7D32',        // Green for Paid/Completed
      bg: 'rgba(46, 125, 50, 0.08)',
      border: 'rgba(46, 125, 50, 0.20)',
    },
    error: {
      main: '#C62828',        // Red for destructive actions
      bg: 'rgba(198, 40, 40, 0.08)',
      border: 'rgba(198, 40, 40, 0.20)',
    },
    warning: {
      main: '#D97706',        // Amber for warnings
      bg: 'rgba(217, 119, 6, 0.08)',
      border: 'rgba(217, 119, 6, 0.20)',
    },
    info: {
      main: '#5F6368',        // Neutral for info
      bg: 'rgba(95, 99, 104, 0.08)',
      border: 'rgba(95, 99, 104, 0.20)',
    },
  },

  // Badge/Status Colors
  badge: {
    primary: { bg: 'rgba(110, 91, 206, 0.08)', text: '#6E5BCE' },
    success: { bg: 'rgba(46, 125, 50, 0.08)', text: '#2E7D32' },
    neutral: { bg: 'rgba(0, 0, 0, 0.04)', text: '#5F6368' },
    warning: { bg: 'rgba(217, 119, 6, 0.08)', text: '#D97706' },
    error: { bg: 'rgba(198, 40, 40, 0.08)', text: '#C62828' },
  },

  // Interactive States
  interactive: {
    hover: 'rgba(110, 91, 206, 0.08)',
    active: 'rgba(110, 91, 206, 0.12)',
    focus: '#6E5BCE',
    disabled: '#F1F2F4',
    disabledText: '#9CA3AF',
  },

  // Avatar colors for client profiles
  avatarPalette: [
    '#9B8B9E', // Muted lavender
    '#A8B5A0', // Muted sage
    '#9DAAB5', // Muted slate
    '#D4B88A', // Muted beige
    '#C18A8A', // Muted terracotta
    '#8FA8A8', // Muted teal
  ],
} as const;

// ===== SPACING SCALE =====
// Based on 8px base unit for consistent rhythm
export const spacing = {
  xs: 4,      // 0.5 units
  sm: 8,      // 1 unit
  md: 16,     // 2 units
  lg: 24,     // 3 units
  xl: 32,     // 4 units
  '2xl': 40,  // 5 units
  '3xl': 48,  // 6 units
  '4xl': 64,  // 8 units (global header height)
  '5xl': 80,  // 10 units
} as const;

// MUI spacing values (in units, multiply by 8 for pixels)
export const muiSpacing = {
  xs: 0.5,
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4,
  '2xl': 5,
  '3xl': 6,
  '4xl': 8,    // 64px - global header
  '5xl': 10,
} as const;

// ===== TYPOGRAPHY =====
export const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  
  // Font sizes
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
  
  // Font weights
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 1.75,
  },
} as const;

// ===== BORDER RADIUS =====
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

// ===== SHADOWS =====
export const shadows = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 2px 4px rgba(0, 0, 0, 0.06)',
  md: '0 4px 8px rgba(0, 0, 0, 0.08)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.10)',
  xl: '0 12px 24px rgba(0, 0, 0, 0.12)',
  '2xl': '0 16px 32px rgba(0, 0, 0, 0.14)',
  
  // Component-specific shadows
  card: '0 2px 4px rgba(0, 0, 0, 0.06)',
  cardHover: '0 4px 12px rgba(0, 0, 0, 0.10)',
  dropdown: '0 4px 16px rgba(0, 0, 0, 0.12)',
  modal: '0 12px 40px rgba(0, 0, 0, 0.18)',
} as const;

// ===== TRANSITIONS =====
export const transitions = {
  fast: '0.15s ease',
  base: '0.2s ease',
  slow: '0.3s ease',
  
  duration: {
    fast: 150,
    base: 200,
    slow: 300,
  },
  
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// ===== BREAKPOINTS =====
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
} as const;

// ===== Z-INDEX SCALE =====
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

// ===== LAYOUT CONSTANTS =====
export const layout = {
  headerHeight: 64,          // Global header height
  sidebarWidth: 240,         // Sidebar width (collapsed: 64)
  sidebarCollapsedWidth: 64,
  maxContentWidth: 1440,     // Max width for content
  pageGutter: 32,            // Page horizontal padding
} as const;

// ===== COMPONENT SIZES =====
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