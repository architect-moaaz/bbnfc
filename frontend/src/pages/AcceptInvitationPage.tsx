import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Divider,
} from '@mui/material';
import {
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface InvitationData {
  organization: {
    id: string;
    name: string;
    branding?: {
      logo?: string;
      logoUrl?: string;
      primaryColor?: string;
    };
  };
  assignedTo: {
    email: string;
    name?: string;
  };
  expiresAt: string;
  role: string;
}

const AcceptInvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchInvitationDetails();
  }, [token]);

  const fetchInvitationDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/invitations/${token}`
      );

      if (response.data.success) {
        setInvitation(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch invitation details');
      }
    } catch (err: any) {
      console.error('Fetch invitation error:', err);
      setError(
        err.response?.data?.error ||
        'Invalid or expired invitation'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!user) {
      // Redirect to login with return URL
      navigate('/login', {
        state: { from: location.pathname }
      });
      return;
    }

    try {
      setAccepting(true);
      setError(null);

      const token_value = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/invitations/${token}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token_value}`
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);

        // Redirect to organization dashboard after 2 seconds
        setTimeout(() => {
          navigate('/organization');
          // Reload to update user context
          window.location.reload();
        }, 2000);
      } else {
        setError(response.data.error || 'Failed to accept invitation');
      }
    } catch (err: any) {
      console.error('Accept invitation error:', err);
      setError(
        err.response?.data?.error ||
        'Failed to accept invitation. Please try again.'
      );
    } finally {
      setAccepting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#F8FAFC'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (success) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#F8FAFC'
        }}
      >
        <Container maxWidth="sm">
          <Card>
            <CardContent>
              <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
                <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main' }} />
                <Typography variant="h5" component="h1" fontWeight={600}>
                  Invitation Accepted!
                </Typography>
                <Typography color="text.secondary" textAlign="center">
                  You have successfully joined {invitation?.organization.name}.
                  Redirecting to your organization dashboard...
                </Typography>
                <CircularProgress size={24} />
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        py: 8
      }}
    >
      <Container maxWidth="sm">
        <Card>
          <CardContent sx={{ p: 4 }}>
            {error ? (
              <Stack spacing={3} alignItems="center">
                <ErrorIcon sx={{ fontSize: 64, color: 'error.main' }} />
                <Typography variant="h5" component="h1" fontWeight={600}>
                  Invalid Invitation
                </Typography>
                <Alert severity="error" sx={{ width: '100%' }}>
                  {error}
                </Alert>
                <Button
                  variant="contained"
                  onClick={() => navigate('/')}
                >
                  Go to Home
                </Button>
              </Stack>
            ) : invitation ? (
              <Stack spacing={3}>
                {/* Organization Logo/Icon */}
                <Box sx={{ textAlign: 'center' }}>
                  {invitation.organization.branding?.logoUrl ? (
                    <Box
                      component="img"
                      src={invitation.organization.branding.logoUrl}
                      alt={invitation.organization.name}
                      sx={{
                        maxWidth: 120,
                        maxHeight: 80,
                        mb: 2
                      }}
                    />
                  ) : (
                    <BusinessIcon
                      sx={{
                        fontSize: 64,
                        color: invitation.organization.branding?.primaryColor || 'primary.main',
                        mb: 2
                      }}
                    />
                  )}
                </Box>

                {/* Title */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
                    Join Organization
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    {invitation.organization.name}
                  </Typography>
                </Box>

                <Divider />

                {/* Invitation Details */}
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      You've been invited to join
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {invitation.organization.name}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Invited as
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {invitation.assignedTo.name || invitation.assignedTo.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {invitation.assignedTo.email}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Role
                    </Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                      {invitation.role}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Invitation expires
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {new Date(invitation.expiresAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>
                </Stack>

                <Divider />

                {/* User Status */}
                {!user ? (
                  <Alert severity="info">
                    You need to be logged in to accept this invitation.
                    You'll be redirected to login.
                  </Alert>
                ) : user.email.toLowerCase() !== invitation.assignedTo.email.toLowerCase() ? (
                  <Alert severity="warning">
                    This invitation was sent to {invitation.assignedTo.email}, but you're logged in as {user.email}.
                    Please log in with the correct account.
                  </Alert>
                ) : user.organization ? (
                  <Alert severity="warning">
                    You already belong to an organization. Please leave your current organization before accepting this invitation.
                  </Alert>
                ) : null}

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate('/')}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleAcceptInvitation}
                    disabled={
                      accepting ||
                      !user ||
                      user.email.toLowerCase() !== invitation.assignedTo.email.toLowerCase() ||
                      !!user.organization
                    }
                  >
                    {accepting ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Accepting...
                      </>
                    ) : (
                      'Accept Invitation'
                    )}
                  </Button>
                </Stack>
              </Stack>
            ) : null}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default AcceptInvitationPage;
