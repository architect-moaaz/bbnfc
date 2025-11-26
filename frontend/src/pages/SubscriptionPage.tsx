import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Skeleton,
  Switch,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  TrendingUp as UpgradeIcon,
  Receipt as ReceiptIcon,
  CreditCard as CardIcon,
  CalendarToday as CalendarIcon,
  Autorenew as RenewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import { organizationsAPI } from '../services/api';
import SubscriptionUsageCard from '../components/SubscriptionUsageCard';
import { useOrganizationLimits } from '../hooks/useOrganizationLimits';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || '');

interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  description: string;
  features: PlanFeature[];
  limits: {
    users: number;
    profiles: number;
    cards: number;
    storage: number;
  };
  popular?: boolean;
  recommended?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    description: 'Perfect for individuals getting started',
    features: [
      { name: '1 Team Member', included: true, limit: '1' },
      { name: '3 Profiles', included: true, limit: '3' },
      { name: '5 NFC Cards', included: true, limit: '5' },
      { name: '100 MB Storage', included: true, limit: '100 MB' },
      { name: 'Basic Analytics', included: true },
      { name: 'Email Support', included: true },
      { name: 'Custom Branding', included: false },
      { name: 'Priority Support', included: false },
      { name: 'Advanced Analytics', included: false },
      { name: 'API Access', included: false },
    ],
    limits: {
      users: 1,
      profiles: 3,
      cards: 5,
      storage: 100,
    },
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    interval: 'month',
    description: 'Great for small teams',
    popular: true,
    features: [
      { name: '5 Team Members', included: true, limit: '5' },
      { name: '10 Profiles', included: true, limit: '10' },
      { name: '25 NFC Cards', included: true, limit: '25' },
      { name: '1 GB Storage', included: true, limit: '1 GB' },
      { name: 'Basic Analytics', included: true },
      { name: 'Email Support', included: true },
      { name: 'Custom Branding', included: true },
      { name: 'Priority Support', included: false },
      { name: 'Advanced Analytics', included: false },
      { name: 'API Access', included: false },
    ],
    limits: {
      users: 5,
      profiles: 10,
      cards: 25,
      storage: 1000,
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    interval: 'month',
    description: 'For growing businesses',
    recommended: true,
    features: [
      { name: '20 Team Members', included: true, limit: '20' },
      { name: '50 Profiles', included: true, limit: '50' },
      { name: '100 NFC Cards', included: true, limit: '100' },
      { name: '10 GB Storage', included: true, limit: '10 GB' },
      { name: 'Basic Analytics', included: true },
      { name: 'Email Support', included: true },
      { name: 'Custom Branding', included: true },
      { name: 'Priority Support', included: true },
      { name: 'Advanced Analytics', included: true },
      { name: 'API Access', included: false },
    ],
    limits: {
      users: 20,
      profiles: 50,
      cards: 100,
      storage: 10000,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    interval: 'month',
    description: 'For large organizations',
    features: [
      { name: 'Unlimited Team Members', included: true, limit: 'Unlimited' },
      { name: 'Unlimited Profiles', included: true, limit: 'Unlimited' },
      { name: 'Unlimited NFC Cards', included: true, limit: 'Unlimited' },
      { name: '100 GB Storage', included: true, limit: '100 GB' },
      { name: 'Basic Analytics', included: true },
      { name: 'Email Support', included: true },
      { name: 'Custom Branding', included: true },
      { name: 'Priority Support', included: true },
      { name: 'Advanced Analytics', included: true },
      { name: 'API Access', included: true },
    ],
    limits: {
      users: -1,
      profiles: -1,
      cards: -1,
      storage: 100000,
    },
  },
];

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');
  const [organization, setOrganization] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const { limits, usage } = useOrganizationLimits();

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const response = await organizationsAPI.getCurrentOrganization();
      if (response.success && response.data) {
        setOrganization(response.data);
        setCurrentPlan(response.data.subscription?.plan || 'free');
      }
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch subscription data:', err);
      setError('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') {
      return; // Can't upgrade to free plan
    }

    try {
      setProcessingPlan(planId);
      setError(null);

      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to upgrade your plan');
        return;
      }

      // Create checkout session
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/payments/create-checkout-session`,
        {
          planId,
          billingCycle: billingCycle === 'year' ? 'yearly' : 'monthly',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const stripe = await stripePromise;

        if (!stripe) {
          throw new Error('Stripe failed to load');
        }

        // Redirect to Stripe Checkout
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: response.data.data.sessionId,
        });

        if (stripeError) {
          throw stripeError;
        }
      } else {
        throw new Error(response.data.error || 'Failed to create checkout session');
      }
    } catch (err: any) {
      console.error('Upgrade error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to start checkout process');
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setError(null);

      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to manage your subscription');
        return;
      }

      // Create portal session
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/payments/create-portal-session`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Redirect to customer portal
        window.location.href = response.data.data.url;
      } else {
        throw new Error(response.data.error || 'Failed to open billing portal');
      }
    } catch (err: any) {
      console.error('Manage subscription error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to open billing portal');
    }
  };

  const getYearlyPrice = (monthlyPrice: number) => {
    return Math.floor(monthlyPrice * 12 * 0.8); // 20% discount for yearly
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" width={300} height={60} />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 3, borderRadius: 2 }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Subscription Plans
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Choose the perfect plan for your organization
        </Typography>

        {/* Billing Cycle Toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1" color={billingCycle === 'month' ? 'primary' : 'text.secondary'}>
            Monthly
          </Typography>
          <Switch
            checked={billingCycle === 'year'}
            onChange={(e) => setBillingCycle(e.target.checked ? 'year' : 'month')}
          />
          <Typography variant="body1" color={billingCycle === 'year' ? 'primary' : 'text.secondary'}>
            Yearly
          </Typography>
          <Chip label="Save 20%" color="success" size="small" sx={{ ml: 1 }} />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Current Usage */}
      {limits && usage && (
        <Box sx={{ mb: 4 }}>
          <SubscriptionUsageCard
            plan={currentPlan}
            limits={limits}
            usage={usage}
          />
        </Box>
      )}

      {/* Pricing Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlan;
          const price = billingCycle === 'year' ? getYearlyPrice(plan.price) : plan.price;
          const priceLabel = billingCycle === 'year' ? '/year' : '/month';

          return (
            <Grid item xs={12} sm={6} md={3} key={plan.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: isCurrentPlan ? '2px solid' : '1px solid',
                  borderColor: isCurrentPlan ? 'primary.main' : 'divider',
                  boxShadow: plan.recommended ? 6 : 1,
                  transform: plan.recommended ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: plan.recommended ? 'scale(1.05)' : 'scale(1.02)',
                    boxShadow: 4,
                  },
                }}
              >
                {/* Badges */}
                {(plan.popular || plan.recommended || isCurrentPlan) && (
                  <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                    {isCurrentPlan && (
                      <Chip label="Current Plan" color="primary" size="small" />
                    )}
                    {plan.recommended && !isCurrentPlan && (
                      <Chip label="Recommended" color="success" size="small" />
                    )}
                    {plan.popular && !plan.recommended && !isCurrentPlan && (
                      <Chip label="Popular" color="warning" size="small" />
                    )}
                  </Box>
                )}

                <CardContent sx={{ flexGrow: 1, pt: 4 }}>
                  {/* Plan Name */}
                  <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
                    {plan.name}
                  </Typography>

                  {/* Price */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      ${price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {priceLabel}
                    </Typography>
                  </Box>

                  {/* Description */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {plan.description}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {/* Features */}
                  <List dense sx={{ py: 0 }}>
                    {plan.features.map((feature, index) => (
                      <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {feature.included ? (
                            <CheckIcon color="success" fontSize="small" />
                          ) : (
                            <CloseIcon color="disabled" fontSize="small" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={feature.name}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: feature.included ? 'text.primary' : 'text.disabled',
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant={isCurrentPlan ? 'outlined' : 'contained'}
                    color="primary"
                    disabled={isCurrentPlan || processingPlan === plan.id}
                    onClick={() => handleUpgrade(plan.id)}
                    startIcon={processingPlan === plan.id ? <CircularProgress size={20} /> : isCurrentPlan ? <CheckIcon /> : <UpgradeIcon />}
                  >
                    {processingPlan === plan.id ? 'Processing...' : isCurrentPlan ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Billing Information */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CardIcon />
          Billing Information
        </Typography>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Plan
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Next Billing Date
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon fontSize="small" />
                {currentPlan === 'free' ? 'N/A' : 'December 26, 2025'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Payment Method
              </Typography>
              <Typography variant="body1">
                {currentPlan === 'free' ? 'No payment method' : 'Visa ending in 4242'}
              </Typography>
              {currentPlan !== 'free' && (
                <Button size="small" sx={{ mt: 1 }}>
                  Update Payment Method
                </Button>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Auto-Renewal
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RenewIcon fontSize="small" color={currentPlan === 'free' ? 'disabled' : 'success'} />
                <Typography variant="body1">
                  {currentPlan === 'free' ? 'N/A' : 'Enabled'}
                </Typography>
              </Box>
              {currentPlan !== 'free' && (
                <Button size="small" sx={{ mt: 1 }} onClick={handleManageSubscription}>
                  Manage Subscription
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Billing History */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon />
          Billing History
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Invoice</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentPlan === 'free' ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                      No billing history available
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  <TableRow>
                    <TableCell>Nov 26, 2025</TableCell>
                    <TableCell>Professional Plan - Monthly</TableCell>
                    <TableCell>$79.00</TableCell>
                    <TableCell>
                      <Chip label="Paid" color="success" size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small">Download</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Oct 26, 2025</TableCell>
                    <TableCell>Professional Plan - Monthly</TableCell>
                    <TableCell>$79.00</TableCell>
                    <TableCell>
                      <Chip label="Paid" color="success" size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small">Download</Button>
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default SubscriptionPage;
