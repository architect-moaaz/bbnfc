import React, { useState } from 'react';
import {
  Box, Container, Paper, Typography, Button, TextField, InputAdornment, IconButton, Alert,
} from '@mui/material';
import {
  Lock as LockIcon, Visibility, VisibilityOff, CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }

    try {
      setLoading(true);
      await authAPI.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', backgroundColor: '#F0F4F8' }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 5, borderRadius: 3 }}>
          {done ? (
            <Box sx={{ textAlign: 'center' }}>
              <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Password Reset</Typography>
              <Typography color="text.secondary">
                Your password has been updated. Redirecting to login…
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Reset Your Password</Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Enter a new password for your account.
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth label="New Password" type={show ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  sx={{ mb: 2 }} autoFocus required
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShow((s) => !s)} edge="end">
                          {show ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth label="Confirm New Password" type={show ? 'text' : 'password'}
                  value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  sx={{ mb: 3 }} required
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
                  }}
                />
                <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
                  {loading ? 'Resetting…' : 'Reset Password'}
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default ResetPasswordPage;
