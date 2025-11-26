import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  IconButton,
  InputAdornment,
  Divider,
} from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import ShieldIcon from '@mui/icons-material/Shield';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SyncIcon from '@mui/icons-material/Sync';
import GoogleIcon from '@mui/icons-material/Google';
import AppleIcon from '@mui/icons-material/Apple';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import PersonIcon from '@mui/icons-material/Person';

interface LocationState {
  from?: {
    pathname: string;
  };
}

const LoginPageTailwind: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isFlipping, setIsFlipping] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const state = location.state as LocationState;
  const from = state?.from?.pathname || '/dashboard';

  const handleInputChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'rememberMe' ? event.target.checked : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const toggleMode = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setIsLoginMode(!isLoginMode);
      setError('');
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        rememberMe: false,
      });
      setIsFlipping(false);
    }, 300);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginMode) {
        await login(formData.email, formData.password);
      } else {
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        await register(formData.name, formData.email, formData.password);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || (isLoginMode ? 'Invalid email or password' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const FeatureItem = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        sx={{
          color: '#2563EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
      <Typography sx={{ color: '#64748B', fontSize: '1rem' }}>{text}</Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      {/* Left Section - Fixed Marketing Content (50%) */}
      <Box
        sx={{
          width: { xs: '0%', lg: '50%' },
          minHeight: '100vh',
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          px: 8,
          py: 10,
          backgroundColor: '#F8FAFC',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            maxWidth: '540px',
            mx: 'auto',
          }}
        >
          {/* Badge */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              px: 2,
              py: 1,
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 500,
              width: 'fit-content',
            }}
          >
            <LockIcon sx={{ fontSize: 16 }} />
            Secure Login
          </Box>

          {/* Headline */}
          <Box sx={{ mt: 4 }}>
            <Typography
              sx={{
                fontSize: { xs: '2.25rem', lg: '3rem' },
                fontWeight: 700,
                lineHeight: 1.2,
                color: '#1E293B',
              }}
            >
              Welcome back to
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '2.25rem', lg: '3rem' },
                fontWeight: 700,
                lineHeight: 1.2,
                color: '#2563EB',
              }}
            >
              Your Digital Identity
            </Typography>
          </Box>

          {/* Description */}
          <Typography
            sx={{
              color: '#64748B',
              fontSize: '1.125rem',
              maxWidth: '28rem',
              lineHeight: 1.6,
              mt: 3,
            }}
          >
            Sign in to manage your digital business cards, track engagement, and connect
            with your network.
          </Typography>

          {/* Feature List */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
            <FeatureItem icon={<ShieldIcon />} text="Enterprise-grade security" />
            <FeatureItem icon={<FlashOnIcon />} text="Instant access to your cards" />
            <FeatureItem icon={<SyncIcon />} text="Sync across all devices" />
          </Box>
        </Box>
      </Box>

      {/* Right Section - Login/Register Form (50%) */}
      <Box
        sx={{
          width: { xs: '100%', lg: '50%' },
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          px: { xs: 3, sm: 6, lg: 8 },
          py: { xs: 6, lg: 10 },
          backgroundColor: '#FFFFFF',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: '460px',
            mx: 'auto',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              backgroundColor: { xs: '#FFFFFF', lg: 'transparent' },
              borderRadius: { xs: '24px', lg: 0 },
              boxShadow: { xs: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', lg: 'none' },
              p: { xs: 3, lg: 0 },
              pt: { xs: 4, lg: 0 },
              transform: isFlipping ? 'rotateY(90deg)' : 'rotateY(0deg)',
              transition: 'transform 0.3s ease-in-out',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Form Title */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography
                sx={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#1E293B',
                  mb: 0.5,
                }}
              >
                {isLoginMode ? 'Sign In' : 'Create Account'}
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: '#64748B' }}>
                {isLoginMode ? 'Enter your credentials to continue' : 'Sign up to get started'}
              </Typography>
            </Box>

            {/* Error Message */}
            {error && (
              <Box
                sx={{
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  p: 1.5,
                  borderRadius: '10px',
                  mb: 2,
                  fontSize: '0.8125rem',
                }}
              >
                {error}
              </Box>
            )}

            {/* Login/Register Form */}
            <Box component="form" onSubmit={handleSubmit}>
              {!isLoginMode && (
                <Box sx={{ mb: 1 }}>
                  <Typography
                    component="label"
                    htmlFor="name"
                    sx={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#1E293B',
                      mb: 1,
                    }}
                  >
                    Full Name
                  </Typography>
                  <TextField
                    id="name"
                    fullWidth
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    disabled={loading}
                    required={!isLoginMode}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#FFFFFF',
                        '& fieldset': {
                          borderColor: '#E2E8F0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#CBD5E1',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#2563EB',
                          borderWidth: '2px',
                        },
                      },
                      '& .MuiOutlinedInput-input': {
                        py: 1.5,
                        px: 2,
                      },
                    }}
                  />
                </Box>
              )}

              <Box sx={{ mb: isLoginMode ? 1.5 : 1 }}>
                <Typography
                  component="label"
                  htmlFor="email"
                  sx={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#1E293B',
                    mb: 1,
                  }}
                >
                  Email address
                </Typography>
                <TextField
                  id="email"
                  fullWidth
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  disabled={loading}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      '& fieldset': {
                        borderColor: '#E2E8F0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#CBD5E1',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#2563EB',
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      py: 1.5,
                      px: 2,
                    },
                  }}
                />
              </Box>

              <Box sx={{ mb: isLoginMode ? 1.5 : 1 }}>
                <Typography
                  component="label"
                  htmlFor="password"
                  sx={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#1E293B',
                    mb: 1,
                  }}
                >
                  Password
                </Typography>
                <TextField
                  id="password"
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
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
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      '& fieldset': {
                        borderColor: '#E2E8F0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#CBD5E1',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#2563EB',
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      py: 1.5,
                      px: 2,
                    },
                  }}
                />
              </Box>

              {!isLoginMode && (
                <Box sx={{ mb: 1 }}>
                  <Typography
                    component="label"
                    htmlFor="confirmPassword"
                    sx={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#1E293B',
                      mb: 1,
                    }}
                  >
                    Confirm Password
                  </Typography>
                  <TextField
                    id="confirmPassword"
                    fullWidth
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    disabled={loading}
                    required={!isLoginMode}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            disabled={loading}
                          >
                            {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#FFFFFF',
                        '& fieldset': {
                          borderColor: '#E2E8F0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#CBD5E1',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#2563EB',
                          borderWidth: '2px',
                        },
                      },
                      '& .MuiOutlinedInput-input': {
                        py: 1.5,
                        px: 2,
                      },
                    }}
                  />
                </Box>
              )}

              {/* Remember me + Forgot password (Login only) */}
              {isLoginMode && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.rememberMe}
                        onChange={handleInputChange('rememberMe')}
                        disabled={loading}
                        sx={{
                          color: '#CBD5E1',
                          '&.Mui-checked': {
                            color: '#2563EB',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '0.875rem', color: '#64748B' }}>
                        Remember me
                      </Typography>
                    }
                  />
                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    sx={{
                      color: '#2563EB',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Forgot password?
                  </Link>
                </Box>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  py: 1.25,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  mb: isLoginMode ? 2 : 1.5,
                  mt: isLoginMode ? 0 : 1,
                  '&:hover': {
                    backgroundColor: '#1D4ED8',
                    transform: 'scale(1.02)',
                  },
                  '&:active': {
                    transform: 'scale(0.98)',
                  },
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              >
                {loading
                  ? (isLoginMode ? 'Signing In...' : 'Creating Account...')
                  : (isLoginMode ? 'Sign In' : 'Create Account')
                }
              </Button>

              {/* Divider */}
              <Box sx={{ position: 'relative', my: isLoginMode ? 2 : 1.5 }}>
                <Divider sx={{ borderColor: '#E2E8F0' }} />
                <Typography
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#FFFFFF',
                    px: 2,
                    fontSize: '0.75rem',
                    color: '#94A3B8',
                    textTransform: 'uppercase',
                  }}
                >
                  or continue with
                </Typography>
              </Box>

              {/* Social Login Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mb: isLoginMode ? 2 : 1.5 }}>
                <IconButton
                  sx={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    p: 1.25,
                    '&:hover': {
                      borderColor: '#CBD5E1',
                      backgroundColor: '#F8FAFC',
                    },
                  }}
                >
                  <GoogleIcon sx={{ color: '#64748B', fontSize: 20 }} />
                </IconButton>
                <IconButton
                  sx={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    p: 1.25,
                    '&:hover': {
                      borderColor: '#CBD5E1',
                      backgroundColor: '#F8FAFC',
                    },
                  }}
                >
                  <AppleIcon sx={{ color: '#64748B', fontSize: 20 }} />
                </IconButton>
                <IconButton
                  sx={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    p: 1.25,
                    '&:hover': {
                      borderColor: '#CBD5E1',
                      backgroundColor: '#F8FAFC',
                    },
                  }}
                >
                  <LinkedInIcon sx={{ color: '#64748B', fontSize: 20 }} />
                </IconButton>
              </Box>

              {/* Toggle Sign Up/Sign In Link */}
              <Box sx={{ textAlign: 'center', mb: isLoginMode ? 2 : 1.5 }}>
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    color: '#64748B',
                  }}
                >
                  {isLoginMode ? "Don't have an account?" : "Already have an account?"}{' '}
                  <Link
                    component="button"
                    type="button"
                    onClick={toggleMode}
                    sx={{
                      color: '#2563EB',
                      textDecoration: 'none',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      font: 'inherit',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {isLoginMode ? 'Sign up' : 'Sign in'}
                  </Link>
                </Typography>
              </Box>
            </Box>

            {/* Footer */}
            <Typography
              sx={{
                textAlign: 'center',
                fontSize: '0.625rem',
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                mt: isLoginMode ? 2 : 1.5,
              }}
            >
              Powered by BBTap
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPageTailwind;
