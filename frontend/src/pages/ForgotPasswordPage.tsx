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
  useTheme,
  alpha,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useFormValidation, validationRules } from '../utils/validation';
import { announceToScreenReader } from '../utils/accessibility';
import EmailIcon from '@mui/icons-material/Email';
import LockResetIcon from '@mui/icons-material/LockReset';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const ForgotPasswordPage: React.FC = () => {
  const theme = useTheme();
  const { validateField } = useFormValidation();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    announceToScreenReader('Forgot password page loaded');
  }, []);
  
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    if (error) setError(null);
  };
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    
    // Validate email
    const result = validateField(email, validationRules.email);
    if (!result.isValid) {
      setError(result.error || 'Please enter a valid email address');
      announceToScreenReader('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess(true);
      announceToScreenReader('Password reset instructions sent to your email');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send reset instructions. Please try again.';
      setError(errorMessage);
      announceToScreenReader(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
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
              textAlign: 'center',
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
              Check Your Email
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We've sent password reset instructions to{' '}
              <strong>{email}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Didn't receive the email? Check your spam folder or try again.
            </Typography>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              startIcon={<ArrowBackIcon />}
              sx={{ mt: 2 }}
            >
              Back to Sign In
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }
  
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
              <LockResetIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            </Box>
            <Typography
              component="h1"
              variant="h4"
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              Reset Password
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter your email address and we'll send you instructions to reset your password.
            </Typography>
          </Box>
          
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} role="alert">
              {error}
            </Alert>
          )}
          
          {/* Reset Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={handleEmailChange}
              error={!!error}
              disabled={loading}
              autoComplete="email"
              autoFocus
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !email.trim()}
              endIcon={loading ? undefined : <SendIcon />}
              sx={{ mb: 3 }}
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Link
                component={RouterLink}
                to="/login"
                variant="body1"
                sx={{ 
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <ArrowBackIcon fontSize="small" />
                Back to Sign In
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;