import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Avatar,
  Button,
  IconButton,
  Card,
  CardContent,
  Fab,
  useTheme,
  alpha,
  Skeleton,
  Tooltip,
  Zoom,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebsiteIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  YouTube as YouTubeIcon,
  GitHub as GitHubIcon,
  WhatsApp as WhatsAppIcon,
  Telegram as TelegramIcon,
  Share as ShareIcon,
  QrCode as QrCodeIcon,
  FileDownload as DownloadIcon,
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Lock as LockIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { publicAPI } from '../services/api';
import { Profile } from '../types';
import { motion } from 'framer-motion';
import { getContactSaveInstructions } from '../utils/vcard';

const PublicProfilePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { profileId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [contactSaved, setContactSaved] = useState(false);

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
          sessionStorage.setItem('sessionId', `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
        }
        
        // Determine source from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const source = urlParams.get('source') || 'direct';
        const ref = urlParams.get('ref') || document.referrer;
        
        // Check if this is an NFC tap
        if (source === 'nfc') {
          trackNFCTap();
        }
        
        // Fetch profile from API with source tracking
        const response = await publicAPI.getPublicProfile(profileId);
        
        if (response.success && response.data) {
          setProfile(response.data);
          
          // Generate QR code
          const profileUrl = window.location.href;
          setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(profileUrl)}`);
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

  // Analytics tracking functions
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
        }
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  };

  const trackNFCTap = () => {
    trackEvent('tap', {
      source: 'nfc',
      timestamp: new Date().toISOString()
    });
  };

  const trackSocialClick = (platform: string, url: string) => {
    trackEvent('click', {
      elementClicked: `social_${platform}`,
      destination: url,
      platform: platform
    });
  };

  const trackContactClick = (type: string, value: string) => {
    trackEvent('click', {
      elementClicked: `contact_${type}`,
      contactType: type,
      destination: value
    });
  };

  const trackShare = (method: string) => {
    trackEvent('share', {
      shareMethod: method,
      url: window.location.href
    });
  };

  const trackDownload = (downloadType: string) => {
    trackEvent('download', {
      downloadType: downloadType
    });
  };

  const getSocialIcon = (platform: string) => {
    const iconProps = { sx: { fontSize: 24 } };
    switch (platform) {
      case 'linkedin': return <LinkedInIcon {...iconProps} />;
      case 'twitter': return <TwitterIcon {...iconProps} />;
      case 'instagram': return <InstagramIcon {...iconProps} />;
      case 'facebook': return <FacebookIcon {...iconProps} />;
      case 'github': return <GitHubIcon {...iconProps} />;
      case 'youtube': return <YouTubeIcon {...iconProps} />;
      case 'whatsapp': return <WhatsAppIcon {...iconProps} />;
      case 'telegram': return <TelegramIcon {...iconProps} />;
      default: return <WebsiteIcon {...iconProps} />;
    }
  };

  const getSocialIconUrl = (platform: string) => {
    const iconUrls = {
      linkedin: 'https://cdn-icons-png.flaticon.com/512/174/174857.png',
      twitter: 'https://cdn-icons-png.flaticon.com/512/733/733579.png',
      instagram: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png',
      facebook: 'https://cdn-icons-png.flaticon.com/512/733/733547.png',
      github: 'https://cdn-icons-png.flaticon.com/512/733/733553.png',
      youtube: 'https://cdn-icons-png.flaticon.com/512/733/733646.png',
      whatsapp: 'https://cdn-icons-png.flaticon.com/512/733/733585.png',
      telegram: 'https://cdn-icons-png.flaticon.com/512/2111/2111646.png',
    };
    return iconUrls[platform as keyof typeof iconUrls] || 'https://cdn-icons-png.flaticon.com/512/684/684908.png';
  };

  const getSocialColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      linkedin: '#0077b5',
      twitter: '#1da1f2',
      instagram: '#e4405f',
      facebook: '#1877f2',
      github: '#374151', // Charcoal from design system
      youtube: '#ff0000',
      whatsapp: '#10B981', // Success Green from design system
      telegram: '#00A3B5', // Accent Teal from design system
    };
    return colors[platform] || '#53565A'; // Brand primary fallback
  };

  const handleContact = (type: string, value: string) => {
    // Track contact interaction
    trackContactClick(type, value);
    
    switch (type) {
      case 'email':
        window.open(`mailto:${value}`);
        break;
      case 'phone':
        window.open(`tel:${value}`);
        break;
      case 'website':
        window.open(value, '_blank');
        break;
      default:
        window.open(value, '_blank');
    }
  };

  const handleSocialClick = (platform: string, url: string) => {
    // Track social media click
    trackSocialClick(platform, url);
    window.open(url, '_blank');
  };

  const handleSaveContact = async () => {
    if (!profile || !profileId) return;
    
    try {
      // Track download event
      trackDownload('vcard');
      
      // Generate vCard data
      const { profileToVCard, generateVCard, generateSimpleVCard } = await import('../utils/vcard');
      const vCardData = profileToVCard(profile);
      
      // Use simplified vCard for mobile devices for better compatibility
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const vCardContent = isMobile ? generateSimpleVCard(vCardData) : generateVCard(vCardData);
      const fileName = `${profile.personalInfo.firstName}_${profile.personalInfo.lastName}.vcf`;
      
      // Check if Web Share API is available and can share files
      if (navigator.share && navigator.canShare) {
        // Create a file object
        const file = new File([vCardContent], fileName, { type: 'text/vcard' });
        
        // Check if the device can share this file
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`,
              text: 'Contact Card'
            });
            
            // Show success feedback
            setContactSaved(true);
            setTimeout(() => setContactSaved(false), 3000);
            return;
          } catch (shareError) {
            // User cancelled or share failed
            console.log('Share cancelled or failed:', shareError);
          }
        }
      }
      
      // Fallback for devices without Web Share API or desktop
      const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      
      // For iOS devices, try to open directly
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        // Create an anchor tag and simulate click
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
      } else {
        // Standard download for other devices
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 100);
      }
      
      // Show success feedback
      setContactSaved(true);
      setTimeout(() => setContactSaved(false), 3000);
      
    } catch (error) {
      console.error('Failed to save contact:', error);
      
      // Final fallback - use API endpoint
      try {
        const blob = await publicAPI.downloadVCard(profileId);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${profile.personalInfo.firstName}_${profile.personalInfo.lastName}.vcf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setContactSaved(true);
        setTimeout(() => setContactSaved(false), 3000);
      } catch (fallbackError) {
        console.error('All methods failed:', fallbackError);
        alert('Unable to save contact. Please try again.');
      }
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
        // Use native share API
        await navigator.share(shareData);
        trackShare('native');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        trackShare('clipboard');
        // You could show a toast notification here
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
          background: '#F9FAFB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Container maxWidth="sm">
          <Alert 
            severity="error" 
            sx={{ 
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <AlertTitle sx={{ fontWeight: 600 }}>Access Denied</AlertTitle>
            {error}
          </Alert>
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard')}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                minHeight: 44,
                backgroundColor: theme.palette.secondary.main,
                color: '#FFFFFF',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                '&:hover': {
                  backgroundColor: theme.palette.secondary.dark,
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                },
                transition: 'all 150ms ease-out',
              }}
            >
              Back to Dashboard
            </Button>
          </Box>
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
          background: '#F9FAFB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, sm: 3 },
        }}
      >
        <Container maxWidth="sm">
          <Card
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #E5E7EB',
            }}
          >
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Skeleton variant="circular" width={120} height={120} sx={{ mx: 'auto', mb: 2 }} />
              <Skeleton variant="text" width="60%" height={32} sx={{ mx: 'auto', mb: 1 }} />
              <Skeleton variant="text" width="80%" height={24} sx={{ mx: 'auto', mb: 3 }} />
              <Skeleton variant="rectangular" width="100%" height={80} sx={{ mb: 3 }} />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} variant="circular" width={48} height={48} />
                ))}
              </Box>
            </Box>
          </Card>
        </Container>
      </Box>
    );
  }

  // Don't render anything if profile is null
  if (!profile) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card
            sx={{
              maxWidth: 400,
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: 3,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              border: '1px solid #bfbfbf',
              position: 'relative',
            }}
          >
            {/* Watermarked logo in center of card */}
            {profile.customization?.logo && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '60%',
                  height: '60%',
                  opacity: 0.05,
                  backgroundImage: `url(${profile.customization.logo})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  backgroundSize: 'contain',
                  zIndex: 1,
                  pointerEvents: 'none',
                }}
              />
            )}
            {/* Header Section */}
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              {/* Wave background */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  '& svg': {
                    width: '100%',
                    height: '100%',
                    display: 'block',
                  },
                }}
              >
                <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0,100 C25,50 75,50 100,0 L100,0 L0,0 Z" fill="#FEC72D" />
                </svg>
              </Box>
              {/* Content */}
              <Box sx={{ position: 'relative', p: 3, textAlign: 'center' }}>
                <motion.div whileHover={{ scale: 1.1 }}>
                  <Avatar
                    src={profile.personalInfo?.profilePhoto}
                    sx={{
                      width: 128,
                      height: 128,
                      mx: 'auto',
                      border: '4px solid #b59a3b',
                      fontSize: '3rem',
                      fontWeight: 600,
                    }}
                  >
                    {profile.personalInfo.firstName?.charAt(0) || 'U'}
                  </Avatar>
                </motion.div>
                <Typography
                  variant="h4"
                  sx={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: '#2d2d2d',
                    mt: 2,
                  }}
                >
                  {profile.personalInfo.firstName} {profile.personalInfo.lastName}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#707070',
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  }}
                >
                  {profile.personalInfo.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#505050',
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    mt: 2,
                  }}
                >
                  {profile.contactInfo?.address?.city || 'Location not specified'}
                </Typography>
                {/* Social Links */}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                  {Object.entries(profile.socialLinks || {})
                    .filter(([platform, url]) => {
                      if (typeof url === 'string') {
                        return url && url.trim() !== '';
                      }
                      return false;
                    })
                    .map(([platform, url]) => (
                      <Box
                        key={platform}
                        onClick={() => handleSocialClick(platform, url as string)}
                        sx={{
                          width: 24,
                          height: 24,
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.1)',
                          },
                        }}
                      >
                        <Box
                          component="img"
                          src={getSocialIconUrl(platform)}
                          alt={platform}
                          sx={{
                            width: 24,
                            height: 24,
                            objectFit: 'contain',
                          }}
                        />
                      </Box>
                    ))}
                </Box>
              </Box>
            </Box>

            {/* About Me Section */}
            <Box sx={{ borderTop: '1px solid #bfbfbf', px: 3, py: 2, position: 'relative', zIndex: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#2d2d2d',
                  mb: 1,
                }}
              >
                About Me
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.75rem',
                  color: '#505050',
                  lineHeight: 1.5,
                }}
              >
                {profile.personalInfo.bio || 'Tech entrepreneur passionate about empowering others through digital innovation.'}
              </Typography>
            </Box>

            {/* Contact Info Section */}
            <Box sx={{ borderTop: '1px solid #bfbfbf', px: 3, py: 2, position: 'relative', zIndex: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#2d2d2d',
                  mb: 1,
                }}
              >
                Contact Info
              </Typography>
              <Box sx={{ fontSize: '0.75rem', color: '#505050', '& > div': { mb: 0.5 } }}>
                {profile.contactInfo?.phone && (
                  <Box
                    onClick={() => handleContact('phone', profile.contactInfo.phone!)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { color: '#b59a3b' },
                      transition: 'color 0.2s'
                    }}
                  >
                    <Typography component="span" sx={{ fontWeight: 500 }}>Phone:</Typography>{' '}
                    {profile.contactInfo.phone}
                  </Box>
                )}
                {profile.contactInfo?.email && (
                  <Box
                    onClick={() => handleContact('email', profile.contactInfo.email!)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { color: '#b59a3b' },
                      transition: 'color 0.2s'
                    }}
                  >
                    <Typography component="span" sx={{ fontWeight: 500 }}>Email:</Typography>{' '}
                    {profile.contactInfo.email}
                  </Box>
                )}
                {profile.contactInfo?.website && (
                  <Box
                    onClick={() => handleContact('website', profile.contactInfo.website!)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { color: '#b59a3b' },
                      transition: 'color 0.2s'
                    }}
                  >
                    <Typography component="span" sx={{ fontWeight: 500 }}>Website:</Typography>{' '}
                    {profile.contactInfo.website}
                  </Box>
                )}
              </Box>
            </Box>

            {/* Business Hours Section */}
            {profile.sections?.showHours && (
              <Box sx={{ borderTop: '1px solid #bfbfbf', px: 3, py: 2, position: 'relative', zIndex: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#2d2d2d',
                    mb: 1,
                  }}
                >
                  Business Hours
                </Typography>
                <Box sx={{ fontSize: '0.75rem', color: '#505050' }}>
                  {profile.businessHours && profile.businessHours.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                      {profile.businessHours
                        .sort((a, b) => {
                          const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                          return daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day);
                        })
                        .map((hour, index) => (
                          <Box 
                            key={index} 
                            sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              minHeight: '16px'
                            }}
                          >
                            <Typography 
                              component="span" 
                              sx={{ 
                                fontWeight: 500,
                                minWidth: '70px',
                                fontSize: '0.75rem'
                              }}
                            >
                              {hour.day.charAt(0).toUpperCase() + hour.day.slice(1)}:
                            </Typography>
                            <Typography 
                              component="span" 
                              sx={{ 
                                fontSize: '0.75rem',
                                textAlign: 'right',
                                flex: 1,
                                ml: 1
                              }}
                            >
                              {hour.isOpen ? (
                                hour.openTime && hour.closeTime ? (
                                  `${hour.openTime} – ${hour.closeTime}`
                                ) : (
                                  'Open'
                                )
                              ) : (
                                'Closed'
                              )}
                            </Typography>
                          </Box>
                        ))}
                    </Box>
                  ) : (
                    <Typography sx={{ fontSize: '0.75rem', color: '#888', fontStyle: 'italic' }}>
                      Business hours not set
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            {/* QR Code Section */}
            <Box sx={{ borderTop: '1px solid #bfbfbf', px: 3, py: 2, textAlign: 'center', position: 'relative', zIndex: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#2d2d2d',
                  mb: 1,
                }}
              >
                Scan My QR
              </Typography>
              <motion.div whileHover={{ scale: 1.1 }}>
                <Box
                  component="img"
                  src={qrCode}
                  alt="QR Code"
                  sx={{
                    width: 96,
                    height: 96,
                    mx: 'auto',
                  }}
                />
              </motion.div>
            </Box>

            {/* Action Buttons Section */}
            <Box sx={{ borderTop: '1px solid #bfbfbf', px: 3, py: 2, textAlign: 'center', position: 'relative', zIndex: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#2d2d2d',
                  mb: 2,
                }}
              >
                Connect With Me
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'center', 
                flexWrap: 'wrap',
                mt: 2,
                alignItems: 'center'
              }}>
                <Button
                  onClick={handleSaveContact}
                  startIcon={<DownloadIcon />}
                  sx={{
                    px: { xs: 2.5, sm: 3 },
                    py: { xs: 1.2, sm: 1.5 },
                    backgroundColor: '#b59a3b',
                    color: 'white',
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    fontWeight: 600,
                    borderRadius: 25,
                    textTransform: 'none',
                    minWidth: { xs: '120px', sm: '140px' },
                    flex: { xs: '1 1 auto', sm: '0 0 auto' },
                    maxWidth: { xs: '160px', sm: 'none' },
                    boxShadow: '0 2px 8px rgba(181, 154, 59, 0.3)',
                    '&:hover': {
                      backgroundColor: '#8c752c',
                      boxShadow: '0 4px 12px rgba(181, 154, 59, 0.4)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Save Contact
                </Button>
                <Button
                  onClick={handleShare}
                  startIcon={<ShareIcon />}
                  sx={{
                    px: { xs: 2.5, sm: 3 },
                    py: { xs: 1.2, sm: 1.5 },
                    backgroundColor: theme.palette.secondary.main,
                    color: 'white',
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    fontWeight: 600,
                    borderRadius: 25,
                    textTransform: 'none',
                    minWidth: { xs: '120px', sm: '140px' },
                    flex: { xs: '1 1 auto', sm: '0 0 auto' },
                    maxWidth: { xs: '160px', sm: 'none' },
                    boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.3)}`,
                    '&:hover': {
                      backgroundColor: theme.palette.secondary.dark,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.4)}`,
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Share Profile
                </Button>
              </Box>
              
              {/* Success message for contact save */}
              {contactSaved && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert 
                    severity="success" 
                    sx={{ 
                      mt: 3, 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      borderRadius: 2,
                      mx: 2,
                      boxShadow: '0 2px 8px rgba(76, 175, 80, 0.15)'
                    }}
                  >
                    <AlertTitle sx={{ fontSize: '0.875rem', mb: 0.5 }}>Contact Saved!</AlertTitle>
                    {getContactSaveInstructions()}
                  </Alert>
                </motion.div>
              )}
            </Box>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
};

export default PublicProfilePage;