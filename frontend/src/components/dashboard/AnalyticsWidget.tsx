import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  useTheme,
} from '@mui/material';
import ChartWrapper from '../charts/ChartWrapper';

// Mock data for charts
const viewsData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Profile Views',
      data: [12, 19, 15, 25, 22, 18, 24],
      fill: true,
    },
    {
      label: 'NFC Taps',
      data: [8, 11, 9, 15, 12, 10, 16],
      fill: true,
    },
  ],
};

const deviceData = {
  labels: ['Mobile', 'Desktop', 'Tablet'],
  datasets: [
    {
      data: [65, 25, 10],
    },
  ],
};

const profilePerformanceData = {
  labels: ['CEO Profile', 'Designer Profile', 'Manager Profile'],
  datasets: [
    {
      data: [45, 30, 25],
    },
  ],
};

const AnalyticsWidget: React.FC = () => {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      {/* Views Trend Chart */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Views & Interactions Trend
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Weekly overview of profile views and NFC taps
          </Typography>
          <ChartWrapper type="line" data={viewsData} height={300} />
        </Paper>
      </Grid>

      {/* Device Breakdown */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Device Breakdown
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            How users access your profiles
          </Typography>
          <ChartWrapper type="doughnut" data={deviceData} height={280} showLegend={true} />
        </Paper>
      </Grid>

      {/* Profile Performance */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: 350 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Profile Performance
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Distribution of views across your profiles
          </Typography>
          <ChartWrapper type="doughnut" data={profilePerformanceData} height={250} showLegend={true} />
        </Paper>
      </Grid>

      {/* Engagement Metrics */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: 350 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Engagement Metrics
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Click-through Rate</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>7.2%</Typography>
              </Box>
              <Box
                sx={{
                  height: 8,
                  backgroundColor: theme.palette.grey[200],
                  borderRadius: 4,
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: '72%',
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: 4,
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Contact Saves</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>4.8%</Typography>
              </Box>
              <Box
                sx={{
                  height: 8,
                  backgroundColor: theme.palette.grey[200],
                  borderRadius: 4,
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: '48%',
                    backgroundColor: theme.palette.secondary.main,
                    borderRadius: 4,
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Social Media Clicks</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>12.5%</Typography>
              </Box>
              <Box
                sx={{
                  height: 8,
                  backgroundColor: theme.palette.grey[200],
                  borderRadius: 4,
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: '85%',
                    backgroundColor: theme.palette.success.main,
                    borderRadius: 4,
                  }}
                />
              </Box>
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">QR Code Scans</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>3.2%</Typography>
              </Box>
              <Box
                sx={{
                  height: 8,
                  backgroundColor: theme.palette.grey[200],
                  borderRadius: 4,
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: '32%',
                    backgroundColor: theme.palette.warning.main,
                    borderRadius: 4,
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default AnalyticsWidget;