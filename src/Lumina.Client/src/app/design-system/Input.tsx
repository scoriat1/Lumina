import { TextField, TextFieldProps, InputAdornment } from '@mui/material';
import { colors, borderRadius, componentSizes } from './tokens';
import { ReactNode } from 'react';

// ===== INPUT COMPONENT =====
// Consistent text input styling

export type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<TextFieldProps, 'size'> {
  size?: InputSize;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export function Input({
  size = 'md',
  startIcon,
  endIcon,
  ...props
}: InputProps) {
  const sizeConfig = componentSizes.input[size];

  return (
    <TextField
      {...props}
      size={size === 'sm' ? 'small' : 'medium'}
      InputProps={{
        startAdornment: startIcon ? (
          <InputAdornment position="start">{startIcon}</InputAdornment>
        ) : undefined,
        endAdornment: endIcon ? (
          <InputAdornment position="end">{endIcon}</InputAdornment>
        ) : undefined,
        ...props.InputProps,
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          height: sizeConfig.height,
          fontSize: sizeConfig.fontSize,
          bgcolor: colors.background.paper,
          borderRadius: borderRadius.md,
          '& fieldset': {
            borderColor: colors.border.subtle,
          },
          '&:hover fieldset': {
            borderColor: colors.border.medium,
          },
          '&.Mui-focused fieldset': {
            borderColor: colors.primary.main,
            borderWidth: 1,
          },
          '& input': {
            padding: `0 ${sizeConfig.px}px`,
            height: sizeConfig.height,
            fontSize: sizeConfig.fontSize,
          },
        },
        '& .MuiInputLabel-root': {
          fontSize: sizeConfig.fontSize,
          color: colors.text.tertiary,
          '&.Mui-focused': {
            color: colors.primary.main,
          },
        },
        ...props.sx,
      }}
    />
  );
}

// ===== SEARCH INPUT =====
// Specialized input for search functionality
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { IconButton } from '@mui/material';

interface SearchInputProps extends Omit<InputProps, 'startIcon' | 'endIcon'> {
  onClear?: () => void;
  showClearButton?: boolean;
}

export function SearchInput({
  onClear,
  showClearButton = true,
  value,
  ...props
}: SearchInputProps) {
  const hasClearButton = showClearButton && value && onClear;

  return (
    <Input
      {...props}
      value={value}
      startIcon={<SearchIcon sx={{ color: colors.text.tertiary, fontSize: 18 }} />}
      endIcon={
        hasClearButton ? (
          <IconButton
            size="small"
            onClick={onClear}
            sx={{
              padding: 0.5,
              '&:hover': {
                bgcolor: colors.interactive.hover,
              },
            }}
          >
            <ClearIcon sx={{ fontSize: 16, color: colors.text.tertiary }} />
          </IconButton>
        ) : undefined
      }
    />
  );
}
