/**
 * SUPABASE SCHEMA DOCUMENTATION
 *
 * This file documents ALL tables and columns that the frontend expects.
 * Use this as a blueprint to configure/verify your Supabase schema.
 *
 * FORMAT:
 * - REQUIRED columns are marked with *
 * - OPTIONAL columns are marked with ?
 * - Relationships are documented
 *
 * Last updated: November 4, 2025
 */

// ============================================================================
// CORE TABLES
// ============================================================================

/**
 * TABLE: profiles
 * Primary Key: id (uuid, references auth.users.id)
 *
 * User profile information
 *
 * COLUMNS:
 * - id*: uuid (PK, FK to auth.users.id)
 * - email*: text
 * - full_name?: text
 * - company?: text
 * - notifications_enabled: boolean (default: true)
 * - onboarding_completed: boolean (default: false)
 * - theme_preference: text (default: 'system', values: 'light', 'dark', 'system')
 * - created_at*: timestamptz
 * - updated_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - id → auth.users.id
 * - workspace_members → profiles.id
 * - tasks.assigned_to → profiles.id
 * - tasks.created_by → profiles.id
 */

/**
 * TABLE: workspaces
 * Primary Key: id (uuid)
 *
 * Workspace/organization data
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - owner_id*: uuid (FK to auth.users.id)
 * - name*: text
 * - slug*: text (unique)
 * - plan*: text (values: 'trial', 'free', 'starter', 'pro', 'enterprise')
 * - subscription_status*: text (values: 'active', 'frozen', 'cancelled')
 * - trial_ends_at?: timestamptz
 * - stripe_customer_id?: text
 * - stripe_subscription_id?: text
 * - created_at*: timestamptz
 * - updated_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - owner_id → auth.users.id
 * - campaigns.workspace_id → workspaces.id
 * - creators.workspace_id → workspaces.id
 * - tasks.workspace_id → workspaces.id
 * - content_media.workspace_id → workspaces.id
 * - notes.workspace_id → workspaces.id
 * - workspace_members.workspace_id → workspaces.id
 */

/**
 * TABLE: workspace_members
 * Primary Key: (workspace_id, user_id)
 *
 * Team members in a workspace
 *
 * COLUMNS:
 * - workspace_id*: uuid (FK to workspaces.id)
 * - user_id*: uuid (FK to auth.users.id)
 * - role*: text (values: 'owner', 'admin', 'member', 'viewer')
 * - created_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - workspace_id → workspaces.id
 * - user_id → auth.users.id
 */

// ============================================================================
// CREATOR MANAGEMENT
// ============================================================================

/**
 * TABLE: creators
 * Primary Key: id (uuid)
 *
 * Creator/influencer profiles
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - workspace_id*: uuid (FK to workspaces.id)
 * - name*: text
 * - email?: text
 * - phone?: text
 * - instagram_handle?: text
 * - tiktok_handle?: text
 * - snapchat_handle?: text
 * - discount_code?: text
 * - status*: text (values: 'active', 'inactive', 'pending')
 * - tags?: jsonb (array of strings)
 * - notes?: text
 * - follower_count?: jsonb (format: {instagram: number, tiktok: number, snapchat: number})
 * - engagement_rate?: numeric
 * - created_at*: timestamptz
 * - updated_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - workspace_id → workspaces.id
 * - ad_sets.creator_id → creators.id
 * - campaign_creators.creator_id → creators.id
 */

// ============================================================================
// CAMPAIGN MANAGEMENT
// ============================================================================

/**
 * TABLE: campaigns
 * Primary Key: id (uuid)
 *
 * Marketing campaigns
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - workspace_id*: uuid (FK to workspaces.id)
 * - name*: text
 * - description?: text
 * - status*: text (values: 'draft', 'active', 'completed', 'archived')
 * - budget?: numeric
 * - start_date?: date
 * - end_date?: date
 * - goals?: jsonb
 * - brand?: text
 * - brand_guidelines?: text
 * - created_by*: uuid (FK to auth.users.id)
 * - created_at*: timestamptz
 * - updated_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - workspace_id → workspaces.id
 * - created_by → auth.users.id
 * - ad_sets.campaign_id → campaigns.id
 * - campaign_creators.campaign_id → campaigns.id
 * - deliverables.campaign_id → campaigns.id
 * - tasks.campaign_id → campaigns.id
 * - notes.campaign_id → campaigns.id
 * - content_media.campaign_id → campaigns.id
 *
 * NOTE: Revenue/costs are calculated from ad_sets, NOT stored on campaigns table
 */

/**
 * TABLE: campaign_creators
 * Primary Key: (campaign_id, creator_id)
 *
 * Many-to-many relationship between campaigns and creators
 *
 * COLUMNS:
 * - campaign_id*: uuid (FK to campaigns.id)
 * - creator_id*: uuid (FK to creators.id)
 * - status*: text (values: 'invited', 'accepted', 'declined', 'completed')
 * - created_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - campaign_id → campaigns.id
 * - creator_id → creators.id
 */

/**
 * TABLE: ad_sets
 * Primary Key: id (uuid)
 *
 * Ad sets within campaigns (contains revenue/spend metrics)
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - campaign_id*: uuid (FK to campaigns.id)
 * - creator_id*: uuid (FK to creators.id)
 * - name*: text
 * - platform*: text (values: 'META', 'TikTok', 'Google', 'Snapchat', 'Other')
 * - status*: text (values: 'draft', 'active', 'paused', 'completed')
 * - spend*: numeric (default: 0) - THIS IS THE COST/SPEND FIELD
 * - revenue*: numeric (default: 0)
 * - conversions?: integer
 * - clicks?: integer
 * - impressions?: integer
 * - ad_creative_url?: text
 * - spark_code?: text
 * - duration_days?: integer
 * - start_date?: date
 * - end_date?: date
 * - performance_metrics?: jsonb (includes costBreakdown: {creator_fee, production, ad_spend, etc})
 * - created_at*: timestamptz
 * - updated_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - campaign_id → campaigns.id
 * - creator_id → creators.id
 * - content_media.ad_set_id → ad_sets.id
 *
 * IMPORTANT:
 * - All campaign revenue/costs come from aggregating ad_sets
 * - performance_metrics.costBreakdown contains detailed cost breakdown
 * - spend = total costs for this ad set
 * - revenue = total revenue generated by this ad set
 */

// ============================================================================
// CONTENT & DELIVERABLES
// ============================================================================

/**
 * TABLE: deliverables
 * Primary Key: id (uuid)
 *
 * Content deliverables from creators
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - campaign_id*: uuid (FK to campaigns.id)
 * - creator_id*: uuid (FK to creators.id)
 * - title*: text
 * - description?: text
 * - due_date?: date
 * - status*: text (values: 'pending', 'in_progress', 'submitted', 'approved', 'rejected')
 * - file_url?: text
 * - created_at*: timestamptz
 * - updated_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - campaign_id → campaigns.id
 * - creator_id → creators.id
 */

/**
 * TABLE: content_media
 * Primary Key: id (uuid)
 *
 * Media files uploaded to the platform
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - workspace_id*: uuid (FK to workspaces.id)
 * - campaign_id?: uuid (FK to campaigns.id)
 * - creator_id?: uuid (FK to creators.id)
 * - ad_set_id?: uuid (FK to ad_sets.id)
 * - file_url*: text
 * - file_type*: text
 * - file_size?: integer
 * - title?: text
 * - description?: text
 * - status*: text (values: 'pending', 'approved', 'rejected')
 * - usage_rights?: text
 * - rights_expiry?: date
 * - metadata?: jsonb
 * - uploaded_by*: uuid (FK to auth.users.id)
 * - created_at*: timestamptz
 * - updated_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - workspace_id → workspaces.id
 * - campaign_id → campaigns.id (optional)
 * - creator_id → creators.id (optional)
 * - ad_set_id → ad_sets.id (optional)
 * - uploaded_by → auth.users.id
 */

/**
 * TABLE: content_reviews
 * Primary Key: id (uuid)
 *
 * Review/feedback on content
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - content_id*: uuid (FK to content_media.id)
 * - reviewer_id*: uuid (FK to auth.users.id)
 * - status*: text (values: 'approved', 'changes_requested', 'rejected')
 * - feedback?: text
 * - created_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - content_id → content_media.id
 * - reviewer_id → auth.users.id
 */

// ============================================================================
// TASKS & ACTIVITY
// ============================================================================

/**
 * TABLE: tasks
 * Primary Key: id (uuid)
 *
 * Task management
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - workspace_id*: uuid (FK to workspaces.id)
 * - campaign_id?: uuid (FK to campaigns.id)
 * - creator_id?: uuid (FK to creators.id)
 * - title*: text
 * - description?: text
 * - due_date?: date
 * - priority*: text (values: 'low', 'medium', 'high', 'urgent')
 * - status*: text (values: 'todo', 'in_progress', 'completed', 'cancelled')
 * - assigned_to?: uuid (FK to auth.users.id)
 * - created_by*: uuid (FK to auth.users.id)
 * - created_at*: timestamptz
 * - updated_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - workspace_id → workspaces.id
 * - campaign_id → campaigns.id (optional)
 * - creator_id → creators.id (optional)
 * - assigned_to → auth.users.id (optional)
 * - created_by → auth.users.id
 */

/**
 * TABLE: notes
 * Primary Key: id (uuid)
 *
 * Notes/documentation
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - workspace_id*: uuid (FK to workspaces.id)
 * - campaign_id?: uuid (FK to campaigns.id)
 * - creator_id?: uuid (FK to creators.id)
 * - title*: text
 * - content*: text
 * - created_by*: uuid (FK to auth.users.id)
 * - created_at*: timestamptz
 * - updated_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - workspace_id → workspaces.id
 * - campaign_id → campaigns.id (optional)
 * - creator_id → creators.id (optional)
 * - created_by → auth.users.id
 */

/**
 * TABLE: notifications
 * Primary Key: id (uuid)
 *
 * User notifications
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - user_id*: uuid (FK to auth.users.id)
 * - workspace_id?: uuid (FK to workspaces.id)
 * - title*: text
 * - message*: text
 * - type*: text (values: 'info', 'success', 'warning', 'error')
 * - read: boolean (default: false)
 * - action_url?: text
 * - created_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - user_id → auth.users.id
 * - workspace_id → workspaces.id (optional)
 */

/**
 * TABLE: activity_log
 * Primary Key: id (uuid)
 *
 * Audit trail of user actions
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - workspace_id*: uuid (FK to workspaces.id)
 * - user_id*: uuid (FK to auth.users.id)
 * - action*: text
 * - entity_type*: text (e.g., 'campaign', 'creator', 'ad_set')
 * - entity_id?: uuid
 * - details?: jsonb
 * - created_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - workspace_id → workspaces.id
 * - user_id → auth.users.id
 */

// ============================================================================
// BILLING & SUBSCRIPTIONS
// ============================================================================

/**
 * TABLE: payment_methods
 * Primary Key: id (uuid)
 *
 * Stripe payment methods
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - workspace_id*: uuid (FK to workspaces.id)
 * - stripe_payment_method_id*: text
 * - type*: text
 * - last4?: text
 * - brand?: text
 * - is_default: boolean (default: false)
 * - created_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - workspace_id → workspaces.id
 */

/**
 * TABLE: invoices
 * Primary Key: id (uuid)
 *
 * Billing invoices
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - workspace_id*: uuid (FK to workspaces.id)
 * - stripe_invoice_id*: text
 * - amount*: numeric
 * - status*: text
 * - invoice_url?: text
 * - created_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - workspace_id → workspaces.id
 */

/**
 * TABLE: email_preferences
 * Primary Key: id (uuid)
 *
 * User email notification preferences
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - user_id*: uuid (FK to auth.users.id)
 * - marketing_emails: boolean (default: true)
 * - product_updates: boolean (default: true)
 * - campaign_notifications: boolean (default: true)
 * - task_reminders: boolean (default: true)
 * - weekly_reports: boolean (default: true)
 * - created_at*: timestamptz
 * - updated_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - user_id → auth.users.id
 */

// ============================================================================
// INTEGRATIONS
// ============================================================================

/**
 * TABLE: platform_integrations
 * Primary Key: id (uuid)
 *
 * OAuth integrations (Shopify, Meta, etc.)
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - workspace_id*: uuid (FK to workspaces.id)
 * - platform*: text (values: 'shopify', 'meta', 'google', etc.)
 * - access_token*: text (encrypted)
 * - refresh_token?: text (encrypted)
 * - expires_at?: timestamptz
 * - shop_name?: text (for Shopify)
 * - scope?: text
 * - connected_at*: timestamptz
 * - last_synced_at?: timestamptz
 * - created_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - workspace_id → workspaces.id
 */

/**
 * TABLE: shopify_orders
 * Primary Key: id (uuid)
 *
 * Synced Shopify orders
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - workspace_id*: uuid (FK to workspaces.id)
 * - shopify_order_id*: text
 * - order_number*: text
 * - total_price*: numeric
 * - discount_code?: text
 * - created_at*: timestamptz
 * - synced_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - workspace_id → workspaces.id
 */

/**
 * TABLE: conversion_events
 * Primary Key: id (uuid)
 *
 * Conversion tracking events
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - workspace_id*: uuid (FK to workspaces.id)
 * - creator_id?: uuid (FK to creators.id)
 * - ad_set_id?: uuid (FK to ad_sets.id)
 * - event_type*: text
 * - value?: numeric
 * - metadata?: jsonb
 * - created_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - workspace_id → workspaces.id
 * - creator_id → creators.id (optional)
 * - ad_set_id → ad_sets.id (optional)
 */

/**
 * TABLE: product_intelligence_suggestions
 * Primary Key: id (uuid)
 *
 * AI-generated product suggestions
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - workspace_id*: uuid (FK to workspaces.id)
 * - suggestion_type*: text
 * - title*: text
 * - description*: text
 * - status*: text (values: 'pending', 'accepted', 'rejected')
 * - metadata?: jsonb
 * - created_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - workspace_id → workspaces.id
 */

/**
 * TABLE: linear_integrations
 * Primary Key: id (uuid)
 *
 * Linear integration configuration
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - workspace_id*: uuid (FK to workspaces.id)
 * - api_key*: text (encrypted)
 * - team_id*: text
 * - enabled: boolean (default: true)
 * - last_synced_at?: timestamptz
 * - created_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - workspace_id → workspaces.id
 */

/**
 * TABLE: integration_sync_logs
 * Primary Key: id (uuid)
 *
 * Integration sync logs
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - integration_type*: text
 * - workspace_id*: uuid (FK to workspaces.id)
 * - status*: text (values: 'success', 'failed')
 * - details?: jsonb
 * - created_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - workspace_id → workspaces.id
 */

// ============================================================================
// SUPPORT SYSTEM
// ============================================================================

/**
 * TABLE: support_staff
 * Primary Key: id (uuid)
 *
 * Support team members
 *
 * COLUMNS:
 * - id*: uuid (PK, FK to auth.users.id)
 * - email*: text
 * - name*: text
 * - role*: text (values: 'admin', 'support', 'viewer')
 * - is_active: boolean (default: true)
 * - created_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - id → auth.users.id
 */

/**
 * TABLE: support_tickets
 * Primary Key: id (uuid)
 *
 * Customer support tickets
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - user_id*: uuid (FK to auth.users.id)
 * - workspace_id?: uuid (FK to workspaces.id)
 * - subject*: text
 * - message*: text
 * - status*: text (values: 'open', 'in_progress', 'resolved', 'closed')
 * - priority*: text (values: 'low', 'medium', 'high', 'urgent')
 * - assigned_to?: uuid (FK to support_staff.id)
 * - created_at*: timestamptz
 * - updated_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - user_id → auth.users.id
 * - workspace_id → workspaces.id (optional)
 * - assigned_to → support_staff.id (optional)
 */

/**
 * TABLE: support_ticket_messages
 * Primary Key: id (uuid)
 *
 * Messages within support tickets
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - ticket_id*: uuid (FK to support_tickets.id)
 * - sender_id*: uuid (FK to auth.users.id)
 * - message*: text
 * - is_internal: boolean (default: false)
 * - created_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - ticket_id → support_tickets.id
 * - sender_id → auth.users.id
 */

/**
 * TABLE: support_audit_logs
 * Primary Key: id (uuid)
 *
 * Support staff actions audit log
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - staff_id*: uuid (FK to support_staff.id)
 * - action*: text
 * - entity_type*: text
 * - entity_id?: uuid
 * - details?: jsonb
 * - ip_address?: text
 * - created_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - staff_id → support_staff.id
 */

/**
 * TABLE: support_workspace_notes
 * Primary Key: id (uuid)
 *
 * Internal notes about workspaces (for support)
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - workspace_id*: uuid (FK to workspaces.id)
 * - staff_id*: uuid (FK to support_staff.id)
 * - note*: text
 * - created_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - workspace_id → workspaces.id
 * - staff_id → support_staff.id
 */

/**
 * TABLE: email_domains
 * Primary Key: id (uuid)
 *
 * Custom email domains for workspaces
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - workspace_id*: uuid (FK to workspaces.id)
 * - domain*: text
 * - verified: boolean (default: false)
 * - dns_configured: boolean (default: false)
 * - created_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - workspace_id → workspaces.id
 */

/**
 * TABLE: dns_records
 * Primary Key: id (uuid)
 *
 * DNS records for email domains
 *
 * COLUMNS:
 * - id*: uuid (PK)
 * - domain_id*: uuid (FK to email_domains.id)
 * - record_type*: text (values: 'TXT', 'CNAME', 'MX')
 * - name*: text
 * - value*: text
 * - verified: boolean (default: false)
 * - created_at*: timestamptz
 *
 * RELATIONSHIPS:
 * - domain_id → email_domains.id
 */

// ============================================================================
// RPC FUNCTIONS USED BY FRONTEND
// ============================================================================

/**
 * RPC: create_workspace_with_owner
 *
 * Atomically creates a workspace and adds the owner as a member
 *
 * PARAMETERS:
 * - p_owner_id: uuid
 * - p_name: text
 * - p_slug: text
 * - p_plan: text (default: 'trial')
 *
 * RETURNS: uuid (workspace_id)
 *
 * USED IN:
 * - SignupModal.tsx
 * - workspaceHelpers.ts
 */

/**
 * RPC: get_workspace_usage
 *
 * Gets usage statistics for a workspace
 *
 * PARAMETERS:
 * - p_workspace_id: uuid
 *
 * RETURNS: jsonb with usage counts
 *
 * USED IN:
 * - PlanLimitsContext.tsx
 */

// ============================================================================
// VIEWS (OPTIONAL - Frontend calculates these if views don't exist)
// ============================================================================

/**
 * VIEW: campaign_performance_summary (OPTIONAL)
 *
 * Aggregated campaign metrics
 * - Used by AnalyticsView if available
 * - Frontend falls back to direct calculation from ad_sets if view doesn't exist
 */

/**
 * VIEW: platform_performance_summary (OPTIONAL)
 *
 * Aggregated platform metrics
 * - Used by AnalyticsView if available
 * - Frontend falls back to direct calculation from ad_sets if view doesn't exist
 */

// ============================================================================
// IMPORTANT NOTES
// ============================================================================

/**
 * WORKSPACE SCOPING:
 * Most queries MUST filter by workspace_id. The frontend assumes:
 * - All campaigns belong to a workspace
 * - All creators belong to a workspace
 * - All tasks belong to a workspace
 * - All content_media belongs to a workspace
 * - All notes belong to a workspace
 *
 * CURRENT IMPLEMENTATION:
 * Each component loads workspace from Dashboard context or URL
 * Should be centralized with useCurrentWorkspace() hook
 */

/**
 * METRICS CALCULATION:
 * All campaign revenue/costs come from ad_sets table:
 * - campaign.total_revenue = SUM(ad_sets.revenue WHERE campaign_id = campaign.id)
 * - campaign.total_spend = SUM(ad_sets.spend WHERE campaign_id = campaign.id)
 * - campaign.profit = total_revenue - total_spend
 * - campaign.roi = (profit / total_spend) * 100
 *
 * DO NOT add revenue/spend columns to campaigns table!
 */

/**
 * TRIAL DURATION:
 * Workspaces created with plan='trial' should have:
 * - trial_ends_at = now() + interval '14 days'
 * This is set by create_workspace_with_owner RPC function
 */

export const SCHEMA_VERSION = '2.0.0';
export const LAST_UPDATED = '2025-11-04';
