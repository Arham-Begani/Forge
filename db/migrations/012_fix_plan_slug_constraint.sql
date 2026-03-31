-- 012_fix_plan_slug_constraint.sql
-- Fix plan_slug check constraint to include 'starter' plan

-- Drop the existing check constraints that are too restrictive
ALTER TABLE subscriptions
DROP CONSTRAINT subscriptions_plan_slug_check;

-- Re-add the constraint with 'starter' included
ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_plan_slug_check 
CHECK (plan_slug IN ('free', 'starter', 'builder', 'pro', 'studio'));

-- Fix payments table constraint too
ALTER TABLE payments
DROP CONSTRAINT payments_plan_slug_check;

ALTER TABLE payments
ADD CONSTRAINT payments_plan_slug_check 
CHECK (plan_slug IN ('free', 'starter', 'builder', 'pro', 'studio'));

-- Fix usage_ledger table constraint
ALTER TABLE usage_ledger
DROP CONSTRAINT usage_ledger_plan_slug_check;

ALTER TABLE usage_ledger
ADD CONSTRAINT usage_ledger_plan_slug_check 
CHECK (plan_slug IN ('free', 'starter', 'builder', 'pro', 'studio'));
