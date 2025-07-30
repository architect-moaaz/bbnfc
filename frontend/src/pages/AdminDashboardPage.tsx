import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tooltip,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Link as LinkIcon,
  People as PeopleIcon,
  Dashboard as DashboardIcon,
  CardMembership as CardIcon,
  Palette as PaletteIcon,
  Analytics as AnalyticsIcon,
  ContentCopy as CopyIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  YouTube as YouTubeIcon,
  GitHub as GitHubIcon,
} from '@mui/icons-material';
import { adminAPI, profilesAPI, templatesAPI } from '../services/api';
import { User, Profile } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminDashboardPage: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newProfileDialog, setNewProfileDialog] = useState(false);
  const [cardDesignerDialog, setCardDesignerDialog] = useState(false);
  const [dialogTabValue, setDialogTabValue] = useState(0);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalProfiles: 0,
    totalViews: 0,
    activeProfiles: 0,
  });

  // Form state for new profile
  const [newProfile, setNewProfile] = useState({
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    email: '',
    phone: '',
    bio: '',
    userId: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
    socialLinks: {
      linkedin: '',
      twitter: '',
      facebook: '',
      instagram: '',
      youtube: '',
      github: '',
      tiktok: '',
    },
    companyLogo: '',
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Card design state
  const [cardDesign, setCardDesign] = useState({
    primaryColor: '#b59a3b',
    secondaryColor: '#FEC72D',
    fontFamily: 'Inter',
    layout: 'centered',
    backgroundType: 'gradient',
    customCSS: '',
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [usersResponse, profilesResponse, dashboardResponse, templatesResponse] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getProfiles(),
        adminAPI.getDashboard(),
        templatesAPI.getTemplates(),
      ]);

      if (usersResponse.success) {
        setUsers(usersResponse.data || []);
      }
      if (profilesResponse.success) {
        setProfiles(profilesResponse.data || []);
      }
      if (dashboardResponse.success) {
        setDashboardStats(dashboardResponse.data || {
          totalUsers: 0,
          totalProfiles: 0,
          totalViews: 0,
          activeProfiles: 0,
        });
      }
      if (templatesResponse.success) {
        setAvailableTemplates(templatesResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getDirectProfileUrl = (profileId: string) => {
    return `${window.location.origin}/p/${profileId}`;
  };

  const copyProfileLink = (profileId: string) => {
    const url = getDirectProfileUrl(profileId);
    navigator.clipboard.writeText(url);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!newProfile.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!newProfile.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (newProfile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newProfile.email)) {
      errors.email = 'Invalid email format';
    }
    if (newProfile.phone && !/^[\d\s\-\+\(\)]+$/.test(newProfile.phone)) {
      errors.phone = 'Invalid phone format';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateProfile = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const profileData = {
        personalInfo: {
          firstName: newProfile.firstName,
          lastName: newProfile.lastName,
          title: newProfile.title,
          company: newProfile.company,
          bio: newProfile.bio,
        },
        contactInfo: {
          email: newProfile.email,
          phone: newProfile.phone,
          website: newProfile.website,
          address: {
            street: newProfile.address.street,
            city: newProfile.address.city,
            state: newProfile.address.state,
            country: newProfile.address.country,
            postalCode: newProfile.address.postalCode,
          },
        },
        socialLinks: Object.fromEntries(
          Object.entries(newProfile.socialLinks).filter(([_, url]) => url.trim() !== '')
        ),
        customization: {
          ...cardDesign,
          logo: newProfile.companyLogo || 'https://onboarding.gib.com/api/files/754e859f87c409456910f0_afterhire/config//GIB-UK-Logo-e1584979156851.png',
        },
        sections: {
          showContact: true,
          showSocial: true,
          showHours: false,
          showGallery: false,
          showServices: false,
          showTestimonials: false,
        },
        callToAction: {
          enabled: true,
          text: 'Save Contact',
          action: 'vcard' as const,
        },
        analytics: {
          views: 0,
          uniqueViews: 0,
          cardTaps: 0,
          contactDownloads: 0,
          linkClicks: {},
        },
        template: availableTemplates.length > 0 ? availableTemplates[0]._id : undefined,
        isActive: true,
      };

      const response = await profilesAPI.createProfile(profileData);
      if (response.success) {
        setNewProfileDialog(false);
        // Reset form
        setNewProfile({
          firstName: '',
          lastName: '',
          title: '',
          company: '',
          email: '',
          phone: '',
          bio: '',
          userId: '',
          website: '',
          address: {
            street: '',
            city: '',
            state: '',
            country: '',
            postalCode: '',
          },
          socialLinks: {
            linkedin: '',
            twitter: '',
            facebook: '',
            instagram: '',
            youtube: '',
            github: '',
            tiktok: '',
          },
          companyLogo: '',
        });
        setFormErrors({});
        loadAdminData();
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h1" sx={{ mb: 2, color: '#374151', fontWeight: 600 }}>
            Admin Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: '#6B7280' }}>
            Manage users, profiles, and card designs
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #b59a3b 0%, #FEC72D 100%)',
              color: 'white',
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                      {dashboardStats.totalUsers}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Users
                    </Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #00A3B5 0%, #33B5C5 100%)',
              color: 'white',
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                      {dashboardStats.totalProfiles}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Profiles
                    </Typography>
                  </Box>
                  <CardIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
              color: 'white',
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                      {dashboardStats.activeProfiles}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Active Profiles
                    </Typography>
                  </Box>
                  <DashboardIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
              color: 'white',
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                      {dashboardStats.totalViews?.toLocaleString() || '0'}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Views
                    </Typography>
                  </Box>
                  <AnalyticsIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Users" />
              <Tab label="Profiles" />
              <Tab label="Card Designer" />
            </Tabs>
          </Box>

          {/* Users Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">User Management</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setNewProfileDialog(true)}
                sx={{ backgroundColor: theme.palette.primary.main }}
              >
                Create Profile
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Verified</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                            {user.name.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {user.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role} 
                          color={user.role === 'admin' ? 'error' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.isEmailVerified ? 'Verified' : 'Pending'} 
                          color={user.isEmailVerified ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <Tooltip title="View Profile">
                          <IconButton size="small">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit User">
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Profiles Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Profile Management</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setNewProfileDialog(true)}
                sx={{ backgroundColor: theme.palette.primary.main }}
              >
                Create Profile
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Profile</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Views</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Direct Link</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {profile.personalInfo.firstName} {profile.personalInfo.lastName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280' }}>
                            {profile.personalInfo.title}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{profile.personalInfo.company}</TableCell>
                      <TableCell>{profile.analytics.views.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={profile.isActive ? 'Active' : 'Inactive'} 
                          color={profile.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ 
                            maxWidth: 200, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis' 
                          }}>
                            {getDirectProfileUrl(profile.id)}
                          </Typography>
                          <Tooltip title="Copy Link">
                            <IconButton 
                              size="small" 
                              onClick={() => copyProfileLink(profile.id)}
                            >
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>{formatDate(profile.createdAt)}</TableCell>
                      <TableCell>
                        <Tooltip title="View Profile">
                          <IconButton 
                            size="small"
                            onClick={() => window.open(getDirectProfileUrl(profile.id), '_blank')}
                          >
                            <LinkIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Profile">
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Profile">
                          <IconButton size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Card Designer Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Card Designer</Typography>
              <Button
                variant="contained"
                startIcon={<PaletteIcon />}
                onClick={() => setCardDesignerDialog(true)}
                sx={{ backgroundColor: theme.palette.primary.main }}
              >
                Open Designer
              </Button>
            </Box>

            <Typography variant="body1" sx={{ color: '#6B7280' }}>
              Design custom card templates and apply them to user profiles. The card designer allows you to customize colors, fonts, layouts, and more.
            </Typography>
          </TabPanel>
        </Card>

        {/* Create Profile Dialog */}
        <Dialog open={newProfileDialog} onClose={() => setNewProfileDialog(false)} maxWidth="lg" fullWidth>
          <DialogTitle>Create New Profile</DialogTitle>
          <DialogContent>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={dialogTabValue} onChange={(e, newValue) => setDialogTabValue(newValue)}>
                <Tab label="Basic Info" />
                <Tab label="Contact Info" />
                <Tab label="Social Links" />
                <Tab label="Company Info" />
              </Tabs>
            </Box>

            {/* Basic Info Tab */}
            <TabPanel value={dialogTabValue} index={0}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="First Name *"
                    value={newProfile.firstName}
                    onChange={(e) => setNewProfile({...newProfile, firstName: e.target.value})}
                    error={!!formErrors.firstName}
                    helperText={formErrors.firstName}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Last Name *"
                    value={newProfile.lastName}
                    onChange={(e) => setNewProfile({...newProfile, lastName: e.target.value})}
                    error={!!formErrors.lastName}
                    helperText={formErrors.lastName}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Job Title"
                    value={newProfile.title}
                    onChange={(e) => setNewProfile({...newProfile, title: e.target.value})}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Company"
                    value={newProfile.company}
                    onChange={(e) => setNewProfile({...newProfile, company: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    multiline
                    rows={4}
                    value={newProfile.bio}
                    onChange={(e) => setNewProfile({...newProfile, bio: e.target.value})}
                    placeholder="Write a brief description about yourself or your role..."
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Contact Info Tab */}
            <TabPanel value={dialogTabValue} index={1}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={newProfile.email}
                    onChange={(e) => setNewProfile({...newProfile, email: e.target.value})}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={newProfile.phone}
                    onChange={(e) => setNewProfile({...newProfile, phone: e.target.value})}
                    error={!!formErrors.phone}
                    helperText={formErrors.phone}
                    placeholder="+1 (555) 123-4567"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={newProfile.website}
                    onChange={(e) => setNewProfile({...newProfile, website: e.target.value})}
                    placeholder="https://example.com"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: '#6B7280' }}>
                    Address
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={newProfile.address.street}
                    onChange={(e) => setNewProfile({
                      ...newProfile, 
                      address: {...newProfile.address, street: e.target.value}
                    })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={newProfile.address.city}
                    onChange={(e) => setNewProfile({
                      ...newProfile, 
                      address: {...newProfile.address, city: e.target.value}
                    })}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="State"
                    value={newProfile.address.state}
                    onChange={(e) => setNewProfile({
                      ...newProfile, 
                      address: {...newProfile.address, state: e.target.value}
                    })}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    value={newProfile.address.postalCode}
                    onChange={(e) => setNewProfile({
                      ...newProfile, 
                      address: {...newProfile.address, postalCode: e.target.value}
                    })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={newProfile.address.country}
                    onChange={(e) => setNewProfile({
                      ...newProfile, 
                      address: {...newProfile.address, country: e.target.value}
                    })}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Social Links Tab */}
            <TabPanel value={dialogTabValue} index={2}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: '#6B7280' }}>
                    Add your social media links (optional)
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="LinkedIn"
                    value={newProfile.socialLinks.linkedin}
                    onChange={(e) => setNewProfile({
                      ...newProfile,
                      socialLinks: {...newProfile.socialLinks, linkedin: e.target.value}
                    })}
                    placeholder="https://linkedin.com/in/username"
                    InputProps={{
                      startAdornment: <LinkedInIcon sx={{ mr: 1, color: '#0077b5' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Twitter"
                    value={newProfile.socialLinks.twitter}
                    onChange={(e) => setNewProfile({
                      ...newProfile,
                      socialLinks: {...newProfile.socialLinks, twitter: e.target.value}
                    })}
                    placeholder="https://twitter.com/username"
                    InputProps={{
                      startAdornment: <TwitterIcon sx={{ mr: 1, color: '#1da1f2' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Facebook"
                    value={newProfile.socialLinks.facebook}
                    onChange={(e) => setNewProfile({
                      ...newProfile,
                      socialLinks: {...newProfile.socialLinks, facebook: e.target.value}
                    })}
                    placeholder="https://facebook.com/username"
                    InputProps={{
                      startAdornment: <FacebookIcon sx={{ mr: 1, color: '#1877f2' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Instagram"
                    value={newProfile.socialLinks.instagram}
                    onChange={(e) => setNewProfile({
                      ...newProfile,
                      socialLinks: {...newProfile.socialLinks, instagram: e.target.value}
                    })}
                    placeholder="https://instagram.com/username"
                    InputProps={{
                      startAdornment: <InstagramIcon sx={{ mr: 1, color: '#e4405f' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="YouTube"
                    value={newProfile.socialLinks.youtube}
                    onChange={(e) => setNewProfile({
                      ...newProfile,
                      socialLinks: {...newProfile.socialLinks, youtube: e.target.value}
                    })}
                    placeholder="https://youtube.com/c/channel"
                    InputProps={{
                      startAdornment: <YouTubeIcon sx={{ mr: 1, color: '#ff0000' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="GitHub"
                    value={newProfile.socialLinks.github}
                    onChange={(e) => setNewProfile({
                      ...newProfile,
                      socialLinks: {...newProfile.socialLinks, github: e.target.value}
                    })}
                    placeholder="https://github.com/username"
                    InputProps={{
                      startAdornment: <GitHubIcon sx={{ mr: 1, color: '#333' }} />,
                    }}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Company Info Tab */}
            <TabPanel value={dialogTabValue} index={3}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: '#6B7280' }}>
                    Company branding and customization
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Company Logo URL"
                    value={newProfile.companyLogo}
                    onChange={(e) => setNewProfile({...newProfile, companyLogo: e.target.value})}
                    placeholder="https://example.com/logo.png"
                    helperText="Enter a URL to your company logo image"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ mt: 2, p: 2, border: '1px dashed #E5E7EB', borderRadius: 2, textAlign: 'center' }}>
                    {newProfile.companyLogo ? (
                      <img 
                        src={newProfile.companyLogo} 
                        alt="Company logo preview" 
                        style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = '<Typography color="error">Failed to load logo</Typography>';
                        }}
                      />
                    ) : (
                      <Typography color="text.secondary">
                        Logo preview will appear here
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mt: 3, mb: 2, color: '#6B7280' }}>
                    Card Design Settings
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Primary Color"
                    type="color"
                    value={cardDesign.primaryColor}
                    onChange={(e) => setCardDesign({...cardDesign, primaryColor: e.target.value})}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Secondary Color"
                    type="color"
                    value={cardDesign.secondaryColor}
                    onChange={(e) => setCardDesign({...cardDesign, secondaryColor: e.target.value})}
                  />
                </Grid>
              </Grid>
            </TabPanel>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setNewProfileDialog(false);
              setFormErrors({});
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProfile} 
              variant="contained"
              sx={{ backgroundColor: theme.palette.primary.main }}
            >
              Create Profile
            </Button>
          </DialogActions>
        </Dialog>

        {/* Card Designer Dialog */}
        <Dialog open={cardDesignerDialog} onClose={() => setCardDesignerDialog(false)} maxWidth="lg" fullWidth>
          <DialogTitle>Card Designer</DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2 }}>Design Settings</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Primary Color"
                      type="color"
                      value={cardDesign.primaryColor}
                      onChange={(e) => setCardDesign({...cardDesign, primaryColor: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Secondary Color"
                      type="color"
                      value={cardDesign.secondaryColor}
                      onChange={(e) => setCardDesign({...cardDesign, secondaryColor: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Font Family</InputLabel>
                      <Select
                        value={cardDesign.fontFamily}
                        onChange={(e) => setCardDesign({...cardDesign, fontFamily: e.target.value})}
                      >
                        <MenuItem value="Inter">Inter</MenuItem>
                        <MenuItem value="Poppins">Poppins</MenuItem>
                        <MenuItem value="SF Pro">SF Pro</MenuItem>
                        <MenuItem value="Arial">Arial</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Layout</InputLabel>
                      <Select
                        value={cardDesign.layout}
                        onChange={(e) => setCardDesign({...cardDesign, layout: e.target.value})}
                      >
                        <MenuItem value="centered">Centered</MenuItem>
                        <MenuItem value="left-aligned">Left Aligned</MenuItem>
                        <MenuItem value="split">Split</MenuItem>
                        <MenuItem value="minimal">Minimal</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Custom CSS"
                      multiline
                      rows={4}
                      value={cardDesign.customCSS}
                      onChange={(e) => setCardDesign({...cardDesign, customCSS: e.target.value})}
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2 }}>Preview</Typography>
                <Card sx={{ 
                  background: `linear-gradient(135deg, ${cardDesign.primaryColor} 0%, ${cardDesign.secondaryColor} 100%)`,
                  color: 'white',
                  minHeight: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <CardContent>
                    <Typography variant="h5" sx={{ fontFamily: cardDesign.fontFamily }}>
                      Sample Profile
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: cardDesign.fontFamily, mt: 1 }}>
                      UX Designer at Creative Studio
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: cardDesign.fontFamily, mt: 2, opacity: 0.9 }}>
                      This is how the card will look with your design settings.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCardDesignerDialog(false)}>Close</Button>
            <Button 
              variant="contained"
              sx={{ backgroundColor: theme.palette.primary.main }}
            >
              Save Design
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default AdminDashboardPage;