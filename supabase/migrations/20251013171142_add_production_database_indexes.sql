/*
  # Production Database Indexes for Performance Optimization

  ## Overview
  Adds critical database indexes to optimize query performance for frequently accessed data patterns in the NUUM platform.

  ## Changes

  ### Performance Indexes

  1. **workspaces table**
     - Index on `owner_id` for fast user workspace lookup
     - Index on `slug` for URL-based workspace access
     - Index on `plan` for plan-based filtering

  2. **workspace_members table**
     - Composite index on `workspace_id, user_id` for membership checks
     - Index on `user_id` for user's workspaces lookup

  3. **creators table**
     - Composite index on `workspace_id, status` for active creator filtering
     - Index on `email` for creator search
     - Index on social media handles for platform-specific lookups

  4. **campaigns table**
     - Composite index on `workspace_id, status` for active campaign filtering
     - Index on `created_by` for user's campaigns
     - Index on date fields for timeline queries

  5. **campaign_creators table**
     - Composite index on `campaign_id, creator_id` for relationship lookups
     - Index on `status` for filtering by collaboration status

  6. **tasks table**
     - Composite index on `workspace_id, status` for task filtering
     - Composite index on `assigned_to, status` for user task lists
     - Index on `due_date` for deadline queries

  7. **content_media table**
     - Composite index on `workspace_id, status` for content filtering
     - Index on `creator_id` for creator content lookup
     - Index on `campaign_id` for campaign content

  8. **notes table**
     - Composite index on `entity_type, entity_id` for entity notes lookup
     - Index on `created_by` for user notes

  9. **ad_sets table**
     - Index on `campaign_id` for campaign ad sets
     - Composite index on `campaign_id, status` for active ad set filtering

  ## Notes
  - All indexes use IF NOT EXISTS to prevent errors on re-run
  - Indexes are optimized for common query patterns
  - Composite indexes are ordered by selectivity (most selective first)
*/

-- Workspaces indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_plan ON workspaces(plan);
CREATE INDEX IF NOT EXISTS idx_workspaces_subscription_status ON workspaces(subscription_status);

-- Workspace members indexes
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_user
  ON workspace_members(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id
  ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_role
  ON workspace_members(role);

-- Creators indexes
CREATE INDEX IF NOT EXISTS idx_creators_workspace_status
  ON creators(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_creators_email
  ON creators(email);
CREATE INDEX IF NOT EXISTS idx_creators_instagram
  ON creators(instagram_handle) WHERE instagram_handle IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_creators_tiktok
  ON creators(tiktok_handle) WHERE tiktok_handle IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_creators_youtube
  ON creators(youtube_handle) WHERE youtube_handle IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_creators_created_by
  ON creators(created_by);

-- Campaigns indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_status
  ON campaigns(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by
  ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_start_date
  ON campaigns(start_date) WHERE start_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_end_date
  ON campaigns(end_date) WHERE end_date IS NOT NULL;

-- Campaign creators indexes
CREATE INDEX IF NOT EXISTS idx_campaign_creators_campaign_creator
  ON campaign_creators(campaign_id, creator_id);
CREATE INDEX IF NOT EXISTS idx_campaign_creators_creator_id
  ON campaign_creators(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaign_creators_status
  ON campaign_creators(status);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_status
  ON tasks(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status
  ON tasks(assigned_to, status) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due_date
  ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_campaign
  ON tasks(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_creator
  ON tasks(creator_id) WHERE creator_id IS NOT NULL;

-- Content media indexes
CREATE INDEX IF NOT EXISTS idx_content_media_workspace_status
  ON content_media(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_content_media_creator
  ON content_media(creator_id) WHERE creator_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_media_campaign
  ON content_media(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_media_platform
  ON content_media(platform);
CREATE INDEX IF NOT EXISTS idx_content_media_uploaded_by
  ON content_media(uploaded_by);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_entity
  ON notes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notes_workspace
  ON notes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_by
  ON notes(created_by);

-- Ad sets indexes (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ad_sets') THEN
    CREATE INDEX IF NOT EXISTS idx_ad_sets_campaign
      ON ad_sets(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_ad_sets_campaign_status
      ON ad_sets(campaign_id, status);
    CREATE INDEX IF NOT EXISTS idx_ad_sets_platform
      ON ad_sets(platform);
  END IF;
END $$;

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id
  ON profiles(id);

-- Support staff indexes (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_staff') THEN
    CREATE INDEX IF NOT EXISTS idx_support_staff_user_id
      ON support_staff(user_id);
    CREATE INDEX IF NOT EXISTS idx_support_staff_role
      ON support_staff(role);
  END IF;
END $$;

-- Analyze tables to update statistics
ANALYZE workspaces;
ANALYZE workspace_members;
ANALYZE creators;
ANALYZE campaigns;
ANALYZE campaign_creators;
ANALYZE tasks;
ANALYZE content_media;
ANALYZE notes;
ANALYZE profiles;
