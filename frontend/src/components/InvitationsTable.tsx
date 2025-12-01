import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  TextField,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Block as BlockIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface Invitation {
  id: string;
  email: string;
  name?: string;
  status: 'pending' | 'claimed' | 'expired' | 'revoked';
  role: string;
  expiresAt: string;
  createdAt: string;
  claimedAt?: string;
  createdBy?: {
    name: string;
    email: string;
  };
  claimedBy?: {
    name: string;
    email: string;
  };
}

interface InvitationsTableProps {
  invitations: Invitation[];
  onRefresh: () => void;
}

const InvitationsTable: React.FC<InvitationsTableProps> = ({ invitations, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, invitation: Invitation) => {
    setAnchorEl(event.currentTarget);
    setSelectedInvitation(invitation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCopyInviteUrl = () => {
    if (selectedInvitation) {
      const inviteUrl = `${process.env.REACT_APP_FRONTEND_URL || window.location.origin}/accept-invite/${selectedInvitation.id}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setSuccess('Invitation link copied to clipboard');
      setTimeout(() => {
        setCopied(false);
        setSuccess(null);
      }, 3000);
      handleMenuClose();
    }
  };

  const handleResendInvitation = async () => {
    if (!selectedInvitation) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/invitations/${selectedInvitation.id}/resend`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccess('Invitation resent successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to resend invitation:', err);
      setError(err.response?.data?.error || 'Failed to resend invitation');
      setTimeout(() => setError(null), 5000);
    } finally {
      handleMenuClose();
    }
  };

  const handleRevokeInvitation = async () => {
    if (!selectedInvitation) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/invitations/${selectedInvitation.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccess('Invitation revoked successfully');
        setRevokeDialogOpen(false);
        onRefresh();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to revoke invitation:', err);
      setError(err.response?.data?.error || 'Failed to revoke invitation');
      setTimeout(() => setError(null), 5000);
    }
  };

  const openRevokeDialog = () => {
    setRevokeDialogOpen(true);
    handleMenuClose();
  };

  // Filter invitations
  const filteredInvitations = invitations.filter((invitation) => {
    const matchesSearch =
      invitation.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invitation.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invitation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get status counts
  const statusCounts = {
    all: invitations.length,
    pending: invitations.filter(inv => inv.status === 'pending').length,
    claimed: invitations.filter(inv => inv.status === 'claimed').length,
    expired: invitations.filter(inv => inv.status === 'expired').length,
    revoked: invitations.filter(inv => inv.status === 'revoked').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'claimed':
        return 'success';
      case 'expired':
        return 'error';
      case 'revoked':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ScheduleIcon fontSize="small" />;
      case 'claimed':
        return <CheckCircleIcon fontSize="small" />;
      case 'expired':
      case 'revoked':
        return <CancelIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 2 && daysUntilExpiry > 0;
  };

  return (
    <Box>
      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by email or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <Tabs
          value={statusFilter}
          onChange={(e, newValue) => setStatusFilter(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={`All (${statusCounts.all})`} value="all" />
          <Tab label={`Pending (${statusCounts.pending})`} value="pending" />
          <Tab label={`Claimed (${statusCounts.claimed})`} value="claimed" />
          <Tab label={`Expired (${statusCounts.expired})`} value="expired" />
          <Tab label={`Revoked (${statusCounts.revoked})`} value="revoked" />
        </Tabs>
      </Box>

      {/* Invitations Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Invited By</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvitations.length > 0 ? (
                filteredInvitations.map((invitation) => (
                  <TableRow key={invitation.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {invitation.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{invitation.name || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                        size="small"
                        color={invitation.role === 'admin' ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(invitation.status)}
                        label={invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                        size="small"
                        color={getStatusColor(invitation.status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {formatDate(invitation.expiresAt)}
                        </Typography>
                        {invitation.status === 'pending' && isExpiringSoon(invitation.expiresAt) && (
                          <Typography variant="caption" color="error">
                            Expiring soon!
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(invitation.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {invitation.createdBy?.name || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, invitation)}
                        disabled={invitation.status === 'claimed'}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                      {searchQuery || statusFilter !== 'all'
                        ? 'No invitations match your filters'
                        : 'No invitations found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleCopyInviteUrl}>
          <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
          Copy Invite Link
        </MenuItem>
        {selectedInvitation?.status === 'pending' && (
          <MenuItem onClick={handleResendInvitation}>
            <SendIcon fontSize="small" sx={{ mr: 1 }} />
            Resend Invitation
          </MenuItem>
        )}
        {selectedInvitation?.status === 'pending' && (
          <MenuItem onClick={openRevokeDialog} sx={{ color: 'error.main' }}>
            <BlockIcon fontSize="small" sx={{ mr: 1 }} />
            Revoke Invitation
          </MenuItem>
        )}
      </Menu>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={revokeDialogOpen} onClose={() => setRevokeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Revoke Invitation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to revoke the invitation for{' '}
            <strong>{selectedInvitation?.email}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            The invitation link will no longer work and cannot be used to join the organization.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleRevokeInvitation}>
            Revoke Invitation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvitationsTable;
