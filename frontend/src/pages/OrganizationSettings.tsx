import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Avatar,
  Alert,
  Skeleton,
  Tabs,
  Tab,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { organizationsAPI, uploadAPI } from '../services/api';
import { Organization } from '../types';
import {
  Business as BusinessIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const OrganizationSettings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    subdomain: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    customCSS: '',
    customDomain: '',
    allowUserRegistration: true,
    requireEmailVerification: true,
    defaultUserRole: 'member',
    twoFactorRequired: false,
    allowCustomDomains: false,
  });

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setLoading(true);
        const response = await organizationsAPI.getCurrentOrganization();

        if (response.success && response.data) {
          const org = response.data;
          setOrganization(org);

          // Populate form with organization data
          setFormData({
            name: org.name || '',
            slug: org.slug || '',
            subdomain: org.subdomain || '',
            description: org.description || '',
            email: org.contactInfo?.email || '',
            phone: org.contactInfo?.phone || '',
            website: org.contactInfo?.website || '',
            street: org.contactInfo?.address?.street || '',
            city: org.contactInfo?.address?.city || '',
            state: org.contactInfo?.address?.state || '',
            country: org.contactInfo?.address?.country || '',
            postalCode: org.contactInfo?.address?.postalCode || '',
            primaryColor: org.branding?.primaryColor || '#1976d2',
            secondaryColor: org.branding?.secondaryColor || '#dc004e',
            customCSS: org.branding?.customCSS || '',
            customDomain: org.branding?.customDomain || '',
            allowUserRegistration: org.settings?.allowUserRegistration ?? true,
            requireEmailVerification: org.settings?.requireEmailVerification ?? true,
            defaultUserRole: org.settings?.defaultUserRole || 'member',
            twoFactorRequired: org.settings?.twoFactorRequired ?? false,
            allowCustomDomains: org.settings?.allowCustomDomains ?? false,
          });
        }
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch organization:', err);
        setError('Failed to load organization settings');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const response = await uploadAPI.uploadCompanyLogo(file);
      if (response.success && response.data?.imageUrl) {
        setFormData((prev) => ({ ...prev, logo: response.data?.imageUrl }));
        setSuccess('Logo uploaded successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to upload logo:', err);
      setError('Failed to upload logo');
    }
  };

  const handleSaveGeneral = async () => {
    if (!organization) return;

    try {
      setSaving(true);

      const updateData: Partial<Organization> = {
        name: formData.name,
        slug: formData.slug,
        subdomain: formData.subdomain,
        description: formData.description,
        contactInfo: {
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            postalCode: formData.postalCode,
          },
        },
      };

      const response = await organizationsAPI.updateOrganization(
        organization.id || organization._id || '',
        updateData
      );

      if (response.success) {
        setSuccess('General settings saved successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBranding = async () => {
    if (!organization) return;

    try {
      setSaving(true);

      const brandingData = {
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        customCSS: formData.customCSS,
        customDomain: formData.customDomain,
      };

      const response = await organizationsAPI.updateBranding(
        organization.id || organization._id || '',
        brandingData
      );

      if (response.success) {
        setSuccess('Branding settings saved successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to save branding:', err);
      setError('Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!organization) return;

    try {
      setSaving(true);

      const updateData: Partial<Organization> = {
        settings: {
          allowUserRegistration: formData.allowUserRegistration,
          requireEmailVerification: formData.requireEmailVerification,
          defaultUserRole: formData.defaultUserRole,
          twoFactorRequired: formData.twoFactorRequired,
          allowCustomDomains: formData.allowCustomDomains,
        },
      };

      const response = await organizationsAPI.updateOrganization(
        organization.id || organization._id || '',
        updateData
      );

      if (response.success) {
        setSuccess('Security settings saved successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setError('Failed to save security settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="rectangular" height={500} sx={{ mt: 3, borderRadius: 2 }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/organization')}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Organization Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your organization profile, branding, and security settings
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Settings Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<BusinessIcon />} label="General" />
          <Tab icon={<PaletteIcon />} label="Branding" />
          <Tab icon={<SecurityIcon />} label="Security" />
        </Tabs>
      </Paper>

      {/* General Settings */}
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Organization Information
          </Typography>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Organization Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Slug"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                helperText="Used in URLs (e.g., bbtap.me/your-slug)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Subdomain"
                value={formData.subdomain}
                onChange={(e) => handleChange('subdomain', e.target.value)}
                helperText="Custom subdomain (e.g., yourcompany.bbtap.me)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Website"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Contact Information
          </Typography>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={formData.street}
                onChange={(e) => handleChange('street', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="State/Province"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Postal Code"
                value={formData.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveGeneral}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Paper>
      </TabPanel>

      {/* Branding Settings */}
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Brand Identity
          </Typography>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Organization Logo
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={organization?.logo}
                    sx={{ width: 80, height: 80 }}
                  >
                    <BusinessIcon />
                  </Avatar>
                  <Box>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="logo-upload"
                      type="file"
                      onChange={handleLogoUpload}
                    />
                    <label htmlFor="logo-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<PhotoCameraIcon />}
                      >
                        Upload Logo
                      </Button>
                    </label>
                  </Box>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Primary Color"
                type="color"
                value={formData.primaryColor}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Secondary Color"
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => handleChange('secondaryColor', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Custom Domain"
                value={formData.customDomain}
                onChange={(e) => handleChange('customDomain', e.target.value)}
                helperText="Your custom domain (e.g., cards.yourcompany.com)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Custom CSS"
                value={formData.customCSS}
                onChange={(e) => handleChange('customCSS', e.target.value)}
                helperText="Add custom CSS to style your organization's pages"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveBranding}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Branding'}
            </Button>
          </Box>
        </Paper>
      </TabPanel>

      {/* Security Settings */}
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Security & Access
          </Typography>

          <FormGroup sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.allowUserRegistration}
                  onChange={(e) => handleChange('allowUserRegistration', e.target.checked)}
                />
              }
              label="Allow user registration"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.requireEmailVerification}
                  onChange={(e) => handleChange('requireEmailVerification', e.target.checked)}
                />
              }
              label="Require email verification for new users"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.twoFactorRequired}
                  onChange={(e) => handleChange('twoFactorRequired', e.target.checked)}
                />
              }
              label="Require two-factor authentication"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.allowCustomDomains}
                  onChange={(e) => handleChange('allowCustomDomains', e.target.checked)}
                />
              }
              label="Allow custom domains for profiles"
            />
          </FormGroup>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Default User Role</InputLabel>
                <Select
                  value={formData.defaultUserRole}
                  label="Default User Role"
                  onChange={(e) => handleChange('defaultUserRole', e.target.value)}
                >
                  <MenuItem value="member">Member</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveSettings}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Security Settings'}
            </Button>
          </Box>
        </Paper>
      </TabPanel>
    </Container>
  );
};

export default OrganizationSettings;
