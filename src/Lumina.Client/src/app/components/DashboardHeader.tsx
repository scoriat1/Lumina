import { Box, Typography } from '@mui/material';

export function DashboardHeader() {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          color: '#2C2825',
          fontSize: '22px',
          letterSpacing: '-0.2px',
          mb: 0.5,
        }}
      >
        Welcome back, Sarah
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: '#9A9490',
          fontSize: '14px',
        }}
      >
        {currentDate}
      </Typography>
    </Box>
  );
}
