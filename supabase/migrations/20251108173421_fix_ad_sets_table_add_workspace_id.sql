/*
  # Fix Ad Sets Table Schema
  
  1. Changes
    - Add workspace_id column to ad_sets table
    - Make creator_id nullable (not all ad sets need to be linked to a creator immediately)
    - Add workspace_id to RLS policies
    
  2. Security
    - Update RLS policies to check workspace_id instead of campaign_id joins
*/

-- Add workspace_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_sets' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE ad_sets ADD COLUMN workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Make creator_id nullable
ALTER TABLE ad_sets ALTER COLUMN creator_id DROP NOT NULL;

-- Populate workspace_id from campaign_id for existing records
UPDATE ad_sets
SET workspace_id = campaigns.workspace_id
FROM campaigns
WHERE ad_sets.campaign_id = campaigns.id
AND ad_sets.workspace_id IS NULL;

-- Now make workspace_id NOT NULL after populating
ALTER TABLE ad_sets ALTER COLUMN workspace_id SET NOT NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view ad sets in their workspace" ON ad_sets;
DROP POLICY IF EXISTS "Users can insert ad sets in their workspace" ON ad_sets;
DROP POLICY IF EXISTS "Users can update ad sets in their workspace" ON ad_sets;
DROP POLICY IF EXISTS "Users can delete ad sets in their workspace" ON ad_sets;

-- Create new simplified RLS policies using workspace_id
CREATE POLICY "Users can view ad sets in their workspace"
  ON ad_sets FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert ad sets in their workspace"
  ON ad_sets FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ad sets in their workspace"
  ON ad_sets FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ad sets in their workspace"
  ON ad_sets FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Create index on workspace_id for better query performance
CREATE INDEX IF NOT EXISTS idx_ad_sets_workspace_id ON ad_sets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ad_sets_campaign_id ON ad_sets(campaign_id);
