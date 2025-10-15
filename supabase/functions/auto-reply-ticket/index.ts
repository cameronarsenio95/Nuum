import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const KNOWLEDGE_BASE = `
# NUUM Platform Quick Reference

**Tagline:** All your creator data. One system.

## PRICING
- **Trial:** €0 (7 days, no card needed) - 25 creators, 5GB, 3 team members
- **Standard:** €49/mo - 1 workspace, 25 creators, 5GB, 3 team members
- **Elite:** €99/mo (Popular) - 3 workspaces, 50 creators, 25GB, 5 team members
- **Enterprise:** Custom - Unlimited everything

## KEY FEATURES
1. **Creator Profiles** - Database with stats, contacts, performance tracking
2. **Campaign Analytics** - Real-time ROI, engagement, revenue tracking
3. **UGC Library** - Content storage with rights management (JPG, PNG, MP4, MOV, GIF, max 100MB)
4. **Team Collaboration** - Role-based access, shared tasks and notes
5. **Ad Sets** - Track paid ad spend and ROAS

## QUICK ACTIONS
- Add Creator: Creators → Add Creator → Fill name, email, socials → Save
- Create Campaign: Campaigns → New Campaign → Add name, dates → Create
- Upload Content: Content → Upload Media → Drag files → Tag → Upload
- Invite Team: Team → Invite Member → Email + role → Send
- Upgrade: Settings → Billing → Select plan → Enter payment

## METRICS DASHBOARD
- Active Creators, Campaigns, Content pieces, Total Revenue
- Top performers with revenue breakdown
- 7-day content performance graphs
- Recent campaigns overview

## SUPPORT
- Email: support@nuum.com
- Standard: 24-48h | Elite: 12-24h | Enterprise: 4-8h
- 7-day trial, no credit card, upgrade anytime
- GDPR compliant, encrypted, 99.9% uptime (Enterprise)
`;

interface WebhookPayload {
  type: string;
  table: string;
  record: any;
  schema: string;
  old_record: any;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: WebhookPayload = await req.json();

    if (payload.type !== "INSERT" || payload.table !== "support_tickets") {
      return new Response(JSON.stringify({ message: "Not a new ticket" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ticket = payload.record;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const prompt = `You are a friendly, casual customer support agent for NUUM, a creator management platform.

KNOWLEDGE BASE:
${KNOWLEDGE_BASE}

CUSTOMER TICKET:
Subject: ${ticket.subject}
Message: ${ticket.message}

YOUR TASK:
Answer the customer's question in a VERY SHORT, CASUAL, and FRIENDLY way.

CRITICAL RULES:
1. **BE SUPER BRIEF** - Maximum 2-3 SHORT sentences for simple questions
2. **BE INFORMAL** - Like texting a friend: "Hey!", "Yep!", "Sure thing!", "No problem!"
3. **NO long explanations** - Just answer the question directly
4. **NO numbered lists** unless specifically asked "how do I..."
5. **Use emojis sparingly** - One emoji max per response
6. **Answer ONLY what was asked** - Don't add extra information unless needed

EXAMPLES:

Question: "How much storage do I get?"
Good: "Hey! The Standard Plan gives you 10 GB of storage 👍"
Bad: "Hello! Thank you for asking. With the Standard Plan, you receive 10 GB of storage for your content..."

Question: "Can I add creators?"
Good: "Yep! Just go to Creators → Add Creator. Easy!"
Bad: "Certainly! To add creators to your workspace, you'll need to navigate to..."

Question: "What's included in Pro?"
Good: "Pro gives you 100 creators, unlimited campaigns, 50 GB storage, and 15 team members!"
Bad: "The Pro Plan is our most popular tier and includes the following features..."

NOW ANSWER (keep it SHORT and CASUAL!):`;

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("Open_AI");

    console.log("🔑 OpenAI Key Check:");
    console.log("  - OPENAI_API_KEY exists:", !!Deno.env.get("OPENAI_API_KEY"));
    console.log("  - Open_AI exists:", !!Deno.env.get("Open_AI"));
    console.log("  - Using key:", openaiApiKey ? `${openaiApiKey.substring(0, 20)}...` : "NONE");

    let aiResponse = "";

    if (!openaiApiKey) {
      console.log("❌ No OpenAI key found - using fallback response");
      aiResponse = `Hey ${ticket.user_name}! Thanks for reaching out. We got your message and we'll get back to you soon! 👋`;
    } else {
      console.log("✅ OpenAI key found - calling API...");

      try {
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a casual, friendly support agent for NUUM. Be BRIEF and INFORMAL like texting a friend. Maximum 2-3 short sentences for simple questions. No long explanations."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.8,
            max_tokens: 150,
          }),
        });

        console.log("📡 OpenAI Response Status:", openaiResponse.status);

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          aiResponse = openaiData.choices[0].message.content;
          console.log("✅ OpenAI Success! Response length:", aiResponse.length);
        } else {
          const errorData = await openaiResponse.text();
          console.error("❌ OpenAI Error Response:", errorData);
          aiResponse = `Hey ${ticket.user_name}! Thanks for reaching out. We got your message and we'll get back to you soon! 👋`;
        }
      } catch (openaiError) {
        console.error("❌ OpenAI Fetch Error:", openaiError);
        aiResponse = `Hey ${ticket.user_name}! Thanks for reaching out. We got your message and we'll get back to you soon! 👋`;
      }
    }

    const { error: insertError } = await supabase
      .from("support_ticket_messages")
      .insert({
        ticket_id: ticket.id,
        author_id: null,
        author_name: "NUUM Support Team",
        author_email: "support@nuum.com",
        author_type: "support",
        message: aiResponse,
        is_internal: false,
      });

    if (insertError) {
      console.error("Error inserting AI response:", insertError);
      throw insertError;
    }

    const { error: updateError } = await supabase
      .from("support_tickets")
      .update({ status: "in_progress" })
      .eq("id", ticket.id);

    if (updateError) {
      console.error("Error updating ticket status:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "AI response sent",
        ticketId: ticket.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in auto-reply-ticket:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process ticket",
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});