import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Grid,
  Chip,
  Button,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  CreditCard as CreditCardIcon,
  AccountBox as AccountBoxIcon,
  Storage as StorageIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface SubscriptionLimits {
  users: number;
  profiles: number;
  cards: number;
  storage: number;
}

interface SubscriptionUsage {
  users: number;
  profiles: number;
  cards: number;
  storage: number;
}

interface SubscriptionUsageCardProps {
  plan: string;
  limits: SubscriptionLimits;
  usage: SubscriptionUsage;
}

const SubscriptionUsageCard: React.FC<SubscriptionUsageCardProps> = ({ plan, limits, usage }) => {
  const navigate = useNavigate();

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return (used / limit) * 100;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    return 'success';
  };

  const isNearLimit = (used: number, limit: number) => {
    if (limit === -1) return false;
    return (used / limit) >= 0.75;
  };

  const isAtLimit = (used: number, limit: number) => {
    if (limit === -1) return false;
    return used >= limit;
  };

  const formatStorage = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const usageItems = [
    {
      label: 'Team Members',
      icon: <PeopleIcon />,
      used: usage.users,
      limit: limits.users,
      color: '#2563EB',
    },
    {
      label: 'Profiles',
      icon: <AccountBoxIcon />,
      used: usage.profiles,
      limit: limits.profiles,
      color: '#10B981',
    },
    {
      label: 'NFC Cards',
      icon: <CreditCardIcon />,
      used: usage.cards,
      limit: limits.cards,
      color: '#F59E0B',
    },
    {
      label: 'Storage',
      icon: <StorageIcon />,
      used: usage.storage,
      limit: limits.storage,
      color: '#8B5CF6',
      isStorage: true,
    },
  ];

  const hasWarnings = usageItems.some(item => isNearLimit(item.used, item.limit));
  const hasLimitReached = usageItems.some(item => isAtLimit(item.used, item.limit));

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Subscription Usage
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Chip
                label={plan.charAt(0).toUpperCase() + plan.slice(1) + ' Plan'}
                color="primary"
                size="small"
              />
              {hasLimitReached && (
                <Chip
                  icon={<WarningIcon />}
                  label="Limit Reached"
                  color="error"
                  size="small"
                />
              )}
              {hasWarnings && !hasLimitReached && (
                <Chip
                  icon={<WarningIcon />}
                  label="Near Limit"
                  color="warning"
                  size="small"
                />
              )}
            </Box>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TrendingUpIcon />}
            onClick={() => navigate('/subscription')}
          >
            Upgrade Plan
          </Button>
        </Box>

        {/* Warning Alert */}
        {hasLimitReached && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              You've reached your plan limits
            </Typography>
            <Typography variant="caption">
              Upgrade your plan to add more users, profiles, or cards.
            </Typography>
          </Alert>
        )}

        {hasWarnings && !hasLimitReached && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Approaching plan limits
            </Typography>
            <Typography variant="caption">
              Consider upgrading your plan to avoid service interruptions.
            </Typography>
          </Alert>
        )}

        {/* Usage Items */}
        <Grid container spacing={3}>
          {usageItems.map((item) => {
            const percentage = getUsagePercentage(item.used, item.limit);
            const color = getUsageColor(percentage);
            const isUnlimited = item.limit === -1;
            const atLimit = isAtLimit(item.used, item.limit);

            return (
              <Grid item xs={12} sm={6} key={item.label}>
                <Box>
                  {/* Label and Icon */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ color: item.color }}>
                      {item.icon}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.label}
                    </Typography>
                  </Box>

                  {/* Usage Numbers */}
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {item.isStorage ? formatStorage(item.used) : item.used}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      / {isUnlimited ? 'Unlimited' : (item.isStorage ? formatStorage(item.limit) : item.limit)}
                    </Typography>
                  </Box>

                  {/* Progress Bar */}
                  {!isUnlimited && (
                    <Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(percentage, 100)}
                        color={color}
                        sx={{
                          height: 8,
                          borderRadius: 1,
                          backgroundColor: 'grey.200',
                        }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {percentage.toFixed(1)}% used
                        </Typography>
                        {atLimit ? (
                          <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                            Limit reached
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {item.isStorage
                              ? formatStorage(item.limit - item.used)
                              : item.limit - item.used} remaining
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Unlimited Badge */}
                  {isUnlimited && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon color="success" fontSize="small" />
                      <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                        Unlimited
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>

        {/* Plan Details */}
        <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Usage is updated in real-time as you add or remove resources.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SubscriptionUsageCard;
