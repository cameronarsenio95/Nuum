import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, svix-id, svix-timestamp, svix-signature",
};

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: ResendWebhookEvent = await req.json();
    
    console.log("Resend webhook received:", payload.type, payload.data.email_id);

    // Find the notification by resend_message_id
    const { data: notification, error: notificationError } = await supabase
      .from("email_notifications")
      .select("*")
      .eq("resend_message_id", payload.data.email_id)
      .maybeSingle();

    if (notificationError || !notification) {
      console.log("Notification not found for message:", payload.data.email_id);
      return new Response(
        JSON.stringify({ success: true, message: "Notification not found" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Map Resend event types to our status
    const statusMap: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.delivery_delayed': 'sent',
      'email.complained': 'bounced',
      'email.bounced': 'bounced',
      'email.opened': 'opened',
      'email.clicked': 'clicked',
    };

    const newStatus = statusMap[payload.type] || notification.status;
    const updates: any = { status: newStatus };

    // Set timestamps based on event type
    if (payload.type === 'email.delivered') {
      updates.delivered_at = payload.created_at;
    } else if (payload.type === 'email.opened') {
      updates.opened_at = payload.created_at;
    } else if (payload.type === 'email.clicked') {
      updates.clicked_at = payload.created_at;
    } else if (payload.type === 'email.bounced' || payload.type === 'email.complained') {
      updates.failed_at = payload.created_at;
    }

    // Update notification
    await supabase
      .from("email_notifications")
      .update(updates)
      .eq("id", notification.id);

    // Log the event
    await supabase.from("email_logs").insert({
      email_notification_id: notification.id,
      action: payload.type.replace('email.', ''),
      workspace_id: notification.workspace_id,
      user_id: notification.user_id,
      recipient_email: notification.recipient_email,
      metadata: {
        resend_event: payload.type,
        resend_message_id: payload.data.email_id,
        timestamp: payload.created_at,
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Webhook processed successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error processing Resend webhook:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process webhook",
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});