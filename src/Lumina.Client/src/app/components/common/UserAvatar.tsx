import { Avatar } from '@mui/material';
import { colors, typography, componentSizes } from '../../theme';

interface UserAvatarProps {
  initials: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

export function UserAvatar({ initials, color, size = 'md', onClick }: UserAvatarProps) {
  const sizeMap = {
    sm: componentSizes.avatar.sm,
    md: componentSizes.avatar.md,
    lg: componentSizes.avatar.lg,
    xl: componentSizes.avatar.xl,
  };

  const fontSizeMap = {
    sm: typography.fontSize.xs,
    md: typography.fontSize.sm,
    lg: typography.fontSize.base,
    xl: typography.fontSize.lg,
  };

  const avatarSize = sizeMap[size];
  const fontSize = fontSizeMap[size];
  const avatarColor = color || colors.avatarPalette[0];

  return (
    <Avatar
      onClick={onClick}
      sx={{
        width: avatarSize,
        height: avatarSize,
        bgcolor: avatarColor,
        fontSize,
        fontWeight: typography.fontWeight.bold,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick
          ? {
              opacity: 0.9,
            }
          : undefined,
      }}
    >
      {initials}
    </Avatar>
  );
}
