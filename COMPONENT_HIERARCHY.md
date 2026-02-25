# Lumina Component Hierarchy

## Application Structure

```
App.tsx
├── ThemeProvider (MUI)
├── CssBaseline
└── NotesTemplateProvider
    └── RouterProvider
        └── RootLayout
            ├── Sidebar (navigation)
            ├── AppTopBar (navigation)
            └── <Outlet> (page content)
                ├── DashboardPage
                ├── ClientsPage
                ├── SessionsPage
                ├── BillingPage
                └── SettingsPage
```

## Layout Component Tree

```
RootLayout
│
├── Box (main container)
│   │
│   ├── Sidebar
│   │   ├── Logo
│   │   ├── Navigation Items
│   │   │   ├── Dashboard
│   │   │   ├── Clients
│   │   │   ├── Calendar
│   │   │   ├── Sessions
│   │   │   ├── Billing
│   │   │   └── Resources
│   │   └── Bottom Navigation
│   │       ├── Notifications
│   │       └── Settings
│   │
│   └── Main Content Area
│       ├── AppTopBar
│       │   ├── Spacer
│       │   └── Right Actions
│       │       ├── Notifications Bell
│       │       └── User Avatar Menu
│       │
│       └── Content Container
│           └── <Outlet /> (page content)
```

## Page Structure Pattern

Every page follows this structure:

```
Page Component
│
├── PageHeader
│   ├── Breadcrumbs (optional)
│   ├── Title + Subtitle
│   └── Actions (buttons)
│
├── Section 1
│   ├── Section Header
│   │   ├── Title
│   │   └── Header Actions
│   └── Section Content
│       └── Component Grid/List
│
├── Section 2
│   └── ...
│
└── Section N
    └── ...
```

## Example: Dashboard Page

```
DashboardPage
│
├── PageHeader
│   ├── title: "Dashboard"
│   ├── subtitle: "Welcome back..."
│   └── actions: <Button>New Session</Button>
│
├── Section (Metrics)
│   └── Grid (4 columns)
│       ├── MetricCard (Active Clients)
│       ├── MetricCard (Sessions This Month)
│       ├── MetricCard (Revenue MTD)
│       └── MetricCard (Calendar Filled)
│
└── Section (Today's Sessions)
    ├── title: "Today's Sessions"
    ├── subtitle: "3 sessions scheduled"
    ├── headerActions: <Button>View All</Button>
    └── Grid (3 columns on desktop)
        ├── SessionCard (Avery Fields)
        ├── SessionCard (Jordan Lee)
        └── SessionCard (Sam Rivera)
```

## Component Composition Examples

### MetricCard Breakdown

```
MetricCard
├── Card (MUI)
│   └── CardContent
│       ├── Header Row
│       │   ├── Typography (title)
│       │   └── Icon Container
│       │       └── Icon
│       ├── Typography (value - large)
│       └── Trend Row
│           ├── TrendingUpIcon
│           └── Typography (trend value)
```

### SessionCard Breakdown

```
SessionCard
├── Card (MUI)
│   └── CardContent
│       └── Flex Container
│           ├── UserAvatar
│           │   └── Avatar (with initials)
│           └── Content Column
│               ├── Header Row
│               │   ├── Typography (client name)
│               │   └── IconButton (more options)
│               ├── Typography (session type)
│               └── Metadata Row
│                   ├── Location Icon + Time
│                   └── StatusBadge
```

### StatusBadge Breakdown

```
StatusBadge
└── Chip (MUI)
    ├── label (capitalized status)
    └── sx (themed colors based on status)
```

## Component Categories

### Layout Components (Structure)
```
├── AppLayout          # Main app shell
├── PageContainer      # Page width/padding wrapper
├── PageHeader         # Page title + actions
└── Section            # Content sections
```

### Navigation Components (Routing)
```
├── Sidebar            # Main navigation rail
└── AppTopBar          # Top bar with user menu
```

### Common Components (Reusable UI)
```
├── StatusBadge        # Status indicators
├── MetricCard         # Dashboard metrics
├── EmptyState         # No data states
├── LoadingSpinner     # Loading indicators
└── UserAvatar         # User/client avatars
```

### Domain Components (Feature-specific)
```
sessions/
└── SessionCard        # Session display card

clients/
└── (to be created)

billing/
└── (to be created)

forms/
└── (to be created)
```

## Data Flow

### Top-Down Props

```
DashboardPage
│
├── metrics (data)
│   └── MetricCard (props)
│       ├── title
│       ├── value
│       ├── trend
│       └── icon
│
└── sessions (data)
    └── SessionCard (props)
        ├── clientName
        ├── clientInitials
        ├── clientColor
        ├── sessionType
        ├── time
        ├── location
        └── status
```

### Event Handlers (Bottom-Up)

```
SessionCard
│
├── onClick prop
│   └── passed from parent
│       └── DashboardPage
│           └── handleSessionClick()
│               └── navigate to session detail
```

## Styling Architecture

### Theme Token Usage

```
Component
│
├── Import theme tokens
│   ├── colors
│   ├── typography
│   ├── spacing
│   └── borderRadius
│
└── Apply via sx prop
    ├── bgcolor: colors.surface.card
    ├── color: colors.text.primary
    ├── p: 3 (MUI spacing)
    └── borderRadius: borderRadius.lg
```

### Responsive Styling

```
Component
│
└── sx prop with responsive values
    ├── px: { xs: 2, sm: 3, md: 4 }
    ├── fontSize: { xs: '14px', md: '16px' }
    └── display: { xs: 'none', md: 'block' }
```

## State Management

### Local State (Component Level)

```
DashboardPage
├── useState (local UI state)
│   ├── selectedSession
│   ├── isModalOpen
│   └── filters
```

### Context State (Global)

```
App
└── NotesTemplateProvider
    ├── templateMode
    ├── selectedTemplateId
    └── customTemplates
        └── Consumed by Settings/Session pages
```

## Folder to Component Mapping

```
/components/layout/
├── AppLayout.tsx          → <AppLayout>
├── PageContainer.tsx      → <PageContainer>
├── PageHeader.tsx         → <PageHeader>
├── Section.tsx            → <Section>
└── index.ts              (barrel export)

/components/navigation/
├── Sidebar.tsx            → <Sidebar>
├── AppTopBar.tsx          → <AppTopBar>
└── index.ts              (barrel export)

/components/common/
├── StatusBadge.tsx        → <StatusBadge>
├── MetricCard.tsx         → <MetricCard>
├── EmptyState.tsx         → <EmptyState>
├── LoadingSpinner.tsx     → <LoadingSpinner>
├── UserAvatar.tsx         → <UserAvatar>
└── index.ts              (barrel export)

/components/sessions/
├── SessionCard.tsx        → <SessionCard>
└── index.ts              (barrel export)

/pages/Dashboard/
├── DashboardPage.tsx      → <DashboardPage>
└── index.ts              (barrel export)
```

## Import Patterns

### Clean Barrel Imports

```tsx
// Instead of:
import { StatusBadge } from '../components/common/StatusBadge';
import { MetricCard } from '../components/common/MetricCard';

// Use barrel export:
import { StatusBadge, MetricCard } from '../components/common';

// Or with path alias:
import { StatusBadge, MetricCard } from '@/components/common';
```

### Page Imports

```tsx
// In routes.tsx
import { DashboardPage } from './pages/Dashboard';  // ← from index.ts
// Not:
import { DashboardPage } from './pages/Dashboard/DashboardPage';
```

## Component Reusability Matrix

```
Component          | Used In               | Reusable?
-------------------|-----------------------|----------
AppLayout          | RootLayout            | No
PageContainer      | Multiple pages        | Yes
PageHeader         | All pages             | Yes
Section            | All pages             | Yes
Sidebar            | RootLayout            | No
AppTopBar          | RootLayout            | No
StatusBadge        | Multiple features     | Yes
MetricCard         | Dashboard, Reports    | Yes
EmptyState         | Multiple pages        | Yes
LoadingSpinner     | Multiple pages        | Yes
UserAvatar         | Multiple features     | Yes
SessionCard        | Dashboard, Sessions   | Yes
```

## Composition Pattern

### Build Complex from Simple

```
DashboardPage (Complex)
│
├── PageHeader (Medium complexity)
│   ├── Typography (Simple - MUI)
│   └── Button (Simple - MUI)
│
└── Section (Medium complexity)
    └── Grid (Simple - MUI)
        └── MetricCard (Medium complexity)
            ├── Card (Simple - MUI)
            ├── Typography (Simple - MUI)
            └── Icon (Simple - MUI)
```

This shows how we compose simple components into more complex ones.

## Extensibility

### Adding New Features

```
New Feature: Tasks
│
1. Create domain components
│   └── /components/tasks/
│       ├── TaskCard.tsx
│       ├── TaskList.tsx
│       └── index.ts
│
2. Create page
│   └── /pages/Tasks/
│       ├── TasksPage.tsx
│       └── index.ts
│
3. Add route
│   └── routes.tsx
│       └── { path: 'tasks', Component: TasksPage }
│
4. Add navigation
│   └── Sidebar.tsx
│       └── Add task icon to navigationItems
```

This hierarchical structure ensures:
- **Consistency**: All pages follow the same pattern
- **Reusability**: Components can be used across features
- **Maintainability**: Clear organization and separation of concerns
- **Scalability**: Easy to add new features following established patterns

---

For implementation details, see:
- `/ARCHITECTURE.md` - Full architecture documentation
- `/QUICK_START.md` - Quick reference guide
- `/src/app/components/README.md` - Component usage guide