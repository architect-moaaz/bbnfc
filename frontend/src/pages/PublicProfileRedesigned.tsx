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
  CalendarMonth as CalendarIcon,
  LinkedIn,
  Instagram,
  Twitter,
  GitHub,
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
        background: '#F0F4F8',
        py: { xs: 3, md: 5 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', gap: 4, maxWidth: 1100, mx: 'auto' }}>
          {/* Left Column - QR Code (Desktop only) */}
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              flexDirection: 'column',
              width: 240,
              position: 'sticky',
              top: 80,
              height: 'fit-content',
            }}
          >
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <QRCodeCard url={profileUrl} size={180} />
            </motion.div>
          </Box>

          {/* Main Profile Card */}
          <Box sx={{ flex: 1, maxWidth: 480 }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Box
                sx={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
                }}
              >
                {/* Header with gradient or image background */}
                <Box
                  sx={{
                    background: profile.customization?.backgroundImage
                      ? `url(${profile.customization.backgroundImage})`
                      : 'linear-gradient(135deg, #2D6EF5 0%, #4A8DF8 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    height: 140,
                    position: 'relative',
                  }}
                >
                  <IconButton
                    onClick={handleShare}
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      color: '#FFFFFF',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.35)',
                      },
                    }}
                  >
                    <ShareIcon />
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
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: '#1A1A1A',
                        mb: 0.5,
                      }}
                    >
                      {fullName}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#2D6EF5',
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        mb: 0.5,
                      }}
                    >
                      {profile.personalInfo.title}
                    </Typography>
                    {profile.personalInfo.company && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
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

                  {/* Quick Contact Actions */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 2,
                      mb: 3,
                      px: 2,
                    }}
                  >
                    {profile.contactInfo.phone && (
                      <ContactActionIcon
                        icon={<PhoneIcon sx={{ fontSize: 24, color: '#2D6EF5' }} />}
                        label="Call"
                        onClick={() => handleContact('phone', profile.contactInfo.phone!)}
                        backgroundColor="#EBF3FF"
                      />
                    )}
                    {profile.contactInfo.email && (
                      <ContactActionIcon
                        icon={<EmailIcon sx={{ fontSize: 24, color: '#2D6EF5' }} />}
                        label="Email"
                        onClick={() => handleContact('email', profile.contactInfo.email!)}
                        backgroundColor="#EBF3FF"
                      />
                    )}
                    {profile.contactInfo.phone && (
                      <ContactActionIcon
                        icon={<WhatsAppIcon sx={{ fontSize: 24, color: '#25D366' }} />}
                        label="Chat"
                        onClick={() => handleContact('whatsapp', profile.contactInfo.phone!)}
                        backgroundColor="#E8F8F0"
                      />
                    )}
                    {profile.contactInfo.address?.city && (
                      <ContactActionIcon
                        icon={<LocationIcon sx={{ fontSize: 24, color: '#F59E0B' }} />}
                        label="Map"
                        onClick={() => handleContact('location', '')}
                        backgroundColor="#FFF7ED"
                      />
                    )}
                  </Box>

                  {/* Save Contact Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<SaveContactIcon />}
                    onClick={() => setSaveModalOpen(true)}
                    sx={{
                      mb: 2,
                      height: 52,
                      fontSize: '1rem',
                      fontWeight: 600,
                      borderRadius: '12px',
                      textTransform: 'none',
                      backgroundColor: '#2D6EF5',
                      boxShadow: '0px 4px 12px rgba(45, 110, 245, 0.3)',
                      '&:hover': {
                        backgroundColor: '#1E5BE6',
                        boxShadow: '0px 6px 16px rgba(45, 110, 245, 0.4)',
                      },
                    }}
                  >
                    Save Contact
                  </Button>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                    {websiteLink && (
                      <ActionButton
                        icon={<WebsiteIcon sx={{ fontSize: 20 }} />}
                        label="Visit Website"
                        href={websiteLink.url}
                      />
                    )}
                    {portfolioLink && (
                      <ActionButton
                        icon={<FileIcon sx={{ fontSize: 20 }} />}
                        label="Company Portfolio"
                        href={portfolioLink.url}
                      />
                    )}
                    {profile.contactInfo.website && !websiteLink && (
                      <ActionButton
                        icon={<WebsiteIcon sx={{ fontSize: 20 }} />}
                        label="Visit Website"
                        href={profile.contactInfo.website}
                      />
                    )}
                    <ActionButton
                      icon={<CalendarIcon sx={{ fontSize: 20 }} />}
                      label="Book a Meeting"
                      onClick={() => trackEvent('click', { elementClicked: 'book_meeting' })}
                    />
                  </Box>

                  {/* Social Media Links */}
                  {(profile.socialLinks?.linkedin ||
                    profile.socialLinks?.instagram ||
                    profile.socialLinks?.twitter ||
                    profile.socialLinks?.github) && (
                    <>
                      <Typography
                        variant="overline"
                        sx={{
                          display: 'block',
                          textAlign: 'center',
                          color: '#9CA3AF',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          mb: 1.5,
                          letterSpacing: '0.05em',
                        }}
                      >
                        CONNECT
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          gap: 2,
                          mb: 3,
                        }}
                      >
                        {profile.socialLinks.linkedin && (
                          <IconButton
                            onClick={() => window.open(profile.socialLinks.linkedin, '_blank')}
                            sx={{
                              color: '#0A66C2',
                              '&:hover': { backgroundColor: 'rgba(10, 102, 194, 0.1)' },
                            }}
                          >
                            <LinkedIn sx={{ fontSize: 24 }} />
                          </IconButton>
                        )}
                        {profile.socialLinks.instagram && (
                          <IconButton
                            onClick={() => window.open(profile.socialLinks.instagram, '_blank')}
                            sx={{
                              color: '#E4405F',
                              '&:hover': { backgroundColor: 'rgba(228, 64, 95, 0.1)' },
                            }}
                          >
                            <Instagram sx={{ fontSize: 24 }} />
                          </IconButton>
                        )}
                        {profile.socialLinks.twitter && (
                          <IconButton
                            onClick={() => window.open(profile.socialLinks.twitter, '_blank')}
                            sx={{
                              color: '#1DA1F2',
                              '&:hover': { backgroundColor: 'rgba(29, 161, 242, 0.1)' },
                            }}
                          >
                            <Twitter sx={{ fontSize: 24 }} />
                          </IconButton>
                        )}
                        {profile.socialLinks.github && (
                          <IconButton
                            onClick={() => window.open(profile.socialLinks.github, '_blank')}
                            sx={{
                              color: '#333',
                              '&:hover': { backgroundColor: 'rgba(51, 51, 51, 0.1)' },
                            }}
                          >
                            <GitHub sx={{ fontSize: 24 }} />
                          </IconButton>
                        )}
                      </Box>
                    </>
                  )}

                  {/* Location Map */}
                  {profile.contactInfo.address?.city && (
                    <LocationMap
                      address={profile.contactInfo.address}
                      locationLabel={`${profile.contactInfo.address.city}${
                        profile.contactInfo.address.state ? ', ' + profile.contactInfo.address.state : ''
                      }`}
                    />
                  )}

                  {/* Footer Links */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 2,
                      mt: 4,
                      pt: 3,
                      borderTop: '1px solid #E5E7EB',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#9CA3AF',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        '&:hover': { color: '#6B7280' },
                      }}
                    >
                      Privacy Policy
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#E5E7EB' }}>
                      •
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#9CA3AF',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        '&:hover': { color: '#6B7280' },
                      }}
                    >
                      Report Profile
                    </Typography>
                  </Box>

                  {/* BBTap Branding */}
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#D1D5DB',
                        fontSize: '0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                      }}
                    >
                      ⚡ BBTap
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </motion.div>
          </Box>

          {/* Right Column - CTA (Desktop only) */}
          <Box
            sx={{
              display: { xs: 'none', lg: 'block' },
              width: 240,
              position: 'sticky',
              top: 80,
              height: 'fit-content',
            }}
          >
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Box
                sx={{
                  backgroundColor: '#1A1A1A',
                  borderRadius: '16px',
                  p: 3,
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: '#FFFFFF',
                    fontWeight: 700,
                    mb: 1,
                    fontSize: '1.125rem',
                  }}
                >
                  Create your profile
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#9CA3AF',
                    mb: 2.5,
                    fontSize: '0.875rem',
                  }}
                >
                  Get your own digital business card
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  endIcon={<span>→</span>}
                  sx={{
                    backgroundColor: '#FFFFFF',
                    color: '#1A1A1A',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#F3F4F6',
                    },
                  }}
                  onClick={() => (window.location.href = '/register')}
                >
                  Create your profile
                </Button>
              </Box>
            </motion.div>
          </Box>
        </Box>

        {/* Mobile QR Code - Show at bottom on mobile */}
        <Box
          sx={{
            display: { xs: 'flex', lg: 'none' },
            justifyContent: 'center',
            mt: 3,
          }}
        >
          <QRCodeCard url={profileUrl} size={160} />
        </Box>

        {/* Mobile CTA Button - Fixed at bottom */}
        <Box
          sx={{
            display: { xs: 'block', lg: 'none' },
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E5E7EB',
            boxShadow: '0px -4px 12px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Button
            fullWidth
            variant="contained"
            endIcon={<span>→</span>}
            sx={{
              backgroundColor: '#1A1A1A',
              color: '#FFFFFF',
              height: 48,
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#2D2D2D',
              },
            }}
            onClick={() => (window.location.href = '/register')}
          >
            Create your profile
          </Button>
        </Box>
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
