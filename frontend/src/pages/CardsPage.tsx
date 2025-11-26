import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Skeleton,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  QrCode as QrCodeIcon,
  Analytics as AnalyticsIcon,
  NfcSharp as NfcIcon,
  PersonOutline as PersonIcon,
  PowerSettingsNew as PowerIcon,
  ContentCopy as CopyIcon,
  OpenInNew as OpenIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { cardsAPI, profilesAPI } from '../services/api';
import { Card as CardType, Profile } from '../types';
import { motion } from 'framer-motion';

const CardsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<{
    profileId: string;
    chipType: 'NTAG213' | 'NTAG215' | 'NTAG216' | 'Other';
    serialNumber: string;
    isActive: boolean;
  }>({
    profileId: '',
    chipType: 'NTAG213',
    serialNumber: '',
    isActive: true,
  });

  // Fetch cards
  const { data: cardsResponse, isLoading: cardsLoading, error: cardsError } = useQuery({
    queryKey: ['cards'],
    queryFn: cardsAPI.getCards,
  });

  // Fetch profiles for dropdown
  const { data: profilesResponse } = useQuery({
    queryKey: ['profiles'],
    queryFn: profilesAPI.getProfiles,
  });

  const cards = cardsResponse?.data || [];
  const profiles = profilesResponse?.data || [];

  // Create card mutation
  const createCardMutation = useMutation({
    mutationFn: cardsAPI.createCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      enqueueSnackbar('Card created successfully!', { variant: 'success' });
      handleCloseDialog();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to create card';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  // Update card mutation
  const updateCardMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CardType> }) =>
      cardsAPI.updateCard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      enqueueSnackbar('Card updated successfully!', { variant: 'success' });
      handleCloseDialog();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to update card';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  // Delete card mutation
  const deleteCardMutation = useMutation({
    mutationFn: cardsAPI.deleteCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      enqueueSnackbar('Card deleted successfully!', { variant: 'success' });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to delete card';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const handleOpenDialog = (card?: CardType) => {
    if (card) {
      setSelectedCard(card);
      setFormData({
        profileId: typeof card.profile === 'string' ? card.profile : card.profile.id,
        chipType: card.chipType,
        serialNumber: card.serialNumber || '',
        isActive: card.isActive,
      });
    } else {
      setSelectedCard(null);
      setFormData({
        profileId: '',
        chipType: 'NTAG213',
        serialNumber: '',
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCard(null);
    setFormData({
      profileId: '',
      chipType: 'NTAG213',
      serialNumber: '',
      isActive: true,
    });
  };

  const handleSubmit = () => {
    if (!formData.profileId) {
      enqueueSnackbar('Please select a profile', { variant: 'error' });
      return;
    }

    if (selectedCard) {
      updateCardMutation.mutate({
        id: selectedCard.id,
        data: formData,
      });
    } else {
      createCardMutation.mutate(formData);
    }
  };

  const handleDelete = (cardId: string) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      deleteCardMutation.mutate(cardId);
    }
  };

  const handleToggleActive = (card: CardType) => {
    updateCardMutation.mutate({
      id: card.id,
      data: { isActive: !card.isActive },
    });
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    enqueueSnackbar('URL copied to clipboard!', { variant: 'success' });
  };

  const getChipTypeColor = (chipType: string) => {
    switch (chipType) {
      case 'NTAG213': return 'primary';
      case 'NTAG215': return 'secondary';
      case 'NTAG216': return 'info';
      default: return 'default';
    }
  };

  const getProfileName = (profile: string | Profile) => {
    if (typeof profile === 'string') {
      const foundProfile = profiles.find(p => p.id === profile);
      return foundProfile ? `${foundProfile.personalInfo.firstName} ${foundProfile.personalInfo.lastName}` : 'Unknown Profile';
    }
    return `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`;
  };

  if (cardsError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load cards. Please try again later.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
          NFC Cards
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage your physical NFC cards and their linked profiles
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={createCardMutation.isPending}
          sx={{ mb: 3 }}
        >
          Add New Card
        </Button>
      </Box>

      {/* Cards Grid */}
      {cardsLoading ? (
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mb: 2 }} />
                  <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="80%" height={20} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" width="100%" height={40} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : cards.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            backgroundColor: 'background.paper',
            borderRadius: 2,
            border: '2px dashed',
            borderColor: 'divider',
          }}
        >
          <NfcIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            No NFC Cards Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first NFC card to start sharing your digital profile
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Your First Card
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {cards.map((card) => (
            <Grid item xs={12} sm={6} md={4} key={card.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  {/* Status Indicator */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: card.isActive ? 'success.main' : 'error.main',
                    }}
                  />

                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Card Icon */}
                    <Avatar
                      sx={{
                        bgcolor: card.isActive ? 'primary.main' : 'grey.400',
                        mb: 2,
                        width: 48,
                        height: 48,
                      }}
                    >
                      <NfcIcon />
                    </Avatar>

                    {/* Profile Info */}
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {getProfileName(card.profile)}
                    </Typography>

                    {/* Card Details */}
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={card.chipType}
                        color={getChipTypeColor(card.chipType) as any}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                      <Chip
                        label={card.isActive ? 'Active' : 'Inactive'}
                        color={card.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>

                    {/* Serial Number */}
                    {card.serialNumber && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Serial: {card.serialNumber}
                      </Typography>
                    )}

                    {/* Stats */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Taps: {card.tapCount}
                      </Typography>
                      {card.lastTapped && (
                        <Typography variant="body2" color="text.secondary">
                          Last: {new Date(card.lastTapped).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>

                    {/* URL */}
                    {card.customUrl && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title="Copy URL">
                          <IconButton
                            size="small"
                            onClick={() => handleCopyUrl(card.customUrl!)}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Open Profile">
                          <IconButton
                            size="small"
                            onClick={() => window.open(card.customUrl, '_blank')}
                          >
                            <OpenIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Tooltip title={card.isActive ? 'Deactivate' : 'Activate'}>
                      <IconButton
                        onClick={() => handleToggleActive(card)}
                        color={card.isActive ? 'success' : 'default'}
                      >
                        <PowerIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Edit Card">
                      <IconButton onClick={() => handleOpenDialog(card)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Analytics">
                      <IconButton>
                        <AnalyticsIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Delete Card">
                      <IconButton
                        onClick={() => handleDelete(card.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Card Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedCard ? 'Edit Card' : 'Create New Card'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              select
              label="Profile"
              value={formData.profileId}
              onChange={(e) => setFormData({ ...formData, profileId: e.target.value })}
              fullWidth
              required
              helperText={profiles.length === 0 ? 'No profiles available. Create a profile first.' : 'Select the profile to link with this card'}
            >
              <MenuItem value="">
                <em>Select a profile</em>
              </MenuItem>
              {profiles.map((profile) => (
                <MenuItem key={profile.id} value={profile.id}>
                  {profile.personalInfo?.firstName || ''} {profile.personalInfo?.lastName || ''}
                  {profile.personalInfo?.title && ` - ${profile.personalInfo.title}`}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Chip Type"
              value={formData.chipType}
              onChange={(e) => setFormData({ ...formData, chipType: e.target.value as any })}
              fullWidth
            >
              <MenuItem value="NTAG213">NTAG213 (180 bytes)</MenuItem>
              <MenuItem value="NTAG215">NTAG215 (540 bytes)</MenuItem>
              <MenuItem value="NTAG216">NTAG216 (924 bytes)</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>

            <TextField
              label="Serial Number (Optional)"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              fullWidth
              placeholder="Enter chip serial number"
            />

            <TextField
              select
              label="Status"
              value={formData.isActive ? 'active' : 'inactive'}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
              fullWidth
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createCardMutation.isPending || updateCardMutation.isPending}
          >
            {createCardMutation.isPending || updateCardMutation.isPending ? (
              selectedCard ? 'Updating...' : 'Creating...'
            ) : (
              selectedCard ? 'Update Card' : 'Create Card'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CardsPage;