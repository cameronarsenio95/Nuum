/*
  # Create Ad Sets Table for Campaign Management

  ## Overview
  Creates the ad_sets table to store active ads with creator collaborations for each campaign.
  Ad sets represent specific creative executions with creators on advertising platforms (META, TikTok, etc.).
  Campaigns aggregate all ad set performance data for reporting and export.

  ## New Tables

  1. **ad_sets**
     - `id` (uuid, primary key) - Unique identifier
     - `campaign_id` (uuid, foreign key) - References campaigns table
     - `creator_id` (uuid, foreign key) - References creators table
     - `name` (text, required) - Ad set name
     - `description` (text, optional) - Ad set description
     - `platform` (text, required) - Advertising platform (META, TikTok, Google, YouTube, Other)
     - `status` (text, default: draft) - Current status (active, paused, completed, draft)
     - `budget` (numeric, optional) - Allocated budget for this ad set
     - `spend` (numeric, default: 0) - Total amount spent
     - `impressions` (integer, default: 0) - Total impressions
     - `clicks` (integer, default: 0) - Total clicks
     - `conversions` (integer, default: 0) - Total conversions
     - `ctr` (numeric, default: 0) - Click-through rate (calculated)
     - `ad_creative_url` (text, optional) - URL to the ad creative/content
     - `targeting_data` (jsonb, optional) - Targeting configuration and details
     - `performance_metrics` (jsonb, optional) - Additional performance data
     - `created_at` (timestamptz, default: now()) - Creation timestamp
     - `updated_at` (timestamptz, default: now()) - Last update timestamp

  2. **Campaign Aggregated Metrics Columns**
     - `total_ad_sets` (integer) - Count of all ad sets
     - `active_ad_sets` (integer) - Count of active ad sets
     - `total_spend` (numeric) - Sum of spend across all ad sets
     - `total_impressions` (bigint) - Sum of impressions
     - `total_clicks` (bigint) - Sum of clicks
     - `total_conversions` (bigint) - Sum of conversions
     - `average_ctr` (numeric) - Average CTR across all ad sets

  ## Security
  - Enable RLS on ad_sets table
  - Workspace members can view ad sets for campaigns in their workspace
  - Members and above can create, update, and delete ad sets
  - Policies check workspace membership through campaign relationship

  ## Indexes
  - Index on campaign_id for fast campaign lookups
  - Index on creator_id for creator filtering
  - Index on status for filtering by status
  - Composite index on (campaign_id, status) for common queries

  ## Important Notes
  1. Ad sets link campaigns with specific creator collaborations on advertising platforms
  2. Performance metrics are stored and aggregated to the campaign level
  3. CTR is calculated as (clicks / impressions) * 100
  4. Targeting data stored as JSONB for flexibility across different platforms
*/

-- =====================================================
-- AD SETS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS ad_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  platform text NOT NULL CHECK (platform IN ('META', 'TikTok', 'Google', 'YouTube', 'Other')),
  status text DEFAULT 'draft' CHECK (status IN ('active', 'paused', 'completed', 'draft')),
  budget numeric,
  spend numeric DEFAULT 0,
  impressions bigint DEFAULT 0,
  clicks bigint DEFAULT 0,
  conversions bigint DEFAULT 0,
  ctr numeric DEFAULT 0,
  ad_creative_url text,
  targeting_data jsonb DEFAULT '{}'::jsonb,
  performance_metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_ad_sets_campaign ON ad_sets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_sets_creator ON ad_sets(creator_id);
CREATE INDEX IF NOT EXISTS idx_ad_sets_status ON ad_sets(status);
CREATE INDEX IF NOT EXISTS idx_ad_sets_campaign_status ON ad_sets(campaign_id, status);

-- Enable Row Level Security
ALTER TABLE ad_sets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ad_sets
CREATE POLICY "Workspace members can view ad sets"
  ON ad_sets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      JOIN workspace_members ON workspace_members.workspace_id = campaigns.workspace_id
      WHERE campaigns.id = ad_sets.campaign_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members and above can create ad sets"
  ON ad_sets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      JOIN workspace_members ON workspace_members.workspace_id = campaigns.workspace_id
      WHERE campaigns.id = ad_sets.campaign_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Members and above can update ad sets"
  ON ad_sets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      JOIN workspace_members ON workspace_members.workspace_id = campaigns.workspace_id
      WHERE campaigns.id = ad_sets.campaign_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      JOIN workspace_members ON workspace_members.workspace_id = campaigns.workspace_id
      WHERE campaigns.id = ad_sets.campaign_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Members and above can delete ad sets"
  ON ad_sets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      JOIN workspace_members ON workspace_members.workspace_id = campaigns.workspace_id
      WHERE campaigns.id = ad_sets.campaign_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  );

-- =====================================================
-- ADD AGGREGATED METRICS TO CAMPAIGNS TABLE
-- =====================================================

-- Add new columns to campaigns table for aggregated metrics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'total_ad_sets'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN total_ad_sets integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'active_ad_sets'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN active_ad_sets integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'total_spend'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN total_spend numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'total_impressions'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN total_impressions bigint DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'total_clicks'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN total_clicks bigint DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'total_conversions'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN total_conversions bigint DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'average_ctr'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN average_ctr numeric DEFAULT 0;
  END IF;
END $$;

-- =====================================================
-- FUNCTION TO UPDATE CAMPAIGN AGGREGATED METRICS
-- =====================================================

-- Create or replace function to calculate and update campaign metrics
CREATE OR REPLACE FUNCTION update_campaign_metrics(p_campaign_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE campaigns
  SET
    total_ad_sets = (
      SELECT COUNT(*)
      FROM ad_sets
      WHERE ad_sets.campaign_id = p_campaign_id
    ),
    active_ad_sets = (
      SELECT COUNT(*)
      FROM ad_sets
      WHERE ad_sets.campaign_id = p_campaign_id
      AND ad_sets.status = 'active'
    ),
    total_spend = COALESCE((
      SELECT SUM(spend)
      FROM ad_sets
      WHERE ad_sets.campaign_id = p_campaign_id
    ), 0),
    total_impressions = COALESCE((
      SELECT SUM(impressions)
      FROM ad_sets
      WHERE ad_sets.campaign_id = p_campaign_id
    ), 0),
    total_clicks = COALESCE((
      SELECT SUM(clicks)
      FROM ad_sets
      WHERE ad_sets.campaign_id = p_campaign_id
    ), 0),
    total_conversions = COALESCE((
      SELECT SUM(conversions)
      FROM ad_sets
      WHERE ad_sets.campaign_id = p_campaign_id
    ), 0),
    average_ctr = COALESCE((
      SELECT AVG(ctr)
      FROM ad_sets
      WHERE ad_sets.campaign_id = p_campaign_id
      AND impressions > 0
    ), 0),
    updated_at = now()
  WHERE id = p_campaign_id;
END;
$$;

-- =====================================================
-- TRIGGER TO AUTO-UPDATE CAMPAIGN METRICS
-- =====================================================

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_update_campaign_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_campaign_metrics(OLD.campaign_id);
    RETURN OLD;
  ELSE
    PERFORM update_campaign_metrics(NEW.campaign_id);
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger on ad_sets table
DROP TRIGGER IF EXISTS ad_sets_update_campaign_metrics ON ad_sets;
CREATE TRIGGER ad_sets_update_campaign_metrics
  AFTER INSERT OR UPDATE OR DELETE ON ad_sets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_campaign_metrics();
