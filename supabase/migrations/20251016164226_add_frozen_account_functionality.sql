/*
  # Add Frozen Account Functionality for Free Plan
  
  ## Overview
  This migration adds functionality to automatically freeze accounts after the 7-day Free trial expires if they don't upgrade to a Standard plan.
  
  ## Changes Made
  
  ### 1. Helper Functions
  - `check_and_freeze_expired_free_accounts()`: Automatically freezes Free plan accounts that have been created more than 7 days ago
  - `unfreeze_account()`: Unfreezes an account when upgraded to a paid plan
  - `get_account_expiry_info()`: Returns detailed expiry information for Free plan accounts
  
  ### 2. RLS Policies
  - Added restrictive policies to prevent frozen accounts from creating or updating data
  - Applies to campaigns, creators, and tasks tables
  
  ## Important Notes
  - Free plan accounts are automatically frozen after 7 days from creation
  - Frozen accounts cannot perform write operations (enforced by RLS)
  - Upgrading to Standard or higher plan automatically unfreezes the account
  - The freeze check happens based on workspace created_at timestamp
*/

-- Function to check and freeze expired free accounts
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
    AND subscription_status NOT IN ('frozen', 'active')
    AND created_at < (now() - interval '7 days')
    AND (stripe_subscription_id IS NULL OR stripe_subscription_id = '');
    
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  RETURN QUERY SELECT affected_rows;
END;
$$;

-- Function to unfreeze an account when upgraded
CREATE OR REPLACE FUNCTION unfreeze_account(workspace_id_input uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE workspaces
  SET 
    subscription_status = 'active',
    updated_at = now()
  WHERE 
    id = workspace_id_input
    AND subscription_status = 'frozen';
END;
$$;

-- Function to get detailed account expiry info for Free plan
CREATE OR REPLACE FUNCTION get_account_expiry_info(workspace_id_input uuid)
RETURNS TABLE(
  workspace_id uuid,
  plan text,
  subscription_status text,
  created_at timestamptz,
  expires_at timestamptz,
  days_remaining integer,
  is_expired boolean,
  will_freeze_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id as workspace_id,
    w.plan::text,
    w.subscription_status::text,
    w.created_at,
    (w.created_at + interval '7 days') as expires_at,
    CASE 
      WHEN w.created_at + interval '7 days' > now() 
      THEN EXTRACT(day FROM (w.created_at + interval '7 days') - now())::integer + 1
      ELSE 0
    END as days_remaining,
    CASE 
      WHEN w.created_at + interval '7 days' <= now() THEN true
      ELSE false
    END as is_expired,
    (w.created_at + interval '7 days') as will_freeze_at
  FROM workspaces w
  WHERE w.id = workspace_id_input;
END;
$$;

-- Update RLS policies to block write operations for frozen accounts
-- For campaigns table
DROP POLICY IF EXISTS "Frozen accounts cannot create campaigns" ON campaigns;
CREATE POLICY "Frozen accounts cannot create campaigns"
  ON campaigns
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id
      AND w.subscription_status = 'frozen'
    )
  );

DROP POLICY IF EXISTS "Frozen accounts cannot update campaigns" ON campaigns;
CREATE POLICY "Frozen accounts cannot update campaigns"
  ON campaigns
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id
      AND w.subscription_status = 'frozen'
    )
  );

-- For creators table
DROP POLICY IF EXISTS "Frozen accounts cannot create creators" ON creators;
CREATE POLICY "Frozen accounts cannot create creators"
  ON creators
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id
      AND w.subscription_status = 'frozen'
    )
  );

DROP POLICY IF EXISTS "Frozen accounts cannot update creators" ON creators;
CREATE POLICY "Frozen accounts cannot update creators"
  ON creators
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id
      AND w.subscription_status = 'frozen'
    )
  );

-- For tasks table
DROP POLICY IF EXISTS "Frozen accounts cannot create tasks" ON tasks;
CREATE POLICY "Frozen accounts cannot create tasks"
  ON tasks
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id
      AND w.subscription_status = 'frozen'
    )
  );

DROP POLICY IF EXISTS "Frozen accounts cannot update tasks" ON tasks;
CREATE POLICY "Frozen accounts cannot update tasks"
  ON tasks
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id
      AND w.subscription_status = 'frozen'
    )
  );

-- Add index for efficient frozen account queries
CREATE INDEX IF NOT EXISTS idx_workspaces_frozen_status 
ON workspaces(subscription_status, plan, created_at) 
WHERE subscription_status = 'frozen' OR plan = 'free';

-- Add index for free plan expiry checks
CREATE INDEX IF NOT EXISTS idx_workspaces_free_expiry 
ON workspaces(plan, created_at, subscription_status) 
WHERE plan = 'free';
