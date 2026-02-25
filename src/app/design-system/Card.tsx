import { Card as MuiCard, CardProps as MuiCardProps, CardContent, Box, Typography } from '@mui/material';
import { colors, borderRadius, shadows } from './tokens';
import { ReactNode } from 'react';

export interface CardProps extends MuiCardProps {
  /**
   * Card elevation style
   * @default 'elevated'
   */
  elevation?: 'flat' | 'elevated' | 'interactive';
  
  /**
   * Whether the card has a border
   * @default true
   */
  bordered?: boolean;
}

/**
 * Base card component with executive design system styling
 * 
 * @example
 * ```tsx
 * <Card elevation="elevated">
 *   <CardContent>
 *     Your content here
 *   </CardContent>
 * </Card>
 * ```
 */
export function Card({ 
  elevation = 'elevated', 
  bordered = true,
  children, 
  sx, 
  ...props 
}: CardProps) {
  const elevationStyles = {
    flat: {
      boxShadow: 'none',
    },
    elevated: {
      boxShadow: shadows.card,
    },
    interactive: {
      boxShadow: shadows.card,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: shadows.cardHover,
        transform: 'translateY(-2px)',
      },
    },
  };

  return (
    <MuiCard
      {...props}
      sx={{
        bgcolor: colors.background.paper,
        border: bordered ? `1px solid ${colors.border.subtle}` : 'none',
        borderRadius: borderRadius.lg,
        ...elevationStyles[elevation],
        ...sx,
      }}
    >
      {children}
    </MuiCard>
  );
}

export interface SectionCardProps {
  /**
   * Card title
   */
  title: string;
  
  /**
   * Optional action element (e.g., "View All" link)
   */
  action?: ReactNode;
  
  /**
   * Card content
   */
  children: ReactNode;
  
  /**
   * Card elevation style
   * @default 'elevated'
   */
  elevation?: CardProps['elevation'];
  
  /**
   * Additional card props
   */
  cardProps?: Omit<CardProps, 'children'>;
}

/**
 * Section card with header and consistent padding
 * Used for dashboard sections like "Upcoming Sessions" or "Active Clients"
 * 
 * @example
 * ```tsx
 * <SectionCard 
 *   title="Upcoming Sessions"
 *   action={<Link>View All</Link>}
 * >
 *   <SessionList />
 * </SectionCard>
 * ```
 */
export function SectionCard({ 
  title, 
  action, 
  children, 
  elevation = 'elevated',
  cardProps,
}: SectionCardProps) {
  return (
    <Card elevation={elevation} {...cardProps}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
        }}>
          <Typography variant="h6" sx={{
            fontWeight: 600,
            fontSize: '16px',
            color: colors.text.primary,
          }}>
            {title}
          </Typography>
          {action}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}

export interface ListItemCardProps {
  /**
   * Card content
   */
  children: ReactNode;
  
  /**
   * Click handler
   */
  onClick?: () => void;
  
  /**
   * Additional sx props
   */
  sx?: MuiCardProps['sx'];
}

/**
 * Interactive list item card with hover states
 * Used for session items, client cards, etc.
 * 
 * @example
 * ```tsx
 * <ListItemCard onClick={() => handleClick()}>
 *   <SessionContent />
 * </ListItemCard>
 * ```
 */
export function ListItemCard({ children, onClick, sx }: ListItemCardProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2.5,
        borderRadius: borderRadius.lg,
        bgcolor: colors.background.paper,
        border: `1px solid ${colors.border.subtle}`,
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          boxShadow: shadows.cardHover,
          borderColor: colors.border.medium,
        } : {},
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
