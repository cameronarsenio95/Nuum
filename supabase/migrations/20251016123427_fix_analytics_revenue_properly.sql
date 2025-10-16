/*
  # Fix Analytics Revenue Calculation - Proper Solution
  
  1. Problem
    - LEFT JOIN with ad_sets also creates duplication
    - Campaign with 2 ad_sets = revenue counted 2x
    - SUM(DISTINCT c.total_revenue) doesn't work with multiple campaigns
  
  2. Solution
    - Calculate campaign metrics separately from ad_set metrics
    - Use subqueries to avoid any joins that multiply data
  
  3. Safety
    - Only modifying the function
    - No data changes
    - Safe to run multiple times
*/

CREATE OR REPLACE FUNCTION get_workspace_analytics(
  p_workspace_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  result json;
  v_total_campaigns int;
  v_active_campaigns int;
  v_total_creators int;
  v_total_ad_sets int;
  v_total_revenue numeric;
  v_total_spend numeric;
  v_total_profit numeric;
  v_overall_roi numeric;
  v_total_conversions bigint;
  v_total_clicks bigint;
  v_total_impressions bigint;
  v_avg_ctr numeric;
BEGIN
  -- Get campaign counts
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN status = 'active' THEN 1 END)
  INTO v_total_campaigns, v_active_campaigns
  FROM campaigns
  WHERE workspace_id = p_workspace_id
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);

  -- Get creator count
  SELECT COUNT(*) INTO v_total_creators
  FROM creators
  WHERE workspace_id = p_workspace_id;

  -- Get campaign financial metrics (without join)
  SELECT 
    COALESCE(SUM(total_revenue), 0),
    COALESCE(SUM(total_spend), 0)
  INTO v_total_revenue, v_total_spend
  FROM campaigns
  WHERE workspace_id = p_workspace_id
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);

  -- Calculate profit and ROI
  v_total_profit := v_total_revenue - v_total_spend;
  v_overall_roi := CASE 
    WHEN v_total_spend > 0 THEN ROUND((v_total_profit / v_total_spend * 100)::numeric, 2)
    ELSE 0
  END;

  -- Get ad_sets metrics
  SELECT 
    COUNT(DISTINCT ads.id),
    COALESCE(SUM(ads.conversions), 0),
    COALESCE(SUM(ads.clicks), 0),
    COALESCE(SUM(ads.impressions), 0)
  INTO v_total_ad_sets, v_total_conversions, v_total_clicks, v_total_impressions
  FROM ad_sets ads
  INNER JOIN campaigns c ON c.id = ads.campaign_id
  WHERE c.workspace_id = p_workspace_id
    AND (p_start_date IS NULL OR c.created_at >= p_start_date)
    AND (p_end_date IS NULL OR c.created_at <= p_end_date);

  -- Calculate CTR
  v_avg_ctr := CASE 
    WHEN v_total_impressions > 0 THEN ROUND((v_total_clicks::numeric / v_total_impressions * 100)::numeric, 2)
    ELSE 0
  END;

  -- Build result
  result := json_build_object(
    'summary', json_build_object(
      'total_campaigns', v_total_campaigns,
      'active_campaigns', v_active_campaigns,
      'total_creators', v_total_creators,
      'total_ad_sets', v_total_ad_sets,
      'total_revenue', v_total_revenue,
      'total_spend', v_total_spend,
      'total_profit', v_total_profit,
      'overall_roi', v_overall_roi,
      'total_conversions', v_total_conversions,
      'total_clicks', v_total_clicks,
      'total_impressions', v_total_impressions,
      'avg_ctr', v_avg_ctr
    ),
    'date_range', json_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date
    )
  );
    
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
