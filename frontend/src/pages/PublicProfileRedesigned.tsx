import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Avatar,
  Button,
  IconButton,
  Skeleton,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  LocationOn as LocationIcon,
  Language as WebsiteIcon,
  Description as FileIcon,
  Share as ShareIcon,
  PersonAdd as SaveContactIcon,
  PersonAdd as PersonAddIcon,
  CalendarMonth as CalendarIcon,
  LinkedIn,
  Instagram,
  Twitter,
  GitHub,
  Business as BusinessIcon,
  Download as DownloadIcon,
  Event as EventIcon,
  ChevronRight as ChevronRightIcon,
  Public as PublicIcon,
  Chat as ChatIcon,
  YouTube,
  Facebook,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { publicAPI } from '../services/api';
import { Profile } from '../types';
import { motion } from 'framer-motion';
import SaveContactModal from '../components/SaveContactModal';
import QRCodeCard from '../components/QRCodeCard';
import LocationMap from '../components/LocationMap';
import ActionButton from '../components/ui/ActionButton';
import ContactActionIcon from '../components/ui/ContactActionIcon';

const PublicProfileRedesigned: React.FC = () => {
  const { profileId } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!profileId) {
        setError('Profile not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Generate unique session ID for analytics
        if (!sessionStorage.getItem('sessionId')) {
          sessionStorage.setItem(
            'sessionId',
            `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          );
        }

        // Fetch profile from API
        const response = await publicAPI.getPublicProfile(profileId);

        if (response.success && response.data) {
          setProfile(response.data);
        } else {
          setError('Profile not found or access denied');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [profileId]);

  const trackEvent = async (eventType: string, eventData: any = {}) => {
    if (!profile || !profileId) return;

    try {
      await publicAPI.recordAnalytics(profileId, {
        eventType,
        eventData,
        visitor: {
          sessionId: sessionStorage.getItem('sessionId') || 'anonymous',
          userAgent: navigator.userAgent,
          language: navigator.language,
        },
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  };

  const handleContact = (type: string, value: string) => {
    trackEvent('click', { elementClicked: `contact_${type}`, contactType: type });

    switch (type) {
      case 'email':
        window.open(`mailto:${value}`);
        break;
      case 'phone':
        window.open(`tel:${value}`);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/${value.replace(/[^0-9]/g, '')}`);
        break;
      case 'location':
        const fullAddress = [
          profile?.contactInfo.address?.street,
          profile?.contactInfo.address?.city,
          profile?.contactInfo.address?.state,
          profile?.contactInfo.address?.country,
        ]
          .filter(Boolean)
          .join(', ');
        window.open(`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`, '_blank');
        break;
      default:
        window.open(value, '_blank');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${profile?.personalInfo.firstName} ${profile?.personalInfo.lastName}`,
      text: `Check out ${profile?.personalInfo.firstName}'s digital business card`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        trackEvent('share', { shareMethod: 'native' });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        trackEvent('share', { shareMethod: 'clipboard' });
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.warn('Share failed:', error);
    }
  };

  // Error state
  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: '#F0F4F8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Container maxWidth="sm">
          <Alert severity="error" sx={{ borderRadius: 3, boxShadow: 2 }}>
            <AlertTitle sx={{ fontWeight: 600 }}>Access Denied</AlertTitle>
            {error}
          </Alert>
        </Container>
      </Box>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: '#F0F4F8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{ maxWidth: 480, mx: 'auto' }}>
            <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: '20px 20px 0 0', mb: 2 }} />
            <Skeleton variant="circular" width={120} height={120} sx={{ mx: 'auto', mt: -8, mb: 2 }} />
            <Skeleton variant="text" width="60%" height={32} sx={{ mx: 'auto', mb: 1 }} />
            <Skeleton variant="text" width="80%" height={24} sx={{ mx: 'auto', mb: 3 }} />
            <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: 2, mb: 2 }} />
          </Box>
        </Container>
      </Box>
    );
  }

  if (!profile) return null;

  const fullName = `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`;
  const profileUrl = window.location.href;

  // Get custom links and files
  const customLinks = profile.socialLinks?.custom || [];
  const websiteLink = customLinks.find(link => link.platform?.toLowerCase().includes('website'));
  const portfolioLink = customLinks.find(link => link.platform?.toLowerCase().includes('portfolio'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#F9FAFB',
        py: { xs: 2, md: 4 },
        px: { xs: 0, sm: 2 },
      }}
    >
      <Container maxWidth="sm" sx={{ px: { xs: 0, sm: 2 } }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box
            sx={{
              backgroundColor: '#F9FAFB',
              borderRadius: { xs: 0, sm: '20px' },
              overflow: 'hidden',
              boxShadow: { xs: 'none', sm: '0px 4px 20px rgba(0, 0, 0, 0.08)' },
              maxWidth: 480,
              mx: 'auto',
            }}
          >
            {/* Header with gradient or image background */}
            <Box
              sx={{
                background: profile.customization?.backgroundImage
                  ? `url(${profile.customization.backgroundImage})`
                  : 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: 180,
                position: 'relative',
              }}
            >
              <IconButton
                onClick={handleShare}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  width: 40,
                  height: 40,
                  color: '#1A1A1A',
                  '&:hover': {
                    backgroundColor: '#FFFFFF',
                  },
                }}
                size="small"
              >
                <ShareIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>

                {/* Profile Content */}
                <Box sx={{ px: 3, pb: 4 }}>
                  {/* Avatar with online status */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      mt: -7,
                      mb: 2,
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={profile.personalInfo.profilePhoto}
                        alt={fullName}
                        sx={{
                          width: 120,
                          height: 120,
                          border: '4px solid #FFFFFF',
                          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          backgroundColor: '#10B981',
                          border: '3px solid #FFFFFF',
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Name and Title */}
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: '#1A1A1A',
                        mb: 0.75,
                        fontSize: '1.75rem',
                      }}
                    >
                      {fullName}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#2D6EF5',
                        fontWeight: 600,
                        fontSize: '1.125rem',
                        mb: 1,
                      }}
                    >
                      {profile.personalInfo.title}
                    </Typography>
                    {profile.personalInfo.company && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
                        <BusinessIcon sx={{ fontSize: 18, color: '#9CA3AF' }} />
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#6B7280',
                            fontSize: '0.875rem',
                          }}
                        >
                          {profile.personalInfo.company}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Bio */}
                  {profile.personalInfo.bio && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#4B5563',
                        textAlign: 'center',
                        mb: 3,
                        lineHeight: 1.6,
                        px: 1,
                      }}
                    >
                      {profile.personalInfo.bio}
                    </Typography>
                  )}

                  {/* Quick Contact Actions - 4 Button Grid */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 2,
                      mb: 3,
                      px: 1,
                    }}
                  >
                    {/* Call */}
                    {profile.contactInfo.phone && (
                      <Box sx={{ textAlign: 'center' }}>
                        <Box
                          onClick={() => handleContact('phone', profile.contactInfo.phone!)}
                          sx={{
                            width: '100%',
                            aspectRatio: '1',
                            maxWidth: 64,
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
                              boxShadow: '0 4px 12px rgba(45, 110, 245, 0.3)',
                              '& .MuiSvgIcon-root': { color: '#FFFFFF' },
                            },
                          }}
                        >
                          <PhoneIcon sx={{ fontSize: 28, color: '#2D6EF5', transition: 'color 0.2s' }} />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.75rem',
                            color: '#6B7280',
                            mt: 1,
                            display: 'block',
                            fontWeight: 600,
                          }}
                        >
                          Call
                        </Typography>
                      </Box>
                    )}
                    {/* Email */}
                    {profile.contactInfo.email && (
                      <Box sx={{ textAlign: 'center' }}>
                        <Box
                          onClick={() => handleContact('email', profile.contactInfo.email!)}
                          sx={{
                            width: '100%',
                            aspectRatio: '1',
                            maxWidth: 64,
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
                              boxShadow: '0 4px 12px rgba(45, 110, 245, 0.3)',
                              '& .MuiSvgIcon-root': { color: '#FFFFFF' },
                            },
                          }}
                        >
                          <EmailIcon sx={{ fontSize: 28, color: '#2D6EF5', transition: 'color 0.2s' }} />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.75rem',
                            color: '#6B7280',
                            mt: 1,
                            display: 'block',
                            fontWeight: 600,
                          }}
                        >
                          Email
                        </Typography>
                      </Box>
                    )}
                    {/* Chat */}
                    {profile.contactInfo.phone && (
                      <Box sx={{ textAlign: 'center' }}>
                        <Box
                          onClick={() => handleContact('whatsapp', profile.contactInfo.phone!)}
                          sx={{
                            width: '100%',
                            aspectRatio: '1',
                            maxWidth: 64,
                            mx: 'auto',
                            borderRadius: '16px',
                            backgroundColor: '#E8F8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              backgroundColor: '#25D366',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                              '& .MuiSvgIcon-root': { color: '#FFFFFF' },
                            },
                          }}
                        >
                          <ChatIcon sx={{ fontSize: 28, color: '#25D366', transition: 'color 0.2s' }} />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.75rem',
                            color: '#6B7280',
                            mt: 1,
                            display: 'block',
                            fontWeight: 600,
                          }}
                        >
                          Chat
                        </Typography>
                      </Box>
                    )}
                    {/* Web/Location */}
                    {(profile.contactInfo.website || profile.contactInfo.address?.city) && (
                      <Box sx={{ textAlign: 'center' }}>
                        <Box
                          onClick={() => {
                            if (profile.contactInfo.website) {
                              window.open(profile.contactInfo.website, '_blank');
                            } else if (profile.contactInfo.address?.city) {
                              handleContact('location', '');
                            }
                          }}
                          sx={{
                            width: '100%',
                            aspectRatio: '1',
                            maxWidth: 64,
                            mx: 'auto',
                            borderRadius: '16px',
                            backgroundColor: profile.contactInfo.website ? '#F3F4F6' : '#FFF7ED',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              backgroundColor: profile.contactInfo.website ? '#6B7280' : '#F59E0B',
                              transform: 'translateY(-2px)',
                              boxShadow: profile.contactInfo.website
                                ? '0 4px 12px rgba(107, 114, 128, 0.3)'
                                : '0 4px 12px rgba(245, 158, 11, 0.3)',
                              '& .MuiSvgIcon-root': { color: '#FFFFFF' },
                            },
                          }}
                        >
                          {profile.contactInfo.website ? (
                            <PublicIcon
                              sx={{
                                fontSize: 28,
                                color: '#6B7280',
                                transition: 'color 0.2s',
                              }}
                            />
                          ) : (
                            <LocationIcon
                              sx={{
                                fontSize: 28,
                                color: '#F59E0B',
                                transition: 'color 0.2s',
                              }}
                            />
                          )}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.75rem',
                            color: '#6B7280',
                            mt: 1,
                            display: 'block',
                            fontWeight: 600,
                          }}
                        >
                          {profile.contactInfo.website ? 'Web' : 'Map'}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Resources Section */}
                  {customLinks && customLinks.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          color: '#9CA3AF',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          mb: 2,
                          display: 'block',
                        }}
                      >
                        RESOURCES
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {customLinks.map((link, index) => (
                          <Box
                            key={index}
                            onClick={() => {
                              if (link.url) {
                                window.open(link.url, '_blank');
                              }
                            }}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              p: 2,
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '10px',
                                  backgroundColor: link.icon === 'file' ? '#FEF2F2' : '#F5F3FF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {link.icon === 'file' ? (
                                  <DownloadIcon sx={{ fontSize: 20, color: '#EF4444' }} />
                                ) : (
                                  <EventIcon sx={{ fontSize: 20, color: '#8B5CF6' }} />
                                )}
                              </Box>
                              <Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    color: '#1A1A1A',
                                    display: 'block',
                                  }}
                                >
                                  {link.label || link.platform || 'Custom Link'}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: '0.75rem', color: '#9CA3AF' }}
                                >
                                  {link.icon === 'file' ? 'Download' : 'View'}
                                </Typography>
                              </Box>
                            </Box>
                            <ChevronRightIcon sx={{ fontSize: 20, color: '#9CA3AF' }} />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Location Map */}
                  {profile.contactInfo.address?.city && (
                    <Box sx={{ mb: 2.5 }}>
                      <LocationMap
                        address={profile.contactInfo.address}
                        locationLabel={`${profile.contactInfo.address.city}${
                          profile.contactInfo.address.state ? ', ' + profile.contactInfo.address.state : ''
                        }`}
                      />
                    </Box>
                  )}

                  {/* Social Media Links - Circular Gray Icons */}
                  {(profile.socialLinks?.linkedin ||
                    profile.socialLinks?.instagram ||
                    profile.socialLinks?.twitter ||
                    profile.socialLinks?.facebook ||
                    profile.socialLinks?.youtube ||
                    profile.socialLinks?.github) && (
                    <Box sx={{ mb: 3 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          flexWrap: 'wrap',
                          gap: 2,
                        }}
                      >
                        {profile.socialLinks.linkedin && (
                          <Box
                            onClick={() => window.open(profile.socialLinks.linkedin, '_blank')}
                            sx={{
                              width: 44,
                              height: 44,
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
                                boxShadow: '0 4px 8px rgba(10, 102, 194, 0.3)',
                                '& .MuiSvgIcon-root': { color: '#FFFFFF' },
                              },
                            }}
                          >
                            <LinkedIn sx={{ fontSize: 20, color: '#6B7280', transition: 'color 0.2s' }} />
                          </Box>
                        )}
                        {profile.socialLinks.instagram && (
                          <Box
                            onClick={() => window.open(profile.socialLinks.instagram, '_blank')}
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              backgroundColor: '#E5E7EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': {
                                backgroundColor: '#E4405F',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(228, 64, 95, 0.3)',
                                '& .MuiSvgIcon-root': { color: '#FFFFFF' },
                              },
                            }}
                          >
                            <Instagram sx={{ fontSize: 20, color: '#6B7280', transition: 'color 0.2s' }} />
                          </Box>
                        )}
                        {profile.socialLinks.twitter && (
                          <Box
                            onClick={() => window.open(profile.socialLinks.twitter, '_blank')}
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              backgroundColor: '#E5E7EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': {
                                backgroundColor: '#1DA1F2',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(29, 161, 242, 0.3)',
                                '& .MuiSvgIcon-root': { color: '#FFFFFF' },
                              },
                            }}
                          >
                            <Twitter sx={{ fontSize: 20, color: '#6B7280', transition: 'color 0.2s' }} />
                          </Box>
                        )}
                        {profile.socialLinks.facebook && (
                          <Box
                            onClick={() => window.open(profile.socialLinks.facebook, '_blank')}
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              backgroundColor: '#E5E7EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': {
                                backgroundColor: '#1877F2',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(24, 119, 242, 0.3)',
                                '& .MuiSvgIcon-root': { color: '#FFFFFF' },
                              },
                            }}
                          >
                            <Facebook sx={{ fontSize: 20, color: '#6B7280', transition: 'color 0.2s' }} />
                          </Box>
                        )}
                        {profile.socialLinks.youtube && (
                          <Box
                            onClick={() => window.open(profile.socialLinks.youtube, '_blank')}
                            sx={{
                              width: 44,
                              height: 44,
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
                                boxShadow: '0 4px 8px rgba(255, 0, 0, 0.3)',
                                '& .MuiSvgIcon-root': { color: '#FFFFFF' },
                              },
                            }}
                          >
                            <YouTube sx={{ fontSize: 20, color: '#6B7280', transition: 'color 0.2s' }} />
                          </Box>
                        )}
                        {profile.socialLinks.github && (
                          <Box
                            onClick={() => window.open(profile.socialLinks.github, '_blank')}
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              backgroundColor: '#E5E7EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': {
                                backgroundColor: '#333',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(51, 51, 51, 0.3)',
                                '& .MuiSvgIcon-root': { color: '#FFFFFF' },
                              },
                            }}
                          >
                            <GitHub sx={{ fontSize: 20, color: '#6B7280', transition: 'color 0.2s' }} />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Business Hours */}
                  {profile.businessHours && profile.businessHours.some((h) => h.isOpen) && (
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
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setSaveModalOpen(true)}
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

                  {/* Powered By Footer */}
                  <Box sx={{ textAlign: 'center', pt: 3, pb: 3 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.75rem',
                        color: '#9CA3AF',
                        letterSpacing: '0.05em',
                        fontWeight: 600,
                      }}
                    >
                      POWERED BY BBTAP
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </motion.div>
      </Container>

      {/* Save Contact Modal */}
      <SaveContactModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        profile={profile}
        profileId={profileId || ''}
      />
    </Box>
  );
};

export default PublicProfileRedesigned;
