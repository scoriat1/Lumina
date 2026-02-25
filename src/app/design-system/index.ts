/**
 * Lumina Design System
 * 
 * A comprehensive design system for professional service platforms
 * featuring a calm executive SaaS aesthetic with refined purple brand accent.
 * 
 * Usage:
 * ```tsx
 * import { Button, Card, Badge, Input, tokens } from './design-system';
 * ```
 */

// ===== TOKENS =====
export * from './tokens';

// ===== COMPONENTS =====
export { Button, IconButton } from './Button';
export type { ButtonProps, ButtonColor, ButtonSize } from './Button';

export { Card, SectionCard, ListItemCard } from './Card';
export type { CardProps, SectionCardProps, ListItemCardProps } from './Card';

export { Badge, StatusBadge, PaymentBadge } from './Badge';
export type { BadgeVariant, BadgeSize, StatusType, PaymentStatus } from './Badge';

export { Input, SearchInput } from './Input';
export type { InputSize } from './Input';

export { Modal, Drawer } from './Modal';

export { StatCard, SimpleStatCard } from './StatCard';

export { TableCell, TableRow, TableHeaderRow, LoadingTableRow, EmptyTableRow } from './Table';

// ===== LAYOUTS =====
export {
  PageContainer,
  SectionWrapper,
  GridLayout,
  FormLayout,
  CardGrid,
  SplitLayout,
  Flex,
  StackLayout,
} from './layouts';

// ===== THEME =====
export { theme } from './theme';