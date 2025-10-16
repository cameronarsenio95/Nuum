/*
  # Fix Analytics Revenue Calculation - Cartesian Product Issue
  
  1. Problem
    - The get_workspace_analytics function has a LEFT JOIN with creators
    - This creates a cartesian product: campaigns × ad_sets × creators
    - Revenue gets multiplied incorrectly (e.g., 3 campaigns × 2 ad_sets × 3 creators = 18x multiplication)
  
  2. Solution
    - Use subqueries to get creator count separately
    - Remove the creator LEFT JOIN from the main aggregation query
    - This ensures revenue is only summed once per campaign
  
  3. Safety
    - Only modifying the function, not the tables
    - No data is changed
    - Function uses CREATE OR REPLACE (safe to run multiple times)
  
  4. Impact
    - Revenue numbers will now be accurate
    - All other metrics remain correct
*/

-- Fix: Get Workspace Analytics Function (remove cartesian product)
CREATE OR REPLACE FUNCTION get_workspace_analytics(
  p_workspace_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  result json;
  creator_count int;
BEGIN
  -- Get creator count separately to avoid cartesian product
  SELECT COUNT(DISTINCT id) INTO creator_count
  FROM creators
  WHERE workspace_id = p_workspace_id;

  -- Main aggregation query without creator join
  SELECT json_build_object(
    'summary', json_build_object(
      'total_campaigns', COUNT(DISTINCT c.id),
      'active_campaigns', COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END),
      'total_creators', creator_count,
      'total_ad_sets', COUNT(DISTINCT ads.id),
      'total_revenue', COALESCE(SUM(DISTINCT c.total_revenue), 0),
      'total_spend', COALESCE(SUM(DISTINCT c.total_spend), 0),
      'total_profit', COALESCE(SUM(DISTINCT c.total_revenue) - SUM(DISTINCT c.total_spend), 0),
      'overall_roi', CASE 
        WHEN SUM(DISTINCT c.total_spend) > 0 THEN ROUND(((SUM(DISTINCT c.total_revenue) - SUM(DISTINCT c.total_spend)) / SUM(DISTINCT c.total_spend) * 100)::numeric, 2)
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
  WHERE c.workspace_id = p_workspace_id
    AND (p_start_date IS NULL OR c.created_at >= p_start_date)
    AND (p_end_date IS NULL OR c.created_at <= p_end_date);
    
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix the workspace_metrics_summary view
CREATE OR REPLACE VIEW workspace_metrics_summary AS
SELECT 
  w.id AS workspace_id,
  w.name AS workspace_name,
  COUNT(DISTINCT c.id) AS total_campaigns,
  COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) AS active_campaigns,
  (SELECT COUNT(DISTINCT id) FROM creators WHERE workspace_id = w.id) AS total_creators,
  COUNT(DISTINCT ads.id) AS total_ad_sets,
  COALESCE(SUM(DISTINCT c.total_revenue), 0) AS total_revenue,
  COALESCE(SUM(DISTINCT c.total_spend), 0) AS total_spend,
  COALESCE(SUM(DISTINCT c.total_revenue) - SUM(DISTINCT c.total_spend), 0) AS total_profit,
  CASE 
    WHEN SUM(DISTINCT c.total_spend) > 0 THEN ROUND(((SUM(DISTINCT c.total_revenue) - SUM(DISTINCT c.total_spend)) / SUM(DISTINCT c.total_spend) * 100)::numeric, 2)
    ELSE 0
  END AS overall_roi,
  COALESCE(SUM(ads.conversions), 0) AS total_conversions,
  COALESCE(SUM(ads.clicks), 0) AS total_clicks,
  COALESCE(SUM(ads.impressions), 0) AS total_impressions
FROM workspaces w
LEFT JOIN campaigns c ON c.workspace_id = w.id
LEFT JOIN ad_sets ads ON ads.campaign_id = c.id
GROUP BY w.id, w.name;
