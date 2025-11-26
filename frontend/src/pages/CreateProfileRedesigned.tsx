import React, { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { profilesAPI } from '../services/api';
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
  profile: {
    firstName: string;
    lastName: string;
    title: string;
    company: string;
    bio: string;
    profilePhoto: string;
  };
}

const MobilePreview: React.FC<MobilePreviewProps> = ({ profile }) => {
  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || 'Your Name';

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 375,
        mx: 'auto',
        aspectRatio: '375 / 812',
        backgroundColor: '#1A1A1A',
        borderRadius: '32px',
        padding: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative',
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
                  src={profile.profilePhoto}
                  sx={{
                    width: 100,
                    height: 100,
                    border: '3px solid #FFFFFF',
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                    fontSize: '2rem',
                  }}
                >
                  {profile.firstName?.charAt(0) || 'U'}
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
                {fullName}
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
                {profile.title || 'Your Title'}
              </Typography>
              {profile.company && (
                <Typography
                  variant="caption"
                  sx={{
                    color: '#6B7280',
                    fontSize: '0.75rem',
                  }}
                >
                  {profile.company}
                </Typography>
              )}
            </Box>

            {/* Bio */}
            {profile.bio && (
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
                {profile.bio}
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
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const CreateProfileRedesigned: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    bio: '',
    profilePhoto: '',
  });

  const [contactActions, setContactActions] = useState([
    { id: '1', icon: <PhoneIcon />, label: '', type: 'Mobile Call' },
    { id: '2', icon: <EmailIcon />, label: '', type: 'Primary Email' },
  ]);

  const [customLinks, setCustomLinks] = useState<any[]>([]);

  const [socialLinks, setSocialLinks] = useState({
    linkedin: '',
    twitter: '',
    instagram: '',
    facebook: '',
    github: '',
    youtube: '',
    tiktok: '',
    pinterest: '',
  });

  const [businessHours, setBusinessHours] = useState([
    { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { day: 'Saturday', isOpen: false, openTime: '09:00', closeTime: '17:00' },
    { day: 'Sunday', isOpen: false, openTime: '09:00', closeTime: '17:00' },
  ]);

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
    try {
      setLoading(true);

      // Extract contact information from contact actions
      const phoneAction = contactActions.find((a) => a.type.includes('Call'));
      const emailAction = contactActions.find((a) => a.type.includes('Email'));
      const whatsappAction = contactActions.find((a) => a.type.includes('WhatsApp') || a.type.includes('Chat'));

      const profileData = {
        personalInfo: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          title: profile.title,
          company: profile.company,
          bio: profile.bio,
          profilePhoto: profile.profilePhoto,
        },
        contactInfo: {
          phone: phoneAction?.label || '',
          email: emailAction?.label || '',
          whatsapp: whatsappAction?.label || '',
        },
        socialLinks: {
          ...socialLinks,
          custom: customLinks,
        },
        businessHours: businessHours,
        isActive: true,
      };

      console.log('Creating profile with data:', profileData);

      const response = await profilesAPI.createProfile(profileData);

      if (response.success && response.data) {
        // Navigate to the public profile view to preview the created profile
        if (response.data.slug) {
          navigate(`/p/${response.data.slug}`);
        } else if (response.data._id) {
          // Fallback to edit page if slug is not available
          navigate(`/profiles/${response.data._id}/edit`);
        } else {
          // Fallback to profiles list
          navigate('/profiles');
        }
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      alert('Failed to create profile. Please try again.');
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
      { id: String(Date.now()), label: 'New Link', url: '', icon: 'globe' },
    ]);
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
              Create Profile
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Add your information and customize your digital business card
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
              disabled={loading || !profile.firstName || !profile.lastName}
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
              {loading ? 'Creating...' : 'Create Profile'}
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
                Add your photo and personal details.
              </Typography>

              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Avatar
                  src={profile.profilePhoto}
                  sx={{ width: 80, height: 80 }}
                >
                  {profile.firstName?.charAt(0) || 'U'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Cover Image
                  </Typography>
                  <Box
                    sx={{
                      border: '2px dashed #D1D5DB',
                      borderRadius: '12px',
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: '#2D6EF5',
                        backgroundColor: '#F9FAFB',
                      },
                    }}
                  >
                    <UploadIcon sx={{ fontSize: 32, color: '#9CA3AF', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Click to upload cover (1200×400)
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  required
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  required
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Job Title"
                  value={profile.title}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Company"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                />
              </Box>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                helperText={`${profile.bio.length}/200 characters`}
                inputProps={{ maxLength: 200 }}
              />
            </Paper>

            {/* Contact Actions Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '16px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Contact Actions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add quick-action buttons for your profile.
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
                      label={action.label || 'Add contact info'}
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

            {/* Social Media Links Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '16px' }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Social Media Links
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect your social media profiles
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  fullWidth
                  label="LinkedIn"
                  placeholder="https://linkedin.com/in/username"
                  value={socialLinks.linkedin}
                  onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                  size="small"
                  InputProps={{
                    startAdornment: <LinkedIn sx={{ mr: 1, color: '#0077B5' }} />,
                  }}
                />
                <TextField
                  fullWidth
                  label="Twitter/X"
                  placeholder="https://twitter.com/username"
                  value={socialLinks.twitter}
                  onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                  size="small"
                  InputProps={{
                    startAdornment: <Twitter sx={{ mr: 1, color: '#1DA1F2' }} />,
                  }}
                />
                <TextField
                  fullWidth
                  label="Instagram"
                  placeholder="https://instagram.com/username"
                  value={socialLinks.instagram}
                  onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                  size="small"
                  InputProps={{
                    startAdornment: <Instagram sx={{ mr: 1, color: '#E4405F' }} />,
                  }}
                />
                <TextField
                  fullWidth
                  label="Facebook"
                  placeholder="https://facebook.com/username"
                  value={socialLinks.facebook}
                  onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                  size="small"
                  InputProps={{
                    startAdornment: <WebsiteIcon sx={{ mr: 1, color: '#1877F2' }} />,
                  }}
                />
                <TextField
                  fullWidth
                  label="GitHub"
                  placeholder="https://github.com/username"
                  value={socialLinks.github}
                  onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                  size="small"
                  InputProps={{
                    startAdornment: <GitHub sx={{ mr: 1, color: '#181717' }} />,
                  }}
                />
                <TextField
                  fullWidth
                  label="YouTube"
                  placeholder="https://youtube.com/@username"
                  value={socialLinks.youtube}
                  onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                  size="small"
                  InputProps={{
                    startAdornment: <WebsiteIcon sx={{ mr: 1, color: '#FF0000' }} />,
                  }}
                />
                <TextField
                  fullWidth
                  label="TikTok"
                  placeholder="https://tiktok.com/@username"
                  value={socialLinks.tiktok}
                  onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                  size="small"
                  InputProps={{
                    startAdornment: <WebsiteIcon sx={{ mr: 1, color: '#000000' }} />,
                  }}
                />
                <TextField
                  fullWidth
                  label="Pinterest"
                  placeholder="https://pinterest.com/username"
                  value={socialLinks.pinterest}
                  onChange={(e) => setSocialLinks({ ...socialLinks, pinterest: e.target.value })}
                  size="small"
                  InputProps={{
                    startAdornment: <WebsiteIcon sx={{ mr: 1, color: '#E60023' }} />,
                  }}
                />
              </Box>
            </Paper>

            {/* Business Hours Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '16px' }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Business Hours
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Set your availability throughout the week
                </Typography>
              </Box>

              {businessHours.map((schedule, index) => (
                <Box
                  key={schedule.day}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 2,
                    p: 2,
                    backgroundColor: schedule.isOpen ? '#F8FAFC' : '#FEF2F2',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: schedule.isOpen ? '#E5E7EB' : '#FEE2E2',
                  }}
                >
                  <Box sx={{ width: 120 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {schedule.day}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={schedule.isOpen}
                      onChange={(e) => {
                        const updated = [...businessHours];
                        updated[index].isOpen = e.target.checked;
                        setBusinessHours(updated);
                      }}
                      style={{ width: 20, height: 20, cursor: 'pointer' }}
                    />
                    <Typography variant="body2" sx={{ minWidth: 60 }}>
                      {schedule.isOpen ? 'Open' : 'Closed'}
                    </Typography>
                  </Box>

                  {schedule.isOpen && (
                    <>
                      <TextField
                        type="time"
                        size="small"
                        value={schedule.openTime}
                        onChange={(e) => {
                          const updated = [...businessHours];
                          updated[index].openTime = e.target.value;
                          setBusinessHours(updated);
                        }}
                        sx={{ width: 130 }}
                      />
                      <Typography variant="body2" sx={{ color: '#64748B' }}>
                        to
                      </Typography>
                      <TextField
                        type="time"
                        size="small"
                        value={schedule.closeTime}
                        onChange={(e) => {
                          const updated = [...businessHours];
                          updated[index].closeTime = e.target.value;
                          setBusinessHours(updated);
                        }}
                        sx={{ width: 130 }}
                      />
                    </>
                  )}
                </Box>
              ))}
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
                      backgroundColor: link.icon === 'globe' ? '#EBF3FF' : '#FEF2F2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: link.icon === 'globe' ? '#2D6EF5' : '#EF4444',
                    }}
                  >
                    {link.icon === 'globe' ? <WebsiteIcon /> : <FileIcon />}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) => {
                        const updated = customLinks.map((l) =>
                          l.id === link.id ? { ...l, label: e.target.value } : l
                        );
                        setCustomLinks(updated);
                      }}
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="URL"
                      value={link.url}
                      onChange={(e) => {
                        const updated = customLinks.map((l) =>
                          l.id === link.id ? { ...l, url: e.target.value } : l
                        );
                        setCustomLinks(updated);
                      }}
                    />
                  </Box>
                  <IconButton
                    size="small"
                    sx={{ color: '#9CA3AF' }}
                    onClick={() => setCustomLinks(customLinks.filter((l) => l.id !== link.id))}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
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
                  <IconButton size="small" sx={{ color: '#9CA3AF' }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 16,
                        border: '2px solid currentColor',
                        borderRadius: '4px',
                      }}
                    />
                  </IconButton>
                  <IconButton size="small" sx={{ color: '#2D6EF5' }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 18,
                        border: '2px solid currentColor',
                        borderRadius: '3px',
                      }}
                    />
                  </IconButton>
                </Box>
              </Box>
              <MobilePreview profile={profile} />
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default CreateProfileRedesigned;
