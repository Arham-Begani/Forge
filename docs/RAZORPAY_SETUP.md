# Razorpay Payment Gateway Setup

## Overview
Forze uses Razorpay for all payment processing:
- **Subscriptions**: Recurring billing for plans (Starter, Builder, Pro, Studio)
- **One-time payments**: Credit top-ups (60 or 200 credits)
- **Webhooks**: Automatic payment confirmation and reconciliation

---

## Environment Variables Status

✅ **Already configured:**
```
RAZORPAY_KEY_ID=rzp_live_SXsWQK8MKaUzm1
RAZORPAY_KEY_SECRET=LZxKG77YrIRKtSJJrPhO9Jxr
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_SXsWQK8MKaUzm1
```

⚠️ **Action Required:**
1. Set `RAZORPAY_WEBHOOK_SECRET` (from Razorpay dashboard)
2. Create Razorpay Plans and populate Plan IDs
3. Deploy webhook endpoint to production URL

---

## Step 1: Create Razorpay Plans

Go to [Razorpay Dashboard → Subscriptions](https://dashboard.razorpay.com/app/subscriptions)

### Pricing Configuration

| Plan | Monthly Price | Yearly Price | Billing Cycle |
|------|--------------|--------------|---------------|
| Starter | ₹299 | ₹2,990 | 12 months |
| Builder | ₹899 | ₹8,990 | 12 months |
| Pro | ₹2,999 | ₹29,990 | 12 months |
| Studio | ₹7,999 | ₹79,990 | 12 months |

### Create Each Plan

For each plan, you'll see a `plan_` ID after creation. Collect these:

```bash
# Example format (IDs will be different):
RAZORPAY_PLAN_STARTER_MONTHLY=plan_KvpY7PqJJjXxE5
RAZORPAY_PLAN_STARTER_YEARLY=plan_JvpY7PqJJjXxM2
RAZORPAY_PLAN_BUILDER_MONTHLY=plan_MvpY7PqJJjXxN3
RAZORPAY_PLAN_BUILDER_YEARLY=plan_NvpY7PqJJjXxO4
RAZORPAY_PLAN_PRO_MONTHLY=plan_OvpY7PqJJjXxP5
RAZORPAY_PLAN_PRO_YEARLY=plan_PvpY7PqJJjXxQ6
RAZORPAY_PLAN_STUDIO_MONTHLY=plan_QvpY7PqJJjXxR7
RAZORPAY_PLAN_STUDIO_YEARLY=plan_RvpY7PqJJjXxS8
```

### Update .env.local

Replace placeholders in `.env.local` with actual Plan IDs from Razorpay.

---

## Step 2: Setup Webhook

### Get Webhook Secret

1. Go to [Razorpay Settings → Webhooks](https://dashboard.razorpay.com/app/settings/webhooks)
2. Create a new webhook endpoint:
   - **URL**: `https://your-domain.com/api/billing/webhook`
   - **Events**: Check these events:
     - `payment.captured`
     - `subscription.charged`
     - `subscription.cancelled`

3. After creating, you'll see a webhook secret key
4. Update `.env.local`:
```
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## Step 3: Test Payment Flow

### Test Credentials (Do NOT use for production)
- Test Key ID: `rzp_test_xxxxx`
- Test Secret: Use these to test before going live

### Test Scenarios

**Subscription (Monthly):**
```bash
curl -X POST http://localhost:3000/api/billing/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "create",
    "kind": "plan",
    "planSlug": "builder",
    "billingPeriod": "monthly"
  }'
```

**Top-up (One-time):**
```bash
curl -X POST http://localhost:3000/api/billing/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "create",
    "kind": "topup",
    "topupSlug": "topup-50"
  }'
```

---

## API Reference

### Create Payment Checkout
**Endpoint:** `POST /api/billing/checkout`

**Request (Subscription):**
```json
{
  "mode": "create",
  "kind": "plan",
  "planSlug": "builder",
  "billingPeriod": "monthly"
}
```

**Response:**
```json
{
  "checkoutKind": "plan",
  "keyId": "rzp_live_...",
  "subscriptionId": "sub_...",
  "amountInr": 899,
  "plan": { "label": "Builder", "monthlyCredits": 120 },
  "billingPeriod": "monthly",
  "prefill": {
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

**Request (Top-up):**
```json
{
  "mode": "create",
  "kind": "topup",
  "topupSlug": "topup-50"
}
```

**Response:**
```json
{
  "checkoutKind": "topup",
  "keyId": "rzp_live_...",
  "orderId": "order_...",
  "amountInr": 499,
  "topup": { "label": "60 Credits", "credits": 60 },
  "prefill": { "name": "User Name", "email": "user@example.com" }
}
```

### Confirm Payment
**Endpoint:** `POST /api/billing/checkout`

**Request (Subscription):**
```json
{
  "mode": "confirm",
  "kind": "plan",
  "planSlug": "builder",
  "billingPeriod": "monthly",
  "razorpayPaymentId": "pay_...",
  "razorpaySubscriptionId": "sub_...",
  "razorpaySignature": "signature_string"
}
```

**Request (Top-up):**
```json
{
  "mode": "confirm",
  "kind": "topup",
  "topupSlug": "topup-50",
  "razorpayPaymentId": "pay_...",
  "razorpayOrderId": "order_...",
  "razorpaySignature": "signature_string"
}
```

### Get Billing Status
**Endpoint:** `POST /api/billing/me`

**Response:**
```json
{
  "planSlug": "builder",
  "planLabel": "Builder",
  "billingPeriod": "monthly",
  "subscriptionStatus": "active",
  "creditsRemaining": 120,
  "allowedModules": [...],
  "ventureLimit": 5,
  "monthlyCredits": 120,
  "activeVentureCount": 2,
  "canCreateVenture": true,
  "nextRenewalAt": "2024-05-01T00:00:00Z",
  "currentSubscriptionId": "sub_...",
  "cancelAtPeriodEnd": false,
  "hasUnlimitedAccess": false,
  "payments": [...]
}
```

### Cancel Subscription
**Endpoint:** `POST /api/billing/portal`

**Request:**
```json
{
  "action": "cancel"
}
```

---

## Webhook Events

### payment.captured
- **Trigger**: When payment is successfully charged
- **Handler**: Records payment in `payments` table, grants credits
- **Idempotency**: Uses `provider_payment_id` for deduplication

### subscription.charged
- **Trigger**: When subscription cycle billing occurs
- **Handler**: Records recurring payment, renews subscription

### subscription.cancelled
- **Trigger**: When subscription is ended
- **Handler**: Marks subscription as `canceled` with `canceled_at` timestamp

---

## Security Checklist

✅ Key Protection:
- API secret keys never exposed to frontend
- Only public key (`NEXT_PUBLIC_RAZORPAY_KEY_ID`) available to browser
- JWT tokens used for authenticated requests

✅ Signature Verification:
- All webhook payloads verified with `RAZORPAY_WEBHOOK_SECRET`
- Payment confirmations validated with HMAC-SHA256 signatures
- Timing-safe comparison prevents timing attacks

✅ Rate Limiting:
- Applied at API route level (10 operations/hour per user)
- Applied at Razorpay API client level (automatic retry with exponential backoff)

✅ Database Security:
- Row-level security (RLS) on `subscriptions`, `payments`, `credit_ledger` tables
- Users can only view their own billing data
- Subscription IDs are unique per provider

---

## Database Schema

### subscriptions
```sql
id UUID PRIMARY KEY
user_id UUID (FK to users)
plan_slug TEXT (free|starter|builder|pro|studio)
billing_period TEXT (monthly|yearly)
status TEXT (active|canceled|expired|past_due)
provider_subscription_id TEXT UNIQUE
current_period_start TIMESTAMPTZ
current_period_end TIMESTAMPTZ
cancel_at_period_end BOOLEAN
```

### payments
```sql
id UUID PRIMARY KEY
user_id UUID (FK to users)
subscription_id UUID (FK to subscriptions, nullable)
kind TEXT (subscription|topup)
plan_slug TEXT (nullable)
topup_slug TEXT (nullable)
provider_payment_id TEXT UNIQUE
amount_inr INTEGER
status TEXT (captured|failed|refunded)
raw_payload JSONB
```

### credit_ledger
```sql
id UUID PRIMARY KEY
user_id UUID (FK to users)
kind TEXT (monthly_grant|topup|usage|manual_adjustment)
credits INTEGER
created_at TIMESTAMPTZ
```

---

## Troubleshooting

### Plan IDs not found
**Error:** `Razorpay plan id missing for builder monthly`
**Fix:** Ensure all `RAZORPAY_PLAN_*` environment variables are set in `.env.local` and restart the server

### Webhook signature verification failed
**Error:** `Invalid webhook signature`
**Fix:** Verify `RAZORPAY_WEBHOOK_SECRET` matches the secret in Razorpay dashboard

### Payment signature invalid on confirmation
**Error:** `Invalid Razorpay signature`
**Fix:** Ensure payment/subscription IDs match exactly between request and Razorpay response

### "Razorpay public key is not configured"
**Error:** May affect checkout initialization
**Fix:** Ensure `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set (same as `RAZORPAY_KEY_ID`)

---

## Next Steps

1. ✅ Environment variables configured
2. ⏳ **Create Razorpay Plans** (8 total: 4 plans × 2 billing periods)
3. ⏳ **Get webhook secret** and add to `.env.local`
4. ⏳ **Test checkout flow** in local environment
5. ⏳ **Deploy to production** with webhook URL pointing to your domain
6. ⏳ **Run billing portal tests** to ensure cancellations work

---

## Files Modified
- `.env.local` - Added Razorpay configuration
- `lib/razorpay.ts` - Razorpay API client (existing)
- `lib/client-razorpay.ts` - Browser checkout utilities (existing)
- `app/api/billing/checkout/route.ts` - Subscription/topup creation & confirmation (existing)
- `app/api/billing/webhook/route.ts` - Webhook event handler (existing)
- `lib/billing-queries.ts` - Database operations (existing)
- `components/billing/BillingPanel.tsx` - UI for billing (existing)
