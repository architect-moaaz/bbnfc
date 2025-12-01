import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Avatar,
  Button,
  IconButton,
  Card,
  Skeleton,
  Alert,
  AlertTitle,
  Divider,
  Chip,
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
  LinkedIn as LinkedInIcon,
  Instagram as InstagramIcon,
  Twitter as TwitterIcon,
  GitHub as GitHubIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { publicAPI } from '../services/api';
import { Profile } from '../types';
import { motion } from 'framer-motion';
import SaveContactModal from '../components/SaveContactModal';

const PublicProfilePageNew: React.FC = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
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

          // Generate QR code
          const profileUrl = window.location.href;
          setQrCode(
            `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`
          );
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
        window.open(`https://maps.google.com/?q=${encodeURIComponent(value)}`, '_blank');
        break;
      default:
        window.open(value, '_blank');
    }
  };

  const handleSocialClick = (platform: string, url: string) => {
    trackEvent('click', { elementClicked: `social_${platform}`, platform });
    window.open(url, '_blank');
  };

  const handleSaveContact = async () => {
    if (!profile || !profileId) return;

    trackEvent('download', { downloadType: 'vcard' });

    try {
      const { profileToVCard, generateMinimalVCard } = await import('../utils/vcard');
      const vCardData = profileToVCard(profile);
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const vCardContent = generateMinimalVCard(vCardData);
      const fileName = `${profile.personalInfo.firstName}_${profile.personalInfo.lastName}.vcf`;

      const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Failed to save contact:', error);
      alert('Unable to save contact. Please try again.');
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
          background: 'linear-gradient(135deg, #E0E7FF 0%, #F9FAFB 100%)',
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
          background: 'linear-gradient(135deg, #E0E7FF 0%, #F9FAFB 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, sm: 3 },
        }}
      >
        <Container maxWidth="sm">
          <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 6 }}>
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Skeleton variant="circular" width={120} height={120} sx={{ mx: 'auto', mb: 2 }} />
              <Skeleton variant="text" width="60%" height={32} sx={{ mx: 'auto', mb: 1 }} />
              <Skeleton variant="text" width="80%" height={24} sx={{ mx: 'auto', mb: 3 }} />
              <Skeleton variant="rectangular" width="100%" height={80} sx={{ mb: 3 }} />
            </Box>
          </Card>
        </Container>
      </Box>
    );
  }

  if (!profile) return null;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #E0E7FF 0%, #F9FAFB 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 6 },
      }}
    >
      <Container maxWidth="sm">
        {/* QR Code on left (hidden on mobile) */}
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'fixed',
            left: 60,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card
              sx={{
                p: 2,
                textAlign: 'center',
                borderRadius: 2,
                boxShadow: 2,
              }}
            >
              <Box component="img" src={qrCode} alt="QR Code" sx={{ width: 120, height: 120 }} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontSize: '0.7rem' }}>
                Scan to save on mobile
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', opacity: 0.7 }}>
                Compatible with iOS & Android
              </Typography>
            </Card>
          </motion.div>
        </Box>

        {/* Main Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card
            sx={{
              maxWidth: 500,
              width: '100%',
              mx: 'auto',
              borderRadius: 4,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Share Button */}
            <IconButton
              onClick={handleShare}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                zIndex: 10,
                '&:hover': {
                  bgcolor: 'white',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s',
                boxShadow: 2,
              }}
            >
              <ShareIcon />
            </IconButton>

            {/* Cover Section */}
            <Box
              sx={{
                height: 180,
                background: profile.personalInfo.coverImage
                  ? `url(${profile.personalInfo.coverImage})`
                  : 'linear-gradient(135deg, #007BFF 0%, #0056B3 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
              }}
            >
              {/* Profile Photo */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -50,
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
              >
                <Avatar
                  src={profile.personalInfo.profilePhoto}
                  sx={{
                    width: 100,
                    height: 100,
                    border: '5px solid white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    fontSize: '2.5rem',
                    fontWeight: 600,
                  }}
                >
                  {profile.personalInfo.firstName?.charAt(0)}
                </Avatar>
                {/* Online Status Indicator */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    width: 16,
                    height: 16,
                    bgcolor: 'success.main',
                    borderRadius: '50%',
                    border: '3px solid white',
                  }}
                />
              </Box>
            </Box>

            {/* Profile Content */}
            <Box sx={{ pt: 8, px: 3, pb: 3 }}>
              {/* Name and Title */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {profile.personalInfo.firstName} {profile.personalInfo.lastName}
                </Typography>
                <Typography variant="body1" color="primary.main" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {profile.personalInfo.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Box component="span" sx={{ fontSize: 16 }}>
                    🏢
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {profile.personalInfo.company}
                  </Typography>
                </Box>

                {/* Bio */}
                {profile.personalInfo.bio && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 2, lineHeight: 1.7, px: 2 }}
                  >
                    {profile.personalInfo.bio}
                  </Typography>
                )}
              </Box>

              {/* Contact Actions */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'center',
                  mb: 3,
                  flexWrap: 'wrap',
                }}
              >
                {profile.contactInfo?.phone && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Box
                      onClick={() => handleContact('phone', profile.contactInfo.phone!)}
                      sx={{
                        textAlign: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          bgcolor: '#007BFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: '0 6px 16px rgba(0, 123, 255, 0.4)',
                          },
                        }}
                      >
                        <PhoneIcon sx={{ fontSize: 24 }} />
                      </Box>
                      <Typography variant="caption" sx={{ mt: 0.5, display: 'block', fontWeight: 500 }}>
                        Call
                      </Typography>
                    </Box>
                  </motion.div>
                )}

                {profile.contactInfo?.email && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Box
                      onClick={() => handleContact('email', profile.contactInfo.email!)}
                      sx={{
                        textAlign: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          bgcolor: '#0284C7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: '0 6px 16px rgba(2, 132, 199, 0.4)',
                          },
                        }}
                      >
                        <EmailIcon sx={{ fontSize: 24 }} />
                      </Box>
                      <Typography variant="caption" sx={{ mt: 0.5, display: 'block', fontWeight: 500 }}>
                        Email
                      </Typography>
                    </Box>
                  </motion.div>
                )}

                {profile.contactInfo?.whatsapp && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Box
                      onClick={() => handleContact('whatsapp', profile.contactInfo.whatsapp!)}
                      sx={{
                        textAlign: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          bgcolor: '#10B981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
                          },
                        }}
                      >
                        <WhatsAppIcon sx={{ fontSize: 24 }} />
                      </Box>
                      <Typography variant="caption" sx={{ mt: 0.5, display: 'block', fontWeight: 500 }}>
                        Chat
                      </Typography>
                    </Box>
                  </motion.div>
                )}

                {profile.contactInfo?.address && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Box
                      onClick={() =>
                        handleContact(
                          'location',
                          `${profile.contactInfo.address?.city}, ${profile.contactInfo.address?.country}`
                        )
                      }
                      sx={{
                        textAlign: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          bgcolor: '#F97316',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: '0 6px 16px rgba(249, 115, 22, 0.4)',
                          },
                        }}
                      >
                        <LocationIcon sx={{ fontSize: 24 }} />
                      </Box>
                      <Typography variant="caption" sx={{ mt: 0.5, display: 'block', fontWeight: 500 }}>
                        Map
                      </Typography>
                    </Box>
                  </motion.div>
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
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.5,
                  mb: 2,
                  boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(0, 123, 255, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                Save Contact
              </Button>

              {/* Custom Links */}
              {profile.contactInfo?.website && (
                <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<WebsiteIcon />}
                    onClick={() => handleContact('website', profile.contactInfo.website!)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      py: 1.5,
                      justifyContent: 'flex-start',
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        bgcolor: 'primary.50',
                      },
                    }}
                  >
                    <Box sx={{ flex: 1, textAlign: 'left' }}>Visit Website</Box>
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      →
                    </Typography>
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FileIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      py: 1.5,
                      justifyContent: 'flex-start',
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        bgcolor: 'error.50',
                        borderColor: 'error.main',
                        color: 'error.main',
                      },
                    }}
                  >
                    <Box sx={{ flex: 1, textAlign: 'left' }}>Company Portfolio</Box>
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      →
                    </Typography>
                  </Button>
                </Box>
              )}

              {/* Social Links */}
              {(profile.socialLinks?.linkedin ||
                profile.socialLinks?.instagram ||
                profile.socialLinks?.twitter ||
                profile.socialLinks?.github) && (
                <>
                  <Divider sx={{ my: 3 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600, px: 2 }}
                    >
                      CONNECT
                    </Typography>
                  </Divider>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    {profile.socialLinks?.linkedin && (
                      <IconButton
                        onClick={() => handleSocialClick('linkedin', profile.socialLinks.linkedin!)}
                        sx={{
                          bgcolor: '#0077B5',
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#006399',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0, 119, 181, 0.3)',
                          },
                          transition: 'all 0.2s',
                        }}
                      >
                        <LinkedInIcon />
                      </IconButton>
                    )}
                    {profile.socialLinks?.instagram && (
                      <IconButton
                        onClick={() => handleSocialClick('instagram', profile.socialLinks.instagram!)}
                        sx={{
                          bgcolor: '#E4405F',
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#D62952',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(228, 64, 95, 0.3)',
                          },
                          transition: 'all 0.2s',
                        }}
                      >
                        <InstagramIcon />
                      </IconButton>
                    )}
                    {profile.socialLinks?.twitter && (
                      <IconButton
                        onClick={() => handleSocialClick('twitter', profile.socialLinks.twitter!)}
                        sx={{
                          bgcolor: '#1DA1F2',
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#1A8CD8',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(29, 161, 242, 0.3)',
                          },
                          transition: 'all 0.2s',
                        }}
                      >
                        <TwitterIcon />
                      </IconButton>
                    )}
                    {profile.socialLinks?.github && (
                      <IconButton
                        onClick={() => handleSocialClick('github', profile.socialLinks.github!)}
                        sx={{
                          bgcolor: '#333',
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#24292e',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                          },
                          transition: 'all 0.2s',
                        }}
                      >
                        <GitHubIcon />
                      </IconButton>
                    )}
                  </Box>
                </>
              )}
            </Box>

            {/* Footer */}
            <Box
              sx={{
                py: 2,
                px: 3,
                bgcolor: '#F9FAFB',
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Privacy Policy
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  •
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Report Profile
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                ⚡ BBTap
              </Typography>
            </Box>
          </Card>
        </motion.div>

        {/* CTA for creating profile */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                bgcolor: '#1F2937',
                color: 'white',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                '&:hover': {
                  bgcolor: '#111827',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s',
              }}
            >
              Create your profile →
            </Button>
          </Box>
        </motion.div>
      </Container>

      {/* Save Contact Modal */}
      <SaveContactModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        profile={profile}
        onDownload={handleSaveContact}
      />
    </Box>
  );
};

export default PublicProfilePageNew;
