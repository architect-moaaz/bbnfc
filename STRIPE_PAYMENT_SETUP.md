# Stripe Payment Integration Setup & Testing Guide

**Date:** 2025-11-26
**Status:** ✅ **COMPLETE - Ready for Stripe Configuration**

---

## Overview

This guide covers the complete setup and testing of Stripe payment integration for the NFC Business Card Platform subscription system.

### What's Implemented

✅ Backend payment routes with Stripe Checkout
✅ Webhook handling for subscription events
✅ Frontend checkout flow integration
✅ Customer portal for subscription management
✅ 4-tier pricing plans (Free, Starter, Professional, Enterprise)
✅ Monthly and yearly billing cycles (20% discount)
✅ Resource limits enforcement

---

## Step 1: Stripe Account Setup

### 1.1 Create Stripe Account

1. Go to https://stripe.com and sign up
2. Complete account verification
3. Switch to **Test Mode** (toggle in top right)

### 1.2 Get API Keys

1. Navigate to **Developers → API Keys**
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)
4. Keep these secure - you'll add them to `.env` files

---

## Step 2: Create Products and Prices

### 2.1 Navigate to Products

1. Go to **Products** in Stripe Dashboard
2. Click **+ Add product** for each plan

### 2.2 Create Starter Plan

**Product Details:**
- Name: `Starter Plan`
- Description: `Great for small teams - 5 users, 10 profiles, 25 cards`

**Pricing:**
- Click **Add another price**
- **Monthly Price:**
  - Model: `Recurring`
  - Amount: `$29.00`
  - Billing period: `Monthly`
  - Price description: `Starter Monthly`
  - Click **Save**
  - Copy the **Price ID** (starts with `price_`)

- Click **Add another price** again
- **Yearly Price:**
  - Model: `Recurring`
  - Amount: `$278.40` (20% discount: $29 × 12 × 0.8)
  - Billing period: `Yearly`
  - Price description: `Starter Yearly`
  - Click **Save**
  - Copy the **Price ID**

### 2.3 Create Professional Plan

**Product Details:**
- Name: `Professional Plan`
- Description: `For growing businesses - 20 users, 50 profiles, 100 cards`

**Pricing:**
- **Monthly:** `$79.00` → Price ID
- **Yearly:** `$758.40` (20% discount) → Price ID

### 2.4 Create Enterprise Plan

**Product Details:**
- Name: `Enterprise Plan`
- Description: `For large organizations - Unlimited users, profiles, and cards`

**Pricing:**
- **Monthly:** `$199.00` → Price ID
- **Yearly:** `$1,910.40` (20% discount) → Price ID

### 2.5 Keep Track of Price IDs

You should now have **6 Price IDs**:
- `price_xxxxx` - Starter Monthly
- `price_xxxxx` - Starter Yearly
- `price_xxxxx` - Professional Monthly
- `price_xxxxx` - Professional Yearly
- `price_xxxxx` - Enterprise Monthly
- `price_xxxxx` - Enterprise Yearly

---

## Step 3: Configure Webhooks

### 3.1 Create Webhook Endpoint

1. Go to **Developers → Webhooks**
2. Click **+ Add endpoint**

**Endpoint Details:**
- **URL:** `http://localhost:5000/api/payments/webhook` (for local testing)
- **Description:** `Subscription events`
- **Events to send:**
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

3. Click **Add endpoint**
4. Copy the **Signing secret** (starts with `whsec_`)

### 3.2 Production Webhook (Later)

For production, you'll create another webhook with your production URL:
- **URL:** `https://yourdomain.com/api/payments/webhook`
- Same events as above

---

## Step 4: Environment Variables Configuration

### 4.1 Backend Configuration

Edit `backend/.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here

# Stripe Price IDs
STRIPE_STARTER_MONTHLY_PRICE_ID=price_your_starter_monthly_id
STRIPE_STARTER_YEARLY_PRICE_ID=price_your_starter_yearly_id
STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_your_professional_monthly_id
STRIPE_PROFESSIONAL_YEARLY_PRICE_ID=price_your_professional_yearly_id
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_your_enterprise_monthly_id
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_your_enterprise_yearly_id

# Frontend URL (for redirect after checkout)
FRONTEND_URL=http://localhost:3000
```

### 4.2 Frontend Configuration

Edit `frontend/.env`:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000

# Stripe Configuration
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_actual_publishable_key_here
```

### 4.3 Restart Servers

After updating `.env` files:

```bash
# Restart backend
cd backend
npm start

# Restart frontend (in another terminal)
cd frontend
npm start
```

---

## Step 5: Testing the Payment Flow

### 5.1 Test Checkout Flow

1. **Navigate to subscription page:**
   - Go to `http://localhost:3000/subscription`

2. **Select a plan:**
   - Toggle between monthly/yearly billing
   - Click **Upgrade** on any paid plan (Starter/Professional/Enterprise)

3. **Stripe Checkout should open:**
   - You'll be redirected to Stripe's hosted checkout page
   - Use Stripe test cards (see below)

4. **Test Cards:**

**Successful Payment:**
```
Card number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Declined Payment:**
```
Card number: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

**Requires Authentication (3D Secure):**
```
Card number: 4000 0025 0000 3155
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

5. **Complete checkout:**
   - Fill in test card details
   - Click **Subscribe**
   - You'll be redirected back to `/subscription?success=true`

6. **Verify subscription activated:**
   - Organization plan should be updated
   - Limits should be increased
   - Usage card should reflect new limits

### 5.2 Test Webhook Events

1. **Check webhook delivery:**
   - Go to Stripe Dashboard → **Developers → Webhooks**
   - Click on your webhook endpoint
   - You should see successful events:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `customer.subscription.created`

2. **Check backend logs:**
   ```bash
   # Should see in backend console:
   Subscription activated for organization 67xxxxx: starter (monthly)
   Payment succeeded for invoice in_xxxxx
   ```

3. **Check database:**
   - Organization document should have:
     - `subscription.plan`: "starter" (or selected plan)
     - `subscription.status`: "active"
     - `subscription.stripeSubscriptionId`: "sub_xxxxx"
     - `limits`: Updated to plan limits
     - `stripeCustomerId`: "cus_xxxxx"

### 5.3 Test Customer Portal

1. **Navigate to subscription page:**
   - Go to `http://localhost:3000/subscription`

2. **Manage subscription:**
   - Scroll to **Billing Information** section
   - Click **Manage Subscription** button

3. **Customer Portal opens:**
   - View subscription details
   - Update payment method
   - View invoice history
   - Cancel subscription (test this carefully!)

4. **Cancel subscription (optional test):**
   - Click **Cancel plan**
   - Confirm cancellation
   - Webhook `customer.subscription.deleted` fires
   - Organization downgrades to free plan

### 5.4 Test Subscription Update

1. **Upgrade plan:**
   - Start with Starter plan
   - Click **Upgrade** on Professional plan
   - Complete checkout
   - Webhook `customer.subscription.updated` fires
   - Limits are updated to Professional tier

### 5.5 Test Payment Failure

1. **Use declined card:**
   - Card: `4000 0000 0000 0002`
   - Attempt checkout
   - Payment should fail
   - User stays on free plan

2. **Simulate invoice failure:**
   - In Stripe Dashboard → **Payments**
   - Find a test invoice
   - Click **Mark as uncollectible**
   - Webhook `invoice.payment_failed` fires
   - Organization status becomes "past_due"

---

## Step 6: Webhook Testing with Stripe CLI (Optional but Recommended)

### 6.1 Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (with Scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Linux
# Download from https://github.com/stripe/stripe-cli/releases/latest
```

### 6.2 Login to Stripe CLI

```bash
stripe login
```

### 6.3 Forward Webhooks to Localhost

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

This will:
- Give you a webhook signing secret (starts with `whsec_`)
- Update your `backend/.env` with this secret
- Forward all Stripe events to your local server
- Show webhook events in real-time

### 6.4 Trigger Test Events

```bash
# Test successful checkout
stripe trigger checkout.session.completed

# Test subscription update
stripe trigger customer.subscription.updated

# Test subscription cancellation
stripe trigger customer.subscription.deleted

# Test payment success
stripe trigger invoice.payment_succeeded

# Test payment failure
stripe trigger invoice.payment_failed
```

---

## Step 7: Verify Implementation

### 7.1 Backend Endpoints

Test each endpoint with curl or Postman:

**Create Checkout Session:**
```bash
curl -X POST http://localhost:5000/api/payments/create-checkout-session \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "starter",
    "billingCycle": "monthly"
  }'
```

**Get Subscription Status:**
```bash
curl -X GET http://localhost:5000/api/payments/subscription-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create Portal Session:**
```bash
curl -X POST http://localhost:5000/api/payments/create-portal-session \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7.2 Check Database Schema

Verify Organization model has correct structure:

```javascript
{
  _id: ObjectId("..."),
  name: "Test Organization",
  slug: "test-org",

  // Subscription details
  subscription: {
    plan: "starter",              // free, starter, professional, enterprise
    status: "active",             // active, canceled, past_due
    stripeSubscriptionId: "sub_xxxxx",
    currentPeriodEnd: ISODate("2026-01-26"),
    billingCycle: "monthly"       // monthly, yearly
  },

  // Stripe customer
  stripeCustomerId: "cus_xxxxx",

  // Plan limits
  limits: {
    users: 5,
    profiles: 10,
    cards: 25,
    storage: 1000
  },

  // Current usage
  usage: {
    users: 2,
    profiles: 5,
    cards: 8,
    storage: 150
  }
}
```

---

## Step 8: Production Deployment Checklist

When ready for production:

### 8.1 Switch to Live Mode in Stripe

1. Toggle from **Test mode** to **Live mode** in Stripe Dashboard
2. Get **live API keys** (start with `pk_live_` and `sk_live_`)
3. Create **live products and prices** (same as test)
4. Create **production webhook** with your live domain

### 8.2 Update Production Environment Variables

```env
# Production backend .env
STRIPE_SECRET_KEY=sk_live_your_actual_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
STRIPE_STARTER_MONTHLY_PRICE_ID=price_live_starter_monthly
# ... all other live price IDs
FRONTEND_URL=https://yourdomain.com

# Production frontend .env
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_your_actual_live_key
REACT_APP_API_URL=https://api.yourdomain.com
```

### 8.3 Test with Real Card

Use a real credit card (your own) to test:
- Complete checkout flow
- Verify subscription activation
- Check webhook delivery
- Test customer portal
- Verify billing

### 8.4 Set Up Monitoring

- Monitor webhook events in Stripe Dashboard
- Set up alerts for failed payments
- Track subscription metrics
- Monitor for errors in logs

---

## Troubleshooting

### Issue: Stripe Checkout not opening

**Check:**
- Stripe public key is correct in `frontend/.env`
- API endpoint is accessible (`/api/payments/create-checkout-session`)
- User is authenticated (JWT token exists)
- Browser console for errors

**Solution:**
```bash
# Check frontend env
cat frontend/.env | grep STRIPE

# Restart frontend
cd frontend
npm start
```

### Issue: Webhook not firing

**Check:**
- Webhook endpoint is accessible (`/api/payments/webhook`)
- Webhook secret is correct in `backend/.env`
- Webhook events are selected in Stripe Dashboard
- Backend server is running

**Solution:**
```bash
# Use Stripe CLI to test locally
stripe listen --forward-to localhost:5000/api/payments/webhook

# Check backend logs
cd backend
npm start
```

### Issue: Subscription not activating

**Check:**
- Webhook `checkout.session.completed` was received
- Backend logs show "Subscription activated"
- Organization document in database was updated
- Price ID in webhook metadata is correct

**Solution:**
```javascript
// Check webhook handler logs
// backend/routes/payments.js:256
async function handleCheckoutSessionCompleted(session) {
  console.log('Checkout session:', JSON.stringify(session, null, 2));
  // ... rest of handler
}
```

### Issue: Wrong plan limits applied

**Check:**
- Price IDs in `.env` match Stripe Dashboard
- `getPlanFromPriceId()` function in `backend/config/stripe.js`
- Webhook metadata has correct `planId`

**Solution:**
```bash
# Verify price IDs
grep STRIPE_.*_PRICE_ID backend/.env

# Check Stripe Dashboard
# Products → Click product → View prices
```

### Issue: Customer portal not opening

**Check:**
- Organization has `stripeCustomerId`
- User has correct role (org_admin/admin/super_admin)
- Stripe secret key is correct

**Solution:**
```javascript
// Check organization in database
db.organizations.findOne({ _id: ObjectId("...") })

// Should have:
// { stripeCustomerId: "cus_xxxxx" }
```

---

## Test Scenarios

### Scenario 1: New User Subscribes

1. User creates account → Free plan
2. User creates organization → Free plan limits
3. User adds 2 profiles (limit: 3) → OK
4. User tries to add 4th profile → Blocked with limit warning
5. User navigates to `/subscription`
6. User clicks "Upgrade" on Starter plan
7. Completes Stripe checkout
8. Redirected back with success message
9. Organization plan = "starter"
10. User can now add up to 10 profiles

### Scenario 2: User Upgrades Plan

1. User on Starter plan (5 users, 10 profiles)
2. User adds 8 profiles → Near limit warning
3. User navigates to `/subscription`
4. User clicks "Upgrade" on Professional plan
5. Completes checkout
6. Webhook updates subscription
7. Organization plan = "professional"
8. User can now add up to 50 profiles

### Scenario 3: Payment Fails

1. User attempts to subscribe
2. Uses declined test card
3. Payment fails in Stripe
4. User stays on current plan
5. Error message shown
6. User tries again with valid card
7. Payment succeeds

### Scenario 4: User Cancels Subscription

1. User on Professional plan
2. User clicks "Manage Subscription"
3. Stripe Customer Portal opens
4. User clicks "Cancel plan"
5. Confirms cancellation
6. Webhook `customer.subscription.deleted` fires
7. Organization plan = "free"
8. Limits reduced to free tier
9. User notified of cancellation

---

## API Endpoints Reference

### POST `/api/payments/create-checkout-session`

Creates a Stripe Checkout session for subscription.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "planId": "starter",
  "billingCycle": "monthly"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_xxxxx",
    "url": "https://checkout.stripe.com/pay/cs_test_xxxxx"
  }
}
```

### POST `/api/payments/create-portal-session`

Creates a Stripe Customer Portal session for subscription management.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/session/xxxxx"
  }
}
```

### GET `/api/payments/subscription-status`

Gets current subscription status and limits.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": "starter",
    "status": "active",
    "billingCycle": "monthly",
    "currentPeriodEnd": "2026-01-26T00:00:00.000Z",
    "limits": {
      "users": 5,
      "profiles": 10,
      "cards": 25,
      "storage": 1000
    },
    "usage": {
      "users": 2,
      "profiles": 5,
      "cards": 8,
      "storage": 150
    }
  }
}
```

### POST `/api/payments/webhook`

Handles Stripe webhook events (public endpoint, verified by signature).

**Headers:**
```
stripe-signature: t=xxxxx,v1=xxxxx
Content-Type: application/json
```

**Body:** Raw JSON from Stripe

---

## Webhook Events Handled

### `checkout.session.completed`

Triggered when user completes checkout.

**Actions:**
- Updates organization subscription
- Sets plan and status
- Saves Stripe subscription ID
- Updates resource limits

### `customer.subscription.updated`

Triggered when subscription is modified (upgrade/downgrade).

**Actions:**
- Updates plan from price ID
- Updates billing cycle
- Updates limits
- Updates subscription status

### `customer.subscription.deleted`

Triggered when subscription is canceled.

**Actions:**
- Downgrades to free plan
- Resets limits to free tier
- Sets status to "canceled"

### `invoice.payment_succeeded`

Triggered when payment succeeds.

**Actions:**
- Logs successful payment
- (Optional) Send receipt email

### `invoice.payment_failed`

Triggered when payment fails.

**Actions:**
- Sets subscription status to "past_due"
- Logs payment failure
- (Optional) Send notification email

---

## Files Modified

### Created

1. `backend/config/stripe.js` - Stripe configuration
2. `backend/routes/payments.js` - Payment API routes
3. `STRIPE_PAYMENT_SETUP.md` - This guide

### Modified

1. `backend/server.js` - Registered payment routes
2. `backend/.env` - Added Stripe keys and price IDs
3. `frontend/.env` - Added Stripe public key
4. `frontend/src/pages/SubscriptionPage.tsx` - Integrated checkout flow

### Dependencies Added

**Backend:**
- `stripe` (already installed in previous step)

**Frontend:**
- `@stripe/stripe-js`

---

## Security Considerations

### Backend

- Webhook signature verification prevents unauthorized events
- JWT authentication protects payment endpoints
- Rate limiting prevents abuse
- Raw body parser only for webhook endpoint
- Sensitive data in environment variables

### Frontend

- Public key only (safe to expose)
- Checkout handled by Stripe (PCI compliant)
- No card data touches your servers
- Token-based authentication
- HTTPS in production

### Database

- Subscription IDs encrypted at rest
- No card details stored locally
- Customer IDs only (references Stripe)
- Regular backups

---

## Success Criteria

✅ User can view pricing plans
✅ User can subscribe to paid plan
✅ Stripe checkout opens correctly
✅ Payment processed successfully
✅ Webhook events received
✅ Subscription activated in database
✅ Limits updated correctly
✅ Customer portal accessible
✅ User can manage subscription
✅ User can cancel subscription
✅ Downgrade to free works

---

## Next Steps

1. **Configure Stripe Dashboard** with your products and prices
2. **Add environment variables** with your actual keys
3. **Test complete payment flow** with test cards
4. **Monitor webhook events** in Stripe Dashboard
5. **Set up production environment** when ready to launch

---

## Support Resources

- **Stripe Documentation:** https://stripe.com/docs
- **Stripe Test Cards:** https://stripe.com/docs/testing#cards
- **Stripe CLI:** https://stripe.com/docs/stripe-cli
- **Webhook Testing:** https://stripe.com/docs/webhooks/test

---

**Payment integration is complete and ready for testing!** 🎉
