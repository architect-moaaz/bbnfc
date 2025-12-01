import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  onInviteSent?: () => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  open,
  onClose,
  onInviteSent
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setEmail('');
    setName('');
    setRole('member');
    setError(null);
    setSuccess(false);
    setInviteUrl(null);
    setCopied(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Email is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/invitations/send`,
        {
          email,
          name,
          role,
          expiresInDays: 7
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setInviteUrl(response.data.data.inviteUrl);

        // Notify parent component
        if (onInviteSent) {
          onInviteSent();
        }
      } else {
        setError(response.data.error || 'Failed to send invitation');
      }
    } catch (err: any) {
      console.error('Send invitation error:', err);
      setError(
        err.response?.data?.error ||
        'Failed to send invitation. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div" fontWeight={600}>
            Invite Team Member
          </Typography>
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={3}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {success && inviteUrl ? (
              <Stack spacing={2}>
                <Alert
                  severity="success"
                  icon={<CheckCircleIcon />}
                >
                  Invitation sent successfully to {email}!
                </Alert>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Invitation Link
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 2,
                      backgroundColor: '#F8FAFC',
                      borderRadius: 1,
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        wordBreak: 'break-all',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                      }}
                    >
                      {inviteUrl}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={handleCopyUrl}
                      sx={{ color: copied ? 'success.main' : 'primary.main' }}
                    >
                      {copied ? <CheckCircleIcon /> : <CopyIcon />}
                    </IconButton>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Share this link with the invitee. It expires in 7 days.
                  </Typography>
                </Box>
              </Stack>
            ) : (
              <>
                <TextField
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  placeholder="colleague@example.com"
                  autoFocus
                />

                <TextField
                  label="Name (Optional)"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  placeholder="John Doe"
                />

                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={role}
                    label="Role"
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <MenuItem value="member">
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          Member
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Can create and manage their own profiles and cards
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="admin">
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          Admin
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Can manage organization settings and invite members
                        </Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                <Alert severity="info" sx={{ mt: 1 }}>
                  An invitation email will be sent to {email || 'the provided email address'} with a link to join your organization.
                </Alert>
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          {success ? (
            <>
              <Button onClick={handleClose} variant="outlined">
                Close
              </Button>
              <Button
                onClick={() => {
                  setEmail('');
                  setName('');
                  setRole('member');
                  setSuccess(false);
                  setInviteUrl(null);
                }}
                variant="contained"
              >
                Send Another Invitation
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !email}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default InviteMemberModal;
