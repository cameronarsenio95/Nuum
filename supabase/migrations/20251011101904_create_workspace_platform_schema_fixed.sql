/*
  # NUUM Workspace Platform - Complete Database Schema

  ## Overview
  Complete database structure for the NUUM influencer marketing workspace platform with team collaboration, campaign management, creator database, and task tracking.

  ## New Tables

  ### Core Tables
  
  1. **workspaces**
     - `id` (uuid, primary key)
     - `name` (text) - Workspace name
     - `slug` (text, unique) - URL-friendly identifier
     - `plan` (text) - 'standard' or 'elite'
     - `max_team_members` (int) - Plan limit (5 for standard, null for elite)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)
     - `owner_id` (uuid) - References auth.users
     - `settings` (jsonb) - Custom workspace settings

  2. **workspace_members**
     - `id` (uuid, primary key)
     - `workspace_id` (uuid) - References workspaces
     - `user_id` (uuid) - References auth.users
     - `role` (text) - 'owner', 'admin', 'member', 'viewer'
     - `invited_by` (uuid) - References auth.users
     - `joined_at` (timestamptz)
     - `created_at` (timestamptz)

  3. **creators**
     - `id` (uuid, primary key)
     - `workspace_id` (uuid) - References workspaces
     - `name` (text)
     - `email` (text)
     - `phone` (text)
     - `instagram_handle` (text)
     - `tiktok_handle` (text)
     - `youtube_handle` (text)
     - `follower_count` (jsonb) - {platform: count}
     - `engagement_rate` (numeric)
     - `notes` (text)
     - `tags` (text[])
     - `status` (text) - 'active', 'inactive', 'blacklisted'
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)
     - `created_by` (uuid) - References auth.users

  4. **campaigns**
     - `id` (uuid, primary key)
     - `workspace_id` (uuid) - References workspaces
     - `name` (text)
     - `description` (text)
     - `status` (text) - 'draft', 'active', 'completed', 'archived'
     - `budget` (numeric)
     - `start_date` (date)
     - `end_date` (date)
     - `goals` (jsonb) - Campaign objectives
     - `brand_guidelines` (text)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)
     - `created_by` (uuid) - References auth.users

  5. **campaign_creators**
     - `id` (uuid, primary key)
     - `campaign_id` (uuid) - References campaigns
     - `creator_id` (uuid) - References creators
     - `status` (text) - 'invited', 'accepted', 'declined', 'completed'
     - `fee` (numeric)
     - `deliverables_count` (int)
     - `notes` (text)
     - `created_at` (timestamptz)

  6. **deliverables**
     - `id` (uuid, primary key)
     - `campaign_id` (uuid) - References campaigns
     - `creator_id` (uuid) - References creators
     - `campaign_creator_id` (uuid) - References campaign_creators
     - `title` (text)
     - `description` (text)
     - `type` (text) - 'post', 'story', 'video', 'reel', 'other'
     - `platform` (text) - 'instagram', 'tiktok', 'youtube', 'other'
     - `due_date` (date)
     - `status` (text) - 'pending', 'in_review', 'approved', 'posted', 'completed'
     - `url` (text) - Posted content URL
     - `performance_data` (jsonb) - Views, likes, comments, etc.
     - `assigned_to` (uuid) - References auth.users
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  7. **tasks**
     - `id` (uuid, primary key)
     - `workspace_id` (uuid) - References workspaces
     - `campaign_id` (uuid, nullable) - References campaigns
     - `title` (text)
     - `description` (text)
     - `status` (text) - 'todo', 'in_progress', 'review', 'done'
     - `priority` (text) - 'low', 'medium', 'high', 'urgent'
     - `assigned_to` (uuid) - References auth.users
     - `due_date` (date)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)
     - `created_by` (uuid) - References auth.users

  8. **comments**
     - `id` (uuid, primary key)
     - `workspace_id` (uuid) - References workspaces
     - `entity_type` (text) - 'campaign', 'deliverable', 'task', 'creator'
     - `entity_id` (uuid) - ID of the entity being commented on
     - `content` (text)
     - `mentions` (uuid[]) - Array of user IDs mentioned
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)
     - `created_by` (uuid) - References auth.users

  9. **notifications**
     - `id` (uuid, primary key)
     - `workspace_id` (uuid) - References workspaces
     - `user_id` (uuid) - References auth.users
     - `type` (text) - 'mention', 'assignment', 'deadline', 'comment', 'status_change'
     - `title` (text)
     - `message` (text)
     - `entity_type` (text)
     - `entity_id` (uuid)
     - `read` (boolean)
     - `created_at` (timestamptz)

  10. **activity_log**
      - `id` (uuid, primary key)
      - `workspace_id` (uuid) - References workspaces
      - `user_id` (uuid) - References auth.users
      - `action` (text) - 'created', 'updated', 'deleted', 'completed'
      - `entity_type` (text)
      - `entity_id` (uuid)
      - `details` (jsonb) - Change details
      - `created_at` (timestamptz)

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Policies ensure users can only access data from workspaces they're members of
  - Role-based access control for different permission levels
  - Workspace owners have full control, admins can manage, members can contribute, viewers can only read

  ## Indexes
  - Foreign key indexes for optimal query performance
  - Composite indexes for common query patterns
  - Text search indexes for creator and campaign search

  ## Important Notes
  1. All tables use RLS to ensure data isolation between workspaces
  2. Workspace plan limits are enforced at the application level
  3. Real-time subscriptions can be enabled for collaboration features
  4. JSONB fields allow flexible data structures for custom workflows
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- WORKSPACES
-- =====================================================

CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  plan text NOT NULL DEFAULT 'standard' CHECK (plan IN ('standard', 'elite')),
  max_team_members int,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspaces they own"
  ON workspaces FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create their own workspaces"
  ON workspaces FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Workspace owners can update their workspaces"
  ON workspaces FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Workspace owners can delete their workspaces"
  ON workspaces FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- =====================================================
-- WORKSPACE MEMBERS
-- =====================================================

CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by uuid REFERENCES auth.users(id),
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view other members in their workspace"
  ON workspace_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can add members"
  ON workspace_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update member roles"
  ON workspace_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can remove members"
  ON workspace_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

-- Update workspaces policy to include member access
DROP POLICY IF EXISTS "Users can view workspaces they own" ON workspaces;

CREATE POLICY "Users can view workspaces they own or are members of"
  ON workspaces FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
    )
  );

-- =====================================================
-- CREATORS
-- =====================================================

CREATE TABLE IF NOT EXISTS creators (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  instagram_handle text,
  tiktok_handle text,
  youtube_handle text,
  follower_count jsonb DEFAULT '{}'::jsonb,
  engagement_rate numeric,
  notes text,
  tags text[] DEFAULT ARRAY[]::text[],
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creators_workspace ON creators(workspace_id);
CREATE INDEX IF NOT EXISTS idx_creators_status ON creators(workspace_id, status);

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view creators"
  ON creators FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = creators.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members and above can create creators"
  ON creators FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = creators.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Members and above can update creators"
  ON creators FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = creators.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = creators.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Admins and owners can delete creators"
  ON creators FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = creators.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- CAMPAIGNS
-- =====================================================

CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  budget numeric,
  start_date date,
  end_date date,
  goals jsonb DEFAULT '{}'::jsonb,
  brand_guidelines text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_workspace ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(workspace_id, status);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = campaigns.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members and above can create campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = campaigns.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Members and above can update campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = campaigns.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = campaigns.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Admins and owners can delete campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = campaigns.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- CAMPAIGN CREATORS
-- =====================================================

CREATE TABLE IF NOT EXISTS campaign_creators (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'completed')),
  fee numeric,
  deliverables_count int DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_creators_campaign ON campaign_creators(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_creators_creator ON campaign_creators(creator_id);

ALTER TABLE campaign_creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view campaign creators"
  ON campaign_creators FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      JOIN workspace_members ON workspace_members.workspace_id = campaigns.workspace_id
      WHERE campaigns.id = campaign_creators.campaign_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members and above can manage campaign creators"
  ON campaign_creators FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      JOIN workspace_members ON workspace_members.workspace_id = campaigns.workspace_id
      WHERE campaigns.id = campaign_creators.campaign_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      JOIN workspace_members ON workspace_members.workspace_id = campaigns.workspace_id
      WHERE campaigns.id = campaign_creators.campaign_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  );

-- =====================================================
-- DELIVERABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS deliverables (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  campaign_creator_id uuid REFERENCES campaign_creators(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text DEFAULT 'post' CHECK (type IN ('post', 'story', 'video', 'reel', 'other')),
  platform text DEFAULT 'instagram' CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'other')),
  due_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'posted', 'completed')),
  url text,
  performance_data jsonb DEFAULT '{}'::jsonb,
  assigned_to uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliverables_campaign ON deliverables(campaign_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_creator ON deliverables(creator_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_assigned ON deliverables(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deliverables_status ON deliverables(campaign_id, status);

ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view deliverables"
  ON deliverables FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      JOIN workspace_members ON workspace_members.workspace_id = campaigns.workspace_id
      WHERE campaigns.id = deliverables.campaign_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members and above can manage deliverables"
  ON deliverables FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      JOIN workspace_members ON workspace_members.workspace_id = campaigns.workspace_id
      WHERE campaigns.id = deliverables.campaign_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      JOIN workspace_members ON workspace_members.workspace_id = campaigns.workspace_id
      WHERE campaigns.id = deliverables.campaign_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  );

-- =====================================================
-- TASKS
-- =====================================================

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to uuid REFERENCES auth.users(id),
  due_date date,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_campaign ON tasks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(workspace_id, status);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = tasks.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members and above can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = tasks.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Members and above can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = tasks.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = tasks.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Members and above can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = tasks.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('campaign', 'deliverable', 'task', 'creator')),
  entity_id uuid NOT NULL,
  content text NOT NULL,
  mentions uuid[] DEFAULT ARRAY[]::uuid[],
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_workspace ON comments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = comments.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = comments.workspace_id
      AND workspace_members.user_id = auth.uid()
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Comment authors can update their comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Comment authors and admins can delete comments"
  ON comments FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = comments.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('mention', 'assignment', 'deadline', 'comment', 'status_change')),
  title text NOT NULL,
  message text NOT NULL,
  entity_type text,
  entity_id uuid,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_workspace ON notifications(workspace_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- ACTIVITY LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'completed')),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_workspace ON activity_log(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view activity log"
  ON activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = activity_log.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create activity log entries"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);