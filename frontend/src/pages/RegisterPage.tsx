import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  LinearProgress,
  useTheme,
  alpha,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFormValidation, validationRules, getPasswordStrength } from '../utils/validation';
import { announceToScreenReader } from '../utils/accessibility';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const RegisterPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { register } = useAuth();
  const { validateForm, validateField } = useFormValidation();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const passwordStrength = getPasswordStrength(formData.password);
  
  useEffect(() => {
    // Announce page load to screen readers
    announceToScreenReader('Registration page loaded');
  }, []);
  
  const handleInputChange = (field: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Clear submit error
    if (submitError) {
      setSubmitError(null);
    }
  };
  
  const handleFieldBlur = (field: keyof typeof formData) => () => {
    let rules;
    
    switch (field) {
      case 'name':
        rules = validationRules.name;
        break;
      case 'email':
        rules = validationRules.email;
        break;
      case 'password':
        rules = validationRules.password;
        break;
      case 'confirmPassword':
        rules = validationRules.confirmPassword(formData.password);
        break;
      default:
        return;
    }
    
    const result = validateField(formData[field], rules);
    
    if (!result.isValid && result.error) {
      setErrors(prev => ({ ...prev, [field]: result.error! }));
    }
  };
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    
    // Check terms acceptance
    if (!acceptTerms) {
      setSubmitError('Please accept the Terms of Service and Privacy Policy');
      announceToScreenReader('Please accept the Terms of Service and Privacy Policy');
      return;
    }
    
    // Validate form
    const { isValid, errors: validationErrors } = validateForm(formData, {
      name: validationRules.name,
      email: validationRules.email,
      password: validationRules.password,
      confirmPassword: validationRules.confirmPassword(formData.password),
    });
    
    if (!isValid) {
      setErrors(validationErrors);
      announceToScreenReader('Please fix the errors in the form');
      return;
    }
    
    setLoading(true);
    
    try {
      await register(formData.name, formData.email, formData.password);
      announceToScreenReader('Registration successful');
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setSubmitError(errorMessage);
      announceToScreenReader(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 6 },
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[8],
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <CreditCardIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            </Box>
            <Typography
              component="h1"
              variant="h4"
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              Create Account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join thousands of professionals using digital business cards
            </Typography>
          </Box>
          
          {/* Error Alert */}
          {submitError && (
            <Alert severity="error" sx={{ mb: 3 }} role="alert">
              {submitError}
            </Alert>
          )}
          
          {/* Registration Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Full Name"
              value={formData.name}
              onChange={handleInputChange('name')}
              onBlur={handleFieldBlur('name')}
              error={!!errors.name}
              helperText={errors.name}
              disabled={loading}
              autoComplete="name"
              autoFocus
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              onBlur={handleFieldBlur('email')}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
              autoComplete="email"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            
            <TextField
              fullWidth
              id="password"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              onBlur={handleFieldBlur('password')}
              error={!!errors.password}
              helperText={errors.password}
              disabled={loading}
              autoComplete="new-password"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
              aria-describedby={errors.password ? 'password-error' : 'password-strength'}
            />
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Password strength:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: passwordStrength.color, fontWeight: 600 }}
                  >
                    {passwordStrength.label}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(passwordStrength.score / 6) * 100}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: alpha(passwordStrength.color, 0.2),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: passwordStrength.color,
                    },
                  }}
                  aria-label={`Password strength: ${passwordStrength.label}`}
                />
              </Box>
            )}
            
            <TextField
              fullWidth
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              onBlur={handleFieldBlur('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              disabled={loading}
              autoComplete="new-password"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {formData.confirmPassword && formData.confirmPassword === formData.password ? (
                      <CheckCircleIcon sx={{ color: 'success.main' }} />
                    ) : (
                      <IconButton
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        disabled={loading}
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    )}
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
              aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
            />
            
            {/* Terms and Conditions */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  disabled={loading}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  I agree to the{' '}
                  <Link href="/terms" target="_blank" rel="noopener noreferrer">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </Link>
                </Typography>
              }
              sx={{ mb: 3, alignItems: 'flex-start' }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !acceptTerms}
              endIcon={loading ? undefined : <ArrowForwardIcon />}
              sx={{ mb: 3 }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
            
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                or
              </Typography>
            </Divider>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Already have an account?
              </Typography>
              <Link
                component={RouterLink}
                to="/login"
                variant="body1"
                sx={{ fontWeight: 600 }}
              >
                Sign In
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;