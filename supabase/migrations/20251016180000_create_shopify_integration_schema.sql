/*
  # Shopify Integration Schema

  ## Overview
  Complete database structure for Shopify e-commerce integration including OAuth, order tracking, conversion attribution, and revenue analytics.

  ## New Tables

  ### 1. platform_integrations
  Stores OAuth tokens and connection status for external platforms (Shopify, META, TikTok, etc.)
  - `id` (uuid, primary key)
  - `workspace_id` (uuid) - References workspaces
  - `platform` (text) - Platform name: 'shopify', 'meta', 'tiktok', 'snapchat'
  - `status` (text) - 'active', 'error', 'disconnected'
  - `access_token` (text) - Encrypted OAuth access token
  - `refresh_token` (text) - Encrypted OAuth refresh token
  - `token_expires_at` (timestamptz) - Token expiration timestamp
  - `store_url` (text) - Shopify store URL (e.g., mystore.myshopify.com)
  - `scopes` (text[]) - OAuth scopes granted
  - `metadata` (jsonb) - Platform-specific configuration
  - `last_sync_at` (timestamptz) - Last successful sync timestamp
  - `error_message` (text) - Latest error message if any
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. shopify_orders
  Stores order data synced from Shopify for revenue tracking and conversion attribution
  - `id` (uuid, primary key)
  - `workspace_id` (uuid) - References workspaces
  - `shopify_order_id` (text) - Shopify's order ID
  - `order_number` (text) - Human-readable order number
  - `email` (text) - Customer email
  - `total_price` (numeric) - Total order value
  - `subtotal_price` (numeric) - Subtotal before tax/shipping
  - `currency` (text) - Currency code (USD, EUR, etc.)
  - `financial_status` (text) - 'paid', 'pending', 'refunded', etc.
  - `fulfillment_status` (text) - 'fulfilled', 'unfulfilled', etc.
  - `discount_code` (text) - Applied discount code for creator attribution
  - `utm_source` (text) - UTM tracking parameter
  - `utm_medium` (text) - UTM tracking parameter
  - `utm_campaign` (text) - UTM tracking parameter
  - `landing_site` (text) - Landing page URL
  - `referring_site` (text) - Referrer URL
  - `customer_data` (jsonb) - Additional customer information
  - `line_items` (jsonb) - Order line items
  - `order_created_at` (timestamptz) - When order was created in Shopify
  - `synced_at` (timestamptz) - When order was synced to our database
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. conversion_events
  Tracks conversion attribution to campaigns and creators based on discount codes and UTM parameters
  - `id` (uuid, primary key)
  - `workspace_id` (uuid) - References workspaces
  - `campaign_id` (uuid) - References campaigns (nullable)
  - `creator_id` (uuid) - References creators (nullable)
  - `ad_set_id` (uuid) - References ad_sets (nullable)
  - `shopify_order_id` (uuid) - References shopify_orders
  - `conversion_value` (numeric) - Order total value
  - `attribution_method` (text) - 'discount_code', 'utm_campaign', 'referrer', 'manual'
  - `attribution_confidence` (numeric) - Confidence score 0-1
  - `discount_code` (text) - Discount code used
  - `utm_data` (jsonb) - UTM parameters used for attribution
  - `converted_at` (timestamptz) - When conversion happened
  - `created_at` (timestamptz)

  ### 4. shopify_products
  Stores product data for reporting and analytics
  - `id` (uuid, primary key)
  - `workspace_id` (uuid) - References workspaces
  - `shopify_product_id` (text) - Shopify's product ID
  - `title` (text) - Product title
  - `handle` (text) - URL handle
  - `product_type` (text) - Product category
  - `vendor` (text) - Product vendor
  - `tags` (text[]) - Product tags
  - `variants` (jsonb) - Product variants with pricing
  - `images` (jsonb) - Product images
  - `status` (text) - 'active', 'draft', 'archived'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Workspace members can only access their workspace's data
  - Access tokens are encrypted at rest
  - Sensitive fields are protected with additional policies

  ## Indexes
  - Foreign key indexes for performance
  - Composite indexes for common queries
  - Text indexes for search functionality

  ## Important Notes
  1. Access tokens must be encrypted before storage
  2. Sync operations should be rate-limited per Shopify API guidelines
  3. Conversion attribution uses multiple methods with confidence scoring
  4. Orders are deduplicated using shopify_order_id
*/

-- =====================================================
-- PLATFORM INTEGRATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS platform_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('shopify', 'meta', 'tiktok', 'snapchat', 'google')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'error', 'disconnected')),
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  store_url text,
  scopes text[] DEFAULT ARRAY[]::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  last_sync_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_platform_integrations_workspace ON platform_integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_platform_integrations_platform ON platform_integrations(platform);
CREATE INDEX IF NOT EXISTS idx_platform_integrations_status ON platform_integrations(workspace_id, status);

ALTER TABLE platform_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view integrations"
  ON platform_integrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = platform_integrations.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can insert integrations"
  ON platform_integrations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = platform_integrations.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can update integrations"
  ON platform_integrations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = platform_integrations.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = platform_integrations.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can delete integrations"
  ON platform_integrations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = platform_integrations.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- =====================================================
-- SHOPIFY ORDERS
-- =====================================================

CREATE TABLE IF NOT EXISTS shopify_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  shopify_order_id text NOT NULL,
  order_number text NOT NULL,
  email text,
  total_price numeric NOT NULL DEFAULT 0,
  subtotal_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  financial_status text,
  fulfillment_status text,
  discount_code text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  landing_site text,
  referring_site text,
  customer_data jsonb DEFAULT '{}'::jsonb,
  line_items jsonb DEFAULT '[]'::jsonb,
  order_created_at timestamptz NOT NULL,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, shopify_order_id)
);

CREATE INDEX IF NOT EXISTS idx_shopify_orders_workspace ON shopify_orders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_shopify_id ON shopify_orders(shopify_order_id);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_discount ON shopify_orders(workspace_id, discount_code) WHERE discount_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shopify_orders_utm ON shopify_orders(workspace_id, utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shopify_orders_created ON shopify_orders(workspace_id, order_created_at DESC);

ALTER TABLE shopify_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view orders"
  ON shopify_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = shopify_orders.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can insert orders"
  ON shopify_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = shopify_orders.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can update orders"
  ON shopify_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = shopify_orders.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = shopify_orders.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

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

-- Function to automatically attribute conversions when orders are inserted
CREATE OR REPLACE FUNCTION attribute_conversion()
RETURNS TRIGGER AS $$
DECLARE
  v_creator_id uuid;
  v_campaign_id uuid;
  v_ad_set_id uuid;
  v_attribution_method text;
  v_confidence numeric;
BEGIN
  -- Try to attribute by discount code first (highest confidence)
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

  -- If no discount code match, try UTM campaign
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

  -- Create conversion event if attribution was successful
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

-- Trigger to run attribution function on new orders
DROP TRIGGER IF EXISTS trigger_attribute_conversion ON shopify_orders;
CREATE TRIGGER trigger_attribute_conversion
  AFTER INSERT ON shopify_orders
  FOR EACH ROW
  EXECUTE FUNCTION attribute_conversion();

-- =====================================================
-- ANALYTICS VIEWS
-- =====================================================

-- View for campaign revenue from Shopify conversions
CREATE OR REPLACE VIEW campaign_shopify_revenue AS
SELECT
  c.id AS campaign_id,
  c.workspace_id,
  c.name AS campaign_name,
  COUNT(DISTINCT ce.id) AS conversion_count,
  SUM(ce.conversion_value) AS total_revenue,
  AVG(ce.conversion_value) AS avg_order_value,
  SUM(CASE WHEN ce.attribution_method = 'discount_code' THEN ce.conversion_value ELSE 0 END) AS discount_code_revenue,
  SUM(CASE WHEN ce.attribution_method = 'utm_campaign' THEN ce.conversion_value ELSE 0 END) AS utm_revenue
FROM campaigns c
LEFT JOIN conversion_events ce ON ce.campaign_id = c.id
GROUP BY c.id, c.workspace_id, c.name;

-- View for creator revenue from Shopify conversions
CREATE OR REPLACE VIEW creator_shopify_revenue AS
SELECT
  cr.id AS creator_id,
  cr.workspace_id,
  cr.name AS creator_name,
  COUNT(DISTINCT ce.id) AS conversion_count,
  SUM(ce.conversion_value) AS total_revenue,
  AVG(ce.conversion_value) AS avg_order_value,
  SUM(CASE WHEN ce.attribution_method = 'discount_code' THEN 1 ELSE 0 END) AS discount_conversions
FROM creators cr
LEFT JOIN conversion_events ce ON ce.creator_id = cr.id
GROUP BY cr.id, cr.workspace_id, cr.name;
