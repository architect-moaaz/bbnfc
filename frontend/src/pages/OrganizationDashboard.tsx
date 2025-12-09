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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Skeleton,
  useTheme,
  alpha,
  LinearProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { organizationsAPI } from '../services/api';
import { Organization } from '../types';
import SubscriptionUsageCard from '../components/SubscriptionUsageCard';
import {
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  CreditCard as CreditCardIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: number;
  max?: number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, max, icon, color, trend }) => {
  const theme = useTheme();
  const percentage = max ? (value / max) * 100 : undefined;

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
              {max && <Typography component="span" variant="h5" color="text.secondary"> / {max}</Typography>}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>

        {percentage !== undefined && (
          <Box>
            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: alpha(color, 0.1),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: color,
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {percentage.toFixed(0)}% used
            </Typography>
          </Box>
        )}

        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
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

const OrganizationDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizationData = async () => {
      try {
        setLoading(true);

        // Fetch current organization
        const orgResponse = await organizationsAPI.getCurrentOrganization();
        if (orgResponse.success && orgResponse.data) {
          setOrganization(orgResponse.data);
          const orgId = orgResponse.data.id || orgResponse.data._id || '';

          // Fetch members
          const membersResponse = await organizationsAPI.getMembers(orgId);
          if (membersResponse.success && membersResponse.data) {
            setMembers(membersResponse.data);
          }

          // Fetch profiles
          try {
            const profilesResponse = await organizationsAPI.getProfiles(orgId);
            if (profilesResponse.success && profilesResponse.data) {
              setProfiles(profilesResponse.data);
            }
          } catch (profileErr) {
            console.warn('Failed to fetch profiles:', profileErr);
          }
        }

        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch organization data:', err);
        setError('Failed to load organization data');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Skeleton variant="text" width={300} height={40} />
            <Skeleton variant="text" width={200} height={24} />
          </Grid>

          {[...Array(4)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}

          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {organization?.logo && (
            <Avatar
              src={organization.logo}
              sx={{ width: 64, height: 64 }}
            />
          )}
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 0 }}>
              {organization?.name || 'Organization Dashboard'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {organization?.description || 'Manage your organization, members, and resources'}
            </Typography>
            {organization?.subscription && (
              <Chip
                label={organization.subscription.plan.toUpperCase()}
                color={organization.subscription.status === 'active' ? 'success' : 'default'}
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<SettingsIcon />}
          onClick={() => navigate('/organization/settings')}
        >
          Settings
        </Button>
      </Box>

      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={3}>
        {/* Subscription Usage Card */}
        {organization && (
          <Grid item xs={12}>
            <SubscriptionUsageCard
              plan={organization.subscription?.plan || 'free'}
              limits={{
                users: organization.limits?.users || 0,
                profiles: organization.limits?.profiles || 0,
                cards: organization.limits?.cards || 0,
                storage: organization.limits?.storage || 0,
              }}
              usage={{
                users: organization.usage?.users || 0,
                profiles: organization.usage?.profiles || 0,
                cards: organization.usage?.cards || 0,
                storage: organization.usage?.storage || 0,
              }}
            />
          </Grid>
        )}

        {/* Usage Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Team Members"
            value={organization?.usage?.users || 0}
            max={organization?.limits?.users}
            icon={<PeopleIcon />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Cards"
            value={organization?.usage?.cards || 0}
            max={organization?.limits?.cards}
            icon={<CreditCardIcon />}
            color={theme.palette.secondary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Profiles"
            value={organization?.usage?.profiles || 0}
            max={organization?.limits?.profiles}
            icon={<PersonIcon />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Storage (MB)"
            value={organization?.usage?.storage || 0}
            max={organization?.limits?.storage}
            icon={<BusinessIcon />}
            color={theme.palette.warning.main}
          />
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/organization/members/invite')}
                  sx={{ py: 1.5 }}
                >
                  Invite Member
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate('/organization/members')}
                  sx={{ py: 1.5 }}
                >
                  Manage Team
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<BusinessIcon />}
                  onClick={() => navigate('/organization/branding')}
                  sx={{ py: 1.5 }}
                >
                  Branding
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => navigate('/organization/settings')}
                  sx={{ py: 1.5 }}
                >
                  Settings
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Organization Profiles */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Organization Profiles
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/profiles')}
                endIcon={<AddIcon />}
              >
                View All
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Profile</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Views</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {profiles.length > 0 ? (
                    profiles.slice(0, 5).map((profile) => (
                      <TableRow key={profile.id || profile._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={profile.personalInfo?.profilePhoto}
                              sx={{ bgcolor: 'secondary.main' }}
                            >
                              {profile.personalInfo?.firstName?.charAt(0) || 'P'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {profile.personalInfo?.firstName} {profile.personalInfo?.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {profile.personalInfo?.title || 'No title'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {profile.user?.name || profile.user?.email || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {profile.analytics?.views || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={profile.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            color={profile.isActive ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/profiles/${profile.id || profile._id}/edit`)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => window.open(`/p/${profile.slug || profile.id || profile._id}`, '_blank')}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          No profiles found. Create profiles for your team members!
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Members */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Team Members
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/organization/members')}
                endIcon={<AddIcon />}
              >
                View All
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.length > 0 ? (
                    members.slice(0, 5).map((member) => (
                      <TableRow key={member.id || member._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {member.name?.charAt(0) || 'U'}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {member.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={member.organizationRole || 'member'}
                            size="small"
                            color={member.organizationRole === 'owner' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{member.department || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={member.isEmailVerified ? 'Active' : 'Pending'}
                            size="small"
                            color={member.isEmailVerified ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small">
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          No team members found. Invite members to get started!
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OrganizationDashboard;
