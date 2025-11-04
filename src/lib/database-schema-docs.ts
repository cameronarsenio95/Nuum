/**
 * DATABASE SCHEMA DOCUMENTATION
 *
 * This file documents the expected database schema that the frontend relies on.
 * All queries assume these tables and columns exist in Supabase.
 *
 * NOTE: This is DOCUMENTATION ONLY - no actual database operations are performed here.
 * The actual schema must be maintained in Supabase via migrations.
 */

/**
 * PROFILES TABLE
 * Table: public.profiles
 * Primary Key: id (uuid, references auth.users)
 *
 * Expected Columns:
 * - id: uuid (PK, FK to auth.users.id)
 * - email: text
 * - full_name: text
 * - company: text (nullable)
 * - notifications_enabled: boolean (default: true)
 * - onboarding_completed: boolean (default: false)
 * - theme_preference: text (default: 'system', options: 'light', 'dark', 'system')
 * - created_at: timestamptz
 * - updated_at: timestamptz
 *
 * RLS Policies:
 * - Users can read/update their own profile (WHERE id = auth.uid())
 * - Users can insert their own profile during signup (WITH CHECK id = auth.uid())
 * - Support staff can read all profiles
 */

/**
 * WORKSPACES TABLE
 * Table: public.workspaces
 * Primary Key: id (uuid)
 *
 * Expected Columns:
 * - id: uuid (PK)
 * - owner_id: uuid (FK to auth.users.id)
 * - name: text
 * - slug: text (unique)
 * - plan: text (values: 'trial', 'starter', 'pro', 'enterprise', 'free')
 * - subscription_status: text (values: 'active', 'frozen', 'cancelled')
 * - trial_ends_at: timestamptz (nullable)
 * - stripe_customer_id: text (nullable)
 * - stripe_subscription_id: text (nullable)
 * - created_at: timestamptz
 * - updated_at: timestamptz
 *
 * RLS Policies:
 * - Owner can read/update their workspace (WHERE owner_id = auth.uid())
 * - Workspace members can read workspace via workspace_members join
 * - Support staff can read/update all workspaces
 */

/**
 * WORKSPACE_MEMBERS TABLE
 * Table: public.workspace_members
 * Primary Key: (workspace_id, user_id)
 *
 * Expected Columns:
 * - workspace_id: uuid (FK to workspaces.id)
 * - user_id: uuid (FK to auth.users.id)
 * - role: text (values: 'owner', 'admin', 'member', 'viewer')
 * - created_at: timestamptz
 *
 * RLS Policies:
 * - Workspace owner/admin can manage members
 * - Members can read their own membership
 */

/**
 * CREATORS TABLE
 * Table: public.creators
 * Primary Key: id (uuid)
 *
 * Expected Columns:
 * - id: uuid (PK)
 * - workspace_id: uuid (FK to workspaces.id)
 * - name: text
 * - email: text (nullable)
 * - phone: text (nullable)
 * - instagram_handle: text (nullable)
 * - tiktok_handle: text (nullable)
 * - snapchat_handle: text (nullable)
 * - discount_code: text (nullable)
 * - status: text (values: 'active', 'inactive', 'pending')
 * - tags: jsonb (nullable, array of strings)
 * - notes: text (nullable)
 * - follower_count: jsonb (nullable, format: {instagram: number, tiktok: number})
 * - engagement_rate: numeric (nullable)
 * - created_at: timestamptz
 * - updated_at: timestamptz
 *
 * RLS Policies:
 * - Accessible by workspace owner/members (WHERE workspace_id IN (user's workspaces))
 */

/**
 * CAMPAIGNS TABLE
 * Table: public.campaigns
 * Primary Key: id (uuid)
 *
 * Expected Columns:
 * - id: uuid (PK)
 * - workspace_id: uuid (FK to workspaces.id)
 * - name: text
 * - description: text (nullable)
 * - status: text (values: 'draft', 'active', 'completed', 'archived')
 * - budget: numeric (nullable)
 * - start_date: date (nullable)
 * - end_date: date (nullable)
 * - goals: jsonb (nullable)
 * - brand: text (nullable)
 * - brand_guidelines: text (nullable)
 * - created_by: uuid (FK to auth.users.id)
 * - created_at: timestamptz
 * - updated_at: timestamptz
 *
 * NOTE: Revenue/cost metrics are calculated from ad_sets, not stored on campaign
 *
 * RLS Policies:
 * - Accessible by workspace owner/members (WHERE workspace_id IN (user's workspaces))
 */

/**
 * AD_SETS TABLE
 * Table: public.ad_sets
 * Primary Key: id (uuid)
 *
 * Expected Columns:
 * - id: uuid (PK)
 * - campaign_id: uuid (FK to campaigns.id)
 * - creator_id: uuid (FK to creators.id)
 * - name: text
 * - platform: text (values: 'META', 'TikTok', 'Google', 'Snapchat', 'Other')
 * - status: text (values: 'draft', 'active', 'paused', 'completed')
 * - spend: numeric (default: 0)
 * - revenue: numeric (default: 0)
 * - conversions: integer (nullable)
 * - clicks: integer (nullable)
 * - impressions: integer (nullable)
 * - ad_creative_url: text (nullable)
 * - spark_code: text (nullable)
 * - duration_days: integer (nullable)
 * - start_date: date (nullable)
 * - end_date: date (nullable)
 * - performance_metrics: jsonb (nullable, includes costBreakdown)
 * - created_at: timestamptz
 * - updated_at: timestamptz
 *
 * RLS Policies:
 * - Accessible via campaign's workspace (WHERE campaign_id IN (user's workspace campaigns))
 */

/**
 * CAMPAIGN_CREATORS TABLE
 * Table: public.campaign_creators
 * Primary Key: (campaign_id, creator_id)
 *
 * Expected Columns:
 * - campaign_id: uuid (FK to campaigns.id)
 * - creator_id: uuid (FK to creators.id)
 * - status: text (values: 'invited', 'accepted', 'declined', 'completed')
 * - created_at: timestamptz
 *
 * RLS Policies:
 * - Accessible via campaign's workspace
 */

/**
 * DELIVERABLES TABLE
 * Table: public.deliverables
 * Primary Key: id (uuid)
 *
 * Expected Columns:
 * - id: uuid (PK)
 * - campaign_id: uuid (FK to campaigns.id)
 * - creator_id: uuid (FK to creators.id)
 * - title: text
 * - description: text (nullable)
 * - due_date: date (nullable)
 * - status: text (values: 'pending', 'in_progress', 'submitted', 'approved', 'rejected')
 * - file_url: text (nullable)
 * - created_at: timestamptz
 * - updated_at: timestamptz
 *
 * RLS Policies:
 * - Accessible via campaign's workspace
 */

/**
 * TASKS TABLE
 * Table: public.tasks
 * Primary Key: id (uuid)
 *
 * Expected Columns:
 * - id: uuid (PK)
 * - workspace_id: uuid (FK to workspaces.id)
 * - campaign_id: uuid (FK to campaigns.id, nullable)
 * - creator_id: uuid (FK to creators.id, nullable)
 * - title: text
 * - description: text (nullable)
 * - due_date: date (nullable)
 * - priority: text (values: 'low', 'medium', 'high', 'urgent')
 * - status: text (values: 'todo', 'in_progress', 'completed', 'cancelled')
 * - assigned_to: uuid (FK to auth.users.id, nullable)
 * - created_by: uuid (FK to auth.users.id)
 * - created_at: timestamptz
 * - updated_at: timestamptz
 *
 * RLS Policies:
 * - Accessible by workspace owner/members
 */

/**
 * NOTIFICATIONS TABLE
 * Table: public.notifications
 * Primary Key: id (uuid)
 *
 * Expected Columns:
 * - id: uuid (PK)
 * - user_id: uuid (FK to auth.users.id)
 * - workspace_id: uuid (FK to workspaces.id, nullable)
 * - title: text
 * - message: text
 * - type: text (values: 'info', 'success', 'warning', 'error')
 * - read: boolean (default: false)
 * - action_url: text (nullable)
 * - created_at: timestamptz
 *
 * RLS Policies:
 * - Users can read/update their own notifications (WHERE user_id = auth.uid())
 */

/**
 * CONTENT_MEDIA TABLE
 * Table: public.content_media
 * Primary Key: id (uuid)
 *
 * Expected Columns:
 * - id: uuid (PK)
 * - workspace_id: uuid (FK to workspaces.id)
 * - campaign_id: uuid (FK to campaigns.id, nullable)
 * - creator_id: uuid (FK to creators.id, nullable)
 * - ad_set_id: uuid (FK to ad_sets.id, nullable)
 * - file_url: text
 * - file_type: text
 * - file_size: integer (nullable)
 * - title: text (nullable)
 * - description: text (nullable)
 * - status: text (values: 'pending', 'approved', 'rejected')
 * - usage_rights: text (nullable)
 * - rights_expiry: date (nullable)
 * - metadata: jsonb (nullable)
 * - uploaded_by: uuid (FK to auth.users.id)
 * - created_at: timestamptz
 * - updated_at: timestamptz
 *
 * RLS Policies:
 * - Accessible by workspace owner/members
 */

/**
 * NOTES TABLE
 * Table: public.notes
 * Primary Key: id (uuid)
 *
 * Expected Columns:
 * - id: uuid (PK)
 * - workspace_id: uuid (FK to workspaces.id)
 * - campaign_id: uuid (FK to campaigns.id, nullable)
 * - creator_id: uuid (FK to creators.id, nullable)
 * - title: text
 * - content: text
 * - created_by: uuid (FK to auth.users.id)
 * - created_at: timestamptz
 * - updated_at: timestamptz
 *
 * RLS Policies:
 * - Accessible by workspace owner/members
 */

/**
 * ACTIVITY_LOG TABLE
 * Table: public.activity_log
 * Primary Key: id (uuid)
 *
 * Expected Columns:
 * - id: uuid (PK)
 * - workspace_id: uuid (FK to workspaces.id)
 * - user_id: uuid (FK to auth.users.id)
 * - action: text
 * - entity_type: text (e.g., 'campaign', 'creator', 'ad_set')
 * - entity_id: uuid (nullable)
 * - details: jsonb (nullable)
 * - created_at: timestamptz
 *
 * RLS Policies:
 * - Readable by workspace owner/members
 */

/**
 * SUPPORT_TICKETS TABLE
 * Table: public.support_tickets
 * Primary Key: id (uuid)
 *
 * Expected Columns:
 * - id: uuid (PK)
 * - user_id: uuid (FK to auth.users.id)
 * - workspace_id: uuid (FK to workspaces.id, nullable)
 * - subject: text
 * - message: text
 * - status: text (values: 'open', 'in_progress', 'resolved', 'closed')
 * - priority: text (values: 'low', 'medium', 'high', 'urgent')
 * - assigned_to: uuid (FK to support_staff.id, nullable)
 * - created_at: timestamptz
 * - updated_at: timestamptz
 *
 * RLS Policies:
 * - Users can read/update their own tickets
 * - Support staff can read/update all tickets
 */

/**
 * SHOPIFY_STORES TABLE
 * Table: public.shopify_stores
 * Primary Key: id (uuid)
 *
 * Expected Columns:
 * - id: uuid (PK)
 * - workspace_id: uuid (FK to workspaces.id)
 * - shop_name: text
 * - access_token: text (encrypted)
 * - scope: text
 * - connected_at: timestamptz
 * - last_synced_at: timestamptz (nullable)
 * - created_at: timestamptz
 *
 * RLS Policies:
 * - Accessible by workspace owner only
 */

/**
 * ANALYTICS VIEWS
 *
 * campaign_performance_summary (VIEW)
 * - Aggregates ad_sets data per campaign
 * - Columns: id, workspace_id, name, status, total_revenue, total_spend, profit, roi_percentage, etc.
 *
 * platform_performance_summary (VIEW)
 * - Aggregates ad_sets data per platform per workspace
 * - Columns: workspace_id, platform, total_revenue, total_spend, profit, roi_percentage, total_conversions
 *
 * FUNCTIONS:
 * - get_workspace_analytics(p_workspace_id, p_start_date, p_end_date): Returns summary analytics
 * - get_top_performing_creators(p_workspace_id, p_limit, p_order_by, p_start_date, p_end_date): Returns top creators
 * - create_workspace_with_owner(p_owner_id, p_name, p_slug, p_plan): Creates workspace atomically
 */

// This file is for documentation purposes only - DO NOT IMPORT
export const SCHEMA_DOCS_ONLY = true;
