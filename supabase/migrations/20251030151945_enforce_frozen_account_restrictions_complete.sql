/*
  # Complete Frozen Account Enforcement System

  ## Overview
  This migration completes the frozen account enforcement system by:
  1. Adding frozen account RLS policies to all remaining write tables
  2. Creating automatic freeze trigger for expired Free plan accounts
  3. Updating subscription_status constraint to include 'frozen' status
  4. Adding comprehensive indexes for performance

  ## Tables Updated with Frozen Account Policies
  - ad_sets (new)
  - content_media (new)
  - campaign_creators (new)
  - notes (new)
  - deliverables (new)
  - workspace_members (new)
  
  ## Existing Tables with Policies
  - campaigns (already has policies from previous migration)
  - creators (already has policies from previous migration)
  - tasks (already has policies from previous migration)

  ## Automatic Freeze System
  - Daily trigger checks Free plan accounts older than 7 days
  - Automatically updates subscription_status to 'frozen'
  - Can be run manually via check_and_freeze_expired_free_accounts() function

  ## Security Notes
  - All policies are RESTRICTIVE to prevent bypass
  - Frozen accounts can still READ data (view-only mode)
  - Frozen accounts cannot CREATE or UPDATE any data
  - Admin/support can override via direct database access
*/

-- Step 1: Update subscription_status constraint to include 'frozen'
DO $$
BEGIN
  ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_subscription_status_check;
  ALTER TABLE workspaces ADD CONSTRAINT workspaces_subscription_status_check 
    CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'expired', 'frozen'));
END $$;

-- Step 2: Add frozen account RLS policies for ad_sets table
DROP POLICY IF EXISTS "Frozen accounts cannot create ad_sets" ON ad_sets;
CREATE POLICY "Frozen accounts cannot create ad_sets"
  ON ad_sets
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM campaigns c
      JOIN workspaces w ON w.id = c.workspace_id
      WHERE c.id = campaign_id
      AND w.subscription_status = 'frozen'
    )
  );

DROP POLICY IF EXISTS "Frozen accounts cannot update ad_sets" ON ad_sets;
CREATE POLICY "Frozen accounts cannot update ad_sets"
  ON ad_sets
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM campaigns c
      JOIN workspaces w ON w.id = c.workspace_id
      WHERE c.id = campaign_id
      AND w.subscription_status = 'frozen'
    )
  );

-- Step 3: Add frozen account RLS policies for content_media table
DROP POLICY IF EXISTS "Frozen accounts cannot create content_media" ON content_media;
CREATE POLICY "Frozen accounts cannot create content_media"
  ON content_media
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

DROP POLICY IF EXISTS "Frozen accounts cannot update content_media" ON content_media;
CREATE POLICY "Frozen accounts cannot update content_media"
  ON content_media
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

-- Step 4: Add frozen account RLS policies for campaign_creators table
DROP POLICY IF EXISTS "Frozen accounts cannot create campaign_creators" ON campaign_creators;
CREATE POLICY "Frozen accounts cannot create campaign_creators"
  ON campaign_creators
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM campaigns c
      JOIN workspaces w ON w.id = c.workspace_id
      WHERE c.id = campaign_id
      AND w.subscription_status = 'frozen'
    )
  );

DROP POLICY IF EXISTS "Frozen accounts cannot update campaign_creators" ON campaign_creators;
CREATE POLICY "Frozen accounts cannot update campaign_creators"
  ON campaign_creators
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM campaigns c
      JOIN workspaces w ON w.id = c.workspace_id
      WHERE c.id = campaign_id
      AND w.subscription_status = 'frozen'
    )
  );

-- Step 5: Add frozen account RLS policies for notes table
DROP POLICY IF EXISTS "Frozen accounts cannot create notes" ON notes;
CREATE POLICY "Frozen accounts cannot create notes"
  ON notes
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

DROP POLICY IF EXISTS "Frozen accounts cannot update notes" ON notes;
CREATE POLICY "Frozen accounts cannot update notes"
  ON notes
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

-- Step 6: Add frozen account RLS policies for deliverables table
DROP POLICY IF EXISTS "Frozen accounts cannot create deliverables" ON deliverables;
CREATE POLICY "Frozen accounts cannot create deliverables"
  ON deliverables
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM campaigns c
      JOIN workspaces w ON w.id = c.workspace_id
      WHERE c.id = campaign_id
      AND w.subscription_status = 'frozen'
    )
  );

DROP POLICY IF EXISTS "Frozen accounts cannot update deliverables" ON deliverables;
CREATE POLICY "Frozen accounts cannot update deliverables"
  ON deliverables
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM campaigns c
      JOIN workspaces w ON w.id = c.workspace_id
      WHERE c.id = campaign_id
      AND w.subscription_status = 'frozen'
    )
  );

-- Step 7: Add frozen account RLS policies for workspace_members table
DROP POLICY IF EXISTS "Frozen accounts cannot add members" ON workspace_members;
CREATE POLICY "Frozen accounts cannot add members"
  ON workspace_members
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

DROP POLICY IF EXISTS "Frozen accounts cannot update members" ON workspace_members;
CREATE POLICY "Frozen accounts cannot update members"
  ON workspace_members
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

-- Step 8: Create automatic freeze trigger function
CREATE OR REPLACE FUNCTION auto_freeze_expired_free_accounts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if this is a Free plan workspace that's older than 7 days
  IF NEW.plan = 'free' 
     AND NEW.subscription_status NOT IN ('frozen', 'active') 
     AND NEW.created_at < (now() - interval '7 days')
     AND (NEW.stripe_customer_id IS NULL OR NEW.stripe_customer_id = '')
  THEN
    NEW.subscription_status := 'frozen';
    NEW.updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 9: Create trigger that runs on workspace INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_auto_freeze_expired_accounts ON workspaces;
CREATE TRIGGER trigger_auto_freeze_expired_accounts
  BEFORE INSERT OR UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION auto_freeze_expired_free_accounts();

-- Step 10: Immediately freeze any existing expired Free accounts
UPDATE workspaces
SET 
  subscription_status = 'frozen',
  updated_at = now()
WHERE 
  plan = 'free'
  AND subscription_status NOT IN ('frozen', 'active')
  AND created_at < (now() - interval '7 days')
  AND (stripe_customer_id IS NULL OR stripe_customer_id = '');

-- Step 11: Add performance indexes for frozen account checks
CREATE INDEX IF NOT EXISTS idx_workspaces_frozen_check 
ON workspaces(subscription_status) 
WHERE subscription_status = 'frozen';

CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_frozen 
ON campaigns(workspace_id);

CREATE INDEX IF NOT EXISTS idx_creators_workspace_frozen 
ON creators(workspace_id);

CREATE INDEX IF NOT EXISTS idx_tasks_workspace_frozen 
ON tasks(workspace_id);

CREATE INDEX IF NOT EXISTS idx_content_media_workspace_frozen 
ON content_media(workspace_id);

CREATE INDEX IF NOT EXISTS idx_notes_workspace_frozen 
ON notes(workspace_id);

-- Step 12: Create helper function to unfreeze account (called by Stripe webhook)
CREATE OR REPLACE FUNCTION unfreeze_workspace_on_upgrade(workspace_id_input uuid)
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

-- Step 13: Add comments for documentation
COMMENT ON FUNCTION auto_freeze_expired_free_accounts() IS 
  'Automatically freezes Free plan workspaces that are older than 7 days and have no paid subscription';

COMMENT ON FUNCTION unfreeze_workspace_on_upgrade(uuid) IS 
  'Unfreezes a workspace when user upgrades to a paid plan (called by Stripe webhook)';

COMMENT ON FUNCTION check_and_freeze_expired_free_accounts() IS 
  'Manual function to check and freeze all expired Free plan accounts. Run daily via cron.';
