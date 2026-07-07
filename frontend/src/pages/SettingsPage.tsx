import React, { useState } from 'react';
import {
  Container, Typography, Box, Paper, TextField, Button, Divider, Chip, InputAdornment, IconButton,
} from '@mui/material';
import { Person as PersonIcon, Lock as LockIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      enqueueSnackbar('Name cannot be empty', { variant: 'error' });
      return;
    }
    try {
      setSavingProfile(true);
      await updateUser({ name: name.trim() });
      enqueueSnackbar('Profile updated', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Failed to update profile', { variant: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      enqueueSnackbar('New password must be at least 6 characters', { variant: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      enqueueSnackbar('New passwords do not match', { variant: 'error' });
      return;
    }
    try {
      setSavingPassword(true);
      await authAPI.updatePassword(currentPassword, newPassword);
      enqueueSnackbar('Password changed successfully', { variant: 'success' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.error || 'Failed to change password', { variant: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Settings</Typography>
        <Typography color="text.secondary">Manage your account details and security.</Typography>
      </Box>

      {/* Account */}
      <Paper sx={{ p: 4, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <PersonIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Account</Typography>
          {user?.role && user.role !== 'user' && (
            <Chip label={user.role.replace('_', ' ')} size="small" color="primary" sx={{ ml: 1, textTransform: 'capitalize' }} />
          )}
        </Box>
        <TextField
          label="Full Name" fullWidth value={name}
          onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }}
        />
        <TextField
          label="Email" fullWidth value={user?.email || ''} disabled
          helperText="Email cannot be changed" sx={{ mb: 3 }}
        />
        <Button variant="contained" onClick={handleSaveProfile} disabled={savingProfile}>
          {savingProfile ? 'Saving…' : 'Save Changes'}
        </Button>
      </Paper>

      {/* Security */}
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <LockIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Change Password</Typography>
        </Box>
        <TextField
          label="Current Password" type={showPw ? 'text' : 'password'} fullWidth
          value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} sx={{ mb: 2 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPw((s) => !s)} edge="end">
                  {showPw ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Divider sx={{ my: 2 }} />
        <TextField
          label="New Password" type={showPw ? 'text' : 'password'} fullWidth
          value={newPassword} onChange={(e) => setNewPassword(e.target.value)} sx={{ mb: 2 }}
        />
        <TextField
          label="Confirm New Password" type={showPw ? 'text' : 'password'} fullWidth
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} sx={{ mb: 3 }}
        />
        <Button
          variant="contained" onClick={handleChangePassword}
          disabled={savingPassword || !currentPassword || !newPassword}
        >
          {savingPassword ? 'Updating…' : 'Update Password'}
        </Button>
      </Paper>
    </Container>
  );
};

export default SettingsPage;
