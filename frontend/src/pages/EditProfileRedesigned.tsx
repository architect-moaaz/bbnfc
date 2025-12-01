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
  Switch,
  FormControlLabel,
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
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  YouTube as YouTubeIcon,
  GitHub as GitHubIcon,
  Share as ShareIcon,
  Business as BusinessIcon,
  Download as DownloadIcon,
  Event as EventIcon,
  ChevronRight as ChevronRightIcon,
  PersonAdd as PersonAddIcon,
  Chat as ChatIcon,
  Public as PublicIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { profilesAPI, uploadAPI, templatesAPI } from '../services/api';
import { Profile, Template } from '../types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import GoogleMapsPicker from '../components/GoogleMapsPicker';
import ImageCropperModal from '../components/ImageCropperModal';

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
  showSaveButton?: boolean;
  showLocation?: boolean;
  showBusinessHours?: boolean;
}

const MobilePreview: React.FC<MobilePreviewProps> = ({
  profile,
  orientation = 'portrait',
  showSaveButton = true,
  showLocation = true,
  showBusinessHours = true
}) => {
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
          backgroundColor: '#F9FAFB',
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Profile Content */}
        <Box sx={{ height: '100%', overflowY: 'auto', backgroundColor: '#F9FAFB' }}>
          {/* Header with gradient or cover image */}
          <Box
            sx={{
              background: profile.customization?.backgroundImage
                ? `url(${profile.customization.backgroundImage})`
                : 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: 140,
              position: 'relative',
            }}
          >
            {/* Share Button */}
            <IconButton
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                width: 32,
                height: 32,
                '&:hover': {
                  backgroundColor: '#FFFFFF',
                },
              }}
              size="small"
            >
              <ShareIcon sx={{ fontSize: 16, color: '#1A1A1A' }} />
            </IconButton>
          </Box>

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
                  mb: 0.5,
                  fontSize: '1.25rem',
                }}
              >
                {fullName || 'Your Name'}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#2D6EF5',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  mb: 0.75,
                }}
              >
                {profile.personalInfo?.title || 'Your Title'}
              </Typography>
              {profile.personalInfo?.company && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <BusinessIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#6B7280',
                      fontSize: '0.8125rem',
                    }}
                  >
                    {profile.personalInfo.company}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Bio */}
            {profile.personalInfo?.bio && (
              <Typography
                variant="body2"
                sx={{
                  color: '#6B7280',
                  textAlign: 'center',
                  mb: 2.5,
                  lineHeight: 1.6,
                  fontSize: '0.8125rem',
                  px: 1,
                }}
              >
                {profile.personalInfo.bio}
              </Typography>
            )}

            {/* Quick Actions - 4 Buttons */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 1.5,
                mb: 2.5,
              }}
            >
              {/* Call */}
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '1',
                    maxWidth: 56,
                    mx: 'auto',
                    borderRadius: '16px',
                    backgroundColor: '#EBF3FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#2D6EF5',
                      transform: 'translateY(-2px)',
                      '& .MuiSvgIcon-root': {
                        color: '#FFFFFF',
                      },
                    },
                  }}
                >
                  <PhoneIcon sx={{ fontSize: 24, color: '#2D6EF5', transition: 'color 0.2s' }} />
                </Box>
                <Typography variant="caption" sx={{ fontSize: '0.6875rem', color: '#6B7280', mt: 0.75, display: 'block', fontWeight: 500 }}>
                  Call
                </Typography>
              </Box>

              {/* Email */}
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '1',
                    maxWidth: 56,
                    mx: 'auto',
                    borderRadius: '16px',
                    backgroundColor: '#EBF3FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#2D6EF5',
                      transform: 'translateY(-2px)',
                      '& .MuiSvgIcon-root': {
                        color: '#FFFFFF',
                      },
                    },
                  }}
                >
                  <EmailIcon sx={{ fontSize: 24, color: '#2D6EF5', transition: 'color 0.2s' }} />
                </Box>
                <Typography variant="caption" sx={{ fontSize: '0.6875rem', color: '#6B7280', mt: 0.75, display: 'block', fontWeight: 500 }}>
                  Email
                </Typography>
              </Box>

              {/* Chat */}
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '1',
                    maxWidth: 56,
                    mx: 'auto',
                    borderRadius: '16px',
                    backgroundColor: '#F0FDF4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#25D366',
                      transform: 'translateY(-2px)',
                      '& .MuiSvgIcon-root': {
                        color: '#FFFFFF',
                      },
                    },
                  }}
                >
                  <WhatsAppIcon sx={{ fontSize: 24, color: '#25D366', transition: 'color 0.2s' }} />
                </Box>
                <Typography variant="caption" sx={{ fontSize: '0.6875rem', color: '#6B7280', mt: 0.75, display: 'block', fontWeight: 500 }}>
                  Chat
                </Typography>
              </Box>

              {/* Web */}
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '1',
                    maxWidth: 56,
                    mx: 'auto',
                    borderRadius: '16px',
                    backgroundColor: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#6B7280',
                      transform: 'translateY(-2px)',
                      '& .MuiSvgIcon-root': {
                        color: '#FFFFFF',
                      },
                    },
                  }}
                >
                  <PublicIcon sx={{ fontSize: 24, color: '#6B7280', transition: 'color 0.2s' }} />
                </Box>
                <Typography variant="caption" sx={{ fontSize: '0.6875rem', color: '#6B7280', mt: 0.75, display: 'block', fontWeight: 500 }}>
                  Web
                </Typography>
              </Box>
            </Box>

            {/* Resources Section */}
            {profile.socialLinks?.custom && profile.socialLinks.custom.length > 0 && (
              <Box sx={{ mb: 2.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.6875rem',
                    color: '#9CA3AF',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    mb: 1.5,
                    display: 'block',
                  }}
                >
                  RESOURCES
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  {profile.socialLinks.custom.map((link, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: '12px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: '#2D6EF5',
                          boxShadow: '0 2px 8px rgba(45, 110, 245, 0.1)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            backgroundColor: '#FEF2F2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {link.icon === 'file' ? (
                            <DownloadIcon sx={{ fontSize: 18, color: '#EF4444' }} />
                          ) : (
                            <EventIcon sx={{ fontSize: 18, color: '#8B5CF6' }} />
                          )}
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#1A1A1A', display: 'block' }}>
                            {link.label || link.platform || 'Custom Link'}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>
                            {link.icon === 'file' ? 'PDF, 4.2 MB' : '30 min intro call'}
                          </Typography>
                        </Box>
                      </Box>
                      <ChevronRightIcon sx={{ fontSize: 18, color: '#9CA3AF' }} />
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Location Map */}
            {showLocation && (
              <Box sx={{ mb: 2.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.6875rem',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    mb: 1.5,
                    display: 'block',
                  }}
                >
                  LOCATION
                </Typography>
                <Box
                  sx={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#F9FAFB',
                  }}
                >
                  {/* Static map placeholder - could be replaced with actual map */}
                  <Box
                    sx={{
                      height: 120,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <LocationIcon sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.8)' }} />
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#1A1A1A',
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      {profile.personalInfo?.company || 'Office Location'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      {profile.contactInfo?.address?.city ? (
                        <>
                          {profile.contactInfo.address.street && `${profile.contactInfo.address.street}, `}
                          {profile.contactInfo.address.city}
                          {profile.contactInfo.address.state && `, ${profile.contactInfo.address.state}`}
                          {profile.contactInfo.address.postalCode && ` ${profile.contactInfo.address.postalCode}`}
                        </>
                      ) : (
                        'Add your office address in the Address section below'
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Social Media Links */}
            {(profile.socialLinks?.linkedin || profile.socialLinks?.twitter || profile.socialLinks?.facebook ||
              profile.socialLinks?.instagram || profile.socialLinks?.youtube || profile.socialLinks?.github) && (
              <Box sx={{ mb: 2.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    gap: 1.5,
                  }}
                >
                  {profile.socialLinks?.linkedin && (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: '#E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          backgroundColor: '#0A66C2',
                          transform: 'translateY(-2px)',
                          '& .MuiSvgIcon-root': {
                            color: '#FFFFFF',
                          },
                        },
                      }}
                    >
                      <LinkedInIcon sx={{ fontSize: 18, color: '#6B7280', transition: 'color 0.2s' }} />
                    </Box>
                  )}
                  {profile.socialLinks?.instagram && (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: '#E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)',
                          transform: 'translateY(-2px)',
                          '& .MuiSvgIcon-root': {
                            color: '#FFFFFF',
                          },
                        },
                      }}
                    >
                      <InstagramIcon sx={{ fontSize: 18, color: '#6B7280', transition: 'color 0.2s' }} />
                    </Box>
                  )}
                  {profile.socialLinks?.twitter && (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: '#E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          backgroundColor: '#000000',
                          transform: 'translateY(-2px)',
                          '& .MuiSvgIcon-root': {
                            color: '#FFFFFF',
                          },
                        },
                      }}
                    >
                      <TwitterIcon sx={{ fontSize: 18, color: '#6B7280', transition: 'color 0.2s' }} />
                    </Box>
                  )}
                  {profile.socialLinks?.github && (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: '#E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          backgroundColor: '#181717',
                          transform: 'translateY(-2px)',
                          '& .MuiSvgIcon-root': {
                            color: '#FFFFFF',
                          },
                        },
                      }}
                    >
                      <GitHubIcon sx={{ fontSize: 18, color: '#6B7280', transition: 'color 0.2s' }} />
                    </Box>
                  )}
                  {profile.socialLinks?.youtube && (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: '#E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          backgroundColor: '#FF0000',
                          transform: 'translateY(-2px)',
                          '& .MuiSvgIcon-root': {
                            color: '#FFFFFF',
                          },
                        },
                      }}
                    >
                      <YouTubeIcon sx={{ fontSize: 18, color: '#6B7280', transition: 'color 0.2s' }} />
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            {/* Business Hours */}
            {showBusinessHours && profile.businessHours && profile.businessHours.some((h) => h.isOpen) && (
              <Box sx={{ mb: 2.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.6875rem',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    mb: 1,
                    display: 'block',
                  }}
                >
                  Business Hours
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {profile.businessHours
                    ?.filter((h) => h.isOpen)
                    .map((daySchedule) => (
                      <Box
                        key={daySchedule.day}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 0.5,
                          px: 1,
                          borderRadius: '8px',
                          backgroundColor: '#FFFFFF',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.6875rem',
                            textTransform: 'capitalize',
                            color: '#1A1A1A',
                          }}
                        >
                          {daySchedule.day}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.6875rem', color: '#6B7280' }}>
                          {daySchedule.openTime} - {daySchedule.closeTime}
                        </Typography>
                      </Box>
                    ))}
                </Box>
              </Box>
            )}

            {/* Save Contact Button */}
            {showSaveButton && (
              <Button
                fullWidth
                variant="contained"
                startIcon={<PersonAddIcon />}
                sx={{
                  mb: 2.5,
                  height: 48,
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  borderRadius: '14px',
                  textTransform: 'none',
                  backgroundColor: '#2D6EF5',
                  boxShadow: '0 4px 12px rgba(45, 110, 245, 0.3)',
                  '&:hover': {
                    backgroundColor: '#1E5DD8',
                    boxShadow: '0 6px 16px rgba(45, 110, 245, 0.4)',
                  },
                }}
              >
                Save Contact
              </Button>
            )}

            {/* Powered By Footer */}
            <Box sx={{ textAlign: 'center', pt: 2, pb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.6875rem',
                  color: '#9CA3AF',
                  letterSpacing: '0.05em',
                  fontWeight: 500,
                }}
              >
                POWERED BY BBTAP
              </Typography>
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewOrientation, setPreviewOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const coverImageInputRef = React.useRef<HTMLInputElement>(null);
  const profilePhotoInputRef = React.useRef<HTMLInputElement>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImage, setCropperImage] = useState('');
  const [cropperType, setCropperType] = useState<'profile' | 'cover'>('profile');
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
      linkedin: '',
      twitter: '',
      facebook: '',
      instagram: '',
      youtube: '',
      github: '',
      tiktok: '',
      custom: [],
    },
    businessHours: [
      { day: 'monday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { day: 'tuesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { day: 'wednesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { day: 'thursday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { day: 'friday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { day: 'saturday', isOpen: false, openTime: '09:00', closeTime: '17:00' },
      { day: 'sunday', isOpen: false, openTime: '09:00', closeTime: '17:00' },
    ],
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

  // Toggle controls for card view elements
  const [showBusinessHours, setShowBusinessHours] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showAddress, setShowAddress] = useState(true);
  const [showSaveButton, setShowSaveButton] = useState(true);

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
          // Initialize businessHours if not present or empty
          const defaultBusinessHours = [
            { day: 'monday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
            { day: 'tuesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
            { day: 'wednesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
            { day: 'thursday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
            { day: 'friday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
            { day: 'saturday', isOpen: false, openTime: '09:00', closeTime: '17:00' },
            { day: 'sunday', isOpen: false, openTime: '09:00', closeTime: '17:00' },
          ];

          const profileData = {
            ...response.data,
            businessHours: (response.data.businessHours && response.data.businessHours.length > 0)
              ? response.data.businessHours
              : defaultBusinessHours,
          };
          setProfile(profileData);

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
          address: profile.contactInfo?.address || undefined,
        },
        socialLinks: {
          linkedin: profile.socialLinks?.linkedin || '',
          twitter: profile.socialLinks?.twitter || '',
          facebook: profile.socialLinks?.facebook || '',
          instagram: profile.socialLinks?.instagram || '',
          youtube: profile.socialLinks?.youtube || '',
          github: profile.socialLinks?.github || '',
          tiktok: profile.socialLinks?.tiktok || '',
          custom: customLinks,
        },
        businessHours: profile.businessHours || [],
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

    // Validate file size (2MB max for MongoDB storage)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
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

    // Validate file size (5MB max before cropping)
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

    // Read file as data URL for cropper
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropperImage(reader.result as string);
      setCropperType('cover');
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
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

  const handleProfilePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max before cropping)
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

    // Read file as data URL for cropper
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropperImage(reader.result as string);
      setCropperType('profile');
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleProfilePhotoClick = () => {
    profilePhotoInputRef.current?.click();
  };

  const handleCropComplete = async (croppedImage: string) => {
    // Convert base64 to file
    const response = await fetch(croppedImage);
    const blob = await response.blob();
    const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });

    // Validate file size after cropping (2MB max for MongoDB storage)
    if (file.size > 2 * 1024 * 1024) {
      alert('Cropped image is too large. Please try cropping a smaller area or use a smaller original image.');
      return;
    }

    if (cropperType === 'profile') {
      setUploadingPhoto(true);
      try {
        const uploadResponse = await uploadAPI.uploadProfilePhoto(file);

        if (uploadResponse.success && uploadResponse.data) {
          const imageUrl = uploadResponse.data.imageUrl;
          setProfile({
            ...profile,
            personalInfo: {
              ...profile.personalInfo,
              profilePhoto: imageUrl,
            },
          });
          alert('Profile photo uploaded successfully!');
        } else {
          alert('Failed to upload profile photo');
        }
      } catch (err) {
        console.error('Upload error:', err);
        alert('Failed to upload profile photo. Please try again.');
      } finally {
        setUploadingPhoto(false);
      }
    } else {
      setUploadingCover(true);
      try {
        const uploadResponse = await uploadAPI.uploadCompanyLogo(file);

        if (uploadResponse.success && uploadResponse.data) {
          const imageUrl = uploadResponse.data.imageUrl;
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
    }
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
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Profile Photo
                  </Typography>
                  <Box
                    onClick={handleProfilePhotoClick}
                    sx={{
                      position: 'relative',
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                  >
                    <Avatar
                      src={profile.personalInfo?.profilePhoto}
                      sx={{
                        width: 80,
                        height: 80,
                        border: uploadingPhoto ? '2px solid #2D6EF5' : 'none',
                      }}
                    >
                      {uploadingPhoto ? '...' : (profile.personalInfo?.firstName?.charAt(0) || 'U')}
                    </Avatar>
                    {!uploadingPhoto && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: '#2D6EF5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid white',
                        }}
                      >
                        <UploadIcon sx={{ fontSize: 14, color: 'white' }} />
                      </Box>
                    )}
                  </Box>
                  <input
                    ref={profilePhotoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoUpload}
                    style={{ display: 'none' }}
                    disabled={uploadingPhoto}
                  />
                </Box>
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

            {/* Address Information Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '16px' }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Office Address
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add your business location to display on the location map.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  fullWidth
                  label="Street Address"
                  placeholder="123 Main Street"
                  value={profile.contactInfo?.address?.street || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      contactInfo: {
                        ...profile.contactInfo,
                        address: {
                          ...profile.contactInfo?.address,
                          street: e.target.value,
                        },
                      },
                    })
                  }
                  variant="outlined"
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2 }}>
                  <TextField
                    fullWidth
                    label="City"
                    placeholder="New York"
                    value={profile.contactInfo?.address?.city || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        contactInfo: {
                          ...profile.contactInfo,
                          address: {
                            ...profile.contactInfo?.address,
                            city: e.target.value,
                          },
                        },
                      })
                    }
                    variant="outlined"
                  />

                  <TextField
                    fullWidth
                    label="State/Province"
                    placeholder="NY"
                    value={profile.contactInfo?.address?.state || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        contactInfo: {
                          ...profile.contactInfo,
                          address: {
                            ...profile.contactInfo?.address,
                            state: e.target.value,
                          },
                        },
                      })
                    }
                    variant="outlined"
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    placeholder="10001"
                    value={profile.contactInfo?.address?.postalCode || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        contactInfo: {
                          ...profile.contactInfo,
                          address: {
                            ...profile.contactInfo?.address,
                            postalCode: e.target.value,
                          },
                        },
                      })
                    }
                    variant="outlined"
                  />

                  <TextField
                    fullWidth
                    label="Country"
                    placeholder="United States"
                    value={profile.contactInfo?.address?.country || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        contactInfo: {
                          ...profile.contactInfo,
                          address: {
                            ...profile.contactInfo?.address,
                            country: e.target.value,
                          },
                        },
                      })
                    }
                    variant="outlined"
                  />
                </Box>
              </Box>

              {/* Google Maps Interactive Picker */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600, color: '#374151' }}>
                  Map Location
                </Typography>
                <Typography variant="caption" sx={{ mb: 2, display: 'block', color: '#6B7280' }}>
                  The pin will automatically appear based on your address. You can click or drag it to adjust the exact location.
                </Typography>
                <GoogleMapsPicker
                  address={profile.contactInfo?.address}
                  editable={true}
                  onLocationChange={(location) => {
                    setProfile({
                      ...profile,
                      contactInfo: {
                        ...profile.contactInfo,
                        address: {
                          ...profile.contactInfo?.address,
                          latitude: location.latitude,
                          longitude: location.longitude,
                        },
                      },
                    });
                  }}
                />
              </Box>
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

            {/* Social Media Links Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '16px' }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Social Media Links
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect your social media profiles to your card.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* LinkedIn */}
                <TextField
                  fullWidth
                  label="LinkedIn"
                  value={profile.socialLinks?.linkedin || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, linkedin: e.target.value } })}
                  placeholder="https://linkedin.com/in/yourprofile"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          backgroundColor: '#0A66C2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          mr: 1.5,
                        }}
                      >
                        <LinkedInIcon fontSize="small" />
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />

                {/* Twitter */}
                <TextField
                  fullWidth
                  label="Twitter"
                  value={profile.socialLinks?.twitter || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, twitter: e.target.value } })}
                  placeholder="https://twitter.com/yourhandle"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          backgroundColor: '#000000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          mr: 1.5,
                        }}
                      >
                        <TwitterIcon fontSize="small" />
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />

                {/* Facebook */}
                <TextField
                  fullWidth
                  label="Facebook"
                  value={profile.socialLinks?.facebook || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, facebook: e.target.value } })}
                  placeholder="https://facebook.com/yourpage"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          backgroundColor: '#1877F2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          mr: 1.5,
                        }}
                      >
                        <FacebookIcon fontSize="small" />
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />

                {/* Instagram */}
                <TextField
                  fullWidth
                  label="Instagram"
                  value={profile.socialLinks?.instagram || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, instagram: e.target.value } })}
                  placeholder="https://instagram.com/yourhandle"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          background: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          mr: 1.5,
                        }}
                      >
                        <InstagramIcon fontSize="small" />
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />

                {/* YouTube */}
                <TextField
                  fullWidth
                  label="YouTube"
                  value={profile.socialLinks?.youtube || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, youtube: e.target.value } })}
                  placeholder="https://youtube.com/@yourchannel"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          backgroundColor: '#FF0000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          mr: 1.5,
                        }}
                      >
                        <YouTubeIcon fontSize="small" />
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />

                {/* GitHub */}
                <TextField
                  fullWidth
                  label="GitHub"
                  value={profile.socialLinks?.github || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, github: e.target.value } })}
                  placeholder="https://github.com/yourusername"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          backgroundColor: '#181717',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          mr: 1.5,
                        }}
                      >
                        <GitHubIcon fontSize="small" />
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />
              </Box>
            </Paper>

            {/* Card View Display Options */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '16px' }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Card View Options
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Control which elements appear on your business card.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={<Switch checked={showSaveButton} onChange={(e) => setShowSaveButton(e.target.checked)} color="primary" />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Save Contact Button
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Allow visitors to save your contact information
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={<Switch checked={showAddress} onChange={(e) => setShowAddress(e.target.checked)} color="primary" />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Address
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Show your office address details
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={<Switch checked={showLocation} onChange={(e) => setShowLocation(e.target.checked)} color="primary" />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Location Map
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Display your office location on the card
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={<Switch checked={showBusinessHours} onChange={(e) => setShowBusinessHours(e.target.checked)} color="primary" />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Business Hours
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Show your availability schedule
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Paper>

            {/* Business Hours Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '16px' }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Business Hours
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Set your availability for each day of the week.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {profile.businessHours && Array.isArray(profile.businessHours) && profile.businessHours.length > 0 ? (
                  profile.businessHours.map((daySchedule, index) => (
                    <Box
                      key={daySchedule.day}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: '12px',
                        backgroundColor: daySchedule.isOpen ? '#F9FAFB' : '#FAFAFA',
                        border: '1px solid #E5E7EB',
                      }}
                    >
                    <Box sx={{ flex: '0 0 120px' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                        {daySchedule.day}
                      </Typography>
                    </Box>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={daySchedule.isOpen}
                          onChange={(e) => {
                            const updatedHours = [...(profile.businessHours || [])];
                            updatedHours[index] = { ...updatedHours[index], isOpen: e.target.checked };
                            setProfile((prev) => ({ ...prev, businessHours: updatedHours }));
                          }}
                          size="small"
                        />
                      }
                      label={daySchedule.isOpen ? 'Open' : 'Closed'}
                      sx={{ mr: 2 }}
                    />

                    {daySchedule.isOpen && (
                      <>
                        <TextField
                          type="time"
                          value={daySchedule.openTime || '09:00'}
                          onChange={(e) => {
                            const updatedHours = [...(profile.businessHours || [])];
                            updatedHours[index] = { ...updatedHours[index], openTime: e.target.value };
                            setProfile((prev) => ({ ...prev, businessHours: updatedHours }));
                          }}
                          size="small"
                          sx={{
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px',
                            },
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          to
                        </Typography>
                        <TextField
                          type="time"
                          value={daySchedule.closeTime || '17:00'}
                          onChange={(e) => {
                            const updatedHours = [...(profile.businessHours || [])];
                            updatedHours[index] = { ...updatedHours[index], closeTime: e.target.value };
                            setProfile((prev) => ({ ...prev, businessHours: updatedHours }));
                          }}
                          size="small"
                          sx={{
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px',
                            },
                          }}
                        />
                      </>
                    )}
                  </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No business hours set. Please save the profile to initialize business hours.
                  </Typography>
                )}
              </Box>
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
              <MobilePreview
                profile={profile}
                orientation={previewOrientation}
                showSaveButton={showSaveButton}
                showLocation={showLocation}
                showBusinessHours={showBusinessHours}
              />
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Image Cropper Modal */}
      <ImageCropperModal
        open={cropperOpen}
        onClose={() => setCropperOpen(false)}
        imageSrc={cropperImage}
        onCropComplete={handleCropComplete}
        aspectRatio={cropperType === 'profile' ? 1 : 16 / 9}
        cropShape={cropperType === 'profile' ? 'round' : 'rect'}
        title={cropperType === 'profile' ? 'Crop Profile Photo' : 'Crop Cover Image'}
      />
    </Box>
  );
};

export default EditProfileRedesigned;
