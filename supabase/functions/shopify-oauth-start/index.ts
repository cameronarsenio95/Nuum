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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL(req.url);
    const workspaceId = url.searchParams.get("workspace_id");
    const redirectUri = url.searchParams.get("redirect_uri");

    if (!workspaceId || !redirectUri) {
      return new Response(
        JSON.stringify({ error: "Missing workspace_id or redirect_uri" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", workspaceId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (workspaceError || !workspace) {
      return new Response(
        JSON.stringify({ error: "Workspace not found or unauthorized" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const shopifyAppClientId = Deno.env.get("SHOPIFY_APP_CLIENT_ID");
    const shopifyCallbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/shopify-oauth-callback`;

    if (!shopifyAppClientId) {
      return new Response(
        JSON.stringify({ error: "Shopify app not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const state = btoa(JSON.stringify({ workspace_id: workspaceId, redirect_uri: redirectUri }));

    const scopes = [
      "read_orders",
      "read_products",
      "read_customers",
      "read_price_rules",
      "read_analytics",
    ].join(",");

    const shopifyStorePrompt = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Connect Shopify Store</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              background: #0a0a0a;
              color: #e6e6e7;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 10px;
            }
            p {
              color: #9ea0a5;
              margin-bottom: 20px;
            }
            input {
              width: 100%;
              padding: 12px;
              border: 1px solid #1a1b1c;
              border-radius: 8px;
              background: #161718;
              color: #e6e6e7;
              font-size: 14px;
              margin-bottom: 10px;
            }
            button {
              width: 100%;
              padding: 12px;
              background: white;
              color: black;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              margin-bottom: 10px;
            }
            button:hover {
              background: #f0f0f0;
            }
            .note {
              font-size: 12px;
              color: #6c6e73;
              margin-top: 15px;
            }
            .info-box {
              background: #161718;
              border: 1px solid #1a1b1c;
              border-radius: 8px;
              padding: 15px;
              margin-top: 20px;
              display: none;
            }
            .info-box h2 {
              font-size: 16px;
              margin-bottom: 10px;
              color: #e6e6e7;
            }
            .info-box pre {
              background: #0a0a0a;
              padding: 10px;
              border-radius: 4px;
              overflow-x: auto;
              font-size: 12px;
              color: #3b82f6;
              word-break: break-all;
              white-space: pre-wrap;
            }
            .copy-btn {
              background: #3b82f6;
              color: white;
              padding: 8px 12px;
              font-size: 12px;
              margin-top: 10px;
            }
            .copy-btn:hover {
              background: #2563eb;
            }
          </style>
        </head>
        <body>
          <h1>Connect Your Shopify Store</h1>
          <p>Enter your Shopify store URL to connect</p>
          <form id="shopifyForm">
            <input
              type="text"
              id="shopDomain"
              placeholder="mystore.myshopify.com"
              required
            />
            <button type="button" onclick="showRedirectUri()">Show Redirect URI (for Shopify App setup)</button>
            <button type="submit">Continue to Shopify</button>
          </form>
          <div class="note">
            You'll be redirected to Shopify to authorize NUUM to access your store data.
          </div>

          <div id="infoBox" class="info-box">
            <h2>Redirect URI for Shopify App</h2>
            <p style="color: #9ea0a5; font-size: 13px;">Copy this URL and add it to your Shopify App settings under "App setup" > "URLs" > "Allowed redirection URL(s)"</p>
            <pre id="redirectUriDisplay"></pre>
            <button class="copy-btn" onclick="copyToClipboard()">Copy to Clipboard</button>
          </div>

          <script>
            const redirectUri = '${shopifyCallbackUrl}';

            function showRedirectUri() {
              document.getElementById('infoBox').style.display = 'block';
              document.getElementById('redirectUriDisplay').textContent = redirectUri;
            }

            function copyToClipboard() {
              navigator.clipboard.writeText(redirectUri).then(() => {
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => {
                  btn.textContent = originalText;
                }, 2000);
              });
            }

            document.getElementById('shopifyForm').addEventListener('submit', function(e) {
              e.preventDefault();
              const shopDomain = document.getElementById('shopDomain').value.trim();

              if (!shopDomain) {
                alert('Please enter your Shopify store domain');
                return;
              }

              const cleanDomain = shopDomain.replace(/^https?:\\/\\//, '').replace(/\\/$/, '');
              const authUrl = \`https://\${cleanDomain}/admin/oauth/authorize?client_id=${shopifyAppClientId}&scope=${scopes}&redirect_uri=\${encodeURIComponent(redirectUri)}&state=${state}\`;

              window.location.href = authUrl;
            });
          </script>
        </body>
      </html>
    `;

    return new Response(shopifyStorePrompt, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error in shopify-oauth-start:", error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});