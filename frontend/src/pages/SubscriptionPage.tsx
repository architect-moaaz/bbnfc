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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { organizationsAPI } from '../services/api';
import SubscriptionUsageCard from '../components/SubscriptionUsageCard';
import { useOrganizationLimits } from '../hooks/useOrganizationLimits';

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
    price: 109, // SAR
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
    price: 299, // SAR
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
    price: 749, // SAR
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
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');
  const [organization, setOrganization] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  const { limits, usage } = useOrganizationLimits();

  // Handle payment callback status
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const plan = searchParams.get('plan');

    if (paymentStatus === 'success') {
      setSuccess(`Payment successful! Your plan has been upgraded${plan ? ` to ${plan}` : ''}.`);
      // Refresh subscription data
      fetchSubscriptionData();
    } else if (paymentStatus === 'failed') {
      setError('Payment failed. Please try again.');
    } else if (paymentStatus === 'cancelled') {
      setError('Payment was cancelled.');
    } else if (paymentStatus === 'error') {
      const message = searchParams.get('message');
      setError(message ? decodeURIComponent(message) : 'An error occurred during payment.');
    }
  }, [searchParams]);

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
      setSuccess(null);

      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to upgrade your plan');
        return;
      }

      // Create Fatoora invoice
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || ''}/api/payments/fatoora/create-payment`,
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
        // Show invoice dialog with payment details
        setInvoiceData(response.data.data);
        setShowInvoiceDialog(true);

        // If there's an invoice URL from Fatoora, open it in a new tab
        if (response.data.data.invoiceUrl) {
          window.open(response.data.data.invoiceUrl, '_blank');
        }
      } else {
        throw new Error(response.data.error || 'Failed to create invoice');
      }
    } catch (err: any) {
      console.error('Upgrade error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create invoice');
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
    // SAR yearly prices (approximately 20-25% discount)
    const yearlyPrices: { [key: number]: number } = {
      0: 0,
      109: 999,   // Starter yearly
      299: 2699,  // Professional yearly
      749: 6999,  // Enterprise yearly
    };
    return yearlyPrices[monthlyPrice] || Math.floor(monthlyPrice * 12 * 0.8);
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

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
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
                      {price === 0 ? 'Free' : `${price} SAR`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {price === 0 ? '' : priceLabel}
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

      {/* Invoice Dialog */}
      <Dialog
        open={showInvoiceDialog}
        onClose={() => setShowInvoiceDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Invoice Created Successfully
        </DialogTitle>
        <DialogContent>
          {invoiceData && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                {invoiceData.message || 'Please complete payment to activate your subscription.'}
              </Alert>

              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Invoice Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Reference</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{invoiceData.reference}</Typography>
                  </Grid>
                  {invoiceData.invoiceNumber && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Invoice Number</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{invoiceData.invoiceNumber}</Typography>
                    </Grid>
                  )}
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Plan</Typography>
                    <Typography variant="body1">{invoiceData.planName || invoiceData.plan}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Billing Period</Typography>
                    <Typography variant="body1">{invoiceData.billingPeriod || invoiceData.billingCycle}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Amount
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={8}>
                    <Typography variant="body2">Subtotal</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" align="right">{invoiceData.amount} SAR</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">VAT (15%)</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" align="right">{invoiceData.vatAmount} SAR</Typography>
                  </Grid>
                  <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>Total</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }} align="right">{invoiceData.totalAmount} SAR</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {invoiceData.paymentInstructions && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Bank Transfer Details
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Bank</Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="body2">{invoiceData.paymentInstructions.bankName}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Account Name</Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="body2">{invoiceData.paymentInstructions.accountName}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">IBAN</Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{invoiceData.paymentInstructions.iban}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Reference</Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{invoiceData.paymentInstructions.reference}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          {invoiceData?.invoiceUrl && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.open(invoiceData.invoiceUrl, '_blank')}
            >
              View Invoice PDF
            </Button>
          )}
          <Button onClick={() => setShowInvoiceDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SubscriptionPage;
