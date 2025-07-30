import React from 'react';
import { Box, Container, Typography, Button, Grid, Card, CardContent, useTheme, alpha, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TapAndPlayIcon from '@mui/icons-material/TapAndPlay';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import BrushIcon from '@mui/icons-material/Brush';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  
  const features = [
    {
      icon: <BrushIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />,
      title: 'Easy Creation',
      description: 'Design beautiful digital business cards in minutes with our intuitive editor.',
    },
    {
      icon: <TapAndPlayIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />,
      title: 'NFC Technology',
      description: 'Share your card instantly with a simple tap using NFC-enabled devices.',
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />,
      title: 'Analytics',
      description: 'Track views, clicks, and engagement with detailed analytics.',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
          pt: { xs: 6, md: 10 },
          pb: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Chip 
                label="The Future of Networking" 
                color="primary" 
                size="small"
                sx={{ mb: 3, fontWeight: 500 }}
              />
              <Typography 
                component="h1" 
                variant="h1" 
                gutterBottom
                sx={{
                  fontSize: { xs: '36px', md: '48px' },
                  lineHeight: { xs: '40px', md: '52px' },
                  fontWeight: 700,
                }}
              >
                Digital Business Cards for the Modern Professional
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                paragraph
                sx={{ 
                  fontSize: '18px',
                  lineHeight: '28px',
                  mb: 4,
                  maxWidth: '540px',
                }}
              >
                Create, share, and track your professional digital business cards with NFC technology. 
                Make lasting connections in seconds.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {user ? (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/dashboard')}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate('/register')}
                      endIcon={<ArrowForwardIcon />}
                    >
                      Get Started Free
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/login')}
                    >
                      Sign In
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box 
                sx={{ 
                  position: 'relative',
                  textAlign: 'center',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80%',
                    height: '80%',
                    background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
                    borderRadius: '50%',
                    filter: 'blur(40px)',
                  }
                }}
              >
                <img
                  src="https://via.placeholder.com/500x400/1B365F/FFFFFF?text=NFC+Business+Card"
                  alt="Digital Business Card"
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto',
                    borderRadius: theme.shape.borderRadius * 2,
                    boxShadow: theme.shadows[10],
                    position: 'relative',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="overline" 
              color="primary.main"
              sx={{ fontWeight: 600, letterSpacing: 1.5 }}
            >
              Why Choose Us
            </Typography>
            <Typography 
              variant="h2" 
              component="h2" 
              gutterBottom
              sx={{ mt: 1, fontWeight: 700 }}
            >
              Everything You Need to Network Digitally
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ maxWidth: '600px', mx: 'auto' }}
            >
              Our platform provides all the tools you need to create, share, and manage 
              your professional digital presence.
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    transition: theme.transitions.create(['transform', 'box-shadow']),
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 5 }}>
                    <Box sx={{ mb: 3 }}>
                      {feature.icon}
                    </Box>
                    <Typography 
                      variant="h3" 
                      component="h3" 
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;