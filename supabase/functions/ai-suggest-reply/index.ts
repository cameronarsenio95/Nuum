import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const KNOWLEDGE_BASE = `
# NUUM - Complete Creator Management Platform Guide

## About NUUM
NUUM is the ultimate all-in-one creator management platform designed specifically for brands and agencies to streamline their influencer marketing and UGC (User Generated Content) campaigns. We help you manage everything from creator discovery to campaign analytics in one centralized system.

## Core Platform Features

### 1. Dashboard & Overview
- Real-time workspace metrics at a glance
- Quick access to recent campaigns and creators
- Activity feed showing team actions
- Performance charts for revenue, engagement, and growth
- Quick links to all major sections

### 2. Campaign Management
**How to Create a Campaign:**
1. Navigate to "Campaigns" in the sidebar
2. Click "New Campaign" button
3. Fill in campaign details:
   - Campaign name (required)
   - Description
   - Start and end dates
   - Budget (optional)
   - Goals and KPIs
   - Platform (Instagram, TikTok, YouTube, etc.)
4. Click "Create Campaign"

**Campaign Features:**
- Track multiple campaigns simultaneously
- Real-time performance analytics per campaign
- Assign creators to campaigns
- Upload and organize campaign content
- Monitor campaign revenue and ROI
- Set campaign status (Draft, Active, Completed)
- Track campaign tasks and deadlines
- Export campaign reports

**Campaign Analytics:**
- Total spend vs. budget
- Revenue generated
- ROI calculations
- Engagement metrics (likes, comments, shares)
- Reach and impressions
- Creator performance within campaign
- Content performance breakdown

### 3. Creator Management
**How to Add a Creator:**
1. Go to "Creators" section
2. Click "Add Creator" button
3. Enter creator information:
   - Full name (required)
   - Email address
   - Phone number
   - Social media handles (Instagram, TikTok, YouTube)
   - Location/timezone
   - Niche/category
   - Follower counts per platform
   - Rate/pricing information
   - Notes
4. Click "Save Creator"

**Creator Features:**
- Centralized creator database
- Track creator performance across campaigns
- Store contact information and social profiles
- Add custom notes and tags
- View creator history and past campaigns
- Track payments and invoices
- Rate and review creators
- Search and filter creators by category, location, followers, etc.

**Creator Profile Information:**
- Basic contact details
- Social media statistics (followers, engagement rate)
- Past campaign performance
- Content examples
- Availability status
- Preferred communication method
- Payment terms

### 4. Ad Sets Management
**What are Ad Sets?**
Ad sets allow you to organize your paid advertising campaigns alongside creator campaigns for complete performance tracking.

**Creating Ad Sets:**
1. Navigate to "Ad Sets"
2. Click "Create Ad Set"
3. Link to a campaign (optional)
4. Set budget and schedule
5. Track spend and revenue
6. Monitor ROAS (Return on Ad Spend)

**Ad Set Features:**
- Budget tracking and alerts
- Revenue attribution
- ROAS calculations
- Integration with campaign metrics
- Daily spend monitoring

### 5. Content Library
**How to Upload Content:**
1. Go to "Content" section
2. Click "Upload Media"
3. Select files or drag and drop
4. Supported formats: JPG, PNG, MP4, MOV, GIF
5. Add metadata:
   - Title
   - Campaign association
   - Creator attribution
   - Platform
   - Tags
   - Rights status
6. Click "Upload"

**Content Management:**
- Centralized UGC content storage
- Organize by campaign, creator, or platform
- Content rights management (Usage rights tracking)
- Media preview and playback
- Download original files
- Share content with team
- Content approval workflows
- Search and filter by tags

**Content Rights:**
- Track usage rights per content piece
- Set expiration dates
- Define usage territories
- Specify allowed platforms
- Archive expired content

### 6. Tasks & Project Management
**Creating Tasks:**
1. Navigate to "Tasks"
2. Click "New Task"
3. Set task details:
   - Task title and description
   - Assign to team member
   - Set due date
   - Add priority (Low, Medium, High, Urgent)
   - Link to campaign or creator
   - Add labels/tags
4. Click "Create Task"

**Task Features:**
- Kanban-style board view
- List view with sorting and filtering
- Due date reminders
- Task comments and updates
- File attachments
- Progress tracking
- Automated notifications

### 7. Notions (Notes & Documentation)
**How to Create Notes:**
1. Go to "Notions" section
2. Click "New Note"
3. Enter note title
4. Write content (supports rich text formatting)
5. Link to campaigns or creators (optional)
6. Add tags for organization
7. Click "Save"

**Notes Features:**
- Rich text editor
- Organize by tags and categories
- Link notes to specific campaigns or creators
- Search through all notes
- Share notes with team members
- Version history

### 8. Team Collaboration
**How to Invite Team Members:**
1. Navigate to "Team" section
2. Click "Invite Member"
3. Enter email address
4. Select role:
   - Admin (full access)
   - Manager (edit campaigns and creators)
   - Viewer (read-only access)
5. Click "Send Invitation"

**Team Features:**
- Role-based access control
- Activity tracking
- Collaborative workspaces
- Shared notes and tasks
- Team member permissions
- Remove or update member roles

### 9. Settings & Customization
**Available Settings:**
- Profile information
- Email preferences
- Notification settings
- Theme (Light/Dark mode)
- Workspace name and details
- Billing and subscription
- API access (Enterprise)
- Integrations

**How to Change Theme:**
1. Click your profile icon
2. Toggle the theme switch
3. Choose Light or Dark mode

### 10. Product Intelligence (Advanced Analytics)
**Features:**
- Cross-campaign insights
- Trend analysis
- Predictive analytics
- Creator performance patterns
- ROI forecasting
- Market benchmarking
- Competitive analysis

### 11. Linear MCP (Project Management Integration)
**Features:**
- Integration with Linear for issue tracking
- Sync tasks with Linear issues
- Track development requests
- Bug reporting workflow
- Feature request management

## Pricing Plans & Limits

### Free Trial (14 days)
- Full platform access
- Up to 5 creators
- 3 active campaigns
- 1 GB storage
- 2 team members
- Basic analytics
- Email support

### Starter Plan ($49/month)
- 25 creators
- 10 active campaigns
- 10 GB storage
- 5 team members
- Basic analytics
- Email support
- Content library
- Task management

### Pro Plan ($149/month)
- 100 creators
- Unlimited campaigns
- 50 GB storage
- 15 team members
- Advanced analytics
- Priority email support
- Content rights management
- Custom reports
- API access
- Integration support

### Enterprise Plan (Custom pricing)
- Unlimited creators
- Unlimited campaigns
- Unlimited storage
- Unlimited team members
- Custom integrations
- Dedicated account manager
- White-label options
- SLA guarantees
- Phone support
- Custom training
- Advanced security features

## Common How-To Questions

### "How do I add a creator?"
1. Go to the "Creators" section from the sidebar
2. Click the "Add Creator" button
3. Fill in the creator's name, email, and social media handles
4. Add any additional information like rates or notes
5. Click "Save Creator"

### "How do I create a campaign?"
1. Navigate to "Campaigns" in the sidebar
2. Click "New Campaign"
3. Enter campaign name, dates, and budget
4. Assign creators to the campaign
5. Click "Create Campaign"
6. You can now track performance and upload content

### "How do I upload content?"
1. Go to "Content" section
2. Click "Upload Media"
3. Drag and drop files or click to browse
4. Add campaign and creator information
5. Click "Upload"

### "How do I invite team members?"
1. Go to "Team" section
2. Click "Invite Member"
3. Enter their email and select role
4. They'll receive an invitation email

### "How do I track campaign ROI?"
1. Open your campaign from the "Campaigns" section
2. The analytics section shows:
   - Total spend
   - Revenue generated
   - ROI percentage
   - Engagement metrics
3. You can export detailed reports

### "How do I upgrade my plan?"
1. Go to "Settings" > "Billing"
2. Click "Upgrade Plan"
3. Select your desired plan
4. Enter payment information
5. Changes take effect immediately

### "How do I manage content rights?"
1. Open content in the "Content" section
2. Click on the content item
3. Go to "Rights Management" tab
4. Set usage rights, expiration dates, and allowed platforms
5. Save changes

## Technical Support & Troubleshooting

### Login & Account Issues
**Can't log in?**
- Verify your email address is correct
- Try resetting your password
- Clear browser cache and cookies
- Try incognito/private browsing mode
- Check if your account email is verified
- Contact support if issues persist

**Password reset:**
1. Go to login page
2. Click "Forgot Password"
3. Enter your email
4. Check email for reset link
5. Create new password

### Campaign Issues
**Campaign not saving?**
- Ensure all required fields are filled
- Check you haven't exceeded plan limits
- Verify you have proper permissions
- Try refreshing the page
- Contact support if error persists

**Can't see campaign metrics?**
- Make sure campaign is set to "Active"
- Check that creators and content are assigned
- Analytics update in real-time but may take a few seconds
- Verify your plan includes analytics features

### Creator Management Issues
**Reached creator limit?**
- Check your current plan limits
- Upgrade to add more creators
- Archive inactive creators to free up slots
- Contact sales for custom limits

**Can't add creator social profiles?**
- Ensure URLs are complete and valid
- Check format: https://instagram.com/username
- Verify you have edit permissions
- Try refreshing the page

### Content Upload Issues
**Upload failing?**
- Check file size (max 100MB per file)
- Verify file format is supported (JPG, PNG, MP4, MOV)
- Check storage limit for your plan
- Try smaller file or compress video
- Clear browser cache
- Check internet connection

**Storage full?**
- Review and delete unused content
- Upgrade plan for more storage
- Download and archive old campaign content
- Contact support for assistance

### Team & Permissions Issues
**Team member can't access features?**
- Check their role permissions
- Admins have full access
- Managers can edit campaigns and creators
- Viewers have read-only access
- Update role in Team settings if needed

**Invitation not received?**
- Check spam/junk folder
- Verify email address is correct
- Try resending invitation
- Contact support if still not received

### Integration Issues
**Social media not connecting?**
- Instagram integration: Available on Pro+ plans
- TikTok integration: Currently in beta, contact support
- YouTube integration: Coming soon
- Ensure you have proper OAuth permissions
- Try disconnecting and reconnecting

### Billing Issues
**Payment failed?**
- Verify card details are current
- Check with your bank for declined transactions
- Try different payment method
- Contact billing support

**Want to cancel?**
- Go to Settings > Billing
- Click "Cancel Subscription"
- Data remains accessible for 30 days
- No refunds for partial months
- Export your data before cancellation

## Best Practices & Tips

### Campaign Success Tips
1. Set clear, measurable objectives before starting
2. Define KPIs upfront (engagement rate, conversions, etc.)
3. Brief creators thoroughly with guidelines
4. Maintain regular communication
5. Track content rights and usage carefully
6. Review analytics weekly and adjust strategy
7. Document learnings in Notions
8. Export reports for stakeholders

### Creator Management Tips
1. Keep creator profiles updated with latest stats
2. Tag creators by niche, performance tier, rates
3. Add detailed notes after each interaction
4. Track payment status and invoices
5. Rate creators after each campaign
6. Build long-term relationships with top performers
7. Respond to creator messages promptly
8. Provide clear, detailed briefs

### Content Organization Tips
1. Use consistent naming conventions
2. Tag content by campaign, creator, and platform
3. Set content rights immediately upon upload
4. Archive old campaign content regularly
5. Create approval workflows for brand safety
6. Download backup copies of key content
7. Use folders or tags to organize by quarter/season

### Team Collaboration Tips
1. Assign clear task ownership
2. Use due dates and priorities effectively
3. Add team members to relevant campaigns only
4. Document processes in Notions
5. Hold regular sync meetings
6. Use comments for asynchronous communication
7. Leverage role permissions appropriately
8. Keep workspace organized and clean

### Maximizing ROI Tips
1. Track all campaign costs accurately
2. Monitor ad spend in Ad Sets
3. Calculate creator ROI individually
4. Compare performance across platforms
5. Use Product Intelligence for insights
6. A/B test different creator types
7. Focus budget on best performers
8. Review and optimize quarterly

## Contact & Support

### Support Channels
- **Email Support:** support@nuum.com (24-48 hour response)
- **Priority Support:** Available on Pro+ plans (12 hour response)
- **Sales Inquiries:** sales@nuum.com
- **Technical Documentation:** docs.nuum.com
- **Status Page:** status.nuum.com
- **Feature Requests:** Submit via in-app contact form

### Support Response Times
- Starter Plan: 24-48 hours via email
- Pro Plan: 12-24 hours via email (priority queue)
- Enterprise Plan: 4-8 hours via email + phone support

### What to Include in Support Requests
1. Detailed description of the issue
2. Steps to reproduce (if applicable)
3. Screenshots or screen recordings
4. Browser and device information
5. Your workspace name
6. When the issue started
7. Any error messages received

## Security & Data

### Data Security
- 256-bit SSL encryption
- SOC 2 Type II certified
- GDPR compliant
- Regular security audits
- Data backup every 6 hours
- 99.9% uptime SLA (Enterprise)

### Data Export
- Export creator database as CSV
- Export campaign reports as PDF/Excel
- Download all content files
- API access for custom integrations (Pro+)

### Data Retention
- Active accounts: Indefinite storage
- After cancellation: 30 days
- After 30 days: Permanent deletion
- Export your data before cancelling

## Keyboard Shortcuts
- Ctrl/Cmd + K: Quick search
- Ctrl/Cmd + N: New campaign/creator
- Ctrl/Cmd + S: Save
- Ctrl/Cmd + /: Show shortcuts

## Mobile Access
- Responsive web design works on mobile
- Native mobile apps coming Q2 2026
- Current recommendation: Use tablet or desktop for best experience
`;

interface SuggestReplyRequest {
  ticketSubject: string;
  ticketMessage: string;
  conversationHistory?: Array<{
    author: string;
    message: string;
    timestamp: string;
  }>;
  supportStaffName?: string;
}

function generateFallbackResponse(subject: string, message: string, staffName: string, conversationHistory?: Array<{author: string; message: string; timestamp: string}>): string {
  const combined = `${subject} ${message}`.toLowerCase();

  const hasConversationHistory = conversationHistory && conversationHistory.length > 0;

  if (hasConversationHistory) {
    const lastCustomerMessage = conversationHistory.filter(msg => !msg.author.includes('Support')).pop();
    const previousContext = conversationHistory.map(msg => msg.message.toLowerCase()).join(' ');

    if (combined.includes('save') || combined.includes('content') || combined.includes('standard plan')) {
      if (previousContext.includes('creator') || previousContext.includes('add')) {
        return `Absolutely! With any plan you can save your content. Here's how it works:\n\n**Saving Content:**\nOnce you've added creators to your system, you can upload and organize their content in the "Content" section. All plans include content storage:\n\n- **Free Trial:** 1 GB storage\n- **Starter ($49/mo):** 10 GB storage\n- **Pro ($149/mo):** 50 GB storage\n- **Enterprise:** Unlimited storage\n\n**To upload content:**\n1. Go to "Content" section in the sidebar\n2. Click "Upload Media"\n3. Select your files (JPG, PNG, MP4, MOV, GIF)\n4. Tag it with the campaign and creator\n5. Add rights information (when content can be used)\n6. Click "Upload"\n\nYour content is automatically saved and you can access it anytime! You can also link content directly to creators and campaigns for easy organization.\n\nNeed help with anything else?\n\nBest regards,\n${staffName}`;
      }
    }

    return `Hey! Thanks for following up.\n\nBased on what we were just discussing, I'd be happy to help with that. Could you give me a bit more detail about what you'd like to do? For example:\n\n- Are you asking about a specific feature?\n- Do you need help with something you tried?\n- Is there an error or issue you're running into?\n\nJust let me know and I'll guide you through it step by step!\n\nBest regards,\n${staffName}`;
  }

  if (combined.includes('add') && (combined.includes('creator') || combined.includes('influencer'))) {
    return `Hey there!\n\nGreat question! Adding creators is super easy. Here's how:\n\n1. Go to the "Creators" section in the left sidebar\n2. Click "Add Creator" at the top right\n3. Fill in their info:\n   - Name (required)\n   - Email\n   - Social handles (Instagram, TikTok, YouTube)\n   - Location, niche, follower counts\n   - Rates and any notes\n4. Hit "Save Creator"\n\nThat's it! The creator will show up in your database where you can track their performance and assign them to campaigns.\n\n**Quick tip:** You can add up to 5 creators on Free Trial, 25 on Starter, or 100 on Pro. Need more? Enterprise gives you unlimited!\n\nLet me know if you need anything else!\n\nBest regards,\n${staffName}`;
  }

  if (combined.includes('create') && combined.includes('campaign')) {
    return `Hey!\n\nLet's get that campaign set up! Here's what you do:\n\n1. Go to "Campaigns" in the sidebar\n2. Click "New Campaign"\n3. Fill in the details:\n   - Campaign name (required)\n   - Description\n   - Dates and budget\n   - Goals and platform (IG, TikTok, YouTube, etc.)\n4. Hit "Create Campaign"\n\nOnce it's created, you can assign creators, upload content, and track all your analytics and ROI in real-time!\n\n**Plan limits:**\n- Free Trial: 3 campaigns\n- Starter: 10 campaigns\n- Pro: Unlimited\n\nNeed help with strategy or anything else? Just ask!\n\nBest regards,\n${staffName}`;
  }

  if (combined.includes('upload') && (combined.includes('content') || combined.includes('media') || combined.includes('video') || combined.includes('image'))) {
    return `Hi there!\n\nHere's how to upload content to your NUUM library:\n\n1. Go to the "Content" section in the left sidebar\n2. Click the "Upload Media" button\n3. Drag and drop files or click to browse\n4. Supported formats: JPG, PNG, MP4, MOV, GIF\n5. Add metadata for each file:\n   - Title\n   - Campaign association\n   - Creator attribution\n   - Platform\n   - Tags for easy searching\n   - Rights status (important for tracking usage rights!)\n6. Click "Upload"\n\n**Storage limits:**\n- Free Trial: 1 GB\n- Starter: 10 GB\n- Pro: 50 GB\n- Enterprise: Unlimited\n\n**File size limit:** 100MB per file\n\n**Troubleshooting tips:**\n- If upload fails, check your file size and format\n- Make sure you haven't exceeded your plan's storage limit\n- Try compressing large video files\n- Clear browser cache if issues persist\n\nYour content will be organized in the centralized library where you can preview, download, share with team members, and manage usage rights.\n\nNeed help with anything else?\n\nBest regards,\n${staffName}`;
  }

  return `Hey there!\n\nThanks for reaching out about: "${subject}"\n\nHere are some quick links that might help:\n\n**Main Features:**\n- **Creators:** Manage your creator database\n- **Campaigns:** Track all your campaigns\n- **Content:** Store and organize UGC\n- **Team:** Invite team members\n- **Analytics:** Monitor ROI and performance\n\n**Quick How-Tos:**\n1. Add creators: Creators → Add Creator\n2. Create campaigns: Campaigns → New Campaign\n3. Upload content: Content → Upload Media\n4. Invite team: Team → Invite Member\n5. Track ROI: Open any campaign\n\n**Plans:**\n- Free Trial: 5 creators, 3 campaigns, 1GB\n- Starter ($49/mo): 25 creators, 10 campaigns, 10GB\n- Pro ($149/mo): 100 creators, unlimited campaigns, 50GB\n- Enterprise: Unlimited everything\n\nCan you give me a bit more detail about what you're trying to do? I'll help you out!\n\nBest regards,\n${staffName}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { ticketSubject, ticketMessage, conversationHistory, supportStaffName }: SuggestReplyRequest = await req.json();

    let conversationContext = "";
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = "\n\nPrevious conversation:\n" + conversationHistory.map(msg =>
        `${msg.author} (${msg.timestamp}): ${msg.message}`
      ).join("\n");
    }

    const prompt = `You are an expert customer support agent for NUUM, the leading creator management platform for brands and agencies.

KNOWLEDGE BASE:
${KNOWLEDGE_BASE}

CUSTOMER INQUIRY:
Subject: ${ticketSubject}
Message: ${ticketMessage}
${conversationContext}

YOUR TASK:
Provide a helpful, accurate, and professional response to the customer's question based ONLY on the knowledge base above.

RESPONSE GUIDELINES:

1. **Be Direct & Specific**
   - Answer the exact question asked
   - Provide step-by-step instructions when relevant
   - Reference specific features and sections by name
   - Include exact button names and navigation paths

2. **Use the Knowledge Base**
   - Draw information ONLY from the provided knowledge base
   - If the customer asks "how do I..." check the "Common How-To Questions" section first
   - Reference troubleshooting guides for technical issues
   - Mention relevant features, pricing limits, or best practices

3. **Format for Clarity**
   - Use numbered steps for how-to instructions
   - Use bullet points for multiple options or features
   - Keep paragraphs short (2-3 sentences)
   - Use clear section breaks

4. **Tone & Style - VERY IMPORTANT**
   - Be SUPER INFORMAL like texting a friend
   - Use casual language: "Hey!", "Yep!", "Sure thing!", "No problem!"
   - Keep it SHORT and friendly, not corporate
   - Use contractions: "you're", "that's", "it's", "we'll"
   - If there's conversation history, acknowledge what was discussed before
   - Act like you're continuing a natural conversation

5. **Conversation Flow**
   - If there's conversation history, reference it casually: "So about that..." or "Following up..."
   - Answer follow-up questions VERY briefly (1-2 sentences!)
   - Use natural transitions: "Yep!", "Sure!", "No problem!"

6. **Structure Your Response**
   - Start with casual greeting: "Hey!"
   - Answer the question in 1-3 SHORT sentences
   - NO tips or extra info unless specifically asked
   - End simply: "Let me know if you need anything else!"
   ${supportStaffName ? `- Sign off as "${supportStaffName}"` : ""}

7. **Handle Edge Cases**
   - If feature isn't in knowledge base: "Hey! Let me check with our team on that and get back to you!"
   - If question is unclear: "Could you tell me a bit more about what you're trying to do?"
   - If issue requires technical help: "Let me escalate this to our tech team!"

8. **Length - CRITICAL**
   - Simple questions: 1-3 sentences MAX
   - "How do I..." questions: Brief steps (3-5 lines)
   - Follow-up questions: 1-2 sentences ONLY
   - NO long explanations or paragraphs

Now generate your response:`;

    let openaiApiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("Open_AI");

    console.log("Checking for OpenAI API key...");
    console.log("OPENAI_API_KEY exists:", !!Deno.env.get("OPENAI_API_KEY"));
    console.log("Open_AI exists:", !!Deno.env.get("Open_AI"));

    if (!openaiApiKey) {
      console.warn("No OpenAI API key found, using fallback response");
      const fallbackResponse = generateFallbackResponse(ticketSubject, ticketMessage, supportStaffName || 'NUUM Support Team', conversationHistory);
      return new Response(
        JSON.stringify({
          suggestion: fallbackResponse,
          model: "fallback",
          warning: "OpenAI API key not configured",
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Using OpenAI API with key (first 10 chars):", openaiApiKey.substring(0, 10));

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
            content: "You are an expert customer support agent for NUUM, a creator management platform. You have deep knowledge of all platform features, workflows, and troubleshooting. Provide accurate, step-by-step guidance based on the comprehensive knowledge base. Be professional, friendly, and solution-oriented. Always give specific, actionable instructions with exact navigation paths and button names."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", openaiResponse.status, errorText);

      const fallbackResponse = generateFallbackResponse(ticketSubject, ticketMessage, supportStaffName || 'NUUM Support Team', conversationHistory);
      return new Response(
        JSON.stringify({
          suggestion: fallbackResponse,
          model: "fallback",
          warning: `OpenAI API error: ${openaiResponse.status}`,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    const suggestedReply = openaiData.choices[0].message.content;
    console.log("Successfully generated OpenAI response");

    return new Response(
      JSON.stringify({
        suggestion: suggestedReply,
        model: "gpt-4o-mini",
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error generating AI suggestion:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate suggestion",
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});