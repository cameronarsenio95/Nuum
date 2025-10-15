/*
  # Update Campaign Metrics Function

  ## Overview
  Updates the campaign metrics aggregation function to only aggregate
  revenue and spend from ad_sets, removing deprecated fields.

  ## Changes
  1. Remove aggregation of budget, impressions, clicks, conversions, ctr
  2. Keep only revenue and spend aggregation
  3. Simplify the function for better performance

  ## Important Notes
  - This aligns with the simplified ad_sets schema
  - Campaign metrics will now only track revenue, spend, and ad set counts
  - ROI can be calculated in the frontend from revenue and spend
*/

-- =====================================================
-- DROP AND RECREATE CAMPAIGN METRICS FUNCTION
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
    updated_at = now()
  WHERE id = p_campaign_id;
END;
$$;
