/*
  # Fix Top Performing Creators Function

  1. Problem
    - Function only shows creators with ad_sets that have revenue
    - If ad_sets.revenue is 0 or NULL, creators don't appear
    - Need to show all creators with their campaign association

  2. Solution
    - Join creators with campaigns through campaign_creators
    - Calculate revenue from ad_sets linked to both creator AND campaign
    - Show creators even if they have no revenue yet
    - Order by total revenue contribution

  3. Changes
    - Use campaign_creators junction table
    - Aggregate ad_set revenue per creator
    - Remove overly restrictive filters
    - Keep only creators with at least one campaign
*/

CREATE OR REPLACE FUNCTION get_top_performing_creators(
  p_workspace_id uuid,
  p_limit int DEFAULT 10,
  p_order_by text DEFAULT 'revenue'
)
RETURNS TABLE (
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
  WITH creator_campaign_stats AS (
    SELECT
      cr.id,
      cr.name,
      COUNT(DISTINCT cc.campaign_id) as campaign_count,
      COALESCE(SUM(ads.revenue), 0) as ad_revenue,
      COALESCE(SUM(ads.spend), 0) as ad_spend,
      COALESCE(SUM(ads.conversions), 0) as ad_conversions,
      COUNT(DISTINCT ads.id) as ad_set_count
    FROM creators cr
    LEFT JOIN campaign_creators cc ON cc.creator_id = cr.id
    LEFT JOIN campaigns c ON c.id = cc.campaign_id
    LEFT JOIN ad_sets ads ON ads.creator_id = cr.id AND ads.campaign_id = c.id
    WHERE cr.workspace_id = p_workspace_id
    GROUP BY cr.id, cr.name
    HAVING COUNT(DISTINCT cc.campaign_id) > 0
  )
  SELECT
    ccs.id AS creator_id,
    ccs.name AS creator_name,
    ccs.ad_revenue::numeric AS total_revenue,
    ccs.ad_spend::numeric AS total_spend,
    (ccs.ad_revenue - ccs.ad_spend)::numeric AS profit,
    CASE
      WHEN ccs.ad_spend > 0 THEN ROUND(((ccs.ad_revenue - ccs.ad_spend) / ccs.ad_spend * 100)::numeric, 2)
      ELSE 0
    END AS roi_percentage,
    ccs.ad_conversions AS conversions,
    ccs.campaign_count AS campaigns_count,
    ccs.ad_set_count AS ad_sets_count
  FROM creator_campaign_stats ccs
  ORDER BY
    CASE
      WHEN p_order_by = 'revenue' THEN ccs.ad_revenue
      WHEN p_order_by = 'roi' THEN CASE
        WHEN ccs.ad_spend > 0 THEN ((ccs.ad_revenue - ccs.ad_spend) / ccs.ad_spend * 100)
        ELSE 0
      END
      WHEN p_order_by = 'conversions' THEN ccs.ad_conversions
      ELSE ccs.ad_revenue
    END DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
