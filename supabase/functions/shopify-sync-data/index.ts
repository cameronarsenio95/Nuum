import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ShopifyOrder {
  id: string;
  order_number: string;
  email: string;
  total_price: string;
  subtotal_price: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  discount_codes: Array<{ code: string }>;
  landing_site: string | null;
  referring_site: string | null;
  customer: any;
  line_items: any[];
  created_at: string;
  note_attributes?: Array<{ name: string; value: string }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { workspace_id } = await req.json();

    if (!workspace_id) {
      return new Response(
        JSON.stringify({ error: "Missing workspace_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const startTime = Date.now();

    const { data: integration, error: integrationError } = await supabase
      .from("platform_integrations")
      .select("*")
      .eq("workspace_id", workspace_id)
      .eq("platform", "shopify")
      .maybeSingle();

    if (integrationError || !integration) {
      throw new Error("Shopify integration not found");
    }

    const { access_token, store_url } = integration;

    if (!access_token || !store_url) {
      throw new Error("Invalid Shopify integration configuration");
    }

    const logId = crypto.randomUUID();
    await supabase.from("integration_sync_logs").insert({
      id: logId,
      workspace_id: workspace_id,
      integration_type: "shopify",
      sync_type: "manual",
      direction: "inbound",
      status: "started",
      records_processed: 0,
      records_created: 0,
      records_updated: 0,
      records_failed: 0,
      metadata: {},
      started_at: new Date().toISOString(),
    });

    const ordersUrl = `https://${store_url}/admin/api/2024-01/orders.json?status=any&limit=250`;

    const ordersResponse = await fetch(ordersUrl, {
      headers: {
        "X-Shopify-Access-Token": access_token,
        "Content-Type": "application/json",
      },
    });

    if (!ordersResponse.ok) {
      throw new Error(`Shopify API error: ${ordersResponse.statusText}`);
    }

    const ordersData = await ordersResponse.json();
    const orders: ShopifyOrder[] = ordersData.orders || [];

    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;

    for (const order of orders) {
      try {
        const utmSource = order.note_attributes?.find((attr: any) => attr.name === "utm_source")?.value || null;
        const utmMedium = order.note_attributes?.find((attr: any) => attr.name === "utm_medium")?.value || null;
        const utmCampaign = order.note_attributes?.find((attr: any) => attr.name === "utm_campaign")?.value || null;

        const discountCode = order.discount_codes && order.discount_codes.length > 0
          ? order.discount_codes[0].code
          : null;

        const { data: existing } = await supabase
          .from("shopify_orders")
          .select("id")
          .eq("workspace_id", workspace_id)
          .eq("shopify_order_id", order.id.toString())
          .maybeSingle();

        const orderData = {
          workspace_id: workspace_id,
          shopify_order_id: order.id.toString(),
          order_number: order.order_number.toString(),
          email: order.email,
          total_price: parseFloat(order.total_price),
          subtotal_price: parseFloat(order.subtotal_price),
          currency: order.currency,
          financial_status: order.financial_status,
          fulfillment_status: order.fulfillment_status,
          discount_code: discountCode,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          landing_site: order.landing_site,
          referring_site: order.referring_site,
          customer_data: order.customer || {},
          line_items: order.line_items || [],
          order_created_at: order.created_at,
          synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (existing) {
          await supabase
            .from("shopify_orders")
            .update(orderData)
            .eq("id", existing.id);
          recordsUpdated++;
        } else {
          await supabase
            .from("shopify_orders")
            .insert(orderData);
          recordsCreated++;
        }

        recordsProcessed++;
      } catch (orderError) {
        console.error(`Error processing order ${order.id}:`, orderError);
        recordsFailed++;
      }
    }

    const duration = Date.now() - startTime;

    await supabase
      .from("integration_sync_logs")
      .update({
        status: "completed",
        records_processed: recordsProcessed,
        records_created: recordsCreated,
        records_updated: recordsUpdated,
        records_failed: recordsFailed,
        completed_at: new Date().toISOString(),
        duration_ms: duration,
      })
      .eq("id", logId);

    await supabase
      .from("platform_integrations")
      .update({
        last_sync_at: new Date().toISOString(),
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", integration.id);

    return new Response(
      JSON.stringify({
        success: true,
        records_processed: recordsProcessed,
        records_created: recordsCreated,
        records_updated: recordsUpdated,
        records_failed: recordsFailed,
        duration_ms: duration,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in shopify-sync-data:", error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
