import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const shop = url.searchParams.get("shop");

    if (!code || !state || !shop) {
      return new Response(
        JSON.stringify({ error: "Missing OAuth parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const stateData = JSON.parse(atob(state));
    const workspaceId = stateData.workspace_id;
    const redirectUri = stateData.redirect_uri;

    const shopifyAppClientId = Deno.env.get("SHOPIFY_APP_CLIENT_ID");
    const shopifyAppClientSecret = Deno.env.get("SHOPIFY_APP_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!shopifyAppClientId || !shopifyAppClientSecret) {
      return new Response(
        JSON.stringify({ error: "Shopify app not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const tokenEndpoint = `https://${shop}/admin/oauth/access_token`;
    const tokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: shopifyAppClientId,
        client_secret: shopifyAppClientSecret,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for access token");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const scope = tokenData.scope;

    const { error: upsertError } = await supabase
      .from("platform_integrations")
      .upsert({
        workspace_id: workspaceId,
        platform: "shopify",
        status: "active",
        access_token: accessToken,
        store_url: shop,
        scopes: scope.split(","),
        metadata: {
          shop: shop,
        },
        last_sync_at: new Date().toISOString(),
        error_message: null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "workspace_id,platform",
      });

    if (upsertError) {
      console.error("Error saving integration:", upsertError);
      throw new Error("Failed to save Shopify integration");
    }

    const { error: logError } = await supabase
      .from("integration_sync_logs")
      .insert({
        workspace_id: workspaceId,
        integration_type: "shopify",
        sync_type: "manual",
        direction: "inbound",
        status: "completed",
        records_processed: 0,
        records_created: 0,
        records_updated: 0,
        records_failed: 0,
        metadata: { action: "oauth_connected" },
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: 0,
      });

    if (logError) {
      console.error("Error logging sync:", logError);
    }

    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shopify Connected</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 500px;
              margin: 50px auto;
              padding: 20px;
              background: #0a0a0a;
              color: #e6e6e7;
              text-align: center;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 10px;
              color: #3dd68c;
            }
            p {
              color: #9ea0a5;
              margin-bottom: 20px;
            }
            .success-icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="success-icon">✓</div>
          <h1>Shopify Connected Successfully!</h1>
          <p>Your Shopify store has been connected. Redirecting you back to your dashboard...</p>
          <script>
            setTimeout(() => {
              window.location.href = '${redirectUri}?view=shopify';
            }, 2000);
          </script>
        </body>
      </html>
      `,
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html",
        },
      }
    );
  } catch (error) {
    console.error("Error in shopify-oauth-callback:", error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
