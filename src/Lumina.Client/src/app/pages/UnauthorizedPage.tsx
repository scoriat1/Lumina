import { Box, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';

export function UnauthorizedPage() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Stack spacing={2} alignItems="center">
        <Typography variant="h4">Unauthorized</Typography>
        <Typography>You are not authorized to access this page.</Typography>
        <Button component={RouterLink} to="/login" variant="contained">
          Go to Login
        </Button>
      </Stack>
    </Box>
  );
}
