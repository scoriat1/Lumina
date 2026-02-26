/**
 * Legacy theme.ts compatibility file
 * This file re-exports from the new theme system for backward compatibility
 */

import {
  colors as _colors,
  spacing as _spacing,
  typography as _typography,
  borderRadius as _borderRadius,
  shadows as _shadows,
  transitions as _transitions,
  breakpoints as _breakpoints,
  layout as _layout,
  zIndex as _zIndex,
  componentSizes as _componentSizes,
  theme as _theme,
} from './theme/index';

// Re-export with both original and prefixed names
export const colors = _colors;
export const spacing = _spacing;
export const typography = _typography;
export const borderRadius = _borderRadius;
export const shadows = _shadows;
export const transitions = _transitions;
export const breakpoints = _breakpoints;
export const layout = _layout;
export const zIndex = _zIndex;
export const componentSizes = _componentSizes;
export const theme = _theme;

// Also export with "theme" prefix
export const themeColors = _colors;
export const themeSpacing = _spacing;
export const themeTypography = _typography;
export const themeBorderRadius = _borderRadius;
export const themeShadows = _shadows;
export const themeTransitions = _transitions;
export const themeBreakpoints = _breakpoints;
export const themeLayout = _layout;
export const themeZIndex = _zIndex;
export const themeComponentSizes = _componentSizes;

// Default export
export default _theme;
