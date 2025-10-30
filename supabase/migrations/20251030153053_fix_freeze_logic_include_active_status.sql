/*
  # Fix Freeze Logic to Include Active Status

  ## Overview
  The previous freeze logic had a bug where it excluded workspaces with 'active' status.
  This migration fixes that by:
  1. Updating the auto_freeze trigger to also freeze 'active' Free accounts
  2. Updating the check_and_freeze function to also freeze 'active' Free accounts
  3. Running an immediate freeze on all expired Free accounts including 'active' ones

  ## Changes
  - Modified auto_freeze_expired_free_accounts() trigger function
  - Modified check_and_freeze_expired_free_accounts() RPC function
  - Immediate freeze of all expired Free accounts
*/

-- Step 1: Update the automatic freeze trigger to include 'active' status
CREATE OR REPLACE FUNCTION auto_freeze_expired_free_accounts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if this is a Free plan workspace that's older than 7 days
  -- Now includes 'active' status in the check
  IF NEW.plan = 'free' 
     AND NEW.subscription_status NOT IN ('frozen') 
     AND NEW.created_at < (now() - interval '7 days')
     AND (NEW.stripe_customer_id IS NULL OR NEW.stripe_customer_id = '')
  THEN
    NEW.subscription_status := 'frozen';
    NEW.updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 2: Update the check_and_freeze function to include 'active' status
CREATE OR REPLACE FUNCTION check_and_freeze_expired_free_accounts()
RETURNS TABLE(frozen_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_rows integer;
BEGIN
  UPDATE workspaces
  SET 
    subscription_status = 'frozen',
    updated_at = now()
  WHERE 
    plan = 'free'
    AND subscription_status NOT IN ('frozen')
    AND created_at < (now() - interval '7 days')
    AND (stripe_customer_id IS NULL OR stripe_customer_id = '');
    
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  RETURN QUERY SELECT affected_rows;
END;
$$;

-- Step 3: Immediately freeze ALL expired Free accounts (including active ones)
UPDATE workspaces
SET 
  subscription_status = 'frozen',
  updated_at = now()
WHERE 
  plan = 'free'
  AND subscription_status NOT IN ('frozen')
  AND created_at < (now() - interval '7 days')
  AND (stripe_customer_id IS NULL OR stripe_customer_id = '');

-- Step 4: Add comment for documentation
COMMENT ON FUNCTION auto_freeze_expired_free_accounts() IS 
  'Automatically freezes Free plan workspaces that are older than 7 days and have no paid subscription. Updated to include active status.';

COMMENT ON FUNCTION check_and_freeze_expired_free_accounts() IS 
  'Manual function to check and freeze all expired Free plan accounts including those with active status. Run daily via cron.';
