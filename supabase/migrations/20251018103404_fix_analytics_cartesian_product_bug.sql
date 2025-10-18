/*
  # Fix Analytics Cartesian Product Bug

  ## Problem
  The `get_workspace_analytics()` function had a critical bug where it joined creators 
  with campaigns, causing a Cartesian product that multiplied ad set metrics by the 
  number of creators in the workspace.

  For example, with 3 creators and 7 ad sets:
  - Revenue was counted 3 times per ad set: €9,400 × 3 = €28,200 (WRONG!)
  - Correct revenue should be: €9,400

  ## Solution
  Remove the creators JOIN from the main aggregation query and count creators separately 
  in a subquery to avoid the Cartesian product.

  ## Changes
  - Remove `LEFT JOIN creators cr ON cr.workspace_id = c.workspace_id`
  - Add a separate subquery to count `total_creators` correctly
  - This ensures ad set metrics are only counted once

  ## Impact
  - ✅ Revenue, spend, and profit will now show correct values
  - ✅ ROI calculations will be accurate
  - ✅ Conversions, clicks, and impressions will be correct
  - ✅ Creator count remains accurate
*/

-- =====================================================
-- FIX get_workspace_analytics FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_workspace_analytics(
  p_workspace_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  result json;
  creator_count bigint;
BEGIN
  -- Count creators separately to avoid Cartesian product
  SELECT COUNT(DISTINCT id) INTO creator_count
  FROM creators
  WHERE workspace_id = p_workspace_id
    AND status = 'active';

  -- Aggregate ad set metrics without joining creators
  SELECT json_build_object(
    'summary', json_build_object(
      'total_campaigns', COUNT(DISTINCT c.id),
      'active_campaigns', COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END),
      'total_creators', creator_count,
      'total_ad_sets', COUNT(DISTINCT ads.id),
      'total_revenue', COALESCE(SUM(ads.revenue), 0),
      'total_spend', COALESCE(SUM(ads.spend), 0),
      'total_profit', COALESCE(SUM(ads.revenue) - SUM(ads.spend), 0),
      'overall_roi', CASE 
        WHEN SUM(ads.spend) > 0 THEN ROUND(((SUM(ads.revenue) - SUM(ads.spend)) / SUM(ads.spend) * 100)::numeric, 2)
        ELSE 0
      END,
      'total_conversions', COALESCE(SUM(ads.conversions), 0),
      'total_clicks', COALESCE(SUM(ads.clicks), 0),
      'total_impressions', COALESCE(SUM(ads.impressions), 0),
      'avg_ctr', CASE 
        WHEN SUM(ads.impressions) > 0 THEN ROUND((SUM(ads.clicks)::numeric / SUM(ads.impressions) * 100)::numeric, 2)
        ELSE 0
      END
    ),
    'date_range', json_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date
    )
  ) INTO result
  FROM campaigns c
  LEFT JOIN ad_sets ads ON ads.campaign_id = c.id
    AND (
      -- Include ad sets that overlap with the date range
      p_start_date IS NULL OR p_end_date IS NULL OR
      (
        -- Ad set started before or during the period AND
        (ads.start_date IS NULL OR ads.start_date <= p_end_date) AND
        -- Ad set ended after or during the period (or has no end date)
        (ads.end_date IS NULL OR ads.end_date >= p_start_date)
      )
    )
  WHERE c.workspace_id = p_workspace_id;
    
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ADD COMMENT FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION get_workspace_analytics(uuid, timestamptz, timestamptz) IS 'Returns workspace analytics with correct aggregation. Creators are counted separately to avoid Cartesian product multiplication of ad set metrics.';
