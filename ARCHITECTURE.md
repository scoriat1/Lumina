# Lumina Architecture

## Project Overview

Lumina is a responsive web application for professional service providers (consultants, therapists, advisors, designers, strategists) to manage their practice. Built with React, TypeScript, Material-UI, and featuring a calm executive SaaS aesthetic.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) v6
- **Routing**: React Router v7
- **Styling**: MUI's sx prop + centralized theme tokens
- **Build Tool**: Vite
- **State Management**: React Context API

## Project Structure

```
/src/
├── app/
│   ├── components/           # Reusable UI components
│   │   ├── common/          # Domain-agnostic components
│   │   ├── layout/          # Layout & structure components
│   │   ├── navigation/      # Navigation components
│   │   ├── sessions/        # Session-specific components
│   │   ├── clients/         # Client-specific components
│   │   ├── billing/         # Billing-specific components
│   │   ├── forms/           # Form components
│   │   └── README.md        # Component documentation
│   │
│   ├── pages/               # Route pages
│   │   ├── Dashboard/
│   │   ├── Clients/
│   │   ├── Calendar/
│   │   ├── Sessions/
│   │   ├── Billing/
│   │   └── Settings/
│   │
│   ├── theme/               # Design system
│   │   └── index.ts         # Centralized theme & tokens
│   │
│   ├── contexts/            # React contexts
│   │   └── NotesTemplateContext.tsx
│   │
│   ├── data/                # Mock data & constants
│   │
│   ├── App.tsx              # Root app component
│   ├── RootLayout.tsx       # Main layout wrapper
│   └── routes.tsx           # Route configuration
│
├── styles/
│   ├── fonts.css
│   ├── index.css
│   └── theme.css
│
└── index.tsx                # Application entry point
```

## Design System

### Theme Architecture

All design tokens are centralized in `/src/app/theme/index.ts`:

**Color System:**
- One primary brand color (purple #6E5BCE)
- Executive neutral grays (50-900 scale)
- Semantic colors for success/error/warning/info
- Surface colors for backgrounds (page, card, drawer, elevated)
- Status-specific colors for sessions and payments
- Avatar color palette for user profiles

**Typography Scale:**
- System font stack (San Francisco, Segoe UI, Roboto)
- Font sizes: xs (11px) → 5xl (32px)
- Font weights: regular, medium, semibold, bold
- Line heights: tight, snug, normal, relaxed, loose

**Spacing Scale:**
- 8px base unit
- MUI spacing units: 0.5, 1, 2, 3, 4, 5, 6, 8, 10
- Direct tokens: xs, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl

**Other Tokens:**
- Border radius: sm (4px) → 3xl (16px)
- Shadows: xs → 2xl + component-specific
- Transitions: fast (150ms), base (200ms), slow (300ms)
- Breakpoints: xs, sm, md, lg, xl
- Z-index scale: base → tooltip
- Layout constants: header height, sidebar width, max content width

### Component Styling Guidelines

**✅ DO:**
```tsx
import { colors, typography, borderRadius } from '@/theme';

<Box sx={{ 
  p: 3,
  bgcolor: colors.surface.card,
  color: colors.text.primary,
  borderRadius: borderRadius.lg,
}}>
```

**❌ DON'T:**
```tsx
<Box style={{ 
  padding: '24px',
  backgroundColor: '#FFFFFF',
  color: '#1A1A1A',
  borderRadius: '8px',
}}>
```

## Component Architecture

### Component Categories

1. **Common Components** (`/components/common/`)
   - Reusable, domain-agnostic UI elements
   - Examples: StatusBadge, MetricCard, EmptyState, LoadingSpinner, UserAvatar
   - Should be highly reusable across features

2. **Layout Components** (`/components/layout/`)
   - Structural components for page layouts
   - Examples: AppLayout, PageContainer, PageHeader, Section
   - Enforce consistent spacing and structure

3. **Navigation Components** (`/components/navigation/`)
   - App-level navigation
   - Examples: Sidebar, AppTopBar
   - Handle routing and active states

4. **Domain Components** (`/components/{domain}/`)
   - Feature-specific components
   - Examples: SessionCard, ClientCard, BillingInvoice
   - Organized by business domain

### Component Organization Pattern

Each component folder follows this pattern:

```
/components/common/
├── StatusBadge.tsx      # Component implementation
├── MetricCard.tsx
├── EmptyState.tsx
└── index.ts             # Barrel export
```

The `index.ts` file exports all components for clean imports:

```tsx
// Instead of:
import { StatusBadge } from '@/components/common/StatusBadge';
import { MetricCard } from '@/components/common/MetricCard';

// You can do:
import { StatusBadge, MetricCard } from '@/components/common';
```

## Page Architecture

### Page Structure

Each page follows a consistent structure:

```tsx
import { PageHeader, Section } from '@/components/layout';
import { OtherComponents } from '@/components/...';

export function DashboardPage() {
  return (
    <Box>
      <PageHeader 
        title="Dashboard"
        subtitle="Optional subtitle"
        actions={<Button>Action</Button>}
      />

      <Section title="Section Title">
        {/* Section content */}
      </Section>

      <Section title="Another Section">
        {/* More content */}
      </Section>
    </Box>
  );
}
```

### Layout Wrapper

All pages are wrapped by `RootLayout.tsx` which provides:
- Consistent sidebar navigation
- Top application bar
- Maximum content width (1440px)
- Responsive padding
- Scroll container

Pages should **NOT** define their own max-width or page-level padding.

## Routing

Routes are configured in `/src/app/routes.tsx` using React Router's data mode:

```tsx
export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: 'clients', Component: ClientsPage },
      { path: 'clients/:id', Component: ClientDetailPage },
      // ... more routes
    ],
  },
]);
```

## State Management

### Context API

Used for global state that needs to be accessed across the app:

- `NotesTemplateContext`: Manages notes template settings

### Local State

Component-specific state uses React's `useState` and `useReducer`.

### Props Drilling

Kept minimal by using contexts for global state and component composition.

## Responsive Design

### Breakpoints

- **xs**: 0px (mobile)
- **sm**: 600px (tablet)
- **md**: 960px (small desktop)
- **lg**: 1280px (desktop)
- **xl**: 1920px (large desktop)

### Responsive Patterns

**Grid Layout:**
```tsx
<Grid container spacing={3}>
  <Grid item xs={12} sm={6} md={4} lg={3}>
    {/* Responsive grid item */}
  </Grid>
</Grid>
```

**Responsive Spacing:**
```tsx
<Box sx={{ 
  px: { xs: 2, sm: 3, md: 4 },
  py: { xs: 3, sm: 4, md: 5 },
}}>
```

**Conditional Display:**
```tsx
<Box sx={{ 
  display: { xs: 'none', md: 'block' }  // Hide on mobile
}}>
```

## Accessibility

### Guidelines

- Use semantic HTML elements
- Provide ARIA labels for icon-only buttons
- Ensure sufficient color contrast (WCAG AA)
- Support keyboard navigation
- Add focus indicators
- Use descriptive link text
- Provide alt text for images

### Implementation Examples

```tsx
// Icon button with label
<IconButton aria-label="notifications">
  <NotificationsIcon />
</IconButton>

// Status badge with semantic meaning
<Chip 
  label="Completed" 
  role="status"
  aria-label="Session status: Completed"
/>
```

## Performance

### Code Splitting

Pages are lazy-loaded via React Router:

```tsx
const DashboardPage = lazy(() => import('./pages/Dashboard'));
```

### Component Optimization

- Use `React.memo()` for expensive components
- Memoize callbacks with `useCallback()`
- Memoize computed values with `useMemo()`
- Avoid inline function definitions in render

### Bundle Size

- Import only needed MUI components
- Use tree-shaking compatible imports
- Lazy load heavy dependencies

## Development Workflow

### Adding a New Feature

1. **Plan component structure**
   - Identify reusable vs. domain-specific components
   - Choose appropriate component folder

2. **Create components**
   - Follow naming conventions (PascalCase)
   - Use TypeScript interfaces for props
   - Reference theme tokens for styling
   - Export from folder's index.ts

3. **Create page**
   - Use layout components (PageHeader, Section)
   - Compose with domain components
   - Add route to routes.tsx

4. **Test**
   - Verify responsive behavior
   - Check accessibility
   - Test keyboard navigation

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (via IDE)
- **Naming**: 
  - Components: PascalCase (e.g., `StatusBadge`)
  - Files: PascalCase for components (e.g., `StatusBadge.tsx`)
  - Functions: camelCase (e.g., `handleClick`)
  - Constants: UPPER_SNAKE_CASE (e.g., `MAX_SESSIONS`)

## Best Practices

### Component Design

1. **Single Responsibility**: Each component should do one thing well
2. **Composition over Inheritance**: Build complex UIs from simple components
3. **Props Interface**: Always define TypeScript interfaces for props
4. **Default Props**: Use destructuring with defaults for optional props
5. **Avoid Prop Drilling**: Use context for deeply nested state

### Styling

1. **Use Theme Tokens**: Never hardcode colors, spacing, etc.
2. **Avoid Inline Styles**: Use MUI's sx prop
3. **Responsive First**: Consider mobile layout from the start
4. **Semantic Color Usage**: Use semantic colors (success, error) appropriately
5. **Consistent Spacing**: Use theme spacing scale

### State Management

1. **Lift State Up**: Hoist state to common ancestor
2. **Context for Global**: Use context for app-wide state
3. **Local When Possible**: Keep state as local as possible
4. **Derived State**: Compute from existing state instead of duplicating

### File Organization

1. **Colocate Related Files**: Keep related components together
2. **Barrel Exports**: Use index.ts for clean imports
3. **Consistent Structure**: Follow established folder patterns
4. **Meaningful Names**: Use descriptive, searchable names

## Migration Guide

### Refactoring Existing Code

When updating older components to match the new architecture:

1. **Identify inline styles** → Replace with theme tokens
2. **Find hardcoded values** → Extract to theme constants
3. **Spot repeated patterns** → Extract to reusable components
4. **Check layout structure** → Use layout components
5. **Review responsive behavior** → Add responsive props
6. **Test thoroughly** → Ensure no visual regressions

### Example Migration

**Before:**
```tsx
<div style={{ 
  padding: '24px', 
  backgroundColor: '#F7F8FA',
  borderRadius: '8px',
  marginBottom: '32px'
}}>
  <h2 style={{ color: '#1A1A1A', fontSize: '20px' }}>Title</h2>
  <p style={{ color: '#5F6368' }}>Description</p>
</div>
```

**After:**
```tsx
import { Section } from '@/components/layout';
import { colors } from '@/theme';

<Section title="Title" spacing={4}>
  <Typography variant="body2" sx={{ color: colors.text.secondary }}>
    Description
  </Typography>
</Section>
```

## Resources

- [Component Documentation](/src/app/components/README.md)
- [Theme Tokens](/src/app/theme/index.ts)
- [Material-UI Docs](https://mui.com/)
- [React Router Docs](https://reactrouter.com/)

---

**Last Updated**: February 2026
**Version**: 2.0