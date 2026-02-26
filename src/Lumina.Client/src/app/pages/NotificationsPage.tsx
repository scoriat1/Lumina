import { Box, Typography } from '@mui/material';
import { PageHeader } from '../components/PageHeader';

export function NotificationsPage() {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader title="Notifications" />
      
      <Typography variant="body1" sx={{ color: '#7A746F' }}>
        Notifications content will be displayed here.
      </Typography>
    </Box>
  );
}