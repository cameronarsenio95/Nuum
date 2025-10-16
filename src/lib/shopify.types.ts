export interface PlatformIntegration {
  id: string;
  workspace_id: string;
  platform: 'shopify' | 'meta' | 'tiktok' | 'snapchat' | 'google';
  status: 'active' | 'error' | 'disconnected';
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  store_url: string | null;
  scopes: string[];
  metadata: Record<string, any>;
  last_sync_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShopifyOrder {
  id: string;
  workspace_id: string;
  shopify_order_id: string;
  order_number: string;
  email: string | null;
  total_price: number;
  subtotal_price: number;
  currency: string;
  financial_status: string | null;
  fulfillment_status: string | null;
  discount_code: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_site: string | null;
  referring_site: string | null;
  customer_data: Record<string, any>;
  line_items: Array<any>;
  order_created_at: string;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface ConversionEvent {
  id: string;
  workspace_id: string;
  campaign_id: string | null;
  creator_id: string | null;
  ad_set_id: string | null;
  shopify_order_id: string;
  conversion_value: number;
  attribution_method: 'discount_code' | 'utm_campaign' | 'referrer' | 'manual';
  attribution_confidence: number;
  discount_code: string | null;
  utm_data: Record<string, any>;
  converted_at: string;
  created_at: string;
}

export interface ShopifyProduct {
  id: string;
  workspace_id: string;
  shopify_product_id: string;
  title: string;
  handle: string | null;
  product_type: string | null;
  vendor: string | null;
  tags: string[];
  variants: Array<any>;
  images: Array<any>;
  status: 'active' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface CampaignShopifyRevenue {
  campaign_id: string;
  workspace_id: string;
  campaign_name: string;
  conversion_count: number;
  total_revenue: number;
  avg_order_value: number;
  discount_code_revenue: number;
  utm_revenue: number;
}

export interface CreatorShopifyRevenue {
  creator_id: string;
  workspace_id: string;
  creator_name: string;
  conversion_count: number;
  total_revenue: number;
  avg_order_value: number;
  discount_conversions: number;
}
