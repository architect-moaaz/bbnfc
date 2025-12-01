import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Skeleton,
  Grid,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { organizationsAPI } from '../services/api';
import { User, Organization } from '../types';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import InviteMemberModal from '../components/InviteMemberModal';
import InvitationsTable from '../components/InvitationsTable';
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
}

const TeamManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [invitationAnchorEl, setInvitationAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);

  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form states
  const [editRole, setEditRole] = useState('member');
  const [editDepartment, setEditDepartment] = useState('');

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);

      // Fetch organization
      const orgResponse = await organizationsAPI.getCurrentOrganization();
      if (orgResponse.success && orgResponse.data) {
        setOrganization(orgResponse.data);

        // Fetch members
        const membersResponse = await organizationsAPI.getMembers(
          orgResponse.data.id || orgResponse.data._id || ''
        );
        if (membersResponse.success && membersResponse.data) {
          setMembers(membersResponse.data);
        }
      }

      // Fetch invitations
      await fetchInvitations();

      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch team data:', err);
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/invitations/organization/list`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setInvitations(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch invitations:', err);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleInviteSent = () => {
    setSuccess('Invitation sent successfully!');
    fetchInvitations(); // Refresh invitations list
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleEditMember = async () => {
    if (!organization || !selectedMember) return;

    try {
      const response = await organizationsAPI.updateMemberRole(
        organization.id || organization._id || '',
        selectedMember.id,
        editRole
      );

      if (response.success) {
        setSuccess('Member updated successfully');
        setEditDialogOpen(false);
        fetchTeamData();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to update member:', err);
      setError('Failed to update member');
    }
  };

  const handleDeleteMember = async () => {
    if (!organization || !selectedMember) return;

    try {
      const response = await organizationsAPI.removeMember(
        organization.id || organization._id || '',
        selectedMember.id
      );

      if (response.success) {
        setSuccess('Member removed successfully');
        setDeleteDialogOpen(false);
        setSelectedMember(null);
        fetchTeamData();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      setError('Failed to remove member');
    }
  };

  const openEditDialog = () => {
    if (selectedMember) {
      setEditRole(selectedMember.organizationRole || 'member');
      setEditDepartment(selectedMember.department || '');
      setEditDialogOpen(true);
      handleMenuClose();
    }
  };

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 3, borderRadius: 2 }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/organization')}
            sx={{ mb: 2 }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Team Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your organization members and their roles
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setInviteDialogOpen(true)}
        >
          Invite Member
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Team Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {members.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Members
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
              {members.filter((m) => m.isEmailVerified).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Members
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'warning.main' }}>
              {invitations.filter((inv) => inv.status === 'pending').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending Invitations
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs for Members and Invitations */}
      <Paper>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label={`Members (${members.length})`} />
          <Tab label={`Invitations (${invitations.length})`} />
        </Tabs>

        {/* Members Tab */}
        {currentTab === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Job Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.length > 0 ? (
                  members.map((member) => (
                    <TableRow key={member.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {member.name?.charAt(0) || 'U'}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {member.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={member.organizationRole || 'member'}
                          size="small"
                          color={
                            member.organizationRole === 'owner'
                              ? 'primary'
                              : member.organizationRole === 'admin'
                              ? 'secondary'
                              : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>{member.department || '-'}</TableCell>
                      <TableCell>{member.jobTitle || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          icon={member.isEmailVerified ? <CheckCircleIcon /> : <CancelIcon />}
                          label={member.isEmailVerified ? 'Active' : 'Pending'}
                          size="small"
                          color={member.isEmailVerified ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, member)}
                          disabled={member.organizationRole === 'owner'}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No team members found. Invite members to get started!
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Invitations Tab */}
        {currentTab === 1 && (
          <Box sx={{ p: 3 }}>
            <InvitationsTable invitations={invitations} onRefresh={fetchInvitations} />
          </Box>
        )}
      </Paper>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={openEditDialog}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Role
        </MenuItem>
        <MenuItem onClick={openDeleteDialog} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Remove Member
        </MenuItem>
      </Menu>

      {/* Invite Member Modal */}
      <InviteMemberModal
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        onInviteSent={handleInviteSent}
      />

      {/* Edit Member Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Member</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Organization Role</InputLabel>
              <Select
                value={editRole}
                label="Organization Role"
                onChange={(e) => setEditRole(e.target.value)}
              >
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Department"
              value={editDepartment}
              onChange={(e) => setEditDepartment(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditMember}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Remove Team Member</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove <strong>{selectedMember?.name}</strong> from the organization?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteMember}>
            Remove Member
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeamManagement;
