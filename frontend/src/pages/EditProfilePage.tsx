import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Avatar,
  Chip,
  IconButton,
  Alert,
  Skeleton,
  Switch,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { profilesAPI, templatesAPI } from '../services/api';
import { Profile, Template } from '../types';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import ImageUpload from '../components/ImageUpload';
import { DAYS_ORDER, DAYS_DISPLAY } from '../utils/businessHours';

// Helper function to validate business hours
const validateBusinessHours = (openTime: string, closeTime: string): boolean => {
  if (!openTime || !closeTime) return true; // Allow empty times
  
  const open = new Date(`2000-01-01T${openTime}:00`);
  const close = new Date(`2000-01-01T${closeTime}:00`);
  
  return close > open;
};

interface ProfileFormData {
  personalInfo: {
    firstName: string;
    lastName: string;
    title: string;
    company: string;
    bio: string;
    profilePhoto: string;
  };
  contactInfo: {
    phone: string;
    email: string;
    website: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };
  socialLinks: {
    linkedin: string;
    twitter: string;
    facebook: string;
    instagram: string;
    youtube: string;
    github: string;
    tiktok: string;
  };
  customization: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  sections: {
    showContact: boolean;
    showSocial: boolean;
    showHours: boolean;
    showGallery: boolean;
    showServices: boolean;
    showTestimonials: boolean;
  };
  businessHours: Array<{
    day: string;
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  }>;
  template: string;
}

const EditProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset, watch, setValue } = useForm<ProfileFormData>();
  const { fields: businessHoursFields, update: updateBusinessHour } = useFieldArray({
    control,
    name: 'businessHours'
  });
  const [customSocialLinks, setCustomSocialLinks] = useState<Array<{ platform: string; url: string; icon: string }>>([]);
  const [businessHoursErrors, setBusinessHoursErrors] = useState<{ [key: number]: string }>({});

  // Fetch profile data
  const { data: profileResponse, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => profilesAPI.getProfile(id!),
    enabled: !!id,
  });

  // Fetch templates
  const { data: templatesResponse } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesAPI.getTemplates(),
  });

  const profile = profileResponse?.data;
  const templates = (templatesResponse?.data as Template[]) || [];

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<Profile>) => profilesAPI.updateProfile(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', id] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      enqueueSnackbar('Profile updated successfully!', { variant: 'success' });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to update profile';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      console.log('EditProfilePage: Profile loaded:', profile.personalInfo);
      console.log('EditProfilePage: Profile photo:', profile.personalInfo.profilePhoto);
      
      // Create default business hours for form if they don't exist
      const defaultBusinessHours = DAYS_ORDER.map(day => ({
        day,
        isOpen: day !== 'saturday' && day !== 'sunday', // Default: weekdays open, weekends closed
        openTime: '09:00',
        closeTime: '17:00'
      }));
      
      reset({
        personalInfo: {
          firstName: profile.personalInfo.firstName || '',
          lastName: profile.personalInfo.lastName || '',
          title: profile.personalInfo.title || '',
          company: profile.personalInfo.company || '',
          bio: profile.personalInfo.bio || '',
          profilePhoto: profile.personalInfo.profilePhoto || '',
        },
        contactInfo: {
          phone: profile.contactInfo?.phone || '',
          email: profile.contactInfo?.email || '',
          website: profile.contactInfo?.website || '',
          address: {
            street: profile.contactInfo?.address?.street || '',
            city: profile.contactInfo?.address?.city || '',
            state: profile.contactInfo?.address?.state || '',
            country: profile.contactInfo?.address?.country || '',
            postalCode: profile.contactInfo?.address?.postalCode || '',
          },
        },
        socialLinks: {
          linkedin: profile.socialLinks?.linkedin || '',
          twitter: profile.socialLinks?.twitter || '',
          facebook: profile.socialLinks?.facebook || '',
          instagram: profile.socialLinks?.instagram || '',
          youtube: profile.socialLinks?.youtube || '',
          github: profile.socialLinks?.github || '',
          tiktok: profile.socialLinks?.tiktok || '',
        },
        customization: {
          primaryColor: profile.customization?.primaryColor || '#0066cc',
          secondaryColor: profile.customization?.secondaryColor || '#f0f0f0',
          fontFamily: profile.customization?.fontFamily || 'Inter',
        },
        sections: {
          showContact: profile.sections?.showContact ?? true,
          showSocial: profile.sections?.showSocial ?? true,
          showHours: profile.sections?.showHours ?? true,
          showGallery: profile.sections?.showGallery ?? false,
          showServices: profile.sections?.showServices ?? false,
          showTestimonials: profile.sections?.showTestimonials ?? false,
        },
        businessHours: profile.businessHours || defaultBusinessHours,
        template: typeof profile.template === 'string' ? profile.template : profile.template?.id || '',
      });

      setCustomSocialLinks(profile.socialLinks?.custom || []);
    }
  }, [profile, reset]);

  const onSubmit = (data: ProfileFormData) => {
    // Validate all business hours before submitting
    let hasValidationErrors = false;
    const newErrors: { [key: number]: string } = {};
    
    data.businessHours.forEach((hour, index) => {
      if (hour.isOpen && hour.openTime && hour.closeTime) {
        if (!validateBusinessHours(hour.openTime, hour.closeTime)) {
          newErrors[index] = 'Close time must be after open time';
          hasValidationErrors = true;
        }
      }
    });
    
    if (hasValidationErrors) {
      setBusinessHoursErrors(newErrors);
      enqueueSnackbar('Please fix business hours validation errors before saving', { variant: 'error' });
      return;
    }

    const updatedProfile: Partial<Profile> = {
      ...data,
      socialLinks: {
        ...data.socialLinks,
        custom: customSocialLinks,
      },
    };

    updateProfileMutation.mutate(updatedProfile);
  };

  const addCustomSocialLink = () => {
    setCustomSocialLinks([...customSocialLinks, { platform: '', url: '', icon: '' }]);
  };

  const removeCustomSocialLink = (index: number) => {
    setCustomSocialLinks(customSocialLinks.filter((_, i) => i !== index));
  };

  const updateCustomSocialLink = (index: number, field: string, value: string) => {
    const updated = customSocialLinks.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    );
    setCustomSocialLinks(updated);
  };

  const handlePreview = () => {
    navigate(`/profiles/${id}/preview`);
  };

  if (profileError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load profile. Please try again later.
        </Alert>
      </Container>
    );
  }

  if (profileLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" width="100%" height={600} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/profiles')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Edit Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Update your digital business card information
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<PreviewIcon />}
          onClick={handlePreview}
          sx={{ mr: 2 }}
        >
          Preview
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSubmit(onSubmit)}
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={4}>
          {/* Personal Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Personal Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sx={{ textAlign: 'center', mb: 2 }}>
                    <Controller
                      name="personalInfo.profilePhoto"
                      control={control}
                      render={({ field }) => {
                        console.log('EditProfilePage Controller: field.value:', field.value);
                        return (
                          <ImageUpload
                            currentImage={field.value}
                            onImageChange={field.onChange}
                            uploadType="profile"
                            label="Profile Photo"
                            size={120}
                            rounded
                          />
                        );
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="personalInfo.firstName"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="First Name"
                          fullWidth
                          required
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="personalInfo.lastName"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Last Name"
                          fullWidth
                          required
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="personalInfo.title"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Job Title"
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="personalInfo.company"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Company"
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="personalInfo.bio"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Bio"
                          fullWidth
                          multiline
                          rows={3}
                          placeholder="Tell people about yourself..."
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Contact Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Controller
                      name="contactInfo.email"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Email"
                          type="email"
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="contactInfo.phone"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Phone"
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="contactInfo.website"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Website"
                          fullWidth
                          placeholder="https://example.com"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="contactInfo.address.street"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Street Address"
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="contactInfo.address.city"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="City"
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="contactInfo.address.state"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="State/Province"
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Social Links */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Social Media Links
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="socialLinks.linkedin"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="LinkedIn"
                          fullWidth
                          placeholder="https://linkedin.com/in/username"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="socialLinks.twitter"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Twitter"
                          fullWidth
                          placeholder="https://twitter.com/username"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="socialLinks.facebook"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Facebook"
                          fullWidth
                          placeholder="https://facebook.com/username"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="socialLinks.instagram"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Instagram"
                          fullWidth
                          placeholder="https://instagram.com/username"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="socialLinks.github"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="GitHub"
                          fullWidth
                          placeholder="https://github.com/username"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="socialLinks.youtube"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="YouTube"
                          fullWidth
                          placeholder="https://youtube.com/channel/..."
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Section Visibility */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Section Visibility
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="sections.showContact"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch {...field} checked={field.value} />}
                          label="Show Contact Information"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="sections.showSocial"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch {...field} checked={field.value} />}
                          label="Show Social Media Links"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="sections.showHours"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch {...field} checked={field.value} />}
                          label="Show Business Hours"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Business Hours Management */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Business Hours
                </Typography>
                
                {businessHoursFields.map((field, index) => (
                  <Grid container spacing={2} key={field.id} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={3}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          height: '56px'
                        }}
                      >
                        {DAYS_DISPLAY[DAYS_ORDER.indexOf(field.day)]}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={2}>
                      <Controller
                        name={`businessHours.${index}.isOpen`}
                        control={control}
                        render={({ field: isOpenField }) => (
                          <FormControlLabel
                            control={
                              <Switch 
                                {...isOpenField} 
                                checked={isOpenField.value}
                                onChange={(e) => {
                                  isOpenField.onChange(e.target.checked);
                                  // Update the field in the array
                                  const currentHour = businessHoursFields[index];
                                  updateBusinessHour(index, {
                                    ...currentHour,
                                    isOpen: e.target.checked
                                  });
                                }}
                              />
                            }
                            label="Open"
                          />
                        )}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={3}>
                      <Controller
                        name={`businessHours.${index}.openTime`}
                        control={control}
                        render={({ field: openTimeField }) => (
                          <TextField
                            {...openTimeField}
                            type="time"
                            label="Open Time"
                            size="small"
                            fullWidth
                            disabled={!watch(`businessHours.${index}.isOpen`)}
                            error={!!businessHoursErrors[index]}
                            onChange={(e) => {
                              openTimeField.onChange(e.target.value);
                              const currentHour = businessHoursFields[index];
                              const newOpenTime = e.target.value;
                              const closeTime = watch(`businessHours.${index}.closeTime`);
                              
                              // Validate time range
                              if (newOpenTime && closeTime && !validateBusinessHours(newOpenTime, closeTime)) {
                                setBusinessHoursErrors(prev => ({
                                  ...prev,
                                  [index]: 'Open time must be before close time'
                                }));
                              } else {
                                setBusinessHoursErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors[index];
                                  return newErrors;
                                });
                              }
                              
                              updateBusinessHour(index, {
                                ...currentHour,
                                openTime: newOpenTime
                              });
                            }}
                            InputLabelProps={{
                              shrink: true,
                            }}
                          />
                        )}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={3}>
                      <Controller
                        name={`businessHours.${index}.closeTime`}
                        control={control}
                        render={({ field: closeTimeField }) => (
                          <TextField
                            {...closeTimeField}
                            type="time"
                            label="Close Time"
                            size="small"
                            fullWidth
                            disabled={!watch(`businessHours.${index}.isOpen`)}
                            error={!!businessHoursErrors[index]}
                            onChange={(e) => {
                              closeTimeField.onChange(e.target.value);
                              const currentHour = businessHoursFields[index];
                              const newCloseTime = e.target.value;
                              const openTime = watch(`businessHours.${index}.openTime`);
                              
                              // Validate time range
                              if (openTime && newCloseTime && !validateBusinessHours(openTime, newCloseTime)) {
                                setBusinessHoursErrors(prev => ({
                                  ...prev,
                                  [index]: 'Close time must be after open time'
                                }));
                              } else {
                                setBusinessHoursErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors[index];
                                  return newErrors;
                                });
                              }
                              
                              updateBusinessHour(index, {
                                ...currentHour,
                                closeTime: newCloseTime
                              });
                            }}
                            InputLabelProps={{
                              shrink: true,
                            }}
                          />
                        )}
                      />
                    </Grid>
                    
                    {/* Error message for this day */}
                    {businessHoursErrors[index] && (
                      <Grid item xs={12}>
                        <Typography 
                          variant="caption" 
                          color="error" 
                          sx={{ display: 'block', mt: 0.5, ml: 1 }}
                        >
                          {businessHoursErrors[index]}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                ))}
                
                <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      // Set all days to weekday hours (9 AM - 5 PM, closed weekends)
                      DAYS_ORDER.forEach((day, index) => {
                        const isWeekday = day !== 'saturday' && day !== 'sunday';
                        updateBusinessHour(index, {
                          day,
                          isOpen: isWeekday,
                          openTime: '09:00',
                          closeTime: '17:00'
                        });
                      });
                    }}
                  >
                    Set Weekday Hours (9-5)
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      // Set all days to open
                      DAYS_ORDER.forEach((day, index) => {
                        updateBusinessHour(index, {
                          day,
                          isOpen: true,
                          openTime: '08:00',
                          closeTime: '18:00'
                        });
                      });
                    }}
                  >
                    Set All Days (8-6)
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    color="secondary"
                    onClick={() => {
                      // Close all days
                      DAYS_ORDER.forEach((day, index) => {
                        updateBusinessHour(index, {
                          day,
                          isOpen: false,
                          openTime: '09:00',
                          closeTime: '17:00'
                        });
                      });
                    }}
                  >
                    Close All Days
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Customization */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Customization
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Controller
                      name="customization.primaryColor"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Primary Color"
                          type="color"
                          fullWidth
                          InputProps={{
                            startAdornment: (
                              <Box
                                sx={{
                                  width: 24,
                                  height: 24,
                                  backgroundColor: field.value,
                                  borderRadius: 1,
                                  mr: 1,
                                  border: '1px solid #ccc',
                                }}
                              />
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="customization.secondaryColor"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Secondary Color"
                          type="color"
                          fullWidth
                          InputProps={{
                            startAdornment: (
                              <Box
                                sx={{
                                  width: 24,
                                  height: 24,
                                  backgroundColor: field.value,
                                  borderRadius: 1,
                                  mr: 1,
                                  border: '1px solid #ccc',
                                }}
                              />
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export default EditProfilePage;