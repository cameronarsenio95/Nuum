/*
  # Add Missing Shopify Integration Tables
  
  ## Overview
  Creates the missing tables from the Shopify integration schema that weren't created in the initial migration.
  
  ## New Tables
  
  ### 1. conversion_events
  - Tracks conversion attribution to campaigns and creators
  - Links Shopify orders to campaigns via discount codes and UTM parameters
  - Includes confidence scoring for attribution accuracy
  
  ### 2. shopify_products
  - Stores product catalog data from Shopify
  - Used for reporting and product performance analytics
  
  ## Security
  - RLS enabled on all tables
  - Workspace-level access control
  - Service role can insert/update for sync operations
*/

-- =====================================================
-- CONVERSION EVENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS conversion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  creator_id uuid REFERENCES creators(id) ON DELETE SET NULL,
  ad_set_id uuid REFERENCES ad_sets(id) ON DELETE SET NULL,
  shopify_order_id uuid REFERENCES shopify_orders(id) ON DELETE CASCADE NOT NULL,
  conversion_value numeric NOT NULL DEFAULT 0,
  attribution_method text NOT NULL CHECK (attribution_method IN ('discount_code', 'utm_campaign', 'referrer', 'manual')),
  attribution_confidence numeric NOT NULL DEFAULT 1.0 CHECK (attribution_confidence >= 0 AND attribution_confidence <= 1),
  discount_code text,
  utm_data jsonb DEFAULT '{}'::jsonb,
  converted_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversion_events_workspace ON conversion_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_campaign ON conversion_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_creator ON conversion_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_ad_set ON conversion_events(ad_set_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_order ON conversion_events(shopify_order_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_date ON conversion_events(workspace_id, converted_at DESC);

ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view conversions"
  ON conversion_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = conversion_events.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can insert conversions"
  ON conversion_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = conversion_events.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can update conversions"
  ON conversion_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = conversion_events.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = conversion_events.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- =====================================================
-- SHOPIFY PRODUCTS
-- =====================================================

CREATE TABLE IF NOT EXISTS shopify_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  shopify_product_id text NOT NULL,
  title text NOT NULL,
  handle text,
  product_type text,
  vendor text,
  tags text[] DEFAULT ARRAY[]::text[],
  variants jsonb DEFAULT '[]'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, shopify_product_id)
);

CREATE INDEX IF NOT EXISTS idx_shopify_products_workspace ON shopify_products(workspace_id);
CREATE INDEX IF NOT EXISTS idx_shopify_products_shopify_id ON shopify_products(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_shopify_products_status ON shopify_products(workspace_id, status);

ALTER TABLE shopify_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view products"
  ON shopify_products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = shopify_products.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can insert products"
  ON shopify_products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = shopify_products.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can update products"
  ON shopify_products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = shopify_products.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = shopify_products.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS FOR AUTOMATIC CONVERSION ATTRIBUTION
-- =====================================================

CREATE OR REPLACE FUNCTION attribute_conversion()
RETURNS TRIGGER AS $$
DECLARE
  v_creator_id uuid;
  v_campaign_id uuid;
  v_ad_set_id uuid;
  v_attribution_method text;
  v_confidence numeric;
BEGIN
  IF NEW.discount_code IS NOT NULL THEN
    SELECT id INTO v_creator_id
    FROM creators
    WHERE workspace_id = NEW.workspace_id
    AND discount_code = NEW.discount_code
    LIMIT 1;

    IF v_creator_id IS NOT NULL THEN
      v_attribution_method := 'discount_code';
      v_confidence := 1.0;
    END IF;
  END IF;

  IF v_creator_id IS NULL AND NEW.utm_campaign IS NOT NULL THEN
    SELECT id INTO v_campaign_id
    FROM campaigns
    WHERE workspace_id = NEW.workspace_id
    AND lower(name) = lower(NEW.utm_campaign)
    LIMIT 1;

    IF v_campaign_id IS NOT NULL THEN
      v_attribution_method := 'utm_campaign';
      v_confidence := 0.8;
    END IF;
  END IF;

  IF v_creator_id IS NOT NULL OR v_campaign_id IS NOT NULL THEN
    INSERT INTO conversion_events (
      workspace_id,
      campaign_id,
      creator_id,
      ad_set_id,
      shopify_order_id,
      conversion_value,
      attribution_method,
      attribution_confidence,
      discount_code,
      utm_data,
      converted_at
    ) VALUES (
      NEW.workspace_id,
      v_campaign_id,
      v_creator_id,
      v_ad_set_id,
      NEW.id,
      NEW.total_price,
      v_attribution_method,
      v_confidence,
      NEW.discount_code,
      jsonb_build_object(
        'utm_source', NEW.utm_source,
        'utm_medium', NEW.utm_medium,
        'utm_campaign', NEW.utm_campaign
      ),
      NEW.order_created_at
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_attribute_conversion ON shopify_orders;
CREATE TRIGGER trigger_attribute_conversion
  AFTER INSERT ON shopify_orders
  FOR EACH ROW
  EXECUTE FUNCTION attribute_conversion();

-- =====================================================
-- ANALYTICS VIEWS
-- =====================================================

CREATE OR REPLACE VIEW campaign_shopify_revenue AS
SELECT
  c.id AS campaign_id,
  c.workspace_id,
  c.name AS campaign_name,
  COUNT(DISTINCT ce.id) AS conversion_count,
  COALESCE(SUM(ce.conversion_value), 0) AS total_revenue,
  CASE WHEN COUNT(DISTINCT ce.id) > 0 THEN AVG(ce.conversion_value) ELSE 0 END AS avg_order_value,
  COALESCE(SUM(CASE WHEN ce.attribution_method = 'discount_code' THEN ce.conversion_value ELSE 0 END), 0) AS discount_code_revenue,
  COALESCE(SUM(CASE WHEN ce.attribution_method = 'utm_campaign' THEN ce.conversion_value ELSE 0 END), 0) AS utm_revenue
FROM campaigns c
LEFT JOIN conversion_events ce ON ce.campaign_id = c.id
GROUP BY c.id, c.workspace_id, c.name;

CREATE OR REPLACE VIEW creator_shopify_revenue AS
SELECT
  cr.id AS creator_id,
  cr.workspace_id,
  cr.name AS creator_name,
  COUNT(DISTINCT ce.id) AS conversion_count,
  COALESCE(SUM(ce.conversion_value), 0) AS total_revenue,
  CASE WHEN COUNT(DISTINCT ce.id) > 0 THEN AVG(ce.conversion_value) ELSE 0 END AS avg_order_value,
  COALESCE(SUM(CASE WHEN ce.attribution_method = 'discount_code' THEN 1 ELSE 0 END), 0) AS discount_conversions
FROM creators cr
LEFT JOIN conversion_events ce ON ce.creator_id = cr.id
GROUP BY cr.id, cr.workspace_id, cr.name;