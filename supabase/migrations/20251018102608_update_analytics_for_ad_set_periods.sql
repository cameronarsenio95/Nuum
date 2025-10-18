/*
  # Update Analytics to Filter by Ad Set Periods

  ## Overview
  Updates analytics views and functions to filter ad sets based on their start_date and end_date,
  enabling period-based analytics that match the ad set duration system.

  ## Changes

  1. **get_workspace_analytics()** function:
     - Filters ad sets that overlap with the requested date range
     - An ad set is included if: (start_date <= filter_end OR start_date IS NULL) AND (end_date >= filter_start OR end_date IS NULL)
     - Handles NULL values for "All Time" ad sets

  2. **get_top_performing_creators()** function:
     - Filters creators based on their ad sets within the date range
     - Ensures only ad sets active during the period are counted

  3. **campaign_performance_summary** view:
     - No changes needed (already based on campaign dates)

  ## Important Notes
  1. Ad sets with NULL start_date/end_date (legacy data or "All Time") are included in all date ranges
  2. An ad set "overlaps" with a date range if any part of its period falls within the range
  3. This maintains backwards compatibility with existing ad sets that don't have period data
*/

-- =====================================================
-- UPDATE get_workspace_analytics FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_workspace_analytics(
  p_workspace_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'summary', json_build_object(
      'total_campaigns', COUNT(DISTINCT c.id),
      'active_campaigns', COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END),
      'total_creators', COUNT(DISTINCT cr.id),
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
  LEFT JOIN creators cr ON cr.workspace_id = c.workspace_id
  WHERE c.workspace_id = p_workspace_id;
    
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- UPDATE get_top_performing_creators FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_top_performing_creators(
  p_workspace_id uuid,
  p_limit int DEFAULT 10,
  p_order_by text DEFAULT 'revenue',
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(
  creator_id uuid,
  creator_name text,
  total_revenue numeric,
  total_spend numeric,
  profit numeric,
  roi_percentage numeric,
  conversions bigint,
  campaigns_count bigint,
  ad_sets_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id AS creator_id,
    cr.name AS creator_name,
    COALESCE(SUM(ads.revenue), 0)::numeric AS total_revenue,
    COALESCE(SUM(ads.spend), 0)::numeric AS total_spend,
    COALESCE(SUM(ads.revenue) - SUM(ads.spend), 0)::numeric AS profit,
    CASE 
      WHEN SUM(ads.spend) > 0 THEN ROUND(((SUM(ads.revenue) - SUM(ads.spend)) / SUM(ads.spend) * 100)::numeric, 2)
      ELSE 0
    END AS roi_percentage,
    COALESCE(SUM(ads.conversions), 0) AS conversions,
    COUNT(DISTINCT ads.campaign_id) AS campaigns_count,
    COUNT(DISTINCT ads.id) AS ad_sets_count
  FROM creators cr
  LEFT JOIN ad_sets ads ON ads.creator_id = cr.id
    AND (
      -- Include ad sets that overlap with the date range
      p_start_date IS NULL OR p_end_date IS NULL OR
      (
        (ads.start_date IS NULL OR ads.start_date <= p_end_date) AND
        (ads.end_date IS NULL OR ads.end_date >= p_start_date)
      )
    )
  LEFT JOIN campaigns c ON c.id = ads.campaign_id
  WHERE cr.workspace_id = p_workspace_id
    AND cr.status = 'active'
  GROUP BY cr.id, cr.name
  HAVING COUNT(DISTINCT ads.id) > 0  -- Only include creators with ad sets in the period
  ORDER BY 
    CASE 
      WHEN p_order_by = 'revenue' THEN COALESCE(SUM(ads.revenue), 0)
      WHEN p_order_by = 'roi' THEN CASE 
        WHEN SUM(ads.spend) > 0 THEN ((SUM(ads.revenue) - SUM(ads.spend)) / SUM(ads.spend) * 100)
        ELSE 0
      END
      WHEN p_order_by = 'conversions' THEN COALESCE(SUM(ads.conversions), 0)
      ELSE COALESCE(SUM(ads.revenue), 0)
    END DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- UPDATE platform_performance_summary VIEW
-- =====================================================

-- Drop and recreate the view to ensure clean state
DROP VIEW IF EXISTS platform_performance_summary CASCADE;

CREATE OR REPLACE VIEW platform_performance_summary AS
SELECT 
  ads.platform,
  ads.campaign_id,
  c.workspace_id,
  ads.duration_days,
  ads.start_date,
  ads.end_date,
  COUNT(ads.id) AS ad_set_count,
  COALESCE(SUM(ads.revenue), 0) AS total_revenue,
  COALESCE(SUM(ads.spend), 0) AS total_spend,
  COALESCE(SUM(ads.revenue) - SUM(ads.spend), 0) AS profit,
  CASE 
    WHEN SUM(ads.spend) > 0 THEN ROUND(((SUM(ads.revenue) - SUM(ads.spend)) / SUM(ads.spend) * 100)::numeric, 2)
    ELSE 0
  END AS roi_percentage,
  COALESCE(SUM(ads.impressions), 0) AS total_impressions,
  COALESCE(SUM(ads.clicks), 0) AS total_clicks,
  COALESCE(SUM(ads.conversions), 0) AS total_conversions,
  CASE 
    WHEN SUM(ads.impressions) > 0 THEN ROUND((SUM(ads.clicks)::numeric / SUM(ads.impressions) * 100)::numeric, 2)
    ELSE 0
  END AS avg_ctr
FROM ad_sets ads
JOIN campaigns c ON c.id = ads.campaign_id
GROUP BY ads.platform, ads.campaign_id, c.workspace_id, ads.duration_days, ads.start_date, ads.end_date;

-- =====================================================
-- NEW HELPER FUNCTION: Get Ad Sets for Date Range
-- =====================================================

CREATE OR REPLACE FUNCTION get_ad_sets_in_period(
  p_workspace_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS TABLE(
  id uuid,
  name text,
  campaign_id uuid,
  creator_id uuid,
  platform text,
  status text,
  duration_days integer,
  start_date timestamptz,
  end_date timestamptz,
  revenue numeric,
  spend numeric,
  profit numeric,
  roi_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ads.id,
    ads.name,
    ads.campaign_id,
    ads.creator_id,
    ads.platform,
    ads.status,
    ads.duration_days,
    ads.start_date,
    ads.end_date,
    ads.revenue,
    ads.spend,
    (ads.revenue - ads.spend) AS profit,
    CASE 
      WHEN ads.spend > 0 THEN ROUND(((ads.revenue - ads.spend) / ads.spend * 100)::numeric, 2)
      ELSE 0
    END AS roi_percentage
  FROM ad_sets ads
  JOIN campaigns c ON c.id = ads.campaign_id
  WHERE c.workspace_id = p_workspace_id
    AND (
      -- Ad set overlaps with the requested period
      (ads.start_date IS NULL OR ads.start_date <= p_end_date) AND
      (ads.end_date IS NULL OR ads.end_date >= p_start_date)
    )
  ORDER BY ads.start_date DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION get_workspace_analytics(uuid, timestamptz, timestamptz) IS 'Returns workspace analytics filtered by ad set period overlap. Ad sets with NULL dates are always included.';
COMMENT ON FUNCTION get_top_performing_creators(uuid, int, text, timestamptz, timestamptz) IS 'Returns top performing creators filtered by ad sets active in the date range.';
COMMENT ON FUNCTION get_ad_sets_in_period(uuid, timestamptz, timestamptz) IS 'Returns all ad sets that were active during the specified period, including those with NULL dates.';
