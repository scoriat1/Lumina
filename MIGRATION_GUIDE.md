# Migration Guide: Refactoring Existing Pages

This guide shows you how to migrate existing pages to use the new component architecture and theme system.

## Before You Start

1. Read `/QUICK_START.md` for basic usage
2. Review `/ARCHITECTURE.md` for overall structure
3. Look at `/src/app/pages/Dashboard/DashboardPage.tsx` as a reference

## Step-by-Step Migration Process

### Step 1: Analyze the Current Page

Identify:
- What data is being displayed?
- What actions are available?
- What are the main sections?
- What UI patterns are repeated?
- What inline styles are used?

### Step 2: Plan Component Structure

Decide:
- Which common components can be used?
- What custom components need to be created?
- How to organize the layout with PageHeader and Section?
- What data structures are needed?

### Step 3: Extract Inline Styles

Replace all hardcoded values with theme tokens.

### Step 4: Refactor Layout

Use PageHeader and Section components for structure.

### Step 5: Extract Repeated Patterns

Create reusable components for repeated UI patterns.

### Step 6: Test

Verify responsive behavior and accessibility.

## Example Migration

Let's migrate a hypothetical "Sessions Page" from old to new architecture.

### Before (Old Code)

```tsx
import { Box, Typography, Card, Avatar, Chip } from '@mui/material';
import { colors } from '../styles/colors';

export function SessionsPage() {
  const sessions = [/* data */];

  return (
    <div style={{ padding: '40px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 700, 
          color: '#1A1A1A',
          marginBottom: '8px'
        }}>
          Sessions
        </h1>
        <p style={{ color: '#5F6368', fontSize: '14px' }}>
          Manage all your sessions
        </p>
      </div>

      {/* Sessions List */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '16px', 
          fontWeight: 600, 
          marginBottom: '16px' 
        }}>
          Upcoming Sessions
        </h2>
        
        {sessions.map(session => (
          <Card 
            key={session.id}
            style={{
              padding: '20px',
              marginBottom: '16px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Avatar style={{ 
                width: 40, 
                height: 40, 
                backgroundColor: session.color 
              }}>
                {session.initials}
              </Avatar>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ 
                  fontSize: '14px', 
                  fontWeight: 600,
                  marginBottom: '4px'
                }}>
                  {session.clientName}
                </h3>
                <p style={{ 
                  fontSize: '13px', 
                  color: '#5F6368' 
                }}>
                  {session.sessionType}
                </p>
              </div>

              <Chip 
                label={session.status}
                style={{
                  backgroundColor: session.status === 'upcoming' 
                    ? 'rgba(168, 181, 160, 0.12)' 
                    : 'rgba(157, 170, 181, 0.12)',
                  color: session.status === 'upcoming' 
                    ? '#5B7052' 
                    : '#4A5B6D',
                  fontWeight: 600
                }}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### After (New Code)

```tsx
import { Box, Grid, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { PageHeader, Section } from '@/components/layout';
import { SessionCard } from '@/components/sessions';
import { EmptyState } from '@/components/common';
import { colors } from '@/theme';

export function SessionsPage() {
  const sessions = [/* data */];

  return (
    <Box>
      <PageHeader
        title="Sessions"
        subtitle="Manage all your sessions"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: colors.brand.purple,
              '&:hover': { bgcolor: colors.brand.purpleDark },
            }}
          >
            New Session
          </Button>
        }
      />

      <Section 
        title="Upcoming Sessions"
        subtitle={`${sessions.length} sessions scheduled`}
        spacing={4}
      >
        {sessions.length > 0 ? (
          <Grid container spacing={2}>
            {sessions.map(session => (
              <Grid item xs={12} md={6} lg={4} key={session.id}>
                <SessionCard
                  clientName={session.clientName}
                  clientInitials={session.initials}
                  clientColor={session.color}
                  sessionType={session.sessionType}
                  time={session.time}
                  location={session.location}
                  status={session.status}
                  onClick={() => handleSessionClick(session.id)}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <EmptyState
            icon={<CalendarIcon />}
            title="No sessions scheduled"
            description="Create your first session to get started"
            action={{
              label: 'New Session',
              onClick: handleNewSession
            }}
          />
        )}
      </Section>
    </Box>
  );
}
```

### What Changed?

1. ✅ Removed all inline styles
2. ✅ Used `PageHeader` instead of custom header markup
3. ✅ Used `Section` for content organization
4. ✅ Replaced custom session card with `SessionCard` component
5. ✅ Added `EmptyState` for zero state
6. ✅ Used theme tokens for colors
7. ✅ Made layout responsive with Grid
8. ✅ Added proper actions to header

## Common Migration Patterns

### Pattern 1: Replace Hardcoded Colors

**Before:**
```tsx
<Box style={{ backgroundColor: '#F7F8FA', color: '#1A1A1A' }}>
```

**After:**
```tsx
import { colors } from '@/theme';

<Box sx={{ bgcolor: colors.surface.page, color: colors.text.primary }}>
```

---

### Pattern 2: Replace Magic Numbers

**Before:**
```tsx
<Box style={{ padding: '24px', marginBottom: '32px' }}>
```

**After:**
```tsx
<Box sx={{ p: 3, mb: 4 }}>  {/* 3*8=24px, 4*8=32px */}
```

---

### Pattern 3: Replace Custom Headers

**Before:**
```tsx
<div style={{ marginBottom: '32px' }}>
  <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Title</h1>
  <p style={{ color: '#5F6368' }}>Subtitle</p>
</div>
```

**After:**
```tsx
<PageHeader 
  title="Title" 
  subtitle="Subtitle" 
/>
```

---

### Pattern 4: Replace Section Markup

**Before:**
```tsx
<div style={{ marginBottom: '32px' }}>
  <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
    Section Title
  </h2>
  {/* content */}
</div>
```

**After:**
```tsx
<Section title="Section Title" spacing={4}>
  {/* content */}
</Section>
```

---

### Pattern 5: Extract Repeated Card Patterns

**Before (repeated everywhere):**
```tsx
<Card style={{ padding: '20px', borderRadius: '8px' }}>
  <div style={{ display: 'flex', gap: '16px' }}>
    <Avatar style={{ width: 40, height: 40 }}>
      {initials}
    </Avatar>
    <div>
      <Typography style={{ fontWeight: 600 }}>{name}</Typography>
      <Typography style={{ color: '#5F6368' }}>{role}</Typography>
    </div>
  </div>
</Card>
```

**After (create reusable component):**
```tsx
// Create: /components/clients/ClientCard.tsx
export function ClientCard({ name, initials, role }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <UserAvatar initials={initials} size="lg" />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: typography.fontWeight.semibold }}>
            {name}
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            {role}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}

// Use everywhere:
<ClientCard name={name} initials={initials} role={role} />
```

---

### Pattern 6: Make Layouts Responsive

**Before (fixed layout):**
```tsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
  {items.map(item => <Card>{item}</Card>)}
</div>
```

**After (responsive layout):**
```tsx
<Grid container spacing={2}>
  {items.map(item => (
    <Grid item xs={12} sm={6} md={4} key={item.id}>
      <Card>{item}</Card>
    </Grid>
  ))}
</Grid>
```

---

### Pattern 7: Replace Status Badges

**Before:**
```tsx
<Chip 
  label={status}
  style={{
    backgroundColor: status === 'active' ? '#E8F5E9' : '#FFEBEE',
    color: status === 'active' ? '#2E7D32' : '#C62828'
  }}
/>
```

**After:**
```tsx
<StatusBadge status={status} type="session" />
```

---

### Pattern 8: Replace Empty States

**Before:**
```tsx
{items.length === 0 && (
  <div style={{ 
    textAlign: 'center', 
    padding: '64px 24px',
    color: '#9CA3AF'
  }}>
    <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
      No items found
    </p>
    <p style={{ fontSize: '14px', marginBottom: '24px' }}>
      Create your first item to get started
    </p>
    <button onClick={handleCreate}>Create Item</button>
  </div>
)}
```

**After:**
```tsx
{items.length === 0 && (
  <EmptyState
    icon={<InboxIcon />}
    title="No items found"
    description="Create your first item to get started"
    action={{ label: 'Create Item', onClick: handleCreate }}
  />
)}
```

## Migration Checklist

For each page you migrate:

### Analysis Phase
- [ ] Identify all inline styles
- [ ] List all hardcoded colors and values
- [ ] Note all repeated UI patterns
- [ ] Document data structures used
- [ ] List all user actions/interactions

### Refactoring Phase
- [ ] Replace inline styles with `sx` prop
- [ ] Import theme tokens (`colors`, `typography`, `spacing`, etc.)
- [ ] Replace hardcoded values with theme tokens
- [ ] Add `PageHeader` component
- [ ] Wrap content in `Section` components
- [ ] Replace custom cards with reusable components
- [ ] Add `EmptyState` for zero states
- [ ] Make layout responsive with Grid

### Component Extraction Phase
- [ ] Identify repeated patterns (3+ uses)
- [ ] Create new component in appropriate folder
- [ ] Add TypeScript interface for props
- [ ] Export from folder's `index.ts`
- [ ] Replace all instances with new component

### Testing Phase
- [ ] Test on mobile (< 600px)
- [ ] Test on tablet (600-960px)
- [ ] Test on desktop (> 960px)
- [ ] Verify all colors match design system
- [ ] Check keyboard navigation
- [ ] Verify focus indicators
- [ ] Test with screen reader (accessibility)

### Documentation Phase
- [ ] Add JSDoc comments to new components
- [ ] Update component README if needed
- [ ] Document any special usage patterns

## Common Gotchas

### 1. MUI Spacing Units

MUI spacing uses an 8px base unit:
```tsx
// This is 24px (3 * 8)
<Box sx={{ p: 3 }}>

// NOT pixels!
<Box sx={{ p: 24 }}>  // ❌ This is 192px!
```

### 2. Style Prop vs sx Prop

Always use `sx` prop, not `style`:
```tsx
// ✅ Correct
<Box sx={{ bgcolor: colors.surface.card }}>

// ❌ Wrong
<Box style={{ backgroundColor: colors.surface.card }}>
```

### 3. Typography Components

Use variant prop instead of styled elements:
```tsx
// ✅ Correct
<Typography variant="h6">Title</Typography>

// ❌ Avoid
<h6>Title</h6>
```

### 4. Responsive Objects

Responsive values must be objects:
```tsx
// ✅ Correct
<Box sx={{ px: { xs: 2, md: 4 } }}>

// ❌ Wrong
<Box sx={{ px: [2, 4] }}>
```

### 5. Import Paths

Use barrel exports:
```tsx
// ✅ Correct
import { StatusBadge, MetricCard } from '@/components/common';

// ❌ Avoid
import { StatusBadge } from '@/components/common/StatusBadge';
import { MetricCard } from '@/components/common/MetricCard';
```

## Progressive Migration Strategy

You don't have to migrate everything at once. Here's a suggested order:

1. **Start with Dashboard** ✅ (Already done)
2. **Simple pages first**: Settings, Resources
3. **Medium complexity**: Clients, Billing
4. **Complex pages last**: Sessions, Calendar

### Per-Page Time Estimate

- **Simple page**: 1-2 hours
- **Medium page**: 2-4 hours
- **Complex page**: 4-8 hours
- **Creating new component**: 30-60 minutes

## Getting Help

If you get stuck:

1. Check `/QUICK_START.md` for common patterns
2. Look at `/src/app/pages/Dashboard/DashboardPage.tsx` example
3. Review `/ARCHITECTURE.md` for overall structure
4. Check `/src/app/theme/index.ts` for available tokens
5. Look at existing components in `/src/app/components/`

## Quality Checklist

Before considering a migration complete:

### Visual
- [ ] Matches design system colors
- [ ] Uses consistent spacing
- [ ] Proper typography scale
- [ ] Consistent border radius
- [ ] Appropriate shadows

### Responsive
- [ ] Works on mobile (375px)
- [ ] Works on tablet (768px)
- [ ] Works on desktop (1440px)
- [ ] No horizontal scroll
- [ ] Touch targets are 44x44px minimum

### Code Quality
- [ ] No inline styles
- [ ] All theme tokens used correctly
- [ ] TypeScript interfaces defined
- [ ] Components properly extracted
- [ ] Clean imports (barrel exports)

### Accessibility
- [ ] Proper heading hierarchy
- [ ] ARIA labels on icon buttons
- [ ] Sufficient color contrast (4.5:1 minimum)
- [ ] Keyboard navigation works
- [ ] Focus indicators visible

---

Happy migrating! 🚀

Remember: **Consistency over perfection**. It's better to have all pages use the new system imperfectly than to have a mix of old and new approaches.
