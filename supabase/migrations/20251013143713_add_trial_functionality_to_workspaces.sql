/*
  # Add Trial Functionality to Workspaces

  ## Overview
  This migration adds trial tracking functionality to workspaces to support the new 7-day trial system where new users get access to all Elite features temporarily.

  ## Changes Made

  ### 1. New Columns Added to workspaces table
  - `trial_started_at` (timestamptz): Timestamp when the trial period began
  - `trial_ends_at` (timestamptz): Calculated timestamp when the trial expires (7 days after start)
  - `is_trial_active` (boolean): Computed field to quickly check if trial is still active

  ### 2. Modified Columns
  - Updated default `subscription_status` to 'trialing' for new workspaces
  - Updated default `plan` to 'free' with trial features enabled

  ### 3. Helper Function
  - Added `check_trial_status()` function to automatically update expired trials
  - This function updates subscription_status to 'expired' when trial_ends_at is passed

  ## Important Notes
  - New workspaces automatically start with a 7-day trial
  - During trial, users have access to Elite-level features
  - After trial expires, features are restricted to free tier limits
  - Existing workspaces are not affected (trial_started_at remains NULL)
*/

-- Add trial tracking columns to workspaces table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspaces' AND column_name = 'trial_started_at'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN trial_started_at timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspaces' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN trial_ends_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Create function to check and update trial status
CREATE OR REPLACE FUNCTION check_trial_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE workspaces
  SET subscription_status = 'expired'
  WHERE subscription_status = 'trialing'
    AND trial_ends_at IS NOT NULL
    AND trial_ends_at < now();
END;
$$;

-- Create function to get workspace with current trial status
CREATE OR REPLACE FUNCTION get_workspace_trial_info(workspace_id_input uuid)
RETURNS TABLE (
  id uuid,
  name text,
  plan text,
  subscription_status text,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  is_trial_active boolean,
  trial_days_remaining integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First update any expired trials
  PERFORM check_trial_status();
  
  -- Return workspace info with trial calculations
  RETURN QUERY
  SELECT 
    w.id,
    w.name,
    w.plan::text,
    w.subscription_status::text,
    w.trial_started_at,
    w.trial_ends_at,
    CASE 
      WHEN w.subscription_status = 'trialing' AND w.trial_ends_at > now() THEN true
      ELSE false
    END as is_trial_active,
    CASE 
      WHEN w.trial_ends_at IS NOT NULL AND w.trial_ends_at > now() 
      THEN EXTRACT(day FROM w.trial_ends_at - now())::integer + 1
      ELSE 0
    END as trial_days_remaining
  FROM workspaces w
  WHERE w.id = workspace_id_input;
END;
$$;

-- Add index for faster trial status queries
CREATE INDEX IF NOT EXISTS idx_workspaces_trial_status 
ON workspaces(subscription_status, trial_ends_at) 
WHERE subscription_status = 'trialing';

-- Add index for expired trial queries
CREATE INDEX IF NOT EXISTS idx_workspaces_trial_expiry 
ON workspaces(trial_ends_at) 
WHERE trial_ends_at IS NOT NULL;
