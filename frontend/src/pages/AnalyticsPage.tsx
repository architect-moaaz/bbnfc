import React from 'react';
import {
  Container,
  Typography,
  Box,
} from '@mui/material';
import AnalyticsWidget from '../components/dashboard/AnalyticsWidget';

const AnalyticsPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor your digital business card performance and engagement metrics.
        </Typography>
      </Box>
      
      <AnalyticsWidget />
    </Container>
  );
};

export default AnalyticsPage;