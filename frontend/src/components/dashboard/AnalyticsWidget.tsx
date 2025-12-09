import React, { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  useTheme,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import ChartWrapper from '../charts/ChartWrapper';
import { analyticsAPI } from '../../services/api';

interface WidgetData {
  viewsTrend: { labels: string[]; views: number[]; taps: number[] };
  deviceBreakdown: { mobile: number; desktop: number; tablet: number };
  profilePerformance: { name: string; views: number }[];
  engagementMetrics: {
    clickThroughRate: number;
    contactSaves: number;
    socialClicks: number;
    qrScans: number;
  };
}

const AnalyticsWidget: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [widgetData, setWidgetData] = useState<WidgetData | null>(null);

  useEffect(() => {
    const fetchWidgetData = async () => {
      try {
        setLoading(true);
        const response = await analyticsAPI.getWidgets('7');
        if (response.success && response.data) {
          setWidgetData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics widgets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWidgetData();
  }, []);

  // Build chart data from API response
  const viewsData = widgetData ? {
    labels: widgetData.viewsTrend.labels,
    datasets: [
      {
        label: 'Profile Views',
        data: widgetData.viewsTrend.views,
        fill: true,
      },
      {
        label: 'NFC Taps',
        data: widgetData.viewsTrend.taps,
        fill: true,
      },
    ],
  } : {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      { label: 'Profile Views', data: [0, 0, 0, 0, 0, 0, 0], fill: true },
      { label: 'NFC Taps', data: [0, 0, 0, 0, 0, 0, 0], fill: true },
    ],
  };

  const deviceData = widgetData ? {
    labels: ['Mobile', 'Desktop', 'Tablet'],
    datasets: [
      {
        data: [
          widgetData.deviceBreakdown.mobile,
          widgetData.deviceBreakdown.desktop,
          widgetData.deviceBreakdown.tablet
        ],
      },
    ],
  } : {
    labels: ['Mobile', 'Desktop', 'Tablet'],
    datasets: [{ data: [0, 0, 0] }],
  };

  const profilePerformanceData = widgetData && widgetData.profilePerformance.length > 0 ? {
    labels: widgetData.profilePerformance.map(p => p.name),
    datasets: [
      {
        data: widgetData.profilePerformance.map(p => p.views),
      },
    ],
  } : {
    labels: ['No profiles yet'],
    datasets: [{ data: [0] }],
  };

  const engagementMetrics = widgetData?.engagementMetrics || {
    clickThroughRate: 0,
    contactSaves: 0,
    socialClicks: 0,
    qrScans: 0,
  };

  if (loading) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="80%" height={24} sx={{ mb: 3 }} />
            <Skeleton variant="rectangular" height={300} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="80%" height={24} sx={{ mb: 3 }} />
            <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="80%" height={24} sx={{ mb: 3 }} />
            <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Skeleton variant="text" width="60%" height={32} />
            <Box sx={{ mt: 3 }}>
              {[1, 2, 3, 4].map((i) => (
                <Box key={i} sx={{ mb: 3 }}>
                  <Skeleton variant="text" width="100%" height={24} />
                  <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 4 }} />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  }

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
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{engagementMetrics.clickThroughRate}%</Typography>
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
                    width: `${Math.min(engagementMetrics.clickThroughRate * 10, 100)}%`,
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: 4,
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Contact Saves</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{engagementMetrics.contactSaves}%</Typography>
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
                    width: `${Math.min(engagementMetrics.contactSaves * 10, 100)}%`,
                    backgroundColor: theme.palette.secondary.main,
                    borderRadius: 4,
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Social Media Clicks</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{engagementMetrics.socialClicks}%</Typography>
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
                    width: `${Math.min(engagementMetrics.socialClicks * 10, 100)}%`,
                    backgroundColor: theme.palette.success.main,
                    borderRadius: 4,
                  }}
                />
              </Box>
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">QR Code Scans</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{engagementMetrics.qrScans}%</Typography>
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
                    width: `${Math.min(engagementMetrics.qrScans * 10, 100)}%`,
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
