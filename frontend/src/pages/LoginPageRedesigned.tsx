import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  IconButton,
  InputAdornment,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import NatureIcon from '@mui/icons-material/Nature';

interface LocationState {
  from?: {
    pathname: string;
  };
}

const LoginPageRedesigned: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const state = location.state as LocationState;
  const from = state?.from?.pathname || '/dashboard';

  const handleInputChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#F0F4F8',
      }}
    >
      {/* Left Side - Marketing Content */}
      {!isMobile && (
        <Box
          sx={{
            flex: 1,
            background: 'linear-gradient(135deg, #E8F4FD 0%, #F0F9FF 100%)',
            p: 8,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Main Heading */}
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              fontSize: '3rem',
              lineHeight: 1.2,
              mb: 3,
              color: '#1A1A1A',
            }}
          >
            Connect smarter with
            <br />
            <span style={{ color: '#2D6EF5' }}>Digital Business Cards</span>
          </Typography>

          {/* Description */}
          <Typography
            variant="body1"
            sx={{
              fontSize: '1.125rem',
              color: '#6B7280',
              mb: 6,
              lineHeight: 1.6,
              maxWidth: 500,
            }}
          >
            Scan the QR code or tap your phone to instantly save contact details,
            view portfolios, and schedule meetings.
          </Typography>

          {/* QR Code Card */}
          <Box
            sx={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              p: 3,
              maxWidth: 280,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              mb: 6,
            }}
          >
            <Box
              sx={{
                backgroundColor: '#1A1A1A',
                borderRadius: '12px',
                p: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              {/* QR Code Placeholder */}
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '2rem',
                  color: '#1A1A1A',
                }}
              >
                QR
              </Box>
            </Box>
            <Typography
              variant="caption"
              sx={{
                color: '#6B7280',
                fontSize: '0.875rem',
                textAlign: 'center',
                display: 'block',
              }}
            >
              Scan to View on Mobile
            </Typography>
          </Box>

          {/* Features List */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <NatureIcon sx={{ fontSize: 20, color: '#10B981' }} />
              </Box>
              <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500, color: '#4B5563' }}>
                Eco-friendly solution
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FlashOnIcon sx={{ fontSize: 20, color: '#F59E0B' }} />
              </Box>
              <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500, color: '#4B5563' }}>
                Instant contact sharing
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  backgroundColor: 'rgba(45, 110, 245, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 20, color: '#2D6EF5' }} />
              </Box>
              <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500, color: '#4B5563' }}>
                Always up-to-date
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Right Side - Login Form */}
      <Box
        sx={{
          flex: isMobile ? 1 : '0 0 500px',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Logo/Title */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                backgroundColor: '#2D6EF5',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: '#FFFFFF',
                fontSize: '1.5rem',
                mx: 'auto',
                mb: 3,
              }}
            >
              B
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                fontSize: '1.75rem',
                mb: 1,
                color: '#1A1A1A',
              }}
            >
              Sign In
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#6B7280',
                fontSize: '0.9375rem',
              }}
            >
              Welcome back! Please enter your details
            </Typography>
          </Box>

          {/* Error Message */}
          {error && (
            <Box
              sx={{
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                p: 2,
                borderRadius: '12px',
                mb: 3,
                fontSize: '0.875rem',
              }}
            >
              {error}
            </Box>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              disabled={loading}
              required
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              disabled={loading}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />

            <Box sx={{ textAlign: 'right', mb: 3 }}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                sx={{
                  color: '#2D6EF5',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                height: 52,
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9375rem',
                mb: 3,
                backgroundColor: '#2D6EF5',
                boxShadow: '0 4px 12px rgba(45, 110, 245, 0.3)',
                '&:hover': {
                  backgroundColor: '#1E5BE6',
                  boxShadow: '0 6px 16px rgba(45, 110, 245, 0.4)',
                },
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#6B7280',
                  fontSize: '0.9375rem',
                }}
              >
                Don't have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{
                    color: '#2D6EF5',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign Up
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPageRedesigned;
