import React, { useEffect, useState, useRef } from 'react';
import { Box, Container, Paper, Typography, Button, CircularProgress } from '@mui/material';
import { CheckCircle as CheckIcon, ErrorOutline as ErrorIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

type Status = 'loading' | 'success' | 'error';

const VerifyEmailPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('Verifying your email address…');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard against React 18 StrictMode double-invoke
    ran.current = true;

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    authAPI
      .verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.data || 'Your email has been verified successfully.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(
          err?.response?.data?.error ||
            'This verification link is invalid or has expired.'
        );
      });
  }, [token]);

  return (
    <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', backgroundColor: '#F0F4F8' }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
          {status === 'loading' && <CircularProgress size={56} sx={{ mb: 3 }} />}
          {status === 'success' && <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />}
          {status === 'error' && <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />}

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            {status === 'loading' && 'Verifying Email'}
            {status === 'success' && 'Email Verified'}
            {status === 'error' && 'Verification Failed'}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            {message}
          </Typography>

          {status !== 'loading' && (
            <Button variant="contained" onClick={() => navigate('/login')}>
              Continue to Login
            </Button>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default VerifyEmailPage;
