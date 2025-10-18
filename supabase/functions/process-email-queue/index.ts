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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Get pending emails from queue (limit to 10 per batch)
    const { data: queuedEmails, error: queueError } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .lt("retry_count", 3)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(10);

    if (queueError) throw queueError;

    if (!queuedEmails || queuedEmails.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No emails to process" 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results = [];

    // Process each email
    for (const email of queuedEmails) {
      try {
        // Mark as processing
        await supabase
          .from("email_queue")
          .update({ status: "processing" })
          .eq("id", email.id);

        // Send via Resend
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "NUUM <noreply@nuum.site>",
            to: [email.recipient_email],
            subject: email.subject,
            html: email.html_body,
            text: email.plain_text_body,
          }),
        });

        if (!resendResponse.ok) {
          const errorData = await resendResponse.text();
          console.error(`Failed to send email ${email.id}:`, errorData);
          
          // Update retry count
          await supabase
            .from("email_queue")
            .update({ 
              status: "failed",
              retry_count: email.retry_count + 1,
              error_message: `Resend error: ${errorData}`,
            })
            .eq("id", email.id);

          results.push({ id: email.id, success: false, error: errorData });
          continue;
        }

        const resendData = await resendResponse.json();

        // Create notification record
        const { data: notification } = await supabase
          .from("email_notifications")
          .insert({
            template_id: email.template_id,
            workspace_id: email.workspace_id,
            user_id: email.user_id,
            recipient_email: email.recipient_email,
            recipient_name: email.recipient_name,
            subject: email.subject,
            html_body: email.html_body,
            plain_text_body: email.plain_text_body,
            status: 'sent',
            resend_message_id: resendData.id,
            metadata: email.metadata,
          })
          .select()
          .single();

        // Log to email_logs
        await supabase.from("email_logs").insert({
          email_notification_id: notification?.id,
          action: 'sent',
          workspace_id: email.workspace_id,
          user_id: email.user_id,
          recipient_email: email.recipient_email,
          metadata: { 
            resend_message_id: resendData.id,
            queue_id: email.id 
          },
        });

        // Mark as completed
        await supabase
          .from("email_queue")
          .update({ 
            status: "completed",
            processed_at: new Date().toISOString(),
          })
          .eq("id", email.id);

        results.push({ 
          id: email.id, 
          success: true, 
          message_id: resendData.id 
        });

        // Rate limiting: wait 100ms between emails
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error);
        
        // Update retry count
        await supabase
          .from("email_queue")
          .update({ 
            status: "failed",
            retry_count: email.retry_count + 1,
            error_message: error.message,
          })
          .eq("id", email.id);

        results.push({ id: email.id, success: false, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error processing email queue:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process email queue",
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});