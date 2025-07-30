import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CameraAlt as CameraIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  YouTube as YouTubeIcon,
  GitHub as GitHubIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { profilesAPI, templatesAPI } from '../services/api';
import ImageUpload from '../components/ImageUpload';

const steps = ['Basic Information', 'Contact Details', 'Social Links', 'Review & Publish'];

const CreateProfilePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeStep, setActiveStep] = useState(0);
  
  // Get selected template from navigation state
  const selectedTemplate = location.state?.selectedTemplate;
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    bio: '',
    profilePhoto: '',
    email: '',
    phone: '',
    website: '',
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    facebook: '',
    youtube: '',
    github: '',
    companyLogo: '',
    isPublic: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  useEffect(() => {
    // Load available templates on component mount
    const loadTemplates = async () => {
      try {
        const response = await templatesAPI.getTemplates();
        if (response.success) {
          setAvailableTemplates(response.data || []);
          if (response.data && response.data.length === 0) {
            console.warn('No templates available in the system');
          }
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        setSnackbar({ 
          open: true, 
          message: 'Failed to load templates. Please try again.', 
          severity: 'error' 
        });
      }
    };
    loadTemplates();
  }, []);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSwitchChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked,
    }));
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      errors.phone = 'Invalid phone format';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setSnackbar({ 
        open: true, 
        message: 'Please fix the errors before saving', 
        severity: 'error' 
      });
      return;
    }

    setLoading(true);
    try {
      const profileData = {
        personalInfo: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          title: formData.title.trim() || undefined,
          company: formData.company.trim() || undefined,
          bio: formData.bio.trim() || undefined,
          profilePhoto: formData.profilePhoto || undefined,
        },
        contactInfo: {
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          website: formData.website.trim() || undefined,
          address: {
            street: formData.street.trim() || undefined,
            city: formData.city.trim() || undefined,
            state: formData.state.trim() || undefined,
            country: formData.country.trim() || undefined,
            postalCode: formData.postalCode.trim() || undefined,
          },
        },
        socialLinks: Object.fromEntries(
          Object.entries({
            linkedin: formData.linkedin,
            twitter: formData.twitter,
            instagram: formData.instagram,
            facebook: formData.facebook,
            youtube: formData.youtube,
            github: formData.github,
          }).filter(([_, url]) => url.trim() !== '')
        ),
        customization: {
          primaryColor: selectedTemplate?.defaultColors?.primary || '#b59a3b',
          secondaryColor: selectedTemplate?.defaultColors?.secondary || '#FEC72D',
          fontFamily: selectedTemplate?.defaultFonts?.body || 'Inter',
          logo: formData.companyLogo || 'https://onboarding.gib.com/api/files/754e859f87c409456910f0_afterhire/config//GIB-UK-Logo-e1584979156851.png',
        },
        sections: {
          showContact: selectedTemplate?.features?.includes('contact') !== false,
          showSocial: selectedTemplate?.features?.includes('social') !== false,
          showHours: selectedTemplate?.features?.includes('hours') || false,
          showGallery: selectedTemplate?.features?.includes('gallery') || false,
          showServices: selectedTemplate?.features?.includes('services') || false,
          showTestimonials: selectedTemplate?.features?.includes('testimonials') || false,
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
        // Include selected template or fallback to first available template
        template: selectedTemplate?._id || (availableTemplates.length > 0 ? availableTemplates[0]._id : undefined),
        isActive: formData.isPublic,
      };

      const response = await profilesAPI.createProfile(profileData);
      if (response.success) {
        setSnackbar({ 
          open: true, 
          message: 'Profile created successfully!', 
          severity: 'success' 
        });
        // Navigate to the new profile after a short delay
        setTimeout(() => navigate('/profiles'), 1500);
      } else {
        throw new Error('Failed to create profile');
      }
    } catch (error: any) {
      console.error('Error creating profile:', error);
      
      let errorMessage = 'Failed to create profile. Please try again.';
      
      if (error.response?.data?.details) {
        errorMessage = `Validation failed: ${error.response.data.details.join(', ')}`;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sx={{ textAlign: 'center', mb: 2 }}>
              <ImageUpload
                currentImage={formData.profilePhoto}
                onImageChange={(imageUrl) => setFormData({ ...formData, profilePhoto: imageUrl })}
                uploadType="profile"
                label="Profile Photo"
                size={120}
                rounded
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name *"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                error={!!formErrors.firstName}
                helperText={formErrors.firstName}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name *"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                error={!!formErrors.lastName}
                helperText={formErrors.lastName}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Job Title"
                value={formData.title}
                onChange={handleInputChange('title')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Company"
                value={formData.company}
                onChange={handleInputChange('company')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                value={formData.bio}
                onChange={handleInputChange('bio')}
                multiline
                rows={4}
                placeholder="Tell people about yourself and your role..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Logo URL"
                value={formData.companyLogo}
                onChange={handleInputChange('companyLogo')}
                placeholder="https://example.com/logo.png"
                helperText="Optional: Enter a URL to your company logo"
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                error={!!formErrors.phone}
                helperText={formErrors.phone}
                placeholder="+1 (555) 123-4567"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website"
                value={formData.website}
                onChange={handleInputChange('website')}
                placeholder="https://yourwebsite.com"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: '#6B7280' }}>
                Address (Optional)
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={formData.street}
                onChange={handleInputChange('street')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={handleInputChange('city')}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={handleInputChange('state')}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Postal Code"
                value={formData.postalCode}
                onChange={handleInputChange('postalCode')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={handleInputChange('country')}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: '#6B7280' }}>
                Add your social media links (optional)
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="LinkedIn"
                value={formData.linkedin}
                onChange={handleInputChange('linkedin')}
                placeholder="https://linkedin.com/in/yourprofile"
                InputProps={{
                  startAdornment: <LinkedInIcon sx={{ mr: 1, color: '#0077b5' }} />,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Twitter"
                value={formData.twitter}
                onChange={handleInputChange('twitter')}
                placeholder="https://twitter.com/yourhandle"
                InputProps={{
                  startAdornment: <TwitterIcon sx={{ mr: 1, color: '#1da1f2' }} />,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Facebook"
                value={formData.facebook}
                onChange={handleInputChange('facebook')}
                placeholder="https://facebook.com/yourprofile"
                InputProps={{
                  startAdornment: <FacebookIcon sx={{ mr: 1, color: '#1877f2' }} />,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Instagram"
                value={formData.instagram}
                onChange={handleInputChange('instagram')}
                placeholder="https://instagram.com/yourhandle"
                InputProps={{
                  startAdornment: <InstagramIcon sx={{ mr: 1, color: '#e4405f' }} />,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="YouTube"
                value={formData.youtube}
                onChange={handleInputChange('youtube')}
                placeholder="https://youtube.com/c/yourchannel"
                InputProps={{
                  startAdornment: <YouTubeIcon sx={{ mr: 1, color: '#ff0000' }} />,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="GitHub"
                value={formData.github}
                onChange={handleInputChange('github')}
                placeholder="https://github.com/yourusername"
                InputProps={{
                  startAdornment: <GitHubIcon sx={{ mr: 1, color: '#333' }} />,
                }}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box>
            <Card sx={{ 
              mb: 3,
              ...(selectedTemplate && {
                background: `linear-gradient(135deg, ${selectedTemplate.defaultColors?.primary}15, ${selectedTemplate.defaultColors?.secondary}15)`,
                border: `2px solid ${selectedTemplate.defaultColors?.primary}30`
              })
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{
                  color: selectedTemplate?.defaultColors?.primary || 'inherit'
                }}>
                  Profile Preview
                  {selectedTemplate && (
                    <Typography component="span" variant="caption" sx={{ ml: 2, opacity: 0.7 }}>
                      ({selectedTemplate.name} template)
                    </Typography>
                  )}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    width: 64, 
                    height: 64, 
                    mr: 2, 
                    bgcolor: selectedTemplate?.defaultColors?.primary || 'primary.main',
                    fontFamily: selectedTemplate?.defaultFonts?.body || 'inherit'
                  }}>
                    {formData.firstName.charAt(0) || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{
                      fontFamily: selectedTemplate?.defaultFonts?.heading || selectedTemplate?.defaultFonts?.body || 'inherit',
                      color: selectedTemplate?.defaultColors?.primary || 'inherit'
                    }}>
                      {formData.firstName || formData.lastName 
                        ? `${formData.firstName} ${formData.lastName}`.trim()
                        : 'Your Name'
                      }
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formData.title || 'Your Title'} • {formData.company || 'Your Company'}
                    </Typography>
                  </Box>
                </Box>
                {formData.bio && (
                  <Typography variant="body2" paragraph>
                    {formData.bio}
                  </Typography>
                )}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Contact Information
                </Typography>
                <Typography variant="body2">Email: {formData.email || 'Not provided'}</Typography>
                <Typography variant="body2">Phone: {formData.phone || 'Not provided'}</Typography>
                <Typography variant="body2">Website: {formData.website || 'Not provided'}</Typography>
                
                {(formData.city || formData.state || formData.country) && (
                  <>
                    <Typography variant="body2">
                      Address: {[formData.city, formData.state, formData.country]
                        .filter(Boolean)
                        .join(', ') || 'Not provided'}
                    </Typography>
                  </>
                )}

                {/* Social Links Preview */}
                {Object.values({
                  linkedin: formData.linkedin,
                  twitter: formData.twitter,
                  instagram: formData.instagram,
                  facebook: formData.facebook,
                  youtube: formData.youtube,
                  github: formData.github,
                }).some(link => link.trim() !== '') && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Social Links
                    </Typography>
                    {formData.linkedin && <Typography variant="body2">LinkedIn: {formData.linkedin}</Typography>}
                    {formData.twitter && <Typography variant="body2">Twitter: {formData.twitter}</Typography>}
                    {formData.instagram && <Typography variant="body2">Instagram: {formData.instagram}</Typography>}
                    {formData.facebook && <Typography variant="body2">Facebook: {formData.facebook}</Typography>}
                    {formData.youtube && <Typography variant="body2">YouTube: {formData.youtube}</Typography>}
                    {formData.github && <Typography variant="body2">GitHub: {formData.github}</Typography>}
                  </>
                )}
              </CardContent>
            </Card>
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublic}
                  onChange={handleSwitchChange('isPublic')}
                />
              }
              label="Make this profile public"
            />
            <Typography variant="caption" display="block" color="text.secondary">
              Public profiles can be accessed by anyone with the direct link
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate('/profiles')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Create New Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Set up your digital business card profile
          </Typography>
        </Box>
        {selectedTemplate && (
          <Card sx={{ 
            minWidth: 200, 
            background: `linear-gradient(135deg, ${selectedTemplate.defaultColors?.primary}, ${selectedTemplate.defaultColors?.secondary})`,
            color: 'white'
          }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Using Template
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedTemplate.name}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      <Paper sx={{ p: 4 }}>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <Box sx={{ mb: 4 }}>
          {renderStepContent(activeStep)}
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <>
                <Button
                  variant="outlined"
                  startIcon={<PreviewIcon />}
                  sx={{ mr: 2 }}
                >
                  Preview
                </Button>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Profile'}
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CreateProfilePage;