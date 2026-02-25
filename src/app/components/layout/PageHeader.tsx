import { ReactNode } from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { colors, typography, spacing } from '../../theme';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <Box
      sx={{
        mb: 4,
      }}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{
            mb: 1,
            '& .MuiBreadcrumbs-separator': {
              color: colors.text.muted,
            },
          }}
        >
          {breadcrumbs.map((crumb, index) => (
            crumb.href ? (
              <Link
                key={index}
                href={crumb.href}
                underline="hover"
                sx={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.tertiary,
                  '&:hover': {
                    color: colors.brand.purple,
                  },
                }}
              >
                {crumb.label}
              </Link>
            ) : (
              <Typography
                key={index}
                sx={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  fontWeight: typography.fontWeight.medium,
                }}
              >
                {crumb.label}
              </Typography>
            )
          ))}
        </Breadcrumbs>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              mb: subtitle ? 0.5 : 0,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                color: colors.text.tertiary,
                fontSize: typography.fontSize.md,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {actions && (
          <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0 }}>
            {actions}
          </Box>
        )}
      </Box>
    </Box>
  );
}
