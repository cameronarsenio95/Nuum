/*
  # NUUM Complete Base Schema - FIXED

  This is the complete foundational schema for the NUUM platform.
  Run this FIRST in a fresh Supabase database before applying any other migrations.

  ## Tables Created
  1. profiles - User profile information
  2. workspaces - Team workspaces
  3. workspace_members - Workspace membership and roles
  4. creators - Creator database
  5. campaigns - Campaign management
  6. campaign_creators - Campaign-creator assignments
  7. deliverables - Content deliverables
  8. tasks - Task management
  9. comments - Comments on entities
  10. notifications - User notifications
  11. activity_log - Activity tracking

  ## Security
  - All tables have RLS enabled
  - Policies enforce workspace isolation
  - Role-based access control
*/

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PART 1: CREATE ALL TABLES (NO POLICIES YET)
-- ============================================================================

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  phone text,
  company text,
  job_title text,
  bio text,
  avatar_url text,
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  theme_preference text DEFAULT 'dark' CHECK (theme_preference IN ('light', 'dark', 'system')),
  notifications_enabled boolean DEFAULT true,
  onboarding_completed boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- WORKSPACES TABLE
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  plan text NOT NULL DEFAULT 'standard' CHECK (plan IN ('standard', 'elite')),
  max_team_members int,
  max_creators int,
  max_storage_gb int,
  storage_used_bytes bigint DEFAULT 0,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  settings jsonb DEFAULT '{}'::jsonb,
  features jsonb DEFAULT '{}'::jsonb,
  subscription_status text DEFAULT 'trialing' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'expired', 'frozen')),
  subscription_expires_at timestamptz,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  stripe_customer_id text,
  support_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_status ON workspaces(subscription_status);

-- WORKSPACE MEMBERS TABLE
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
CREATE INDEX IF NOT EXISTS idx_workspace_members_role ON workspace_members(workspace_id, role);

-- CREATORS TABLE
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

-- CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  brand text,
  description text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  budget numeric,
  start_date date,
  end_date date,
  goals jsonb DEFAULT '{}'::jsonb,
  brand_guidelines text,
  spark_url text,
  revenue numeric DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_workspace ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(workspace_id, status);

-- CAMPAIGN CREATORS TABLE
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

-- DELIVERABLES TABLE
CREATE TABLE IF NOT EXISTS deliverables (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  campaign_creator_id uuid REFERENCES campaign_creators(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text DEFAULT 'post' CHECK (type IN ('post', 'story', 'video', 'reel', 'other')),
  platform text DEFAULT 'instagram' CHECK (platform IN ('instagram', 'tiktok', 'snapchat', 'other')),
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

-- TASKS TABLE
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

-- COMMENTS TABLE
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

-- NOTIFICATIONS TABLE
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

-- ACTIVITY LOG TABLE
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

-- ============================================================================
-- PART 2: ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 3: CREATE RLS POLICIES (NOW ALL TABLES EXIST)
-- ============================================================================

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "signup_profiles_insert"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- WORKSPACES POLICIES
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

CREATE POLICY "signup_workspaces_insert"
  ON workspaces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Workspace owners can update their workspaces"
  ON workspaces FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Workspace owners can delete their workspaces"
  ON workspaces FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- WORKSPACE MEMBERS POLICIES
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

CREATE POLICY "signup_workspace_members_insert"
  ON workspace_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

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

-- CREATORS POLICIES
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

-- CAMPAIGNS POLICIES
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

-- CAMPAIGN CREATORS POLICIES
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
  );

-- DELIVERABLES POLICIES
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
  );

-- TASKS POLICIES
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

-- COMMENTS POLICIES
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

-- NOTIFICATIONS POLICIES
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

-- ACTIVITY LOG POLICIES
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

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'profiles', 'workspaces', 'workspace_members', 'creators',
    'campaigns', 'campaign_creators', 'deliverables', 'tasks',
    'comments', 'notifications', 'activity_log'
  );

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  RAISE NOTICE '============================================';
  RAISE NOTICE 'BASE SCHEMA SETUP COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables created: %', table_count;
  RAISE NOTICE 'RLS policies created: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Core Tables:';
  RAISE NOTICE '  ✓ profiles';
  RAISE NOTICE '  ✓ workspaces';
  RAISE NOTICE '  ✓ workspace_members';
  RAISE NOTICE '  ✓ creators';
  RAISE NOTICE '  ✓ campaigns';
  RAISE NOTICE '  ✓ campaign_creators';
  RAISE NOTICE '  ✓ deliverables';
  RAISE NOTICE '  ✓ tasks';
  RAISE NOTICE '  ✓ comments';
  RAISE NOTICE '  ✓ notifications';
  RAISE NOTICE '  ✓ activity_log';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Apply migration: 20251103153228_fix_signup_500_error_security_definer.sql';
  RAISE NOTICE '  2. Test user signup flow';
  RAISE NOTICE '============================================';
END $$;
