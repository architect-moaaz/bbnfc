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
  Close as CloseIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  ArrowBack as ArrowBackIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profilesAPI } from '../services/api';
import { Profile } from '../types';
import { motion } from 'framer-motion';
import { downloadVCard, profileToVCard, getContactSaveInstructions } from '../utils/vcard';

const PreviewProfilePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [contactSaved, setContactSaved] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!id) {
        setError('Profile not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch profile from API
        const response = await profilesAPI.getProfile(id);
        
        if (response.success && response.data) {
          setProfile(response.data);
          
          // Generate QR code for preview
          const profileUrl = `${window.location.origin}/p/${response.data._id || response.data.id}`;
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
  }, [id, user?.id]);

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
      github: '#374151',
      youtube: '#ff0000',
      whatsapp: '#10B981',
      telegram: '#00A3B5',
    };
    return colors[platform] || '#374151';
  };

  const handleContact = (type: string, value: string) => {
    switch (type) {
      case 'email':
        window.location.href = `mailto:${value}`;
        break;
      case 'phone':
        window.location.href = `tel:${value}`;
        break;
      case 'website':
        window.open(value.startsWith('http') ? value : `https://${value}`, '_blank');
        break;
      default:
        break;
    }
  };

  const handleSocialClick = (platform: string, url: string) => {
    window.open(url, '_blank');
  };

  const handleSaveContact = async () => {
    if (!profile) return;
    
    try {
      // Convert profile to vCard and download
      const vCardData = profileToVCard(profile);
      downloadVCard(vCardData);
      
      // Show success feedback
      setContactSaved(true);
      setTimeout(() => setContactSaved(false), 3000);
      
    } catch (error) {
      console.error('Failed to save contact:', error);
    }
  };


  // Error state
  if (error) {
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
          <Alert 
            severity="error" 
            sx={{ 
              borderRadius: 3,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <AlertTitle sx={{ fontWeight: 600 }}>Preview Error</AlertTitle>
            {error}
          </Alert>
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/profiles')}
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
              Back to Profiles
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
          background: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Container maxWidth="sm">
          <Card
            sx={{
              maxWidth: 400,
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: 3,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              border: '1px solid #bfbfbf',
            }}
          >
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Skeleton variant="circular" width={128} height={128} sx={{ mx: 'auto', mb: 2 }} />
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
          {/* Close Preview Button */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 10,
            }}
          >
            <Button
              variant="contained"
              startIcon={<CloseIcon />}
              onClick={() => navigate('/profiles')}
              sx={{
                borderRadius: 2,
                px: 2,
                py: 1,
                minHeight: 36,
                backgroundColor: theme.palette.secondary.main,
                color: '#FFFFFF',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                '&:hover': {
                  backgroundColor: theme.palette.secondary.dark,
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                },
                transition: 'all 150ms ease-out',
              }}
            >
              Close
            </Button>
          </Box>

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
                        component="a"
                        href={url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          width: 24,
                          height: 24,
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
                  <Box>
                    <Typography component="span" sx={{ fontWeight: 500 }}>Phone:</Typography>{' '}
                    {profile.contactInfo.phone}
                  </Box>
                )}
                {profile.contactInfo?.email && (
                  <Box>
                    <Typography component="span" sx={{ fontWeight: 500 }}>Email:</Typography>{' '}
                    {profile.contactInfo.email}
                  </Box>
                )}
                {profile.contactInfo?.website && (
                  <Box>
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

            {/* NFC Action Section */}
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
                Tap for NFC Action
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'row',
                gap: 2, 
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap',
                mt: 2
              }}>
                <Button
                  onClick={() => {
                    const profileUrl = `${window.location.origin}/p/${profile._id || profile.id}`;
                    window.open(profileUrl, '_blank');
                  }}
                  sx={{
                    px: { xs: 2.5, sm: 3 },
                    py: { xs: 1.2, sm: 1.5 },
                    backgroundColor: '#b59a3b',
                    color: 'white',
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    fontWeight: 600,
                    borderRadius: 25,
                    textTransform: 'none',
                    minWidth: { xs: '130px', sm: '160px' },
                    flex: { xs: '1 1 auto', sm: '0 0 auto' },
                    maxWidth: { xs: '170px', sm: 'none' },
                    boxShadow: '0 2px 8px rgba(181, 154, 59, 0.3)',
                    '&:hover': {
                      backgroundColor: '#8c752c',
                      boxShadow: '0 4px 12px rgba(181, 154, 59, 0.4)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Open My Profile
                </Button>
                
                <Button
                  onClick={handleSaveContact}
                  startIcon={<DownloadIcon />}
                  sx={{
                    px: { xs: 2.5, sm: 3 },
                    py: { xs: 1.2, sm: 1.5 },
                    backgroundColor: theme.palette.secondary.main,
                    color: 'white',
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    fontWeight: 600,
                    borderRadius: 25,
                    textTransform: 'none',
                    minWidth: { xs: '130px', sm: '160px' },
                    flex: { xs: '1 1 auto', sm: '0 0 auto' },
                    maxWidth: { xs: '170px', sm: 'none' },
                    boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.3)}`,
                    '&:hover': {
                      backgroundColor: theme.palette.secondary.dark,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.4)}`,
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Save Contact
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

export default PreviewProfilePage;