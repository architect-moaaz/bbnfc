const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { stripe, getPriceId, getPlanLimits, getPlanFromPriceId } = require('../config/stripe');

/**
 * @route   POST /api/payments/create-checkout-session
 * @desc    Create Stripe checkout session for subscription
 * @access  Protected
 */
router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    const { planId, billingCycle = 'monthly' } = req.body;

    // Validate plan
    if (!['starter', 'professional', 'enterprise'].includes(planId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan selected'
      });
    }

    // Validate billing cycle
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid billing cycle'
      });
    }

    // Check if user has organization
    if (!req.user.organization) {
      return res.status(403).json({
        success: false,
        error: 'You must belong to an organization to upgrade'
      });
    }

    // Get organization
    const organization = await Organization.findById(req.user.organization);
    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Check if user has permission to manage billing
    if (!['org_admin', 'admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Only organization admins can manage billing'
      });
    }

    // Get price ID from Stripe
    const priceId = getPriceId(planId, billingCycle);

    if (!priceId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan configuration'
      });
    }

    // Create or retrieve Stripe customer
    let customerId = organization.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: organization.name,
        metadata: {
          organizationId: organization._id.toString(),
          userId: req.user._id.toString(),
        },
      });
      customerId = customer.id;
      organization.stripeCustomerId = customerId;
      await organization.save();
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription?canceled=true`,
      metadata: {
        organizationId: organization._id.toString(),
        userId: req.user._id.toString(),
        planId,
        billingCycle,
      },
      subscription_data: {
        metadata: {
          organizationId: organization._id.toString(),
          planId,
          billingCycle,
        },
      },
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating checkout session',
      details: error.message,
    });
  }
});

/**
 * @route   POST /api/payments/create-portal-session
 * @desc    Create Stripe customer portal session for managing subscription
 * @access  Protected
 */
router.post('/create-portal-session', protect, async (req, res) => {
  try {
    // Check if user has organization
    if (!req.user.organization) {
      return res.status(403).json({
        success: false,
        error: 'You must belong to an organization'
      });
    }

    // Get organization
    const organization = await Organization.findById(req.user.organization);
    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Check if user has permission
    if (!['org_admin', 'admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Only organization admins can manage billing'
      });
    }

    // Check if organization has Stripe customer
    if (!organization.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        error: 'No active subscription found'
      });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: organization.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/subscription`,
    });

    res.json({
      success: true,
      data: {
        url: session.url,
      },
    });
  } catch (error) {
    console.error('Create portal session error:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating portal session',
      details: error.message,
    });
  }
});

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Stripe webhooks
 * @access  Public (verified by Stripe signature)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Webhook event handlers

async function handleCheckoutSessionCompleted(session) {
  const organizationId = session.metadata.organizationId;
  const planId = session.metadata.planId;
  const billingCycle = session.metadata.billingCycle;

  const organization = await Organization.findById(organizationId);
  if (!organization) {
    console.error('Organization not found:', organizationId);
    return;
  }

  // Update organization with subscription details
  organization.subscription = {
    plan: planId,
    status: 'active',
    stripeSubscriptionId: session.subscription,
    currentPeriodEnd: new Date(session.subscription ? null : Date.now()),
    billingCycle,
  };

  // Update limits based on plan
  const limits = getPlanLimits(planId);
  organization.limits = limits;

  await organization.save();

  console.log(`Subscription activated for organization ${organizationId}: ${planId} (${billingCycle})`);
}

async function handleSubscriptionUpdated(subscription) {
  const organizationId = subscription.metadata.organizationId;
  const organization = await Organization.findById(organizationId);

  if (!organization) {
    console.error('Organization not found:', organizationId);
    return;
  }

  // Get plan from price ID
  const priceId = subscription.items.data[0].price.id;
  const planInfo = getPlanFromPriceId(priceId);

  if (planInfo) {
    organization.subscription.plan = planInfo.planId;
    organization.subscription.billingCycle = planInfo.billingCycle;
    organization.limits = getPlanLimits(planInfo.planId);
  }

  organization.subscription.status = subscription.status;
  organization.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  await organization.save();

  console.log(`Subscription updated for organization ${organizationId}`);
}

async function handleSubscriptionDeleted(subscription) {
  const organizationId = subscription.metadata.organizationId;
  const organization = await Organization.findById(organizationId);

  if (!organization) {
    console.error('Organization not found:', organizationId);
    return;
  }

  // Downgrade to free plan
  organization.subscription.plan = 'free';
  organization.subscription.status = 'canceled';
  organization.limits = getPlanLimits('free');

  await organization.save();

  console.log(`Subscription canceled for organization ${organizationId}`);
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log(`Payment succeeded for invoice ${invoice.id}`);
  // You can add additional logic here, such as sending a receipt email
}

async function handleInvoicePaymentFailed(invoice) {
  console.log(`Payment failed for invoice ${invoice.id}`);
  // You can add additional logic here, such as sending a payment failed email

  const customerId = invoice.customer;
  const organization = await Organization.findOne({ stripeCustomerId: customerId });

  if (organization) {
    organization.subscription.status = 'past_due';
    await organization.save();
  }
}

/**
 * @route   GET /api/payments/subscription-status
 * @desc    Get current subscription status
 * @access  Protected
 */
router.get('/subscription-status', protect, async (req, res) => {
  try {
    if (!req.user.organization) {
      return res.json({
        success: true,
        data: {
          plan: 'free',
          status: 'active',
        },
      });
    }

    const organization = await Organization.findById(req.user.organization);
    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    res.json({
      success: true,
      data: {
        plan: organization.subscription?.plan || 'free',
        status: organization.subscription?.status || 'active',
        billingCycle: organization.subscription?.billingCycle,
        currentPeriodEnd: organization.subscription?.currentPeriodEnd,
        limits: organization.limits,
        usage: organization.usage,
      },
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching subscription status',
    });
  }
});

/**
 * Simple Fatoora API Integration
 * API Base: https://api.simplefatoora.com
 * Documentation: https://simplefatoora.com/fatoora_doc.html
 */
const axios = require('axios');
const { settingsOperations } = require('../utils/dbOperations');

const FATOORA_API_BASE = 'https://api.simplefatoora.com';

// Helper to create Fatoora API instance with dynamic API key
const createFatooraApi = (apiKey) => {
  return axios.create({
    baseURL: FATOORA_API_BASE,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    }
  });
};

// Get Fatoora API key from database settings or fallback to env
const getFatooraApiKey = async () => {
  try {
    const settings = await settingsOperations.getPaymentSettings();
    if (settings.fatoora?.enabled && settings.fatoora?.apiKey) {
      return settings.fatoora.apiKey;
    }
  } catch (error) {
    console.error('Error fetching Fatoora settings:', error);
  }
  return process.env.FATOORA_API_KEY;
};

// Get bank details from database settings or fallback to defaults
const getBankDetails = async () => {
  try {
    const settings = await settingsOperations.getPaymentSettings();
    if (settings.bankDetails) {
      return {
        bankName: settings.bankDetails.bankName || 'Al Rajhi Bank',
        accountName: settings.bankDetails.accountName || 'BBTap Business Solutions',
        iban: settings.bankDetails.iban || process.env.PAYMENT_IBAN || 'SA0000000000000000000000',
        swiftCode: settings.bankDetails.swiftCode || ''
      };
    }
  } catch (error) {
    console.error('Error fetching bank details:', error);
  }
  return {
    bankName: 'Al Rajhi Bank',
    accountName: 'BBTap Business Solutions',
    iban: process.env.PAYMENT_IBAN || 'SA0000000000000000000000',
    swiftCode: ''
  };
};

/**
 * @route   POST /api/payments/fatoora/create-payment
 * @desc    Create Fatoora invoice for subscription upgrade
 * @access  Protected
 */
router.post('/fatoora/create-payment', protect, async (req, res) => {
  try {
    const { planId, billingCycle = 'monthly' } = req.body;

    // Validate plan
    if (!['starter', 'professional', 'enterprise'].includes(planId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan selected'
      });
    }

    // Get user organization
    let organization = null;
    if (req.user.organization) {
      organization = await Organization.findById(req.user.organization);
    }

    // Define plan prices (in SAR - Saudi Riyal)
    const planPrices = {
      starter: { monthly: 109, yearly: 999 },
      professional: { monthly: 299, yearly: 2699 },
      enterprise: { monthly: 749, yearly: 6999 },
    };

    const planNames = {
      starter: 'BBTap Starter Plan',
      professional: 'BBTap Professional Plan',
      enterprise: 'BBTap Enterprise Plan',
    };

    const price = planPrices[planId][billingCycle === 'yearly' ? 'yearly' : 'monthly'];
    const billingPeriod = billingCycle === 'yearly' ? 'Annual' : 'Monthly';

    // Create a unique invoice reference
    const invoiceRef = `BBT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Store payment session
    const paymentSession = {
      reference: invoiceRef,
      userId: req.user._id.toString(),
      organizationId: organization?._id?.toString() || null,
      planId,
      billingCycle: billingCycle === 'yearly' ? 'yearly' : 'monthly',
      amount: price,
      currency: 'SAR',
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
    };

    await User.findByIdAndUpdate(req.user._id, {
      $set: { pendingPayment: paymentSession }
    });

    // Get Fatoora API key from database or environment
    const fatooraApiKey = await getFatooraApiKey();

    // If Fatoora API key is configured, create invoice via API
    if (fatooraApiKey) {
      try {
        const fatooraApi = createFatooraApi(fatooraApiKey);

        // Create invoice using Simple Fatoora API
        const invoiceData = {
          // Client details (individual - client_type: 2)
          client_type: 2,
          client_name: req.user.name || organization?.name || 'Customer',
          client_mobile: req.user.phone || '',
          client_email: req.user.email,
          client_country_code: '+966',

          // Invoice type: 0 = Simplified Invoice
          invoice_type: 0,

          // Line items
          line_items: [
            {
              description: `${planNames[planId]} - ${billingPeriod} Subscription`,
              product_id: `PLAN-${planId.toUpperCase()}`,
              unit_price: price,
              quantity: 1,
              vat_percent: 15 // Saudi VAT rate
            }
          ],

          // Additional info
          notes: `Subscription Reference: ${invoiceRef}`,
          footer_text: 'Thank you for choosing BBTap!'
        };

        const fatooraResponse = await fatooraApi.post('/api_doc/invoice/create', invoiceData);

        if (fatooraResponse.data.status) {
          // Update payment session with Fatoora invoice details
          await User.findByIdAndUpdate(req.user._id, {
            $set: {
              'pendingPayment.fatooraInvoiceId': fatooraResponse.data.response.invoice_id,
              'pendingPayment.fatooraInvoiceNumber': fatooraResponse.data.response.invoice_number,
              'pendingPayment.fatooraInvoiceUrl': fatooraResponse.data.response.invoice_pdf_url
            }
          });

          return res.json({
            success: true,
            data: {
              reference: invoiceRef,
              invoiceNumber: fatooraResponse.data.response.invoice_number,
              invoiceUrl: fatooraResponse.data.response.invoice_pdf_url,
              amount: price,
              vatAmount: (price * 0.15).toFixed(2),
              totalAmount: (price * 1.15).toFixed(2),
              currency: 'SAR',
              plan: planId,
              billingCycle,
              message: 'Invoice created successfully. Please complete payment to activate your subscription.'
            },
          });
        }
      } catch (fatooraError) {
        console.error('Fatoora API error:', fatooraError.response?.data || fatooraError.message);
        // Fall through to manual invoice flow
      }
    }

    // Fallback: Return payment details for manual processing
    const frontendUrl = process.env.FRONTEND_URL || 'https://bbetanfc.vercel.app';
    const bankDetails = await getBankDetails();

    res.json({
      success: true,
      data: {
        reference: invoiceRef,
        amount: price,
        vatAmount: (price * 0.15).toFixed(2),
        totalAmount: (price * 1.15).toFixed(2),
        currency: 'SAR',
        plan: planId,
        planName: planNames[planId],
        billingCycle,
        billingPeriod,
        // Payment instructions from database settings
        paymentInstructions: {
          bankName: bankDetails.bankName,
          accountName: bankDetails.accountName,
          iban: bankDetails.iban,
          swiftCode: bankDetails.swiftCode,
          reference: invoiceRef,
        },
        confirmationUrl: `${frontendUrl}/subscription?ref=${invoiceRef}`,
        message: 'Please complete the bank transfer and contact support with your payment reference for activation.'
      },
    });
  } catch (error) {
    console.error('Create Fatoora payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating invoice',
      details: error.message,
    });
  }
});

/**
 * @route   GET /api/payments/fatoora/callback
 * @desc    Handle Fatoora payment callback
 * @access  Public
 */
router.get('/fatoora/callback', async (req, res) => {
  try {
    const { ref, status, transaction_id } = req.query;

    if (!ref) {
      return res.redirect(`${process.env.FRONTEND_URL || 'https://bbetanfc.vercel.app'}/subscription?payment=error&message=Invalid+callback`);
    }

    // Find user with this payment reference
    const user = await User.findOne({ 'pendingPayment.reference': ref });

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'https://bbetanfc.vercel.app'}/subscription?payment=error&message=Payment+not+found`);
    }

    const paymentSession = user.pendingPayment;

    if (status === 'success' || status === 'paid') {
      // Payment successful - upgrade subscription
      const planLimits = {
        starter: { maxUsers: 5, maxProfiles: 10, maxCards: 25, maxStorage: 1000 },
        professional: { maxUsers: 20, maxProfiles: 50, maxCards: 100, maxStorage: 10000 },
        enterprise: { maxUsers: -1, maxProfiles: -1, maxCards: -1, maxStorage: 100000 },
      };

      // Update organization if exists
      if (paymentSession.organizationId) {
        await Organization.findByIdAndUpdate(paymentSession.organizationId, {
          $set: {
            'subscription.plan': paymentSession.planId,
            'subscription.status': 'active',
            'subscription.billingCycle': paymentSession.billingCycle,
            'subscription.currentPeriodEnd': new Date(Date.now() + (paymentSession.billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
            'subscription.fatooraTransactionId': transaction_id,
            limits: planLimits[paymentSession.planId],
          }
        });
      }

      // Update user subscription
      await User.findByIdAndUpdate(user._id, {
        $set: {
          'subscription.plan': paymentSession.planId,
          'subscription.status': 'active',
        },
        $unset: { pendingPayment: 1 }
      });

      return res.redirect(`${process.env.FRONTEND_URL || 'https://bbetanfc.vercel.app'}/subscription?payment=success&plan=${paymentSession.planId}`);
    } else {
      // Payment failed or cancelled
      await User.findByIdAndUpdate(user._id, {
        $unset: { pendingPayment: 1 }
      });

      return res.redirect(`${process.env.FRONTEND_URL || 'https://bbetanfc.vercel.app'}/subscription?payment=failed`);
    }
  } catch (error) {
    console.error('Fatoora callback error:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'https://bbetanfc.vercel.app'}/subscription?payment=error&message=Server+error`);
  }
});

/**
 * @route   POST /api/payments/fatoora/webhook
 * @desc    Handle Fatoora webhook notifications
 * @access  Public (verified by signature)
 */
router.post('/fatoora/webhook', async (req, res) => {
  try {
    const { reference, status, transaction_id, signature } = req.body;

    // Verify webhook signature (implement based on Fatoora's signing method)
    // const expectedSignature = createHmac('sha256', process.env.FATOORA_WEBHOOK_SECRET)
    //   .update(`${reference}${status}${transaction_id}`)
    //   .digest('hex');
    // if (signature !== expectedSignature) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    // Find user with this payment reference
    const user = await User.findOne({ 'pendingPayment.reference': reference });

    if (!user) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const paymentSession = user.pendingPayment;

    if (status === 'paid' || status === 'success') {
      const planLimits = {
        starter: { maxUsers: 5, maxProfiles: 10, maxCards: 25, maxStorage: 1000 },
        professional: { maxUsers: 20, maxProfiles: 50, maxCards: 100, maxStorage: 10000 },
        enterprise: { maxUsers: -1, maxProfiles: -1, maxCards: -1, maxStorage: 100000 },
      };

      if (paymentSession.organizationId) {
        await Organization.findByIdAndUpdate(paymentSession.organizationId, {
          $set: {
            'subscription.plan': paymentSession.planId,
            'subscription.status': 'active',
            'subscription.billingCycle': paymentSession.billingCycle,
            'subscription.currentPeriodEnd': new Date(Date.now() + (paymentSession.billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
            'subscription.fatooraTransactionId': transaction_id,
            limits: planLimits[paymentSession.planId],
          }
        });
      }

      await User.findByIdAndUpdate(user._id, {
        $set: {
          'subscription.plan': paymentSession.planId,
          'subscription.status': 'active',
        },
        $unset: { pendingPayment: 1 }
      });
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Fatoora webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

/**
 * @route   POST /api/payments/fatoora/verify
 * @desc    Verify Fatoora payment status
 * @access  Protected
 */
router.post('/fatoora/verify', protect, async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({
        success: false,
        error: 'Payment reference is required'
      });
    }

    // Check if user has this payment
    const user = await User.findById(req.user._id);
    if (!user || !user.pendingPayment || user.pendingPayment.reference !== reference) {
      // Payment may have been processed - check subscription status
      const org = req.user.organization ? await Organization.findById(req.user.organization) : null;

      return res.json({
        success: true,
        data: {
          status: org?.subscription?.plan !== 'free' ? 'completed' : 'unknown',
          plan: org?.subscription?.plan || user?.subscription?.plan || 'free',
        }
      });
    }

    // Payment is still pending
    res.json({
      success: true,
      data: {
        status: 'pending',
        reference: user.pendingPayment.reference,
        plan: user.pendingPayment.planId,
        amount: user.pendingPayment.amount,
        currency: user.pendingPayment.currency,
      }
    });
  } catch (error) {
    console.error('Verify Fatoora payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Error verifying payment',
    });
  }
});

module.exports = router;
