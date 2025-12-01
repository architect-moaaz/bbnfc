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

module.exports = router;
