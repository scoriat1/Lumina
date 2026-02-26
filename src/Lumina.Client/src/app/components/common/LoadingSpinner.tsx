import { Box, CircularProgress } from '@mui/material';
import { colors } from '../../theme';

interface LoadingSpinnerProps {
  size?: number;
  fullPage?: boolean;
}

export function LoadingSpinner({ size = 40, fullPage = false }: LoadingSpinnerProps) {
  const spinner = (
    <CircularProgress
      size={size}
      sx={{
        color: colors.brand.purple,
      }}
    />
  );

  if (fullPage) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          width: '100%',
        }}
      >
        {spinner}
      </Box>
    );
  }

  return spinner;
}
