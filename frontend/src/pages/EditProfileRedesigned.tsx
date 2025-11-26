import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Paper,
  Divider,
  Tooltip,
  MenuItem,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  DragIndicator as DragIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Language as WebsiteIcon,
  Description as FileIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { profilesAPI, uploadAPI, templatesAPI } from '../services/api';
import { Profile, Template } from '../types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Contact Action Item
interface SortableItemProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  type: string;
  onDelete: () => void;
  onLabelChange: (newLabel: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, icon, label, type, onDelete, onLabelChange }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        mb: 1.5,
        backgroundColor: '#FFFFFF',
        border: '1.5px solid #E5E7EB',
        borderRadius: '12px',
        '&:hover': {
          borderColor: '#D1D5DB',
        },
      }}
    >
      <Box {...listeners} {...attributes} sx={{ cursor: 'grab', color: '#9CA3AF' }}>
        <DragIcon />
      </Box>
      <Box sx={{ color: '#2D6EF5' }}>{icon}</Box>
      <Box sx={{ flex: 1 }}>
        <TextField
          fullWidth
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder={`Enter ${type.toLowerCase()}`}
          variant="standard"
          size="small"
          sx={{
            '& .MuiInput-root': {
              fontSize: '0.875rem',
              fontWeight: 500,
            },
          }}
        />
        <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
          {type}
        </Typography>
      </Box>
      <IconButton onClick={onDelete} size="small" sx={{ color: '#9CA3AF' }}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

// Mobile Preview Component
interface MobilePreviewProps {
  profile: Partial<Profile>;
  orientation?: 'portrait' | 'landscape';
}

const MobilePreview: React.FC<MobilePreviewProps> = ({ profile, orientation = 'portrait' }) => {
  const fullName = `${profile.personalInfo?.firstName || ''} ${profile.personalInfo?.lastName || ''}`.trim();
  const isLandscape = orientation === 'landscape';

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: isLandscape ? 812 : 375,
        mx: 'auto',
        aspectRatio: isLandscape ? '812 / 375' : '375 / 812',
        backgroundColor: '#1A1A1A',
        borderRadius: '32px',
        padding: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        transition: 'all 0.3s ease-in-out',
      }}
    >
      {/* Phone Notch */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '40%',
          height: '30px',
          backgroundColor: '#1A1A1A',
          borderRadius: '0 0 20px 20px',
          zIndex: 2,
        }}
      />

      {/* Phone Screen */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Profile Content */}
        <Box sx={{ height: '100%', overflowY: 'auto' }}>
          {/* Header with gradient */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #2D6EF5 0%, #4A8DF8 100%)',
              height: 120,
              position: 'relative',
            }}
          />

          {/* Profile Content */}
          <Box sx={{ px: 2.5, pb: 3 }}>
            {/* Avatar */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: -6, mb: 1.5 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={profile.personalInfo?.profilePhoto}
                  alt={fullName}
                  sx={{
                    width: 100,
                    height: 100,
                    border: '3px solid #FFFFFF',
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                    fontSize: '2rem',
                  }}
                >
                  {profile.personalInfo?.firstName?.charAt(0) || 'U'}
                </Avatar>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 6,
                    right: 6,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    border: '2px solid #FFFFFF',
                  }}
                />
              </Box>
            </Box>

            {/* Name and Title */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#1A1A1A',
                  mb: 0.25,
                  fontSize: '1.125rem',
                }}
              >
                {fullName || 'Your Name'}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#2D6EF5',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  mb: 0.25,
                }}
              >
                {profile.personalInfo?.title || 'Your Title'}
              </Typography>
              {profile.personalInfo?.company && (
                <Typography
                  variant="caption"
                  sx={{
                    color: '#6B7280',
                    fontSize: '0.75rem',
                  }}
                >
                  {profile.personalInfo.company}
                </Typography>
              )}
            </Box>

            {/* Bio */}
            {profile.personalInfo?.bio && (
              <Typography
                variant="body2"
                sx={{
                  color: '#4B5563',
                  textAlign: 'center',
                  mb: 2,
                  lineHeight: 1.4,
                  fontSize: '0.75rem',
                }}
              >
                {profile.personalInfo.bio}
              </Typography>
            )}

            {/* Quick Actions */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 1.5,
                mb: 2,
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    backgroundColor: '#EBF3FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PhoneIcon sx={{ fontSize: 20, color: '#2D6EF5' }} />
                </Box>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#6B7280', mt: 0.5, display: 'block' }}>
                  Call
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    backgroundColor: '#EBF3FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <EmailIcon sx={{ fontSize: 20, color: '#2D6EF5' }} />
                </Box>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#6B7280', mt: 0.5, display: 'block' }}>
                  Email
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    backgroundColor: '#E8F8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <WhatsAppIcon sx={{ fontSize: 20, color: '#25D366' }} />
                </Box>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#6B7280', mt: 0.5, display: 'block' }}>
                  Chat
                </Typography>
              </Box>
            </Box>

            {/* Save Contact Button */}
            <Button
              fullWidth
              variant="contained"
              size="small"
              sx={{
                mb: 1,
                height: 40,
                fontSize: '0.8125rem',
                fontWeight: 600,
                borderRadius: '10px',
                textTransform: 'none',
                backgroundColor: '#2D6EF5',
                boxShadow: '0px 2px 8px rgba(45, 110, 245, 0.3)',
              }}
            >
              Save Contact
            </Button>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.25,
                  borderRadius: '10px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  fontSize: '0.75rem',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WebsiteIcon sx={{ fontSize: 16, color: '#2D6EF5' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                    Visit Website
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                  →
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.25,
                  borderRadius: '10px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  fontSize: '0.75rem',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FileIcon sx={{ fontSize: 16, color: '#2D6EF5' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                    Company Portfolio
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                  →
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const EditProfileRedesigned: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [previewOrientation, setPreviewOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const coverImageInputRef = React.useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Partial<Profile>>({
    personalInfo: {
      firstName: '',
      lastName: '',
      title: '',
      company: '',
      bio: '',
      profilePhoto: '',
    },
    contactInfo: {
      phone: '',
      email: '',
      website: '',
    },
    socialLinks: {
      custom: [],
    },
    customization: {
      backgroundImage: '',
    },
  });

  const [contactActions, setContactActions] = useState([
    { id: '1', icon: <PhoneIcon />, label: '', type: 'Mobile Call' },
    { id: '2', icon: <EmailIcon />, label: '', type: 'Primary Email' },
  ]);

  const [customLinks, setCustomLinks] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templates, setTemplates] = useState<Template[]>([]);

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await templatesAPI.getTemplates();
        if (response.success && response.data) {
          setTemplates(response.data);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    };
    loadTemplates();
  }, []);

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await profilesAPI.getProfile(id);

        if (response.success && response.data) {
          setProfile(response.data);

          // Set template if exists
          if (response.data.template) {
            setSelectedTemplate(typeof response.data.template === 'string' ? response.data.template : response.data.template._id);
          }

          // Set up contact actions from profile data
          const actions = [];
          if (response.data.contactInfo?.phone) {
            actions.push({
              id: '1',
              icon: <PhoneIcon />,
              label: response.data.contactInfo.phone,
              type: 'Mobile Call'
            });
          }
          if (response.data.contactInfo?.email) {
            actions.push({
              id: '2',
              icon: <EmailIcon />,
              label: response.data.contactInfo.email,
              type: 'Primary Email'
            });
          }
          if (response.data.contactInfo?.website) {
            actions.push({
              id: '3',
              icon: <WebsiteIcon />,
              label: response.data.contactInfo.website,
              type: 'Website'
            });
          }
          setContactActions(actions.length > 0 ? actions : contactActions);

          // Set up custom links
          if (response.data.socialLinks?.custom) {
            setCustomLinks(response.data.socialLinks.custom);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        alert('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setContactActions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Extract contact information from contact actions
      const phoneAction = contactActions.find((a) => a.type.includes('Call'));
      const emailAction = contactActions.find((a) => a.type.includes('Email'));
      const websiteAction = contactActions.find((a) => a.type.includes('Website'));

      const profileData = {
        personalInfo: {
          firstName: profile.personalInfo?.firstName || '',
          lastName: profile.personalInfo?.lastName || '',
          title: profile.personalInfo?.title || '',
          company: profile.personalInfo?.company || '',
          bio: profile.personalInfo?.bio || '',
          profilePhoto: profile.personalInfo?.profilePhoto || '',
        },
        contactInfo: {
          phone: phoneAction?.label || '',
          email: emailAction?.label || '',
          website: websiteAction?.label || '',
        },
        socialLinks: {
          custom: customLinks,
        },
        customization: {
          ...profile.customization,
          backgroundImage: profile.customization?.backgroundImage || '',
        },
        template: selectedTemplate || undefined,
      };

      console.log('Updating profile with data:', profileData);

      const response = await profilesAPI.updateProfile(id, profileData);

      if (response.success) {
        alert('Profile updated successfully!');
        // Navigate to the public profile view
        if (response.data?.slug) {
          navigate(`/p/${response.data.slug}`);
        } else {
          navigate('/profiles');
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addContactAction = () => {
    const newId = String(Date.now());
    setContactActions([
      ...contactActions,
      { id: newId, icon: <PhoneIcon />, label: '', type: 'Contact' },
    ]);
  };

  const addCustomLink = () => {
    setCustomLinks([
      ...customLinks,
      { id: String(Date.now()), label: 'New Link', url: '', icon: 'globe', type: 'url' },
    ]);
  };

  const handleFileUpload = async (linkId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploadingFile(linkId);

    try {
      const response = await uploadAPI.uploadFile(file);

      if (response.success && response.data) {
        setCustomLinks(
          customLinks.map((link) =>
            link.id === linkId
              ? {
                  ...link,
                  file: response.data.fileUrl,
                  fileName: response.data.fileName,
                  fileType: response.data.fileType,
                  fileSize: response.data.fileSize,
                  type: 'file',
                  icon: 'file',
                  label: link.label || response.data.fileName,
                }
              : link
          )
        );
        alert('File uploaded successfully!');
      } else {
        alert('Failed to upload file');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(null);
    }
  };

  const handleLinkUpdate = (linkId: string, field: string, value: string) => {
    setCustomLinks(
      customLinks.map((link) =>
        link.id === linkId ? { ...link, [field]: value } : link
      )
    );
  };

  const handleDeleteLink = (linkId: string) => {
    setCustomLinks(customLinks.filter((link) => link.id !== linkId));
  };

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPEG, PNG, GIF, and WebP images are allowed');
      return;
    }

    setUploadingCover(true);

    try {
      const response = await uploadAPI.uploadCompanyLogo(file);

      if (response.success && response.data) {
        const imageUrl = response.data.imageUrl;
        setProfile({
          ...profile,
          customization: {
            ...profile.customization,
            backgroundImage: imageUrl,
          },
        });
        alert('Cover image uploaded successfully!');
      } else {
        alert('Failed to upload cover image');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload cover image. Please try again.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleCoverImageClick = () => {
    coverImageInputRef.current?.click();
  };

  const handleRemoveCoverImage = () => {
    setProfile({
      ...profile,
      customization: {
        ...profile.customization,
        backgroundImage: '',
      },
    });
  };

  return (
    <Box sx={{ backgroundColor: '#F8FAFC', minHeight: '100vh', p: 4 }}>
      <Container maxWidth="xl">
        {/* Page Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: '#1E293B' }}>
              Edit Profile
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Update your information and customize your digital business card
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/profiles')}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: '#2563EB',
                '&:hover': {
                  backgroundColor: '#1E40AF',
                },
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>

        {/* Main Content - Split Screen */}
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Left Column - Form */}
          <Box sx={{ flex: 1, maxWidth: 700 }}>
            {/* Profile Identity Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '16px' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                Profile Identity
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Update your photo and personal details.
              </Typography>

              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Avatar
                  src={profile.personalInfo?.profilePhoto}
                  sx={{ width: 80, height: 80 }}
                >
                  {profile.personalInfo?.firstName?.charAt(0) || 'U'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Cover Image
                  </Typography>
                  <Box
                    onClick={handleCoverImageClick}
                    sx={{
                      border: '2px dashed #D1D5DB',
                      borderRadius: '12px',
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      backgroundImage: profile.customization?.backgroundImage
                        ? `url(${profile.customization.backgroundImage})`
                        : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      minHeight: 120,
                      '&:hover': {
                        borderColor: '#2D6EF5',
                        backgroundColor: '#F9FAFB',
                      },
                    }}
                  >
                    {uploadingCover ? (
                      <Typography variant="body2" color="text.secondary">
                        Uploading...
                      </Typography>
                    ) : profile.customization?.backgroundImage ? (
                      <>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCoverImage();
                          }}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'error.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'error.dark' },
                          }}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'white',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            px: 2,
                            py: 1,
                            borderRadius: 1,
                            display: 'inline-block',
                          }}
                        >
                          Click to change cover image
                        </Typography>
                      </>
                    ) : (
                      <>
                        <UploadIcon sx={{ fontSize: 32, color: '#9CA3AF', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                          Click to upload cover (1200×400)
                        </Typography>
                      </>
                    )}
                  </Box>
                  <input
                    ref={coverImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageUpload}
                    style={{ display: 'none' }}
                    disabled={uploadingCover}
                  />
                </Box>
              </Box>

              <TextField
                fullWidth
                label="Full Name"
                value={`${profile.personalInfo?.firstName || ''} ${profile.personalInfo?.lastName || ''}`}
                onChange={(e) => {
                  const names = e.target.value.split(' ');
                  setProfile({
                    ...profile,
                    personalInfo: {
                      ...profile.personalInfo,
                      firstName: names[0] || '',
                      lastName: names.slice(1).join(' ') || '',
                    },
                  });
                }}
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Job Title"
                  value={profile.personalInfo?.title || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      personalInfo: { ...profile.personalInfo, title: e.target.value },
                    })
                  }
                />
                <TextField
                  fullWidth
                  label="Company"
                  value={profile.personalInfo?.company || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      personalInfo: { ...profile.personalInfo, company: e.target.value },
                    })
                  }
                />
              </Box>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Bio"
                value={profile.personalInfo?.bio || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    personalInfo: { ...profile.personalInfo, bio: e.target.value },
                  })
                }
                helperText={`${profile.personalInfo?.bio?.length || 0}/200 characters`}
                inputProps={{ maxLength: 200 }}
              />

              <Divider sx={{ my: 3 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Template
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  helperText="Choose a template for your profile design"
                  size="small"
                >
                  <MenuItem value="">
                    <em>Default Template</em>
                  </MenuItem>
                  {templates.map((template) => (
                    <MenuItem key={template._id} value={template._id}>
                      {template.name} {template.isPremium && '⭐'}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Paper>

            {/* Contact Actions Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '16px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Contact Actions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage the quick-action buttons on your profile.
                  </Typography>
                </Box>
                <Button startIcon={<AddIcon />} variant="text" sx={{ color: '#2D6EF5' }} onClick={addContactAction}>
                  Add
                </Button>
              </Box>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={contactActions.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                  {contactActions.map((action) => (
                    <SortableItem
                      key={action.id}
                      id={action.id}
                      icon={action.icon}
                      label={action.label}
                      type={action.type}
                      onDelete={() => setContactActions(contactActions.filter((a) => a.id !== action.id))}
                      onLabelChange={(newLabel) => {
                        setContactActions(
                          contactActions.map((a) =>
                            a.id === action.id ? { ...a, label: newLabel } : a
                          )
                        );
                      }}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </Paper>

            {/* Custom Links & Files Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '16px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Custom Links & Files
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add websites, PDFs, or calendars.
                  </Typography>
                </Box>
              </Box>

              {customLinks.map((link) => (
                <Box
                  key={link.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    mb: 1.5,
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid #E5E7EB',
                    borderRadius: '12px',
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      backgroundColor: link.type === 'file' ? '#FEF2F2' : '#EBF3FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: link.type === 'file' ? '#EF4444' : '#2D6EF5',
                    }}
                  >
                    {link.type === 'file' ? <FileIcon /> : <WebsiteIcon />}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      value={link.label}
                      onChange={(e) => handleLinkUpdate(link.id, 'label', e.target.value)}
                      placeholder="Link title"
                      variant="standard"
                      size="small"
                      sx={{
                        mb: 0.5,
                        '& .MuiInput-root': {
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        },
                      }}
                    />
                    {link.type === 'file' ? (
                      <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.75rem', display: 'block' }}>
                        {uploadingFile === link.id ? 'Uploading...' : link.fileName || 'No file uploaded'}
                      </Typography>
                    ) : (
                      <TextField
                        fullWidth
                        value={link.url || ''}
                        onChange={(e) => handleLinkUpdate(link.id, 'url', e.target.value)}
                        placeholder="https://example.com"
                        variant="standard"
                        size="small"
                        sx={{
                          '& .MuiInput-root': {
                            fontSize: '0.75rem',
                            color: '#2D6EF5',
                          },
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {link.type === 'file' ? (
                      <>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                          onChange={(e) => handleFileUpload(link.id, e)}
                          style={{ display: 'none' }}
                          id={`file-upload-${link.id}`}
                          disabled={uploadingFile === link.id}
                        />
                        <label htmlFor={`file-upload-${link.id}`}>
                          <Button
                            component="span"
                            size="small"
                            disabled={uploadingFile === link.id}
                            sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                          >
                            {link.file ? 'Replace' : 'Upload'}
                          </Button>
                        </label>
                      </>
                    ) : (
                      <Button
                        size="small"
                        onClick={() => {
                          setCustomLinks(
                            customLinks.map((l) =>
                              l.id === link.id ? { ...l, type: 'file', icon: 'file' } : l
                            )
                          );
                        }}
                        sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                      >
                        Upload File
                      </Button>
                    )}
                    <IconButton size="small" sx={{ color: '#9CA3AF' }} onClick={() => handleDeleteLink(link.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}

              <Button
                fullWidth
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addCustomLink}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.5,
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  color: '#6B7280',
                  borderColor: '#D1D5DB',
                  '&:hover': {
                    borderWidth: 2,
                    borderColor: '#2D6EF5',
                    backgroundColor: '#F9FAFB',
                  },
                }}
              >
                Add New Link or File
              </Button>
            </Paper>
          </Box>

          {/* Right Column - Live Preview */}
          <Box
            sx={{
              width: 420,
              position: 'sticky',
              top: 80,
              height: 'fit-content',
            }}
          >
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    color: '#6B7280',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                  }}
                >
                  LIVE PREVIEW
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Landscape">
                    <IconButton
                      size="small"
                      onClick={() => setPreviewOrientation('landscape')}
                      sx={{
                        color: previewOrientation === 'landscape' ? '#2D6EF5' : '#9CA3AF',
                      }}
                    >
                      <Box
                        sx={{
                          width: 20,
                          height: 16,
                          border: '2px solid currentColor',
                          borderRadius: '4px',
                        }}
                      />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Portrait">
                    <IconButton
                      size="small"
                      onClick={() => setPreviewOrientation('portrait')}
                      sx={{
                        color: previewOrientation === 'portrait' ? '#2D6EF5' : '#9CA3AF',
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 18,
                          border: '2px solid currentColor',
                          borderRadius: '3px',
                        }}
                      />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <MobilePreview profile={profile} orientation={previewOrientation} />
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default EditProfileRedesigned;
