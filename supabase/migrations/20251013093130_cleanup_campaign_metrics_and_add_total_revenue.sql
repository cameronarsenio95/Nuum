/*
  # Cleanup Campaign Metrics and Add Total Revenue

  ## Overview
  This migration removes deprecated metrics columns and adds a total_revenue column
  to properly track revenue aggregated from ad sets.

  ## Changes Made
  1. **Removed Columns**
     - `total_impressions` (bigint) - No longer tracked at campaign level
     - `total_clicks` (bigint) - No longer tracked at campaign level
     - `total_conversions` (bigint) - No longer tracked at campaign level
     - `average_ctr` (numeric) - No longer calculated

  2. **Added Columns**
     - `total_revenue` (numeric) - Aggregated revenue from all ad sets in campaign

  3. **Updated Function**
     - Modified `update_campaign_metrics` to populate total_revenue instead of revenue

  ## Important Notes
  - ROI is calculated in the frontend: (total_revenue / total_spend * 100)
  - All metrics are now aggregated from ad_sets table
  - The `revenue` column will be renamed to `total_revenue` for clarity
*/

-- =====================================================
-- RENAME REVENUE TO TOTAL_REVENUE FOR CONSISTENCY
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'revenue'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'total_revenue'
  ) THEN
    ALTER TABLE campaigns RENAME COLUMN revenue TO total_revenue;
  END IF;
END $$;

-- =====================================================
-- DROP DEPRECATED COLUMNS
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'total_impressions'
  ) THEN
    ALTER TABLE campaigns DROP COLUMN total_impressions;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'total_clicks'
  ) THEN
    ALTER TABLE campaigns DROP COLUMN total_clicks;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'total_conversions'
  ) THEN
    ALTER TABLE campaigns DROP COLUMN total_conversions;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'average_ctr'
  ) THEN
    ALTER TABLE campaigns DROP COLUMN average_ctr;
  END IF;
END $$;

-- =====================================================
-- UPDATE CAMPAIGN METRICS FUNCTION
-- =====================================================

DROP FUNCTION IF EXISTS update_campaign_metrics(uuid);

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
    total_revenue = COALESCE((
      SELECT SUM(revenue)
      FROM ad_sets
      WHERE ad_sets.campaign_id = p_campaign_id
    ), 0),
    total_spend = COALESCE((
      SELECT SUM(spend)
      FROM ad_sets
      WHERE ad_sets.campaign_id = p_campaign_id
    ), 0),
    updated_at = now()
  WHERE id = p_campaign_id;
END;
$$;