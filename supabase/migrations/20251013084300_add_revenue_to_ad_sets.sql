/*
  # Add Revenue to Ad Sets and Update Campaign Aggregation

  ## Overview
  Links budget and revenue to ad sets instead of campaigns. Campaigns will now aggregate
  budget and revenue from their ad sets for overview and reporting purposes.

  ## Changes

  1. **ad_sets table**
     - Add `revenue` (numeric, default: 0) - Revenue generated from this ad set

  2. **Campaign Aggregation Updates**
     - Update aggregation function to sum budget from ad_sets
     - Update aggregation function to sum revenue from ad_sets

  ## Important Notes
  1. Budget and revenue are now managed at the ad set level
  2. Campaign budget and revenue become calculated aggregates
  3. This allows for better tracking of performance per ad set
*/

-- =====================================================
-- ADD REVENUE TO AD SETS TABLE
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_sets' AND column_name = 'revenue'
  ) THEN
    ALTER TABLE ad_sets ADD COLUMN revenue numeric DEFAULT 0;
  END IF;
END $$;

-- =====================================================
-- UPDATE CAMPAIGN AGGREGATION FUNCTION
-- =====================================================

-- Update function to aggregate budget and revenue from ad_sets
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
    budget = COALESCE((
      SELECT SUM(budget)
      FROM ad_sets
      WHERE ad_sets.campaign_id = p_campaign_id
    ), 0),
    revenue = COALESCE((
      SELECT SUM(revenue)
      FROM ad_sets
      WHERE ad_sets.campaign_id = p_campaign_id
    ), 0),
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
