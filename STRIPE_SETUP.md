# Stripe Payment Integration Setup Guide

This guide explains how to configure Stripe payments for your NUUM application.

## Prerequisites

1. A Stripe account (create one at [stripe.com](https://stripe.com))
2. Access to your Supabase project dashboard
3. Your application deployed or running locally

## Step 1: Get Your Stripe API Keys

### 1.1 Access Stripe Dashboard
Go to your [Stripe Dashboard API Keys page](https://dashboard.stripe.com/apikeys)

### 1.2 Copy Your Keys
You'll need two keys:
- **Publishable Key** (starts with `pk_test_` for test mode or `pk_live_` for live mode)
- **Secret Key** (starts with `sk_test_` for test mode or `sk_live_` for live mode)

⚠️ **Important**: Keep your Secret Key private - never commit it to version control!

## Step 2: Create Stripe Price IDs

### 2.1 Create Products in Stripe Dashboard

1. Go to [Products](https://dashboard.stripe.com/products) in your Stripe Dashboard
2. Click "+ Add product" for each plan:

#### Standard Plan
- **Name**: NUUM Standard
- **Description**: Professional creator management for growing brands
- **Pricing**:
  - Monthly: $199/month (create price)
  - Annual: $1,990/year (create price)

#### Elite Plan
- **Name**: NUUM Elite
- **Description**: Advanced features for scaling brands
- **Pricing**:
  - Monthly: $499/month (create price)
  - Annual: $4,990/year (create price)

### 2.2 Copy the Price IDs

After creating each price, copy the **Price ID** (starts with `price_`). You'll need:
- `price_standard_monthly`
- `price_standard_annual`
- `price_elite_monthly`
- `price_elite_annual`

## Step 3: Configure Supabase Edge Function Secrets

### 3.1 Access Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **Edge Functions** → **Manage secrets**

### 3.2 Add Stripe Secrets

Add the following secrets (one by one):

```bash
# Stripe Secret Key
Key: STRIPE_SECRET_KEY
Value: sk_test_your_actual_secret_key_here

# Stripe Webhook Secret (optional, for webhooks)
Key: STRIPE_WEBHOOK_SECRET
Value: whsec_your_webhook_secret_here
```

### 3.3 Using Supabase CLI (Alternative Method)

If you have the Supabase CLI installed:

```bash
# Set STRIPE_SECRET_KEY
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_actual_key

# Set STRIPE_WEBHOOK_SECRET (optional)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Step 4: Update Edge Function with Real Price IDs

Edit the file `supabase/functions/create-checkout/index.ts`:

```typescript
const PLAN_PRICES = {
  standard: {
    monthly: "price_1234567890abcdef", // Replace with your actual price ID
    annual: "price_0987654321fedcba",  // Replace with your actual price ID
  },
  elite: {
    monthly: "price_abcdef1234567890", // Replace with your actual price ID
    annual: "price_fedcba0987654321",  // Replace with your actual price ID
  },
};
```

## Step 5: Implement Real Stripe Checkout

Replace the placeholder checkout code in `supabase/functions/create-checkout/index.ts`:

```typescript
// Replace the placeholder code with actual Stripe Checkout Session API call
import Stripe from "npm:stripe@14";

const stripe = new Stripe(STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

// Create actual Stripe Checkout Session
const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  payment_method_types: ["card"],
  line_items: [
    {
      price: priceId,
      quantity: 1,
    },
  ],
  success_url: successUrl,
  cancel_url: cancelUrl,
  client_reference_id: workspaceId,
  customer_email: user.email,
  metadata: {
    workspace_id: workspaceId,
    plan: plan,
    billing_period: billingPeriod,
  },
});

return new Response(
  JSON.stringify({
    checkoutUrl: session.url,
  }),
  {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  }
);
```

## Step 6: Set Up Stripe Webhooks (Recommended)

### 6.1 Create Webhook Endpoint

1. Go to [Webhooks](https://dashboard.stripe.com/webhooks) in Stripe Dashboard
2. Click "+ Add endpoint"
3. Set endpoint URL to:
   ```
   https://your-project-ref.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 6.2 Copy Webhook Secret

After creating the webhook, copy the **Signing secret** (starts with `whsec_`) and add it to Supabase secrets as `STRIPE_WEBHOOK_SECRET`.

### 6.3 Create Webhook Handler (Optional)

Create a new Edge Function `supabase/functions/stripe-webhook/index.ts` to handle webhook events and update your database accordingly.

## Step 7: Test the Integration

### 7.1 Use Stripe Test Mode

Always test with test mode keys first (starting with `sk_test_` and `pk_test_`).

### 7.2 Test Card Numbers

Use [Stripe test cards](https://stripe.com/docs/testing):
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

### 7.3 Test the Flow

1. Go to your application's Billing page
2. Click "Upgrade Now" on any plan
3. Select billing period (monthly/annual)
4. Click checkout button
5. Complete payment with test card
6. Verify subscription status updates

## Step 8: Go Live

### 8.1 Switch to Live Mode

1. Get your **live** API keys from Stripe Dashboard (toggle to "Live" mode)
2. Update Supabase secrets with live keys
3. Create live products and prices
4. Update price IDs in Edge Function
5. Test thoroughly before announcing

### 8.2 Production Checklist

- [ ] Live Stripe keys configured in Supabase
- [ ] Live products and prices created
- [ ] Price IDs updated in code
- [ ] Webhook endpoint set up and verified
- [ ] Test subscription flow end-to-end
- [ ] Verify subscription status updates correctly
- [ ] Test cancellation flow
- [ ] Test upgrade/downgrade scenarios
- [ ] Review error handling
- [ ] Set up monitoring/alerts

## Troubleshooting

### "Stripe is not configured" Error

**Cause**: `STRIPE_SECRET_KEY` not set in Supabase Edge Function secrets.

**Solution**: Follow Step 3 to add the secret.

### Checkout Session Creation Fails

**Cause**: Invalid price ID or incorrect API key.

**Solution**:
1. Verify price IDs match exactly with Stripe Dashboard
2. Verify API key is correct and active
3. Check Edge Function logs in Supabase Dashboard

### Webhook Not Receiving Events

**Cause**: Webhook URL incorrect or signing secret mismatch.

**Solution**:
1. Verify webhook URL is correct
2. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
3. Check webhook logs in Stripe Dashboard

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## Security Best Practices

1. ✅ Never commit API keys to version control
2. ✅ Use environment variables for all secrets
3. ✅ Always validate webhook signatures
4. ✅ Use HTTPS for all Stripe API calls
5. ✅ Regularly rotate API keys
6. ✅ Monitor webhook deliveries
7. ✅ Log all payment events
8. ✅ Set up alerts for failed payments

## Support

For Stripe-specific questions, contact [Stripe Support](https://support.stripe.com/).

For NUUM integration issues, refer to the main documentation or create an issue in the repository.
