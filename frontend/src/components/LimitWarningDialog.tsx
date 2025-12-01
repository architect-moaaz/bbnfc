import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Warning as WarningIcon,
  TrendingUp as UpgradeIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface LimitWarningDialogProps {
  open: boolean;
  onClose: () => void;
  resourceType: 'profile' | 'card' | 'user' | 'storage';
  currentUsage: number;
  limit: number;
  isBlocked?: boolean;
}

const LimitWarningDialog: React.FC<LimitWarningDialogProps> = ({
  open,
  onClose,
  resourceType,
  currentUsage,
  limit,
  isBlocked = false,
}) => {
  const navigate = useNavigate();

  const getResourceLabel = () => {
    switch (resourceType) {
      case 'profile':
        return { singular: 'profile', plural: 'profiles' };
      case 'card':
        return { singular: 'card', plural: 'cards' };
      case 'user':
        return { singular: 'team member', plural: 'team members' };
      case 'storage':
        return { singular: 'storage', plural: 'storage' };
      default:
        return { singular: 'resource', plural: 'resources' };
    }
  };

  const resourceLabel = getResourceLabel();
  const usagePercentage = (currentUsage / limit) * 100;
  const remaining = Math.max(0, limit - currentUsage);

  const handleUpgrade = () => {
    onClose();
    navigate('/subscription');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isBlocked ? (
          <>
            <BlockIcon color="error" />
            <Typography variant="h6" component="span">
              {resourceLabel.singular.charAt(0).toUpperCase() + resourceLabel.singular.slice(1)} Limit Reached
            </Typography>
          </>
        ) : (
          <>
            <WarningIcon color="warning" />
            <Typography variant="h6" component="span">
              Approaching {resourceLabel.singular.charAt(0).toUpperCase() + resourceLabel.singular.slice(1)} Limit
            </Typography>
          </>
        )}
      </DialogTitle>

      <DialogContent>
        {isBlocked ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              You've reached your plan's {resourceLabel.singular} limit
            </Typography>
            <Typography variant="caption">
              You cannot create more {resourceLabel.plural} until you upgrade your plan or delete existing ones.
            </Typography>
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              You're approaching your plan's {resourceLabel.singular} limit
            </Typography>
            <Typography variant="caption">
              Consider upgrading your plan to avoid service interruptions.
            </Typography>
          </Alert>
        )}

        {/* Usage Display */}
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Current Usage
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {currentUsage} / {limit} {resourceLabel.plural}
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={Math.min(usagePercentage, 100)}
            color={isBlocked ? 'error' : 'warning'}
            sx={{
              height: 8,
              borderRadius: 1,
              backgroundColor: 'grey.200',
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {usagePercentage.toFixed(1)}% used
            </Typography>
            {!isBlocked && (
              <Typography variant="caption" color="text.secondary">
                {remaining} {resourceLabel.plural} remaining
              </Typography>
            )}
          </Box>
        </Box>

        {/* Upgrade Benefits */}
        <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Upgrade your plan to get:
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              More {resourceLabel.plural}
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              Advanced analytics
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              Custom branding options
            </Typography>
            <Typography component="li" variant="body2">
              Priority support
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>
          {isBlocked ? 'Close' : 'Continue Anyway'}
        </Button>
        <Button
          variant="contained"
          startIcon={<UpgradeIcon />}
          onClick={handleUpgrade}
          color={isBlocked ? 'error' : 'warning'}
        >
          Upgrade Plan
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LimitWarningDialog;
