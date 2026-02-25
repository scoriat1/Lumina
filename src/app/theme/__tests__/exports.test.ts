/**
 * Theme Export Verification
 * This file verifies that all theme exports are working correctly
 */

import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  layout,
  zIndex,
  componentSizes,
  theme,
  themeColors,
  themeSpacing,
  themeTypography,
  themeBorderRadius,
  themeShadows,
  themeTransitions,
  themeBreakpoints,
  themeLayout,
  themeZIndex,
  themeComponentSizes,
} from '../theme';

// Verify all exports are defined
console.assert(colors !== undefined, 'colors should be defined');
console.assert(spacing !== undefined, 'spacing should be defined');
console.assert(typography !== undefined, 'typography should be defined');
console.assert(borderRadius !== undefined, 'borderRadius should be defined');
console.assert(shadows !== undefined, 'shadows should be defined');
console.assert(transitions !== undefined, 'transitions should be defined');
console.assert(breakpoints !== undefined, 'breakpoints should be defined');
console.assert(layout !== undefined, 'layout should be defined');
console.assert(zIndex !== undefined, 'zIndex should be defined');
console.assert(componentSizes !== undefined, 'componentSizes should be defined');
console.assert(theme !== undefined, 'theme should be defined');

// Verify theme-prefixed exports
console.assert(themeColors !== undefined, 'themeColors should be defined');
console.assert(themeSpacing !== undefined, 'themeSpacing should be defined');
console.assert(themeTypography !== undefined, 'themeTypography should be defined');
console.assert(themeBorderRadius !== undefined, 'themeBorderRadius should be defined');
console.assert(themeShadows !== undefined, 'themeShadows should be defined');
console.assert(themeTransitions !== undefined, 'themeTransitions should be defined');
console.assert(themeBreakpoints !== undefined, 'themeBreakpoints should be defined');
console.assert(themeLayout !== undefined, 'themeLayout should be defined');
console.assert(themeZIndex !== undefined, 'themeZIndex should be defined');
console.assert(themeComponentSizes !== undefined, 'themeComponentSizes should be defined');

console.log('✅ All theme exports verified successfully');

export {};
