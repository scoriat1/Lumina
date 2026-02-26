import { Box, Typography } from '@mui/material';
import { PageHeader } from '../components/PageHeader';

export function ResourcesPage() {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader title="Resources" />
      
      <Typography variant="body1" sx={{ color: '#7A746F' }}>
        Resources content will be displayed here.
      </Typography>
    </Box>
  );
}