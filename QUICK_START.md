# Lumina Quick Start Guide

## Using the New Architecture

### 1. Import Theme Tokens

Always import design tokens from the centralized theme:

```tsx
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
```

### 2. Use Layout Components

Structure your pages with layout components:

```tsx
import { PageHeader, Section } from '@/components/layout';

export function MyPage() {
  return (
    <>
      <PageHeader 
        title="Page Title"
        subtitle="Optional description"
        actions={<Button>Action</Button>}
      />

      <Section title="Section Title" spacing={4}>
        {/* Your content */}
      </Section>
    </>
  );
}
```

### 3. Style with Theme Tokens

```tsx
// ✅ Good - Using theme tokens
<Box sx={{ 
  p: 3,                           // MUI spacing (24px)
  bgcolor: colors.surface.card,   // White background
  color: colors.text.primary,     // Primary text color
  borderRadius: borderRadius.lg,  // 8px
  boxShadow: shadows.card,        // Subtle shadow
}}>

// ❌ Bad - Hardcoded values
<Box style={{ 
  padding: '24px',
  backgroundColor: '#FFFFFF',
  color: '#1A1A1A',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
}}>
```

### 4. Use Common Components

```tsx
import { StatusBadge, MetricCard, UserAvatar, EmptyState } from '@/components/common';

// Status badge
<StatusBadge status="upcoming" type="session" />

// Metric card
<MetricCard 
  title="Active Clients"
  value="48"
  trend={{ value: '+12%', direction: 'up' }}
/>

// User avatar
<UserAvatar initials="JD" color="#9B8B9E" size="lg" />

// Empty state
<EmptyState
  icon={<InboxIcon />}
  title="No sessions found"
  description="Create your first session to get started"
  action={{ label: 'New Session', onClick: handleCreate }}
/>
```

### 5. Responsive Design

Use MUI's responsive object syntax:

```tsx
<Grid container spacing={3}>
  <Grid item xs={12} sm={6} md={4}>
    {/* Mobile: full width, Tablet: half, Desktop: third */}
  </Grid>
</Grid>

<Box sx={{ 
  px: { xs: 2, sm: 3, md: 4 },  // Responsive padding
  fontSize: { xs: '14px', md: '16px' }  // Responsive font size
}}>
```

## Common Patterns

### Creating a New Page

```tsx
// /src/app/pages/MyFeature/MyFeaturePage.tsx
import { Box, Grid, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { PageHeader, Section } from '@/components/layout';
import { MyCustomComponent } from '@/components/my-feature';
import { colors } from '@/theme';

export function MyFeaturePage() {
  return (
    <Box>
      <PageHeader 
        title="My Feature"
        subtitle="Feature description"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: colors.brand.purple,
              '&:hover': { bgcolor: colors.brand.purpleDark },
            }}
          >
            New Item
          </Button>
        }
      />

      <Section title="Section Title" spacing={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <MyCustomComponent />
          </Grid>
        </Grid>
      </Section>
    </Box>
  );
}

// /src/app/pages/MyFeature/index.ts
export { MyFeaturePage } from './MyFeaturePage';
```

### Creating a Reusable Component

```tsx
// /src/app/components/my-domain/MyComponent.tsx
import { Box, Typography } from '@mui/material';
import { colors, typography, borderRadius } from '@/theme';

interface MyComponentProps {
  title: string;
  description?: string;
  onClick?: () => void;
}

export function MyComponent({ title, description, onClick }: MyComponentProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 3,
        bgcolor: colors.surface.card,
        borderRadius: borderRadius.lg,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          boxShadow: shadows.cardHover,
        } : undefined,
      }}
    >
      <Typography 
        variant="h6" 
        sx={{ 
          color: colors.text.primary,
          fontWeight: typography.fontWeight.semibold,
          mb: description ? 1 : 0,
        }}
      >
        {title}
      </Typography>
      
      {description && (
        <Typography 
          variant="body2" 
          sx={{ color: colors.text.secondary }}
        >
          {description}
        </Typography>
      )}
    </Box>
  );
}

// /src/app/components/my-domain/index.ts
export { MyComponent } from './MyComponent';
```

## Theme Token Reference

### Most Commonly Used

```tsx
import { colors, typography, spacing, borderRadius } from '@/theme';

// Colors
colors.brand.purple              // Primary brand color
colors.surface.card              // White background
colors.text.primary              // Dark text
colors.text.secondary            // Medium text
colors.text.tertiary             // Light text
colors.border.subtle             // Light border

// Typography
typography.fontSize.xs           // 11px
typography.fontSize.sm           // 13px
typography.fontSize.base         // 14px
typography.fontSize.lg           // 16px
typography.fontWeight.medium     // 500
typography.fontWeight.semibold   // 600

// Spacing (use MUI spacing for most cases)
sx={{ p: 2 }}                    // 16px padding
sx={{ mb: 3 }}                   // 24px margin-bottom
sx={{ gap: 2 }}                  // 16px gap

// Border Radius
borderRadius.md                  // 6px (inputs)
borderRadius.lg                  // 8px (cards)
borderRadius.xl                  // 10px (special)
```

### Status Colors

```tsx
// Session Status
<StatusBadge status="upcoming" type="session" />
<StatusBadge status="completed" type="session" />
<StatusBadge status="cancelled" type="session" />

// Payment Status
<StatusBadge status="paid" type="payment" />
<StatusBadge status="unpaid" type="payment" />
<StatusBadge status="invoiced" type="payment" />
<StatusBadge status="package" type="payment" />
```

### Semantic Colors

```tsx
// Success (green)
colors.semantic.success.main     // #2E7D32
colors.semantic.success.bg       // Light green background
colors.semantic.success.border   // Green border

// Error (red)
colors.semantic.error.main       // #C62828

// Warning (amber)
colors.semantic.warning.main     // #D97706

// Info (gray)
colors.semantic.info.main        // #5F6368
```

## File Organization

```
/src/app/
├── components/
│   ├── common/              # Reusable UI components
│   ├── layout/              # Layout components
│   ├── navigation/          # Navigation components
│   ├── sessions/            # Session components
│   ├── clients/             # Client components
│   ├── billing/             # Billing components
│   └── forms/               # Form components
│
├── pages/
│   ├── Dashboard/           # Each page in its own folder
│   │   ├── DashboardPage.tsx
│   │   └── index.ts
│   └── ...
│
└── theme/
    └── index.ts             # Central theme
```

## Adding a New Component

1. **Decide on category**: common, layout, navigation, or domain-specific
2. **Create component file**: `ComponentName.tsx` in appropriate folder
3. **Export from index.ts**: Add to folder's `index.ts`
4. **Use theme tokens**: Import from `@/theme`
5. **Add TypeScript interface**: Define props with types
6. **Test responsively**: Check mobile and desktop

Example:
```tsx
// 1. Create file: /components/common/InfoCard.tsx
// 2. Implement component
// 3. Add to /components/common/index.ts
export { InfoCard } from './InfoCard';
// 4. Use in pages
import { InfoCard } from '@/components/common';
```

## Common Mistakes to Avoid

### ❌ Don't hardcode values
```tsx
<Box sx={{ padding: '24px', color: '#1A1A1A' }}>
```

### ✅ Use theme tokens
```tsx
<Box sx={{ p: 3, color: colors.text.primary }}>
```

---

### ❌ Don't use inline styles
```tsx
<div style={{ backgroundColor: '#FFFFFF' }}>
```

### ✅ Use sx prop with theme
```tsx
<Box sx={{ bgcolor: colors.surface.card }}>
```

---

### ❌ Don't repeat layout code
```tsx
<Box sx={{ maxWidth: 1440, mx: 'auto', px: 4 }}>
  <Box sx={{ mb: 4 }}>
    <Typography variant="h4">Title</Typography>
  </Box>
</Box>
```

### ✅ Use layout components
```tsx
<PageHeader title="Title" />
<Section>...</Section>
```

---

### ❌ Don't create duplicate components
```tsx
// Multiple places with same markup
<Box sx={{ display: 'flex', gap: 2 }}>
  <Avatar>{initials}</Avatar>
  <Typography>{name}</Typography>
</Box>
```

### ✅ Extract to reusable component
```tsx
<UserCard name={name} initials={initials} />
```

## Getting Help

- **Architecture**: See `/ARCHITECTURE.md`
- **Components**: See `/src/app/components/README.md`
- **Theme Tokens**: See `/src/app/theme/index.ts`
- **Example**: See `/src/app/pages/Dashboard/DashboardPage.tsx`

## Tips

1. **Use autocomplete**: Theme tokens have full TypeScript support
2. **Check existing components**: Before creating new ones
3. **Follow patterns**: Look at Dashboard example
4. **Think responsive**: Use MUI's responsive props
5. **Compose components**: Build complex UIs from simple parts

---

Happy coding! 🚀