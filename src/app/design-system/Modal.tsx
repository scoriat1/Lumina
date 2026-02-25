import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Drawer as MuiDrawer,
  DrawerProps as MuiDrawerProps,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ReactNode } from 'react';
import { colors, shadows, borderRadius } from './tokens';

// ===== MODAL COMPONENT =====
// Consistent modal/dialog styling

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
}: ModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: borderRadius.lg,
          boxShadow: shadows.modal,
        },
      }}
    >
      {title && (
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${colors.border.subtle}`,
            py: 2,
            px: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '18px' }}>
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: colors.text.tertiary,
              '&:hover': {
                bgcolor: colors.interactive.hover,
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
      )}
      <DialogContent
        sx={{
          px: 3,
          py: 3,
        }}
      >
        {children}
      </DialogContent>
      {actions && (
        <DialogActions
          sx={{
            borderTop: `1px solid ${colors.border.subtle}`,
            px: 3,
            py: 2,
            gap: 1.5,
          }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
}

// ===== DRAWER COMPONENT =====
// Consistent drawer/side panel styling

interface DrawerProps extends Omit<MuiDrawerProps, 'children'> {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: number | string;
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  width = 480,
  anchor = 'right',
  ...props
}: DrawerProps) {
  return (
    <MuiDrawer
      anchor={anchor}
      open={open}
      onClose={onClose}
      {...props}
      PaperProps={{
        sx: {
          width,
          bgcolor: colors.surface.drawer,
          ...props.PaperProps?.sx,
        },
      }}
    >
      {title && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${colors.border.subtle}`,
            py: 2.5,
            px: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '18px' }}>
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: colors.text.tertiary,
              '&:hover': {
                bgcolor: colors.interactive.hover,
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
      <Box sx={{ px: 3, py: 3, overflow: 'auto', flex: 1 }}>
        {children}
      </Box>
    </MuiDrawer>
  );
}
