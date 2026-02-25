import { Avatar as MuiAvatar, AvatarProps as MuiAvatarProps } from '@mui/material';
import { colors, borderRadius } from './tokens';

export interface AvatarProps extends MuiAvatarProps {
  /**
   * Color variant for the avatar background
   * Uses the avatar palette from design tokens
   */
  colorIndex?: 0 | 1 | 2 | 3 | 4 | 5;
  
  /**
   * Size variant
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}

/**
 * Avatar component with therapeutic design system styling
 * 
 * @example
 * ```tsx
 * <Avatar colorIndex={0} size="medium">SC</Avatar>
 * <Avatar colorIndex={1} size="large" src="/path/to/image.jpg" />
 * ```
 */
export function Avatar({ 
  colorIndex = 0, 
  size = 'medium',
  sx,
  ...props 
}: AvatarProps) {
  const sizeMap = {
    small: { width: 32, height: 32, fontSize: '14px' },
    medium: { width: 44, height: 44, fontSize: '16px' },
    large: { width: 52, height: 52, fontSize: '18px' },
    xlarge: { width: 64, height: 64, fontSize: '22px' },
  };

  const backgroundColor = colors.avatarPalette[colorIndex];

  return (
    <MuiAvatar
      {...props}
      sx={{
        ...sizeMap[size],
        bgcolor: backgroundColor,
        color: '#FFFFFF',
        fontWeight: 600,
        borderRadius: borderRadius.lg,
        ...sx,
      }}
    />
  );
}
