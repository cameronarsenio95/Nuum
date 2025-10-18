import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  template_slug: string;
  recipient_email: string;
  recipient_name?: string;
  workspace_id?: string;
  user_id?: string;
  variables: Record<string, string>;
  priority?: number;
  scheduled_for?: string;
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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const emailRequest: EmailRequest = await req.json();

    // Get email template
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("slug", emailRequest.template_slug)
      .eq("is_active", true)
      .maybeSingle();

    if (templateError || !template) {
      throw new Error(`Template not found: ${emailRequest.template_slug}`);
    }

    // Check if user has opted out
    if (emailRequest.user_id) {
      const { data: prefs } = await supabase
        .from("email_preferences")
        .select("*")
        .eq("user_id", emailRequest.user_id)
        .maybeSingle();

      if (prefs?.unsubscribed_at) {
        console.log(`User ${emailRequest.user_id} has unsubscribed`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "User has unsubscribed" 
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Check category-specific preferences
      const categoryPreferenceMap: Record<string, string> = {
        'authentication': 'transactional_enabled',
        'billing': 'transactional_enabled',
        'security': 'security_alerts_enabled',
        'marketing': 'marketing_enabled',
        'support': 'support_ticket_created',
        'campaign': 'campaign_started',
        'team': 'team_invitation',
      };

      const prefKey = categoryPreferenceMap[template.category];
      if (prefKey && prefs && prefs[prefKey] === false) {
        console.log(`User has disabled ${template.category} emails`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "User has disabled this email category" 
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Check quiet hours
      if (prefs?.quiet_hours_enabled) {
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: prefs.quiet_hours_timezone || 'UTC'
        });
        const start = prefs.quiet_hours_start || '22:00';
        const end = prefs.quiet_hours_end || '08:00';
        
        if (currentTime >= start || currentTime <= end) {
          console.log(`Quiet hours active for user ${emailRequest.user_id}`);
          // Schedule for later instead of sending now
          emailRequest.scheduled_for = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString();
        }
      }
    }

    // Replace variables in template
    let htmlBody = template.html_body;
    let plainTextBody = template.plain_text_body;
    let subject = template.subject;

    Object.entries(emailRequest.variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      htmlBody = htmlBody.replaceAll(placeholder, value || '');
      plainTextBody = plainTextBody.replaceAll(placeholder, value || '');
      subject = subject.replaceAll(placeholder, value || '');
    });

    // If scheduled or no Resend key, add to queue
    if (emailRequest.scheduled_for || !resendApiKey) {
      const { data: queueEntry, error: queueError } = await supabase
        .from("email_queue")
        .insert({
          template_id: template.id,
          workspace_id: emailRequest.workspace_id,
          user_id: emailRequest.user_id,
          recipient_email: emailRequest.recipient_email,
          recipient_name: emailRequest.recipient_name,
          subject,
          html_body: htmlBody,
          plain_text_body: plainTextBody,
          priority: emailRequest.priority || 5,
          scheduled_for: emailRequest.scheduled_for || new Date().toISOString(),
          metadata: emailRequest.variables,
        })
        .select()
        .single();

      if (queueError) throw queueError;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email queued", 
          queue_id: queueEntry.id 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send immediately via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NUUM <noreply@nuum.site>",
        to: [emailRequest.recipient_email],
        subject,
        html: htmlBody,
        text: plainTextBody,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error("Resend API error:", errorData);
      
      // Queue for retry
      await supabase.from("email_queue").insert({
        template_id: template.id,
        workspace_id: emailRequest.workspace_id,
        user_id: emailRequest.user_id,
        recipient_email: emailRequest.recipient_email,
        recipient_name: emailRequest.recipient_name,
        subject,
        html_body: htmlBody,
        plain_text_body: plainTextBody,
        priority: emailRequest.priority || 5,
        status: 'pending',
        error_message: `Resend error: ${errorData}`,
        metadata: emailRequest.variables,
      });

      throw new Error(`Resend API error: ${errorData}`);
    }

    const resendData = await resendResponse.json();

    // Log successful send
    const { data: notification } = await supabase
      .from("email_notifications")
      .insert({
        template_id: template.id,
        workspace_id: emailRequest.workspace_id,
        user_id: emailRequest.user_id,
        recipient_email: emailRequest.recipient_email,
        recipient_name: emailRequest.recipient_name,
        subject,
        html_body: htmlBody,
        plain_text_body: plainTextBody,
        status: 'sent',
        resend_message_id: resendData.id,
        metadata: emailRequest.variables,
      })
      .select()
      .single();

    // Log to email_logs
    await supabase.from("email_logs").insert({
      email_notification_id: notification?.id,
      action: 'sent',
      workspace_id: emailRequest.workspace_id,
      user_id: emailRequest.user_id,
      recipient_email: emailRequest.recipient_email,
      metadata: { resend_message_id: resendData.id },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        message_id: resendData.id,
        notification_id: notification?.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send email",
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});