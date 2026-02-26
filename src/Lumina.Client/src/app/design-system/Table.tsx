import {
  TableRow as MuiTableRow,
  TableCell as MuiTableCell,
  TableRowProps as MuiTableRowProps,
  TableCellProps as MuiTableCellProps,
  Box,
  Skeleton,
} from '@mui/material';
import { ReactNode } from 'react';
import { colors, transitions } from './tokens';

// ===== TABLE CELL =====
// Consistent table cell styling

interface TableCellProps extends MuiTableCellProps {
  children: ReactNode;
  header?: boolean;
}

export function TableCell({ children, header = false, ...props }: TableCellProps) {
  return (
    <MuiTableCell
      {...props}
      sx={{
        py: header ? 1.5 : 2,
        px: 2,
        fontSize: header ? '13px' : '14px',
        fontWeight: header ? 600 : 400,
        color: header ? colors.text.tertiary : colors.text.primary,
        textTransform: header ? 'uppercase' : 'none',
        letterSpacing: header ? '0.5px' : 'normal',
        borderBottom: `1px solid ${colors.border.subtle}`,
        ...props.sx,
      }}
    >
      {children}
    </MuiTableCell>
  );
}

// ===== TABLE ROW =====
// Consistent table row styling with hover states

interface TableRowProps extends MuiTableRowProps {
  children: ReactNode;
  clickable?: boolean;
  selected?: boolean;
}

export function TableRow({ children, clickable = false, selected = false, ...props }: TableRowProps) {
  return (
    <MuiTableRow
      {...props}
      sx={{
        cursor: clickable ? 'pointer' : 'default',
        bgcolor: selected ? colors.interactive.hover : 'transparent',
        transition: transitions.base,
        '&:hover': clickable
          ? {
              bgcolor: colors.surface.elevated,
            }
          : {},
        '&:last-child td': {
          borderBottom: 0,
        },
        ...props.sx,
      }}
    >
      {children}
    </MuiTableRow>
  );
}

// ===== TABLE HEADER ROW =====
// Specialized header row
export function TableHeaderRow({ children, ...props }: MuiTableRowProps) {
  return (
    <MuiTableRow
      {...props}
      sx={{
        bgcolor: colors.surface.elevated,
        '& th': {
          borderBottom: `1px solid ${colors.border.medium}`,
        },
        ...props.sx,
      }}
    >
      {children}
    </MuiTableRow>
  );
}

// ===== LOADING TABLE ROW =====
// Skeleton loading state for table rows
interface LoadingTableRowProps {
  columns: number;
  rows?: number;
}

export function LoadingTableRow({ columns, rows = 1 }: LoadingTableRowProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton variant="text" width="80%" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ===== EMPTY TABLE ROW =====
// Empty state for tables
interface EmptyTableRowProps {
  columns: number;
  message?: string;
}

export function EmptyTableRow({ columns, message = 'No data available' }: EmptyTableRowProps) {
  return (
    <TableRow>
      <TableCell colSpan={columns} sx={{ textAlign: 'center', py: 6 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: colors.neutral.gray100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1,
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: `2px solid ${colors.text.tertiary}`,
              }}
            />
          </Box>
          <Box
            sx={{
              fontSize: '14px',
              color: colors.text.tertiary,
            }}
          >
            {message}
          </Box>
        </Box>
      </TableCell>
    </TableRow>
  );
}
