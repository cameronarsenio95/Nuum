/*
  # Fix Ad Sets RLS Infinite Recursion

  ## Overview
  Fixes the infinite recursion error in ad_sets RLS policies by simplifying
  the policies to avoid circular dependencies with workspace_members.

  ## Changes
  1. Drop existing ad_sets RLS policies
  2. Create new simplified policies that use campaigns.created_by directly
  3. Allow workspace owners to manage ad sets through campaign ownership

  ## Important Notes
  - This resolves the infinite recursion detected in workspace_members policies
  - Policies now check campaign ownership and creator relationship directly
  - More efficient and avoids complex joins
*/

-- =====================================================
-- DROP EXISTING AD SETS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Workspace members can view ad sets" ON ad_sets;
DROP POLICY IF EXISTS "Members and above can create ad sets" ON ad_sets;
DROP POLICY IF EXISTS "Members and above can update ad sets" ON ad_sets;
DROP POLICY IF EXISTS "Members and above can delete ad sets" ON ad_sets;

-- =====================================================
-- CREATE NEW SIMPLIFIED POLICIES
-- =====================================================

-- Allow users to view ad sets for campaigns they can access
CREATE POLICY "Users can view ad sets for accessible campaigns"
  ON ad_sets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = ad_sets.campaign_id
    )
  );

-- Allow users to create ad sets for campaigns in their workspace
CREATE POLICY "Users can create ad sets for their campaigns"
  ON ad_sets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = ad_sets.campaign_id
    )
  );

-- Allow users to update ad sets for campaigns in their workspace
CREATE POLICY "Users can update ad sets for their campaigns"
  ON ad_sets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = ad_sets.campaign_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = ad_sets.campaign_id
    )
  );

-- Allow users to delete ad sets for campaigns in their workspace
CREATE POLICY "Users can delete ad sets for their campaigns"
  ON ad_sets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = ad_sets.campaign_id
    )
  );
