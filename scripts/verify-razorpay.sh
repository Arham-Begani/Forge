#!/bin/bash
# Razorpay payment gateway verification script

echo "🔍 Razorpay Payment Gateway Verification"
echo "========================================"
echo ""

# Check environment variables
echo "1. Checking environment variables..."
if grep -q "RAZORPAY_KEY_ID=" .env.local; then
  echo "   ✅ RAZORPAY_KEY_ID configured"
else
  echo "   ❌ RAZORPAY_KEY_ID missing"
fi

if grep -q "RAZORPAY_KEY_SECRET=" .env.local; then
  echo "   ✅ RAZORPAY_KEY_SECRET configured"
else
  echo "   ❌ RAZORPAY_KEY_SECRET missing"
fi

if grep -q "NEXT_PUBLIC_RAZORPAY_KEY_ID=" .env.local; then
  echo "   ✅ NEXT_PUBLIC_RAZORPAY_KEY_ID configured (frontend)"
else
  echo "   ❌ NEXT_PUBLIC_RAZORPAY_KEY_ID missing"
fi

if grep -q "RAZORPAY_WEBHOOK_SECRET=" .env.local; then
  webhook_secret=$(grep "RAZORPAY_WEBHOOK_SECRET=" .env.local | cut -d'=' -f2)
  if [ "$webhook_secret" = "your_webhook_secret_here" ]; then
    echo "   ⚠️  RAZORPAY_WEBHOOK_SECRET is placeholder (needs actual value)"
  else
    echo "   ✅ RAZORPAY_WEBHOOK_SECRET configured"
  fi
else
  echo "   ❌ RAZORPAY_WEBHOOK_SECRET missing"
fi

echo ""
echo "2. Checking Razorpay Plan IDs..."
plan_count=$(grep -c "RAZORPAY_PLAN_" .env.local)
echo "   Found $plan_count Plan ID environment variables"

if [ $plan_count -eq 8 ]; then
  echo "   ✅ All 8 plan environment variables present"
  
  placeholder_count=$(grep "RAZORPAY_PLAN_" .env.local | grep -c "placeholder")
  if [ $placeholder_count -gt 0 ]; then
    echo "   ⚠️  $placeholder_count Plan IDs still use placeholders (need Razorpay Plan IDs)"
  else
    echo "   ✅ All Plan IDs configured with actual values"
  fi
else
  echo "   ❌ Missing Plan ID environment variables (need 8 total)"
fi

echo ""
echo "3. Checking API files..."
api_files=(
  "app/api/billing/checkout/route.ts"
  "app/api/billing/webhook/route.ts"
  "app/api/billing/me/route.ts"
  "app/api/billing/portal/route.ts"
)

for file in "${api_files[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file exists"
  else
    echo "   ❌ $file missing"
  fi
done

echo ""
echo "4. Checking payment processing files..."
payment_files=(
  "lib/razorpay.ts"
  "lib/client-razorpay.ts"
  "lib/billing.ts"
  "lib/billing-queries.ts"
  "db/migrations/007_billing.sql"
)

for file in "${payment_files[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file exists"
  else
    echo "   ❌ $file missing"
  fi
done

echo ""
echo "5. Checking UI components..."
if [ -f "components/billing/BillingPanel.tsx" ]; then
  echo "   ✅ BillingPanel component exists"
else
  echo "   ❌ BillingPanel component missing"
fi

echo ""
echo "========================================"
echo "📋 Action Items:"
echo ""
echo "[ ] 1. Create 8 Razorpay Plans (4 plans × 2 billing periods)"
echo "       Dashboard: https://dashboard.razorpay.com/app/subscriptions"
echo "       Plans: Starter, Builder, Pro, Studio"
echo "       Periods: Monthly, Yearly"
echo ""
echo "[ ] 2. Copy Plan IDs to .env.local:"
echo "       RAZORPAY_PLAN_STARTER_MONTHLY=plan_..."
echo "       RAZORPAY_PLAN_STARTER_YEARLY=plan_..."
echo "       (and 6 more for other plans)"
echo ""
echo "[ ] 3. Create webhook in Razorpay dashboard:"
echo "       URL: https://your-domain.com/api/billing/webhook"
echo "       Events: payment.captured, subscription.charged, subscription.cancelled"
echo ""
echo "[ ] 4. Copy webhook secret to .env.local:"
echo "       RAZORPAY_WEBHOOK_SECRET=whsec_..."
echo ""
echo "[ ] 5. Restart development server:"
echo "       npm run dev"
echo ""
echo "[ ] 6. Test checkout flow at:"
echo "       http://localhost:3000/dashboard/settings#billing"
echo ""
echo "========================================"
