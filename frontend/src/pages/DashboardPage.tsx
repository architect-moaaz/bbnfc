import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  IconButton,
  Skeleton,
  useTheme,
  alpha,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analyticsAPI } from '../services/api';
import { Analytics } from '../types';
import {
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  TouchApp as TouchIcon,
  Share as ShareIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Analytics as AnalyticsIcon,
  CreditCard as CreditCardIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';


interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color }) => {
  const theme = useTheme();
  
  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
        transition: theme.transitions.create(['transform', 'box-shadow']),
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{
              backgroundColor: color,
              color: 'white',
              mr: 2,
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h3" component="div" sx={{ fontWeight: 700, color }}>
              {value.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon
              sx={{
                fontSize: 16,
                color: trend >= 0 ? 'success.main' : 'error.main',
                mr: 0.5,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: trend >= 0 ? 'success.main' : 'error.main',
                fontWeight: 600,
              }}
            >
              {trend >= 0 ? '+' : ''}{trend}% this month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await analyticsAPI.getDashboard();
        setDashboardData(response.data || null);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
        // Set fallback data
        setDashboardData({
          totalProfiles: 0,
          totalViews: 0,
          uniqueVisitors: 0,
          totalTaps: 0,
          totalShares: 0,
          recentProfiles: [],
          recentActivity: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'view':
        return <VisibilityIcon sx={{ fontSize: 20, color: 'primary.main' }} />;
      case 'tap':
        return <TouchIcon sx={{ fontSize: 20, color: 'secondary.main' }} />;
      case 'share':
        return <ShareIcon sx={{ fontSize: 20, color: 'success.main' }} />;
      case 'update':
        return <EditIcon sx={{ fontSize: 20, color: 'warning.main' }} />;
      default:
        return <NotificationsIcon sx={{ fontSize: 20 }} />;
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Header Skeleton */}
          <Grid item xs={12}>
            <Skeleton variant="text" width={300} height={40} />
            <Skeleton variant="text" width={200} height={24} />
          </Grid>
          
          {/* Stats Skeletons */}
          {[...Array(4)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
          
          {/* Content Skeletons */}
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your digital business cards today.
        </Typography>
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Box>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Profiles"
            value={dashboardData?.totalProfiles || 0}
            icon={<PersonIcon />}
            trend={12}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Profile Views"
            value={dashboardData?.totalViews || 0}
            icon={<VisibilityIcon />}
            trend={8}
            color={theme.palette.secondary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="NFC Taps"
            value={dashboardData?.totalTaps || 0}
            icon={<TouchIcon />}
            trend={23}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Shares"
            value={dashboardData?.totalShares || 0}
            icon={<ShareIcon />}
            trend={-3}
            color={theme.palette.warning.main}
          />
        </Grid>
        
        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/profiles/new')}
                  sx={{ py: 1.5 }}
                >
                  Create Profile
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AnalyticsIcon />}
                  onClick={() => navigate('/analytics')}
                  sx={{ py: 1.5 }}
                >
                  View Analytics
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CreditCardIcon />}
                  onClick={() => navigate('/cards')}
                  sx={{ py: 1.5 }}
                >
                  Manage Cards
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate('/profiles')}
                  sx={{ py: 1.5 }}
                >
                  Edit Profiles
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Recent Profiles */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Your Profiles
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/profiles')}
                endIcon={<AddIcon />}
              >
                View All
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {dashboardData?.recentProfiles && dashboardData.recentProfiles.length > 0 ? (
                dashboardData.recentProfiles.map((profile) => (
                  <Card key={profile.id} variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {profile.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {profile.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Updated {profile.lastUpdated}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                          label={profile.status}
                          size="small"
                          color={profile.status === 'active' ? 'success' : 'default'}
                        />
                        <Box sx={{ textAlign: 'right', mr: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {profile.views} views • {profile.taps} taps
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/profiles/${profile.id}/edit`)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Card>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No profiles found. Create your first profile to get started!
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Recent Activity
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity) => (
                  <Box key={activity.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ mt: 0.5 }}>
                      {getActivityIcon(activity.type)}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {activity.message}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {activity.time}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No recent activity. Share your profiles to start seeing activity!
                </Typography>
              )}
              
              <Button
                size="small"
                fullWidth
                variant="text"
                sx={{ mt: 1 }}
                onClick={() => navigate('/analytics')}
              >
                View All Activity
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;