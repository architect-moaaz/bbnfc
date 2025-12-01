const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Stripe Product and Price Configuration
// These correspond to products created in your Stripe Dashboard

const STRIPE_PLANS = {
  starter: {
    monthly: {
      priceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_starter_monthly',
      amount: 2900, // $29.00
    },
    yearly: {
      priceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_starter_yearly',
      amount: 27840, // $278.40 (20% discount)
    },
  },
  professional: {
    monthly: {
      priceId: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || 'price_professional_monthly',
      amount: 7900, // $79.00
    },
    yearly: {
      priceId: process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID || 'price_professional_yearly',
      amount: 75840, // $758.40 (20% discount)
    },
  },
  enterprise: {
    monthly: {
      priceId: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_enterprise_monthly',
      amount: 19900, // $199.00
    },
    yearly: {
      priceId: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly',
      amount: 191040, // $1910.40 (20% discount)
    },
  },
};

// Plan limits configuration
const PLAN_LIMITS = {
  free: {
    users: 1,
    profiles: 3,
    cards: 5,
    storage: 100, // MB
  },
  starter: {
    users: 5,
    profiles: 10,
    cards: 25,
    storage: 1000, // 1 GB
  },
  professional: {
    users: 20,
    profiles: 50,
    cards: 100,
    storage: 10000, // 10 GB
  },
  enterprise: {
    users: -1, // Unlimited
    profiles: -1,
    cards: -1,
    storage: 100000, // 100 GB
  },
};

/**
 * Get Stripe price ID for a plan and billing cycle
 */
const getPriceId = (planId, billingCycle = 'monthly') => {
  if (planId === 'free') {
    return null;
  }

  const plan = STRIPE_PLANS[planId];
  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }

  const cycle = plan[billingCycle];
  if (!cycle) {
    throw new Error(`Invalid billing cycle: ${billingCycle}`);
  }

  return cycle.priceId;
};

/**
 * Get plan limits
 */
const getPlanLimits = (planId) => {
  const limits = PLAN_LIMITS[planId];
  if (!limits) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }
  return limits;
};

/**
 * Get plan name from price ID
 */
const getPlanFromPriceId = (priceId) => {
  for (const [planId, plan] of Object.entries(STRIPE_PLANS)) {
    if (plan.monthly.priceId === priceId || plan.yearly.priceId === priceId) {
      const billingCycle = plan.monthly.priceId === priceId ? 'monthly' : 'yearly';
      return { planId, billingCycle };
    }
  }
  return null;
};

module.exports = {
  stripe,
  STRIPE_PLANS,
  PLAN_LIMITS,
  getPriceId,
  getPlanLimits,
  getPlanFromPriceId,
};
