import { Box, Link, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router';
import { colors } from '../../theme';

interface LuminaMarkProps {
  size?: number;
  sx?: SxProps<Theme>;
}

interface LuminaBrandProps {
  to?: string;
  showWordmark?: boolean;
  markSize?: number;
  inverse?: boolean;
  onClick?: () => void;
  sx?: SxProps<Theme>;
}

export function LuminaMark({ size = 36, sx }: LuminaMarkProps) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '12px',
        bgcolor: colors.brand.purple,
        color: '#FFFFFF',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Crimson Pro", Georgia, serif',
        fontSize: Math.round(size * 0.58),
        fontWeight: 700,
        lineHeight: 1,
        boxShadow: `0 8px 20px ${colors.brand.purple}33`,
        overflow: 'hidden',
        flexShrink: 0,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 4,
          borderRadius: '9px',
          border: '1px solid rgba(255, 255, 255, 0.48)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 6,
          right: 7,
          width: Math.max(5, Math.round(size * 0.18)),
          height: Math.max(5, Math.round(size * 0.18)),
          borderRadius: '999px',
          bgcolor: 'rgba(255, 255, 255, 0.68)',
        },
        ...sx,
      }}
    >
      <Box component="span" sx={{ position: 'relative', zIndex: 1, textShadow: '0 1px 2px rgba(31, 28, 26, 0.18)' }}>
        L
      </Box>
    </Box>
  );
}

export function LuminaBrand({
  to,
  showWordmark = true,
  markSize = 36,
  inverse = false,
  onClick,
  sx,
}: LuminaBrandProps) {
  const content = (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.25 }}>
      <LuminaMark size={markSize} />
      {showWordmark && (
        <Typography
          component="span"
          sx={{
            color: inverse ? '#FFFFFF' : colors.text.primary,
            fontFamily: '"Crimson Pro", Georgia, serif',
            fontSize: { xs: '26px', sm: '28px' },
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          Lumina
        </Typography>
      )}
    </Box>
  );

  const baseSx: SxProps<Theme> = {
    display: 'inline-flex',
    alignItems: 'center',
    color: 'inherit',
    '&:focus-visible': {
      outline: `2px solid ${colors.brand.purple}`,
      outlineOffset: '4px',
      borderRadius: '12px',
    },
    ...sx,
  };

  if (to) {
    return (
      <Link component={RouterLink} to={to} onClick={onClick} underline="none" aria-label="Lumina home" sx={baseSx}>
        {content}
      </Link>
    );
  }

  return <Box sx={baseSx}>{content}</Box>;
}
