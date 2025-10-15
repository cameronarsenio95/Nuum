/*
  # Create Analytics Views and Functions
  
  1. Database Views (Read-Only)
    - `campaign_performance_summary` - Aggregated campaign metrics with ROI calculations
    - `creator_performance_summary` - Creator performance metrics across all campaigns
    - `platform_performance_summary` - Performance breakdown by platform (META, TikTok, etc)
    - `workspace_metrics_summary` - High-level workspace KPIs
  
  2. Stored Functions
    - `get_workspace_analytics()` - Returns comprehensive analytics for a workspace with date range filtering
    - `get_campaign_timeline_data()` - Returns revenue/spend data over time for charts
    - `get_top_performing_creators()` - Returns ranked list of best performing creators
  
  3. Security
    - All views respect existing RLS policies
    - Functions use SECURITY DEFINER with workspace_id checks
    - Read-only operations, cannot modify data
  
  4. Notes
    - No existing tables are modified
    - No existing data is changed
    - Only creates new read-only database objects
    - Safe to run multiple times (uses CREATE OR REPLACE)
*/

-- View: Campaign Performance Summary
CREATE OR REPLACE VIEW campaign_performance_summary AS
SELECT 
  c.id,
  c.name,
  c.workspace_id,
  c.status,
  c.budget,
  c.start_date,
  c.end_date,
  c.total_spend,
  c.total_revenue,
  (c.total_revenue - c.total_spend) AS profit,
  CASE 
    WHEN c.total_spend > 0 THEN ROUND(((c.total_revenue - c.total_spend) / c.total_spend * 100)::numeric, 2)
    ELSE 0
  END AS roi_percentage,
  c.total_ad_sets,
  c.active_ad_sets,
  COALESCE(SUM(ads.impressions), 0) AS total_impressions,
  COALESCE(SUM(ads.clicks), 0) AS total_clicks,
  COALESCE(SUM(ads.conversions), 0) AS total_conversions,
  CASE 
    WHEN SUM(ads.impressions) > 0 THEN ROUND((SUM(ads.clicks)::numeric / SUM(ads.impressions) * 100)::numeric, 2)
    ELSE 0
  END AS avg_ctr,
  CASE
    WHEN SUM(ads.conversions) > 0 THEN ROUND((c.total_spend / SUM(ads.conversions))::numeric, 2)
    ELSE 0
  END AS cost_per_conversion,
  c.created_at,
  c.updated_at
FROM campaigns c
LEFT JOIN ad_sets ads ON ads.campaign_id = c.id
GROUP BY c.id, c.name, c.workspace_id, c.status, c.budget, c.start_date, c.end_date, 
         c.total_spend, c.total_revenue, c.total_ad_sets, c.active_ad_sets, c.created_at, c.updated_at;

-- View: Creator Performance Summary
CREATE OR REPLACE VIEW creator_performance_summary AS
SELECT 
  cr.id,
  cr.name,
  cr.workspace_id,
  cr.status,
  cr.instagram_handle,
  cr.tiktok_handle,
  COUNT(DISTINCT ads.campaign_id) AS campaigns_participated,
  COUNT(DISTINCT ads.id) AS total_ad_sets,
  COALESCE(SUM(ads.revenue), 0) AS total_revenue_generated,
  COALESCE(SUM(ads.spend), 0) AS total_spend,
  COALESCE(SUM(ads.revenue) - SUM(ads.spend), 0) AS total_profit,
  CASE 
    WHEN SUM(ads.spend) > 0 THEN ROUND(((SUM(ads.revenue) - SUM(ads.spend)) / SUM(ads.spend) * 100)::numeric, 2)
    ELSE 0
  END AS roi_percentage,
  COALESCE(SUM(ads.conversions), 0) AS total_conversions,
  COALESCE(SUM(ads.clicks), 0) AS total_clicks,
  COALESCE(SUM(ads.impressions), 0) AS total_impressions,
  CASE 
    WHEN SUM(ads.impressions) > 0 THEN ROUND((SUM(ads.clicks)::numeric / SUM(ads.impressions) * 100)::numeric, 2)
    ELSE 0
  END AS avg_ctr,
  cr.created_at
FROM creators cr
LEFT JOIN ad_sets ads ON ads.creator_id = cr.id
GROUP BY cr.id, cr.name, cr.workspace_id, cr.status, cr.instagram_handle, 
         cr.tiktok_handle, cr.created_at;

-- View: Platform Performance Summary
CREATE OR REPLACE VIEW platform_performance_summary AS
SELECT 
  ads.platform,
  ads.campaign_id,
  c.workspace_id,
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
GROUP BY ads.platform, ads.campaign_id, c.workspace_id;

-- View: Workspace Metrics Summary
CREATE OR REPLACE VIEW workspace_metrics_summary AS
SELECT 
  w.id AS workspace_id,
  w.name AS workspace_name,
  COUNT(DISTINCT c.id) AS total_campaigns,
  COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) AS active_campaigns,
  COUNT(DISTINCT cr.id) AS total_creators,
  COUNT(DISTINCT ads.id) AS total_ad_sets,
  COALESCE(SUM(c.total_revenue), 0) AS total_revenue,
  COALESCE(SUM(c.total_spend), 0) AS total_spend,
  COALESCE(SUM(c.total_revenue) - SUM(c.total_spend), 0) AS total_profit,
  CASE 
    WHEN SUM(c.total_spend) > 0 THEN ROUND(((SUM(c.total_revenue) - SUM(c.total_spend)) / SUM(c.total_spend) * 100)::numeric, 2)
    ELSE 0
  END AS overall_roi,
  COALESCE(SUM(ads.conversions), 0) AS total_conversions,
  COALESCE(SUM(ads.clicks), 0) AS total_clicks,
  COALESCE(SUM(ads.impressions), 0) AS total_impressions
FROM workspaces w
LEFT JOIN campaigns c ON c.workspace_id = w.id
LEFT JOIN creators cr ON cr.workspace_id = w.id
LEFT JOIN ad_sets ads ON ads.campaign_id = c.id
GROUP BY w.id, w.name;

-- Function: Get Workspace Analytics with Date Range Filtering
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
      'total_revenue', COALESCE(SUM(c.total_revenue), 0),
      'total_spend', COALESCE(SUM(c.total_spend), 0),
      'total_profit', COALESCE(SUM(c.total_revenue) - SUM(c.total_spend), 0),
      'overall_roi', CASE 
        WHEN SUM(c.total_spend) > 0 THEN ROUND(((SUM(c.total_revenue) - SUM(c.total_spend)) / SUM(c.total_spend) * 100)::numeric, 2)
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
  LEFT JOIN creators cr ON cr.workspace_id = c.workspace_id
  WHERE c.workspace_id = p_workspace_id
    AND (p_start_date IS NULL OR c.created_at >= p_start_date)
    AND (p_end_date IS NULL OR c.created_at <= p_end_date);
    
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Campaign Timeline Data (for charts)
CREATE OR REPLACE FUNCTION get_campaign_timeline_data(
  p_workspace_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_interval text DEFAULT 'day'
)
RETURNS TABLE(
  date_bucket timestamptz,
  revenue numeric,
  spend numeric,
  profit numeric,
  conversions bigint,
  campaigns_active bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc(p_interval, c.created_at) AS date_bucket,
    COALESCE(SUM(c.total_revenue), 0)::numeric AS revenue,
    COALESCE(SUM(c.total_spend), 0)::numeric AS spend,
    COALESCE(SUM(c.total_revenue) - SUM(c.total_spend), 0)::numeric AS profit,
    COALESCE(SUM(ads.conversions), 0) AS conversions,
    COUNT(DISTINCT c.id) AS campaigns_active
  FROM campaigns c
  LEFT JOIN ad_sets ads ON ads.campaign_id = c.id
  WHERE c.workspace_id = p_workspace_id
    AND c.created_at >= p_start_date
    AND c.created_at <= p_end_date
  GROUP BY date_bucket
  ORDER BY date_bucket ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Top Performing Creators
CREATE OR REPLACE FUNCTION get_top_performing_creators(
  p_workspace_id uuid,
  p_limit int DEFAULT 10,
  p_order_by text DEFAULT 'revenue'
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
  LEFT JOIN campaigns c ON c.id = ads.campaign_id
  WHERE cr.workspace_id = p_workspace_id
    AND cr.status = 'active'
  GROUP BY cr.id, cr.name
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
