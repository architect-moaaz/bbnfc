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
  IconButton,
  Alert,
  Skeleton,
  Switch,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  Tooltip,
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Close as CloseIcon,
  Add as AddIcon,
  CloudUpload as UploadIcon,
  Smartphone as SmartphoneIcon,
  Laptop as LaptopIcon,
  Visibility as EyeIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { profilesAPI } from '../services/api';
import { Profile } from '../types';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import ImageUpload from '../components/ImageUpload';

interface ContactAction {
  id: string;
  type: 'phone' | 'email' | 'whatsapp';
  label: string;
  value: string;
  icon: string;
}

interface CustomLink {
  id: string;
  label: string;
  url: string;
  icon: string;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  bio: string;
  profilePhoto: string;
  coverImage: string;
  contactActions: ContactAction[];
  customLinks: CustomLink[];
  socialLinks: {
    linkedin: string;
    instagram: string;
    twitter: string;
    github: string;
  };
}

const EditProfilePageNew: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

  const { control, handleSubmit, reset, watch } = useForm<ProfileFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      title: '',
      company: '',
      bio: '',
      profilePhoto: '',
      coverImage: '',
      contactActions: [],
      customLinks: [],
      socialLinks: {
        linkedin: '',
        instagram: '',
        twitter: '',
        github: '',
      },
    },
  });

  const {
    fields: contactActionsFields,
    append: appendContactAction,
    remove: removeContactAction,
  } = useFieldArray({
    control,
    name: 'contactActions',
  });

  const {
    fields: customLinksFields,
    append: appendCustomLink,
    remove: removeCustomLink,
  } = useFieldArray({
    control,
    name: 'customLinks',
  });

  // Watch all form values for live preview
  const formValues = watch();

  // Fetch profile data
  const { data: profileResponse, isLoading, error } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => profilesAPI.getProfile(id!),
    enabled: !!id,
  });

  const profile = profileResponse?.data;

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

  // Initialize form
  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.personalInfo.firstName || '',
        lastName: profile.personalInfo.lastName || '',
        title: profile.personalInfo.title || '',
        company: profile.personalInfo.company || '',
        bio: profile.personalInfo.bio || '',
        profilePhoto: profile.personalInfo.profilePhoto || '',
        coverImage: profile.personalInfo.coverImage || '',
        contactActions: [
          {
            id: '1',
            type: 'phone',
            label: 'Mobile Call',
            value: profile.contactInfo?.phone || '',
            icon: 'phone',
          },
          {
            id: '2',
            type: 'email',
            label: 'Primary Email',
            value: profile.contactInfo?.email || '',
            icon: 'email',
          },
          {
            id: '3',
            type: 'whatsapp',
            label: 'Business WhatsApp',
            value: profile.contactInfo?.whatsapp || '',
            icon: 'whatsapp',
          },
        ],
        customLinks: [
          {
            id: '1',
            label: 'Visit Website',
            url: profile.contactInfo?.website || 'https://creative.co',
            icon: 'globe',
          },
          {
            id: '2',
            label: 'Company Portfolio',
            url: 'portfolio_2024.pdf',
            icon: 'file',
          },
        ],
        socialLinks: {
          linkedin: profile.socialLinks?.linkedin || '',
          instagram: profile.socialLinks?.instagram || '',
          twitter: profile.socialLinks?.twitter || '',
          github: profile.socialLinks?.github || '',
        },
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: ProfileFormData) => {
    const updatedProfile: Partial<Profile> = {
      personalInfo: {
        firstName: data.firstName,
        lastName: data.lastName,
        title: data.title,
        company: data.company,
        bio: data.bio,
        profilePhoto: data.profilePhoto,
        coverImage: data.coverImage,
      },
      contactInfo: {
        phone: data.contactActions.find((a) => a.type === 'phone')?.value || '',
        email: data.contactActions.find((a) => a.type === 'email')?.value || '',
        whatsapp: data.contactActions.find((a) => a.type === 'whatsapp')?.value || '',
        website: data.customLinks[0]?.url || '',
      },
      socialLinks: data.socialLinks,
    };

    updateProfileMutation.mutate(updatedProfile);
  };

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load profile. Please try again later.</Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" width="100%" height={600} />
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB' }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 2,
          px: 3,
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'primary.main',
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'primary.main',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                  }}
                >
                  B
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  BBTap
                </Typography>
              </Box>
              <Button
                variant="text"
                sx={{ color: 'text.secondary' }}
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </Button>
              <Button variant="text" sx={{ color: 'primary.main', fontWeight: 600 }}>
                Edit Profile
              </Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="text"
                startIcon={<EyeIcon />}
                onClick={() => navigate(`/profiles/${id}/preview`)}
                sx={{ color: 'text.secondary' }}
              >
                <Box
                  component="span"
                  sx={{ display: { xs: 'none', sm: 'inline' } }}
                >
                  Preview
                </Box>
              </Button>
              <Button variant="outlined" onClick={() => navigate('/profiles')}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit(onSubmit)}
                disabled={updateProfileMutation.isPending}
                sx={{
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Left Panel - Form */}
          <Grid item xs={12} lg={7}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Profile Identity */}
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
                    Profile Identity
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Update your photo and personal details.
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                        <Controller
                          name="profilePhoto"
                          control={control}
                          render={({ field }) => (
                            <Avatar
                              src={field.value}
                              sx={{ width: 80, height: 80, border: '2px solid #E5E7EB' }}
                            >
                              {formValues.firstName?.charAt(0) || 'U'}
                            </Avatar>
                          )}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Cover Image
                          </Typography>
                          <Controller
                            name="coverImage"
                            control={control}
                            render={({ field }) => (
                              <Box
                                sx={{
                                  width: '100%',
                                  height: 120,
                                  border: '2px dashed',
                                  borderColor: 'divider',
                                  borderRadius: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: '#F9FAFB',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'primary.50',
                                  },
                                }}
                              >
                                <Box sx={{ textAlign: 'center' }}>
                                  <UploadIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                                  <Typography variant="body2" color="text.secondary">
                                    Click to upload cover (1200x400)
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                          />
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Controller
                        name="firstName"
                        control={control}
                        render={({ field }) => (
                          <TextField {...field} label="Full Name" fullWidth required />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                          <TextField {...field} label="Job Title" fullWidth />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="company"
                        control={control}
                        render={({ field }) => (
                          <TextField {...field} label="Company" fullWidth />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Controller
                        name="bio"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Bio"
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Tell people about yourself..."
                            helperText={`${field.value?.length || 0}/200 characters`}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Contact Actions */}
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Contact Actions
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Manage the quick-action buttons on your profile.
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() =>
                        appendContactAction({
                          id: Date.now().toString(),
                          type: 'phone',
                          label: 'New Contact',
                          value: '',
                          icon: 'phone',
                        })
                      }
                      sx={{ color: 'primary.main' }}
                    >
                      Add
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {contactActionsFields.map((field, index) => (
                      <Box
                        key={field.id}
                        sx={{
                          display: 'flex',
                          gap: 2,
                          alignItems: 'center',
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          bgcolor: 'background.paper',
                        }}
                      >
                        <DragIcon sx={{ color: 'text.disabled', cursor: 'move' }} />
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1,
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}
                        >
                          {field.type === 'phone' && <PhoneIcon />}
                          {field.type === 'email' && <EmailIcon />}
                          {field.type === 'whatsapp' && <WhatsAppIcon />}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Controller
                            name={`contactActions.${index}.value`}
                            control={control}
                            render={({ field: valueField }) => (
                              <TextField
                                {...valueField}
                                size="small"
                                fullWidth
                                placeholder={
                                  field.type === 'phone'
                                    ? '+1 (555) 123-4567'
                                    : field.type === 'email'
                                    ? 'email@example.com'
                                    : '+1 (555) 123-4567'
                                }
                                label={field.label}
                              />
                            )}
                          />
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => removeContactAction(index)}
                          sx={{ color: 'text.secondary' }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>

              {/* Custom Links & Files */}
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Custom Links & Files
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Add websites, PDFs, or calendars.
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() =>
                        appendCustomLink({
                          id: Date.now().toString(),
                          label: 'New Link',
                          url: '',
                          icon: 'globe',
                        })
                      }
                      sx={{ color: 'primary.main' }}
                    >
                      Add New Link or File
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {customLinksFields.map((field, index) => (
                      <Box
                        key={field.id}
                        sx={{
                          display: 'flex',
                          gap: 2,
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Controller
                                name={`customLinks.${index}.label`}
                                control={control}
                                render={({ field: labelField }) => (
                                  <TextField
                                    {...labelField}
                                    size="small"
                                    fullWidth
                                    label="LABEL"
                                    placeholder="e.g., Visit Website"
                                  />
                                )}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Controller
                                name={`customLinks.${index}.url`}
                                control={control}
                                render={({ field: urlField }) => (
                                  <TextField
                                    {...urlField}
                                    size="small"
                                    fullWidth
                                    label="URL / FILE"
                                    placeholder="https:// or file name"
                                  />
                                )}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => removeCustomLink(index)}
                          sx={{ color: 'text.secondary' }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>

          {/* Right Panel - Live Preview */}
          <Grid item xs={12} lg={5}>
            <Box sx={{ position: 'sticky', top: 24 }}>
              <Box sx={{ mb: 2, textAlign: 'center' }}>
                <Typography
                  variant="overline"
                  sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, display: 'block' }}
                >
                  LIVE PREVIEW
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                  <IconButton
                    size="small"
                    onClick={() => setPreviewDevice('mobile')}
                    sx={{
                      bgcolor: previewDevice === 'mobile' ? 'primary.main' : 'transparent',
                      color: previewDevice === 'mobile' ? 'white' : 'text.secondary',
                      '&:hover': {
                        bgcolor: previewDevice === 'mobile' ? 'primary.dark' : 'action.hover',
                      },
                    }}
                  >
                    <SmartphoneIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setPreviewDevice('desktop')}
                    sx={{
                      bgcolor: previewDevice === 'desktop' ? 'primary.main' : 'transparent',
                      color: previewDevice === 'desktop' ? 'white' : 'text.secondary',
                      '&:hover': {
                        bgcolor: previewDevice === 'desktop' ? 'primary.dark' : 'action.hover',
                      },
                    }}
                  >
                    <LaptopIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Mobile Preview */}
              <Box
                sx={{
                  maxWidth: previewDevice === 'mobile' ? 375 : '100%',
                  mx: 'auto',
                  bgcolor: '#1F2937',
                  borderRadius: 4,
                  p: 2,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }}
              >
                {/* Phone Frame */}
                <Box
                  sx={{
                    bgcolor: 'white',
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '8px solid #1F2937',
                    position: 'relative',
                  }}
                >
                  {/* Notch */}
                  {previewDevice === 'mobile' && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 150,
                        height: 30,
                        bgcolor: '#1F2937',
                        borderBottomLeftRadius: 16,
                        borderBottomRightRadius: 16,
                        zIndex: 10,
                      }}
                    />
                  )}

                  {/* Profile Content */}
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    {/* Cover/Header */}
                    <Box
                      sx={{
                        height: 160,
                        bgcolor: 'primary.main',
                        backgroundImage: formValues.coverImage
                          ? `url(${formValues.coverImage})`
                          : 'linear-gradient(135deg, #007BFF 0%, #0056B3 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: -40,
                          left: '50%',
                          transform: 'translateX(-50%)',
                        }}
                      >
                        <Avatar
                          src={formValues.profilePhoto}
                          sx={{
                            width: 80,
                            height: 80,
                            border: '4px solid white',
                            boxShadow: 2,
                          }}
                        >
                          {formValues.firstName?.charAt(0) || 'U'}
                        </Avatar>
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 4,
                            right: 4,
                            width: 12,
                            height: 12,
                            bgcolor: 'success.main',
                            borderRadius: '50%',
                            border: '2px solid white',
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Profile Info */}
                    <Box sx={{ pt: 6, px: 3, pb: 3, textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {formValues.firstName} {formValues.lastName}
                      </Typography>
                      <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
                        {formValues.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                        <Box
                          component="span"
                          sx={{
                            fontSize: 14,
                            color: 'text.secondary',
                          }}
                        >
                          🏢
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {formValues.company || 'Company Name'}
                        </Typography>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, lineHeight: 1.6 }}>
                        {formValues.bio || 'Add your bio to describe yourself...'}
                      </Typography>

                      {/* Contact Actions */}
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 2,
                          justifyContent: 'center',
                          mt: 3,
                        }}
                      >
                        {contactActionsFields.slice(0, 4).map((action) => (
                          <Box
                            key={action.id}
                            sx={{
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'transform 0.2s',
                              '&:hover': { transform: 'translateY(-2px)' },
                            }}
                          >
                            <Box
                              sx={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                bgcolor:
                                  action.type === 'phone'
                                    ? '#007BFF'
                                    : action.type === 'email'
                                    ? '#0284C7'
                                    : '#10B981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                boxShadow: 1,
                              }}
                            >
                              {action.type === 'phone' && <PhoneIcon sx={{ fontSize: 20 }} />}
                              {action.type === 'email' && <EmailIcon sx={{ fontSize: 20 }} />}
                              {action.type === 'whatsapp' && <WhatsAppIcon sx={{ fontSize: 20 }} />}
                            </Box>
                            <Typography variant="caption" sx={{ mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                              {action.type === 'phone'
                                ? 'Call'
                                : action.type === 'email'
                                ? 'Email'
                                : 'Chat'}
                            </Typography>
                          </Box>
                        ))}
                        <Box
                          sx={{
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-2px)' },
                          }}
                        >
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: '50%',
                              bgcolor: '#F97316',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              boxShadow: 1,
                            }}
                          >
                            📍
                          </Box>
                          <Typography variant="caption" sx={{ mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                            Map
                          </Typography>
                        </Box>
                      </Box>

                      {/* Save Contact Button */}
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={<AddIcon />}
                        sx={{
                          mt: 3,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          py: 1.5,
                          boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
                        }}
                      >
                        Save Contact
                      </Button>

                      {/* Custom Links */}
                      {customLinksFields.length > 0 && (
                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {customLinksFields.slice(0, 3).map((link) => (
                            <Box
                              key={link.id}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  borderColor: 'primary.main',
                                  bgcolor: 'primary.50',
                                },
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box
                                  sx={{
                                    fontSize: 20,
                                    color: 'primary.main',
                                  }}
                                >
                                  {link.icon === 'globe' ? '🌐' : '📄'}
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {link.label}
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                →
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}

                      {/* Social Links */}
                      <Divider sx={{ my: 3 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          CONNECT
                        </Typography>
                      </Divider>
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        {formValues.socialLinks.linkedin && (
                          <IconButton size="small" sx={{ color: '#0077B5' }}>
                            in
                          </IconButton>
                        )}
                        {formValues.socialLinks.instagram && (
                          <IconButton size="small" sx={{ color: '#E4405F' }}>
                            ig
                          </IconButton>
                        )}
                        {formValues.socialLinks.twitter && (
                          <IconButton size="small" sx={{ color: '#1DA1F2' }}>
                            tw
                          </IconButton>
                        )}
                        {formValues.socialLinks.github && (
                          <IconButton size="small" sx={{ color: '#333' }}>
                            gh
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default EditProfilePageNew;
