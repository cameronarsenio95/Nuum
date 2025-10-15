import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    const stateParam = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      console.error("OAuth error:", error);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          "Location": `${url.origin}/dashboard?error=oauth_denied`,
        },
      });
    }

    if (!code || !stateParam) {
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          "Location": `${url.origin}/dashboard?error=invalid_callback`,
        },
      });
    }

    const state = JSON.parse(atob(stateParam));
    const { workspace_id, redirect_uri } = state;

    const metaClientId = Deno.env.get("META_CLIENT_ID");
    const metaClientSecret = Deno.env.get("META_CLIENT_SECRET");

    if (!metaClientId || !metaClientSecret) {
      throw new Error("META credentials not configured");
    }

    const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", metaClientId);
    tokenUrl.searchParams.set("client_secret", metaClientSecret);
    tokenUrl.searchParams.set("redirect_uri", `${url.origin}/functions/v1/meta-oauth-callback`);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          "Location": `${redirect_uri}?error=token_exchange_failed`,
        },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase
      .from("platform_integrations")
      .upsert({
        workspace_id,
        platform: "meta",
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        token_expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
        status: "active",
        last_sync_at: new Date().toISOString(),
      }, {
        onConflict: "workspace_id,platform",
      });

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          "Location": `${redirect_uri}?error=database_error`,
        },
      });
    }

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": `${redirect_uri}?integration=meta&status=success`,
      },
    });
  } catch (error) {
    console.error("Error in meta-oauth-callback:", error);
    const url = new URL(req.url);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": `${url.origin}/dashboard?error=unexpected_error`,
      },
    });
  }
});