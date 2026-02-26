# Lumina Design System

A comprehensive, reusable component library for professional service platforms with a calm executive SaaS aesthetic.

## Design Philosophy

- **Industry-agnostic**: Works for consultants, therapists, advisors, designers, strategists, and other professional service providers
- **Scalable & Premium**: Stripe Dashboard/Linear-inspired design with refined color system
- **Restrained Palette**: ONE refined purple brand accent (#6E5BCE) with executive neutral grays
- **Consistent Patterns**: Standardized components, spacing, and visual hierarchy

## Getting Started

```tsx
import { Button, Card, Badge, Input, StatCard, tokens } from './design-system';

// Use tokens directly
const MyComponent = () => (
  <div style={{ backgroundColor: tokens.colors.surface.page }}>
    <Button color="primary" size="md">Save Changes</Button>
  </div>
);
```

## Design Tokens

### Colors

```tsx
import { colors } from './design-system';

// Brand
colors.primary.main        // #6E5BCE - Deep refined purple (use sparingly)
colors.primary.light       // #8B7BD8
colors.primary.dark        // #5847A8

// Neutrals (Primary Palette)
colors.neutral.gray50      // #F7F8FA - Page background
colors.neutral.gray100     // #F1F2F4 - Icon containers, button backgrounds
colors.neutral.gray900     // #1A1A1A - Primary text

// Surfaces
colors.surface.page        // #F7F8FA - Primary page background
colors.surface.drawer      // #FBFCFD - Drawer background
colors.surface.card        // #FFFFFF - Card background

// Semantic
colors.semantic.success    // Green for Paid/Completed
colors.semantic.error      // Red for destructive actions
colors.semantic.warning    // Amber for warnings
```

### Typography

```tsx
import { typography } from './design-system';

typography.fontSize.xs     // 11px
typography.fontSize.sm     // 13px
typography.fontSize.base   // 14px
typography.fontSize.lg     // 16px
typography.fontSize['3xl'] // 24px

typography.fontWeight.medium   // 500
typography.fontWeight.semibold // 600
typography.fontWeight.bold     // 700
```

### Spacing

```tsx
import { spacing } from './design-system';

spacing.xs    // 4px
spacing.sm    // 8px
spacing.md    // 16px
spacing.lg    // 24px
spacing.xl    // 32px
spacing['4xl'] // 64px (global header height)
```

## Components

### Button

```tsx
<Button color="primary" size="md" variant="contained">
  Save Changes
</Button>

<Button color="neutral" size="sm" variant="outlined">
  Cancel
</Button>

<IconButton>
  <SettingsIcon />
</IconButton>
```

**Props:**
- `color`: 'primary' | 'secondary' | 'neutral'
- `size`: 'sm' | 'md' | 'lg'
- `variant`: 'contained' | 'outlined' | 'text'

### Card

```tsx
<Card elevation="elevated" bordered>
  <CardContent>
    Your content here
  </CardContent>
</Card>

<SectionCard 
  title="Upcoming Sessions"
  action={<Button variant="text">View All</Button>}
>
  <SessionList />
</SectionCard>
```

**Props:**
- `elevation`: 'flat' | 'elevated' | 'interactive'
- `bordered`: boolean

### Badge

```tsx
<Badge label="Active" variant="primary" size="md" />
<StatusBadge status="completed" />
<PaymentBadge status="paid" />
```

**Props:**
- `variant`: 'primary' | 'success' | 'neutral' | 'warning' | 'error'
- `size`: 'sm' | 'md' | 'lg'

### Input

```tsx
<Input 
  label="Email"
  size="md"
  placeholder="Enter email..."
  startIcon={<EmailIcon />}
/>

<SearchInput
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onClear={() => setSearchQuery('')}
  placeholder="Search..."
/>
```

### Modal & Drawer

```tsx
<Modal
  open={isOpen}
  onClose={handleClose}
  title="Edit Session"
  maxWidth="md"
  actions={
    <>
      <Button variant="outlined" onClick={handleClose}>Cancel</Button>
      <Button variant="contained" onClick={handleSave}>Save</Button>
    </>
  }
>
  <FormContent />
</Modal>

<Drawer
  open={isOpen}
  onClose={handleClose}
  title="Session Details"
  width={480}
>
  <SessionDetails />
</Drawer>
```

### StatCard

```tsx
<StatCard
  title="Active Clients"
  value={24}
  subtitle="3 new this month"
  trend={{ value: '+12%', direction: 'up' }}
  icon={<PeopleIcon />}
  color={colors.primary.main}
/>
```

### Table Components

```tsx
<TableContainer>
  <Table>
    <TableHead>
      <TableHeaderRow>
        <TableCell header>Name</TableCell>
        <TableCell header>Status</TableCell>
      </TableHeaderRow>
    </TableHead>
    <TableBody>
      <TableRow clickable onClick={handleClick}>
        <TableCell>Alex Thompson</TableCell>
        <TableCell><StatusBadge status="active" /></TableCell>
      </TableRow>
      <LoadingTableRow columns={2} rows={3} />
      <EmptyTableRow columns={2} message="No sessions found" />
    </TableBody>
  </Table>
</TableContainer>
```

## Layout Primitives

### PageContainer

```tsx
<PageContainer maxWidth="xl">
  <YourPageContent />
</PageContainer>
```

### GridLayout

```tsx
<GridLayout columns={3} gap={3}>
  <StatCard {...props} />
  <StatCard {...props} />
  <StatCard {...props} />
</GridLayout>
```

### CardGrid

```tsx
<CardGrid minCardWidth={320} gap={3}>
  <Card>...</Card>
  <Card>...</Card>
</CardGrid>
```

### FormLayout

```tsx
<FormLayout spacing={3} maxWidth={600}>
  <Input label="Name" />
  <Input label="Email" />
  <Button>Submit</Button>
</FormLayout>
```

### Flex & Stack

```tsx
<Flex justify="space-between" align="center" gap={2}>
  <Typography>Title</Typography>
  <Button>Action</Button>
</Flex>

<StackLayout spacing={2} divider>
  <Item />
  <Item />
  <Item />
</StackLayout>
```

## Best Practices

### Use Tokens, Not Hardcoded Values

❌ **Don't:**
```tsx
<Box sx={{ color: '#6E5BCE', padding: '24px' }}>
```

✅ **Do:**
```tsx
import { colors, spacing } from './design-system';

<Box sx={{ color: colors.primary.main, padding: spacing.lg }}>
```

### Use Design System Components

❌ **Don't:**
```tsx
<MuiButton 
  sx={{ 
    bgcolor: '#6E5BCE', 
    borderRadius: '6px',
    textTransform: 'none'
  }}
>
```

✅ **Do:**
```tsx
import { Button } from './design-system';

<Button color="primary" size="md">
```

### Consistent Spacing

Use the spacing scale consistently:
- **xs (4px)**: Icon gaps, tight layouts
- **sm (8px)**: Button padding, chip spacing
- **md (16px)**: Card padding, form fields
- **lg (24px)**: Section spacing
- **xl (32px)**: Page gutter
- **4xl (64px)**: Header height, major sections

### Color Usage

- **Primary Purple (#6E5BCE)**: Use sparingly for CTAs, focus states, key highlights
- **Neutrals**: Use for 95% of UI (text, borders, backgrounds)
- **Semantic Colors**: Use only for their intended purpose (success = green, error = red)

## Component Sizes

All interactive components support three sizes:

- **sm**: Compact UI, dense tables
- **md**: Default size (use 80% of the time)
- **lg**: Prominent actions, hero sections

## Migration Guide

### From Inline Styles

Before:
```tsx
<Box sx={{ bgcolor: '#F7F8FA', p: 3, borderRadius: '8px' }}>
```

After:
```tsx
import { colors, borderRadius } from './design-system';

<Box sx={{ bgcolor: colors.surface.page, p: 3, borderRadius: borderRadius.lg }}>
```

### From MUI Components

Before:
```tsx
<MuiButton variant="contained" color="primary">
```

After:
```tsx
import { Button } from './design-system';

<Button variant="contained" color="primary">
```

## Accessibility

All components follow WCAG 2.1 AA standards:
- Color contrast ratios meet minimum requirements
- Interactive elements have focus states
- Icons include aria-labels where needed
- Semantic HTML structure

## Contributing

When adding new components:
1. Use existing tokens (colors, spacing, typography)
2. Support standard sizes (sm, md, lg)
3. Include TypeScript types
4. Add examples to this README
5. Ensure accessibility compliance