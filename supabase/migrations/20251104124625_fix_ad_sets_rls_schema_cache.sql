/*
  # Fix Ad Sets RLS Schema Cache Error

  ## Problem
  The ad_sets table RLS policies reference campaigns table without proper workspace
  ownership checks, causing "Could not find the table 'public.ad_sets' in the schema cache" errors.

  ## Solution
  Replace all ad_sets RLS policies to directly check workspace ownership through
  the campaigns table, avoiding recursive policy lookups that cause schema cache issues.

  ## Changes
  1. Drop all existing ad_sets RLS policies
  2. Create new policies that check workspace ownership directly
  3. Policies check: campaigns.workspace_id -> workspaces.owner_id = auth.uid()

  ## Security
  - Users can only view/modify ad_sets for campaigns in workspaces they own
  - Frozen accounts cannot create/update ad_sets
  - Demo workspaces allow anonymous viewing
*/

-- =====================================================
-- DROP EXISTING POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view demo ad_sets" ON ad_sets;
DROP POLICY IF EXISTS "Frozen accounts cannot create ad_sets" ON ad_sets;
DROP POLICY IF EXISTS "Frozen accounts cannot update ad_sets" ON ad_sets;
DROP POLICY IF EXISTS "Users can create ad sets for their campaigns" ON ad_sets;
DROP POLICY IF EXISTS "Users can delete ad sets for their campaigns" ON ad_sets;
DROP POLICY IF EXISTS "Users can update ad sets for their campaigns" ON ad_sets;
DROP POLICY IF EXISTS "Users can view ad sets for accessible campaigns" ON ad_sets;
DROP POLICY IF EXISTS "Members and above can create ad sets" ON ad_sets;
DROP POLICY IF EXISTS "Members and above can update ad sets" ON ad_sets;
DROP POLICY IF EXISTS "Members and above can delete ad sets" ON ad_sets;
DROP POLICY IF EXISTS "Workspace members can view ad sets" ON ad_sets;

-- =====================================================
-- CREATE NEW CORRECTED POLICIES
-- =====================================================

-- SELECT: Users can view ad sets for campaigns in their workspace
CREATE POLICY "Users can view ad sets in their workspace"
  ON ad_sets FOR SELECT
  TO authenticated
  USING (
    campaign_id IN (
      SELECT c.id
      FROM campaigns c
      JOIN workspaces w ON w.id = c.workspace_id
      WHERE w.owner_id = auth.uid()
    )
  );

-- INSERT: Users can create ad sets for campaigns in their workspace
CREATE POLICY "Users can create ad sets in their workspace"
  ON ad_sets FOR INSERT
  TO authenticated
  WITH CHECK (
    campaign_id IN (
      SELECT c.id
      FROM campaigns c
      JOIN workspaces w ON w.id = c.workspace_id
      WHERE w.owner_id = auth.uid()
    )
  );

-- UPDATE: Users can update ad sets for campaigns in their workspace
CREATE POLICY "Users can update ad sets in their workspace"
  ON ad_sets FOR UPDATE
  TO authenticated
  USING (
    campaign_id IN (
      SELECT c.id
      FROM campaigns c
      JOIN workspaces w ON w.id = c.workspace_id
      WHERE w.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    campaign_id IN (
      SELECT c.id
      FROM campaigns c
      JOIN workspaces w ON w.id = c.workspace_id
      WHERE w.owner_id = auth.uid()
    )
  );

-- DELETE: Users can delete ad sets for campaigns in their workspace
CREATE POLICY "Users can delete ad sets in their workspace"
  ON ad_sets FOR DELETE
  TO authenticated
  USING (
    campaign_id IN (
      SELECT c.id
      FROM campaigns c
      JOIN workspaces w ON w.id = c.workspace_id
      WHERE w.owner_id = auth.uid()
    )
  );

-- RESTRICTIVE: Prevent frozen accounts from creating ad sets
CREATE POLICY "Frozen accounts cannot create ad sets"
  ON ad_sets AS RESTRICTIVE FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1
      FROM campaigns c
      JOIN workspaces w ON w.id = c.workspace_id
      WHERE c.id = ad_sets.campaign_id
      AND w.subscription_status = 'frozen'
    )
  );

-- RESTRICTIVE: Prevent frozen accounts from updating ad sets
CREATE POLICY "Frozen accounts cannot update ad sets"
  ON ad_sets AS RESTRICTIVE FOR UPDATE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1
      FROM campaigns c
      JOIN workspaces w ON w.id = c.workspace_id
      WHERE c.id = ad_sets.campaign_id
      AND w.subscription_status = 'frozen'
    )
  );

-- PUBLIC ACCESS: Allow viewing demo ad sets
CREATE POLICY "Anyone can view demo ad sets"
  ON ad_sets FOR SELECT
  TO anon, authenticated
  USING (
    campaign_id IN (
      SELECT c.id
      FROM campaigns c
      JOIN workspaces w ON w.id = c.workspace_id
      WHERE w.is_demo = true
    )
  );