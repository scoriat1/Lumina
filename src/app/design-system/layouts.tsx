import { Box, Container, Stack } from '@mui/material';
import { ReactNode } from 'react';
import { colors, spacing, layout } from './tokens';

// ===== PAGE CONTAINER =====
// Standard page wrapper with consistent padding and max-width
interface PageContainerProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
  disableGutters?: boolean;
}

export function PageContainer({ 
  children, 
  maxWidth = 'xl',
  disableGutters = false 
}: PageContainerProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: colors.surface.page,
      }}
    >
      <Container
        maxWidth={maxWidth}
        disableGutters={disableGutters}
        sx={{
          px: disableGutters ? 0 : 4,
          py: 0,
          height: '100%',
        }}
      >
        {children}
      </Container>
    </Box>
  );
}

// ===== SECTION WRAPPER =====
// Consistent spacing for page sections
interface SectionWrapperProps {
  children: ReactNode;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
}

export function SectionWrapper({ 
  children, 
  spacing: spacingSize = 'lg' 
}: SectionWrapperProps) {
  const spacingMap = {
    sm: 2,
    md: 3,
    lg: 4,
    xl: 6,
  };

  return (
    <Box sx={{ mb: spacingMap[spacingSize] }}>
      {children}
    </Box>
  );
}

// ===== GRID LAYOUT =====
// Flexible grid layout for cards and content
interface GridLayoutProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: number;
  minCardWidth?: number;
}

export function GridLayout({ 
  children, 
  columns = 3,
  gap = 3,
  minCardWidth = 280,
}: GridLayoutProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: columns >= 2 ? `repeat(2, 1fr)` : '1fr',
          md: `repeat(${columns}, 1fr)`,
        },
        gap,
      }}
    >
      {children}
    </Box>
  );
}

// ===== FORM LAYOUT =====
// Consistent form field spacing
interface FormLayoutProps {
  children: ReactNode;
  spacing?: number;
  maxWidth?: number | string;
}

export function FormLayout({ 
  children, 
  spacing: formSpacing = 3,
  maxWidth = 600,
}: FormLayoutProps) {
  return (
    <Stack 
      spacing={formSpacing}
      sx={{ 
        maxWidth,
        width: '100%',
      }}
    >
      {children}
    </Stack>
  );
}

// ===== CARD GRID =====
// Responsive grid specifically for card layouts
interface CardGridProps {
  children: ReactNode;
  minCardWidth?: number;
  gap?: number;
}

export function CardGrid({ 
  children, 
  minCardWidth = 320,
  gap = 3,
}: CardGridProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`,
        gap,
      }}
    >
      {children}
    </Box>
  );
}

// ===== SPLIT LAYOUT =====
// Two-column layout for detail views
interface SplitLayoutProps {
  left: ReactNode;
  right: ReactNode;
  leftWidth?: string | number;
  gap?: number;
}

export function SplitLayout({ 
  left, 
  right, 
  leftWidth = '60%',
  gap = 4,
}: SplitLayoutProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: `${leftWidth} 1fr` },
        gap,
      }}
    >
      <Box>{left}</Box>
      <Box>{right}</Box>
    </Box>
  );
}

// ===== FLEX LAYOUT =====
// Simple flex utilities
interface FlexProps {
  children: ReactNode;
  direction?: 'row' | 'column';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  gap?: number;
  wrap?: boolean;
}

export function Flex({ 
  children, 
  direction = 'row',
  align = 'center',
  justify = 'flex-start',
  gap = 0,
  wrap = false,
}: FlexProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: direction,
        alignItems: align,
        justifyContent: justify,
        gap,
        flexWrap: wrap ? 'wrap' : 'nowrap',
      }}
    >
      {children}
    </Box>
  );
}

// ===== STACK LAYOUT =====
// Vertical or horizontal stack with consistent spacing
interface StackLayoutProps {
  children: ReactNode;
  direction?: 'row' | 'column';
  spacing?: number;
  divider?: boolean;
}

export function StackLayout({ 
  children, 
  direction = 'column',
  spacing: stackSpacing = 2,
  divider = false,
}: StackLayoutProps) {
  return (
    <Stack
      direction={direction}
      spacing={stackSpacing}
      divider={divider ? <Box sx={{ borderBottom: `1px solid ${colors.border.subtle}` }} /> : undefined}
    >
      {children}
    </Stack>
  );
}
