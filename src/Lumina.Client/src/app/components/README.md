# Lumina Component Architecture

## Overview

This document outlines the component organization and design system for Lumina, a professional service provider management platform.

## Design Philosophy

- **Industry-agnostic**: Neutral, scalable design suitable for consultants, therapists, advisors, designers, strategists, and other professionals
- **Executive SaaS aesthetic**: Calm, refined interface inspired by Stripe Dashboard and Linear
- **Minimal brand accent**: One refined purple (#6E5BCE) used sparingly for CTAs and focus states
- **Premium neutrals**: Gray-based color palette for surfaces and content
- **Responsive & accessible**: Mobile-first approach with proper contrast and touch targets

## Folder Structure

```
/src/app/
├── components/
│   ├── common/           # Reusable UI components
│   │   ├── StatusBadge.tsx
│   │   ├── MetricCard.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── UserAvatar.tsx
│   │   └── index.ts
│   ├── layout/           # Layout components
│   │   ├── AppLayout.tsx
│   │   ├── PageContainer.tsx
│   │   ├── PageHeader.tsx
│   │   ├── Section.tsx
│   │   └── index.ts
│   ├── navigation/       # Navigation components
│   │   ├── Sidebar.tsx
│   │   ├── AppTopBar.tsx
│   │   └── index.ts
│   ├── sessions/         # Session-specific components
│   │   ├── SessionCard.tsx
│   │   └── index.ts
│   ├── clients/          # Client-specific components (to be created)
│   ├── billing/          # Billing-specific components (to be created)
│   └── forms/            # Form components (to be created)
├── pages/
│   ├── Dashboard/
│   │   ├── DashboardPage.tsx
│   │   └── index.ts
│   └── [other pages...]
├── theme/
│   └── index.ts          # Central theme & design tokens
├── contexts/
└── data/
```

## Component Guidelines

### Common Components (`/components/common/`)

Reusable, domain-agnostic UI components used across the application.

**Examples:**
- `StatusBadge`: Status and payment badges with predefined styles
- `MetricCard`: Dashboard metric cards with icons and trends
- `EmptyState`: Empty state placeholders with optional CTAs
- `LoadingSpinner`: Loading indicators
- `UserAvatar`: User/client avatars with initials

**Usage:**
```tsx
import { StatusBadge, MetricCard, UserAvatar } from '@/components/common';

<StatusBadge status="upcoming" type="session" />
<MetricCard title="Active Clients" value="48" trend={{ value: '+12%', direction: 'up' }} />
<UserAvatar initials="AT" color="#9B8B9E" size="lg" />
```

### Layout Components (`/components/layout/`)

Structural components for consistent page layouts.

**Examples:**
- `AppLayout`: Main app shell with sidebar and topbar
- `PageContainer`: Consistent page width and padding wrapper
- `PageHeader`: Page title, breadcrumbs, and actions
- `Section`: Content sections with optional titles and dividers

**Usage:**
```tsx
import { PageHeader, Section } from '@/components/layout';

<PageHeader 
  title="Dashboard" 
  subtitle="Overview of your practice"
  actions={<Button>New Session</Button>}
/>

<Section title="Metrics" spacing={4}>
  {/* Content */}
</Section>
```

### Navigation Components (`/components/navigation/`)

App-level navigation elements.

**Examples:**
- `Sidebar`: Icon-only vertical navigation rail
- `AppTopBar`: Top application bar with notifications and user menu

### Domain Components

Feature-specific components organized by domain:

- **`/components/sessions/`**: Session-related components
- **`/components/clients/`**: Client-related components
- **`/components/billing/`**: Billing-related components
- **`/components/forms/`**: Form inputs and form layouts

## Theme & Design Tokens

All styling should reference the central theme (`/theme/index.ts`) instead of using inline styles or magic values.

### Using Theme Tokens

```tsx
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';

// Colors
sx={{ 
  bgcolor: colors.surface.card,
  color: colors.text.primary,
  borderColor: colors.border.subtle,
}}

// Typography
sx={{ 
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  lineHeight: typography.lineHeight.normal,
}}

// Spacing
sx={{ 
  p: 3,              // Uses MUI spacing (3 * 8 = 24px)
  mb: spacing.lg,    // Direct token usage (24px)
}}

// Border Radius
sx={{ 
  borderRadius: borderRadius.lg,  // 8px
}}

// Shadows
sx={{ 
  boxShadow: shadows.card,
}}
```

### Available Tokens

**Colors:**
- `colors.brand.purple` - Primary brand color
- `colors.neutral[50-900]` - Gray scale
- `colors.surface.{page|card|drawer|elevated}` - Surface backgrounds
- `colors.text.{primary|secondary|tertiary|muted}` - Text colors
- `colors.border.{subtle|medium|strong}` - Border colors
- `colors.semantic.{success|error|warning|info}` - Semantic colors
- `colors.status.*` - Session status colors
- `colors.payment.*` - Payment status colors
- `colors.avatarPalette[]` - Avatar colors

**Spacing:**
- MUI spacing: `0.5, 1, 2, 3, 4, 5, 6, 8, 10` (multiply by 8 for pixels)
- Direct: `spacing.{xs|sm|md|lg|xl|2xl|3xl|4xl|5xl}`

**Typography:**
- `typography.fontSize.{xs|sm|base|md|lg|xl|2xl|3xl|4xl|5xl}`
- `typography.fontWeight.{regular|medium|semibold|bold}`
- `typography.lineHeight.{tight|snug|normal|relaxed|loose}`

**Layout:**
- `layout.headerHeight` - 64px
- `layout.sidebarWidth` - 240px
- `layout.sidebarCollapsedWidth` - 64px
- `layout.maxContentWidth` - 1440px

## Best Practices

### 1. Avoid Inline Styles

❌ Don't:
```tsx
<Box style={{ padding: '24px', backgroundColor: '#F7F8FA' }}>
```

✅ Do:
```tsx
<Box sx={{ p: 3, bgcolor: colors.surface.page }}>
```

### 2. Use Theme Components

❌ Don't:
```tsx
<div style={{ 
  borderRadius: '8px', 
  boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
  padding: '24px'
}}>
```

✅ Do:
```tsx
<Card sx={{ p: 3 }}>  {/* Card has theme styles built-in */}
```

### 3. Compose with Layout Components

❌ Don't:
```tsx
<Box sx={{ maxWidth: 1200, mx: 'auto', px: 4, py: 5 }}>
  <Box sx={{ mb: 4 }}>
    <Typography variant="h4">Title</Typography>
  </Box>
  {/* Content */}
</Box>
```

✅ Do:
```tsx
<PageContainer>
  <PageHeader title="Title" />
  <Section>
    {/* Content */}
  </Section>
</PageContainer>
```

### 4. Extract Reusable Components

When you notice repeated patterns, extract them into components:

```tsx
// Before: Repeated session card markup in multiple places
<Box sx={{ display: 'flex', gap: 2, p: 2 }}>
  <Avatar>{initials}</Avatar>
  <Box>
    <Typography>{name}</Typography>
    <Typography variant="caption">{time}</Typography>
  </Box>
</Box>

// After: Reusable SessionCard component
<SessionCard clientName={name} time={time} />
```

### 5. Responsive Design

Use MUI's responsive props:

```tsx
<Grid container spacing={3}>
  <Grid item xs={12} sm={6} md={4} lg={3}>
    {/* Responsive grid item */}
  </Grid>
</Grid>

<Box sx={{ 
  px: { xs: 2, sm: 3, md: 4 },  // Responsive padding
  fontSize: { xs: '14px', md: '16px' }  // Responsive font size
}}>
```

## Adding New Components

1. **Choose the right folder**: Determine if it's common, layout, navigation, or domain-specific
2. **Follow naming conventions**: PascalCase for components, index.ts for barrel exports
3. **Use theme tokens**: Import from `@/theme` instead of hardcoding values
4. **Export from index.ts**: Add component to the folder's index.ts for clean imports
5. **Document props**: Add TypeScript interfaces with JSDoc comments

Example:
```tsx
// /components/common/NewComponent.tsx
import { Box, Typography } from '@mui/material';
import { colors, typography } from '@/theme';

interface NewComponentProps {
  /** The title to display */
  title: string;
  /** Optional description text */
  description?: string;
}

export function NewComponent({ title, description }: NewComponentProps) {
  return (
    <Box sx={{ p: 2, bgcolor: colors.surface.card }}>
      <Typography variant="h6" sx={{ color: colors.text.primary }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}

// /components/common/index.ts
export { NewComponent } from './NewComponent';
```

## Migration Checklist

When refactoring existing components:

- [ ] Move component to appropriate folder
- [ ] Replace inline styles with theme tokens
- [ ] Extract magic numbers to theme constants
- [ ] Use layout components where applicable
- [ ] Add TypeScript interfaces for props
- [ ] Export from folder's index.ts
- [ ] Update imports in consuming files
- [ ] Test responsive behavior
- [ ] Verify accessibility (contrast, focus states, keyboard navigation)

## Resources

- [Material-UI Documentation](https://mui.com/)
- [MUI sx prop](https://mui.com/system/getting-started/the-sx-prop/)
- [Lumina Theme Tokens](/src/app/theme/index.ts)