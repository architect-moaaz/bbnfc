import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Fab,
  useTheme,
  alpha,
  Skeleton,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  QrCode as QrCodeIcon,
  Analytics as AnalyticsIcon,
  Person as PersonIcon,
  ViewModule as TemplateIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profilesAPI } from '../services/api';
import { Profile } from '../types';

type ProfileStatus = 'active' | 'draft' | 'archived';
type FilterType = 'all' | 'active' | 'draft' | 'archived';

interface DisplayProfile {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar: string | null;
  status: ProfileStatus;
  isPublic: boolean;
  views: number;
  shares: number;
  lastViewed: string;
  createdAt: string;
  qrCode: string;
  url: string;
}

const ProfilesPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [profiles, setProfiles] = useState<DisplayProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterType>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProfile, setSelectedProfile] = useState<DisplayProfile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const response = await profilesAPI.getProfiles();
      
      if (response.success && response.data) {
        // Transform API profile data to display format
        const displayProfiles: DisplayProfile[] = response.data.map((profile: Profile) => ({
          id: profile._id || profile.id || '',
          name: `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`,
          title: profile.personalInfo.title || '',
          company: profile.personalInfo.company || '',
          avatar: profile.personalInfo.profilePhoto || null,
          status: profile.isActive ? 'active' : 'draft' as ProfileStatus,
          isPublic: profile.isActive,
          views: profile.analytics?.views || 0,
          shares: 0, // TODO: Add shares tracking to backend
          lastViewed: 'Recently', // TODO: Add last viewed tracking
          createdAt: new Date(profile.createdAt).toLocaleDateString(),
          qrCode: profile.qrCode || '',
          url: `${window.location.origin}/p/${profile.slug}`,
        }));
        
        setProfiles(displayProfiles);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to load profiles. Please try again.', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, profile: DisplayProfile) => {
    setAnchorEl(event.currentTarget);
    setSelectedProfile(profile);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProfile(null);
  };

  const handleEdit = () => {
    if (selectedProfile) {
      navigate(`/profiles/${selectedProfile.id}/edit`);
    }
    handleMenuClose();
  };

  const handlePreview = () => {
    if (selectedProfile) {
      navigate(`/profiles/${selectedProfile.id}/preview`);
    }
    handleMenuClose();
  };

  const handleCopyUrl = async () => {
    if (selectedProfile) {
      try {
        await navigator.clipboard.writeText(selectedProfile.url);
        setSnackbar({ open: true, message: 'Profile URL copied to clipboard!', severity: 'success' });
      } catch (err) {
        setSnackbar({ open: true, message: 'Failed to copy URL', severity: 'error' });
      }
    }
    handleMenuClose();
  };

  const handleToggleStatus = async () => {
    if (selectedProfile) {
      try {
        const newIsActive = selectedProfile.status !== 'active';
        const response = await profilesAPI.updateProfile(selectedProfile.id, { isActive: newIsActive });
        
        if (response.success) {
          const newStatus = newIsActive ? 'active' : 'draft';
          setProfiles(profiles.map(p => 
            p.id === selectedProfile.id 
              ? { ...p, status: newStatus, isPublic: newIsActive }
              : p
          ));
          setSnackbar({ 
            open: true, 
            message: `Profile ${newIsActive ? 'activated' : 'deactivated'} successfully!`, 
            severity: 'success' 
          });
        } else {
          setSnackbar({ open: true, message: 'Failed to update profile status', severity: 'error' });
        }
      } catch (error) {
        console.error('Error updating profile status:', error);
        setSnackbar({ open: true, message: 'Failed to update profile status', severity: 'error' });
      }
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (selectedProfile) {
      try {
        const response = await profilesAPI.deleteProfile(selectedProfile.id);
        if (response.success) {
          setProfiles(profiles.filter(p => p.id !== selectedProfile.id));
          setSnackbar({ open: true, message: 'Profile deleted successfully!', severity: 'success' });
        } else {
          setSnackbar({ open: true, message: 'Failed to delete profile', severity: 'error' });
        }
        setSelectedProfile(null);
      } catch (error) {
        console.error('Error deleting profile:', error);
        setSnackbar({ open: true, message: 'Failed to delete profile', severity: 'error' });
      }
    }
    setDeleteDialogOpen(false);
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         profile.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         profile.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || profile.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: ProfileStatus) => {
    switch (status) {
      case 'active': return theme.palette.success.main;
      case 'draft': return theme.palette.warning.main;
      case 'archived': return theme.palette.grey[500];
      default: return theme.palette.grey[500];
    }
  };

  const getStatusLabel = (status: ProfileStatus) => {
    switch (status) {
      case 'active': return 'Active';
      case 'draft': return 'Draft';
      case 'archived': return 'Archived';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="text" width={200} height={24} />
        </Box>
        
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Skeleton variant="rectangular" width={300} height={56} />
          <Skeleton variant="rectangular" width={120} height={56} />
        </Box>

        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            My Profiles
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your digital business card profiles and track their performance.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<TemplateIcon />}
            onClick={() => navigate('/templates')}
            sx={{ minWidth: 140 }}
          >
            Browse Templates
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/profiles/new')}
            sx={{ minWidth: 140 }}
          >
            Create Profile
          </Button>
        </Box>
      </Box>

      {/* Search and Filter */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search profiles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, minWidth: 250 }}
        />
        
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => {/* Filter menu implementation */}}
          sx={{ minWidth: 120 }}
        >
          {filterStatus === 'all' ? 'All' : getStatusLabel(filterStatus as ProfileStatus)}
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {profiles.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Profiles
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
              {profiles.filter(p => p.status === 'active').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
              {profiles.filter(p => p.status === 'draft').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Drafts
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
              {profiles.reduce((sum, p) => sum + p.views, 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Views
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Profiles Grid */}
      {filteredProfiles.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            border: `2px dashed ${theme.palette.divider}`,
            borderRadius: 2,
          }}
        >
          <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            {searchQuery || filterStatus !== 'all' ? 'No profiles found' : 'No profiles yet'}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {searchQuery || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first digital business card profile to get started.'
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/profiles/new')}
            size="large"
          >
            Create Profile
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredProfiles.map((profile) => (
            <Grid item xs={12} sm={6} md={4} key={profile.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: theme.transitions.create(['transform', 'box-shadow']),
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  {/* Profile Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        width: 48,
                        height: 48,
                        mr: 2,
                      }}
                    >
                      {profile.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
                        {profile.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {profile.title}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, profile)}
                      aria-label="Profile options"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  {/* Company and Status */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {profile.company}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={getStatusLabel(profile.status)}
                        size="small"
                        sx={{
                          backgroundColor: alpha(getStatusColor(profile.status), 0.1),
                          color: getStatusColor(profile.status),
                          fontWeight: 600,
                        }}
                      />
                      {profile.isPublic && (
                        <Chip
                          label="Public"
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: 'success.main', color: 'success.main' }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Stats */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {profile.views}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Views
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {profile.shares}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Shares
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Last viewed
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {profile.lastViewed}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/profiles/${profile.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => navigate(`/profiles/${profile.id}/preview`)}
                  >
                    Preview
                  </Button>
                  <Button
                    size="small"
                    startIcon={<ShareIcon />}
                    onClick={() => handleMenuClick(new MouseEvent('click') as any, profile)}
                  >
                    Share
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="Create new profile"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
        onClick={() => navigate('/profiles/new')}
      >
        <AddIcon />
      </Fab>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 8,
          sx: { minWidth: 180 }
        }}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 2, fontSize: 20 }} />
          Edit Profile
        </MenuItem>
        <MenuItem onClick={handlePreview}>
          <VisibilityIcon sx={{ mr: 2, fontSize: 20 }} />
          Preview
        </MenuItem>
        <MenuItem onClick={() => navigate(`/analytics?profile=${selectedProfile?.id}`)}>
          <AnalyticsIcon sx={{ mr: 2, fontSize: 20 }} />
          View Analytics
        </MenuItem>
        <MenuItem onClick={handleCopyUrl}>
          <CopyIcon sx={{ mr: 2, fontSize: 20 }} />
          Copy URL
        </MenuItem>
        <MenuItem onClick={() => window.open(selectedProfile?.qrCode, '_blank')}>
          <QrCodeIcon sx={{ mr: 2, fontSize: 20 }} />
          Download QR Code
        </MenuItem>
        <MenuItem onClick={handleToggleStatus}>
          {selectedProfile?.status === 'active' ? 'Deactivate' : 'Activate'}
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 2, fontSize: 20 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Profile</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProfile?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProfilesPage;