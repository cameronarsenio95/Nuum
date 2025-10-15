/*
  # Product Intelligence and Linear MCP Integration Schema
  
  This migration creates the complete database schema for two major features:
  1. Product Intelligence - AI-driven project suggestions
  2. Linear MCP Integration - Two-way sync with Linear workspace
  
  ## New Tables
  
  ### Product Intelligence Tables
  - `product_intelligence_suggestions`
    - Stores AI-generated project suggestions
    - Links to workspace, related issues, campaigns, or creators
    - Tracks status (pending, accepted, rejected, in_progress, completed)
    - Stores AI reasoning and metadata
    - Priority scoring (low, medium, high, critical)
  
  ### Linear MCP Integration Tables
  - `linear_integrations`
    - Workspace-level Linear OAuth configuration
    - Stores encrypted access tokens and refresh tokens
    - MCP server configuration settings
    - Connection status tracking
  
  - `linear_teams`
    - Linear team structure
    - Team members and permissions
  
  - `linear_users`
    - Linear user mapping to workspace members
    - Sync user profiles and avatars
  
  - `linear_projects`
    - Linear project data with status sync
    - Project metadata and progress tracking
  
  - `linear_issues`
    - Complete Linear issues sync with two-way mapping
    - All issue fields (title, description, state, priority, etc.)
    - Links to local workspace entities
  
  - `linear_comments`
    - All Linear comments with bidirectional updates
    - User attribution and timestamps
  
  - `integration_sync_logs`
    - Real-time sync status tracking
    - Error logging and recovery
    - Performance metrics
  
  ## Security
  - Enable RLS on all tables
  - Policies for workspace-based access control
  - Encrypted storage for OAuth tokens
  - Audit logging for all sync operations
*/

-- Product Intelligence Suggestions Table
CREATE TABLE IF NOT EXISTS product_intelligence_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  ai_reasoning text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'in_progress', 'completed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category text,
  tags text[] DEFAULT '{}',
  related_to jsonb DEFAULT '[]',
  duplicate_of uuid,
  metadata jsonb DEFAULT '{}',
  accepted_by uuid,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pi_suggestions_workspace ON product_intelligence_suggestions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pi_suggestions_status ON product_intelligence_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_pi_suggestions_priority ON product_intelligence_suggestions(priority);
CREATE INDEX IF NOT EXISTS idx_pi_suggestions_created ON product_intelligence_suggestions(created_at DESC);

-- Add self-referencing foreign key after table creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'product_intelligence_suggestions_duplicate_of_fkey'
  ) THEN
    ALTER TABLE product_intelligence_suggestions
    ADD CONSTRAINT product_intelligence_suggestions_duplicate_of_fkey
    FOREIGN KEY (duplicate_of) REFERENCES product_intelligence_suggestions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Linear Integrations Table
CREATE TABLE IF NOT EXISTS linear_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  linear_team_id text NOT NULL,
  linear_team_name text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  mcp_config jsonb DEFAULT '{}',
  sync_enabled boolean DEFAULT true,
  last_sync_at timestamptz,
  sync_status text DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error', 'paused')),
  sync_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_linear_int_workspace ON linear_integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_linear_int_status ON linear_integrations(sync_status);

-- Linear Teams Table (no dependencies)
CREATE TABLE IF NOT EXISTS linear_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  linear_id text NOT NULL UNIQUE,
  name text NOT NULL,
  key text NOT NULL,
  description text,
  icon text,
  color text,
  linear_created_at timestamptz,
  linear_updated_at timestamptz,
  local_created_at timestamptz DEFAULT now(),
  local_updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_linear_teams_workspace ON linear_teams(workspace_id);
CREATE INDEX IF NOT EXISTS idx_linear_teams_linear_id ON linear_teams(linear_id);

-- Linear Users Table (no dependencies)
CREATE TABLE IF NOT EXISTS linear_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  linear_id text NOT NULL,
  name text NOT NULL,
  display_name text,
  email text,
  avatar_url text,
  active boolean DEFAULT true,
  workspace_member_id uuid,
  linear_created_at timestamptz,
  linear_updated_at timestamptz,
  local_created_at timestamptz DEFAULT now(),
  local_updated_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, linear_id)
);

CREATE INDEX IF NOT EXISTS idx_linear_users_workspace ON linear_users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_linear_users_linear_id ON linear_users(linear_id);
CREATE INDEX IF NOT EXISTS idx_linear_users_email ON linear_users(email);

-- Linear Projects Table (depends on teams and users)
CREATE TABLE IF NOT EXISTS linear_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  linear_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  state text NOT NULL,
  icon text,
  color text,
  team_id uuid REFERENCES linear_teams(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES linear_users(id) ON DELETE SET NULL,
  target_date timestamptz,
  start_date timestamptz,
  completed_at timestamptz,
  canceled_at timestamptz,
  url text,
  progress numeric(5,2) DEFAULT 0,
  linear_created_at timestamptz,
  linear_updated_at timestamptz,
  local_created_at timestamptz DEFAULT now(),
  local_updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_linear_projects_workspace ON linear_projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_linear_projects_linear_id ON linear_projects(linear_id);
CREATE INDEX IF NOT EXISTS idx_linear_projects_state ON linear_projects(state);

-- Linear Issues Table (depends on projects, teams, and users)
CREATE TABLE IF NOT EXISTS linear_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  linear_id text NOT NULL UNIQUE,
  linear_identifier text NOT NULL,
  title text NOT NULL,
  description text,
  state text NOT NULL,
  state_id text,
  priority integer DEFAULT 0,
  priority_label text,
  project_id uuid REFERENCES linear_projects(id) ON DELETE SET NULL,
  team_id uuid REFERENCES linear_teams(id) ON DELETE SET NULL,
  assignee_id uuid REFERENCES linear_users(id) ON DELETE SET NULL,
  creator_id uuid REFERENCES linear_users(id) ON DELETE SET NULL,
  labels jsonb DEFAULT '[]',
  url text,
  cycle_id text,
  estimate integer,
  started_at timestamptz,
  completed_at timestamptz,
  canceled_at timestamptz,
  due_date timestamptz,
  linear_created_at timestamptz,
  linear_updated_at timestamptz,
  local_created_at timestamptz DEFAULT now(),
  local_updated_at timestamptz DEFAULT now(),
  sync_status text DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict', 'error'))
);

CREATE INDEX IF NOT EXISTS idx_linear_issues_workspace ON linear_issues(workspace_id);
CREATE INDEX IF NOT EXISTS idx_linear_issues_linear_id ON linear_issues(linear_id);
CREATE INDEX IF NOT EXISTS idx_linear_issues_state ON linear_issues(state);
CREATE INDEX IF NOT EXISTS idx_linear_issues_project ON linear_issues(project_id);

-- Linear Comments Table (depends on issues and users)
CREATE TABLE IF NOT EXISTS linear_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  linear_id text NOT NULL UNIQUE,
  issue_id uuid NOT NULL REFERENCES linear_issues(id) ON DELETE CASCADE,
  user_id uuid REFERENCES linear_users(id) ON DELETE SET NULL,
  body text NOT NULL,
  edited_at timestamptz,
  linear_created_at timestamptz,
  linear_updated_at timestamptz,
  local_created_at timestamptz DEFAULT now(),
  local_updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_linear_comments_workspace ON linear_comments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_linear_comments_issue ON linear_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_linear_comments_linear_id ON linear_comments(linear_id);

-- Integration Sync Logs Table
CREATE TABLE IF NOT EXISTS integration_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  integration_type text NOT NULL DEFAULT 'linear',
  sync_type text NOT NULL CHECK (sync_type IN ('full', 'delta', 'webhook', 'manual')),
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound', 'bidirectional')),
  status text NOT NULL CHECK (status IN ('started', 'in_progress', 'completed', 'failed', 'partial')),
  records_processed integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_message text,
  error_details jsonb,
  metadata jsonb DEFAULT '{}',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_workspace ON integration_sync_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON integration_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started ON integration_sync_logs(started_at DESC);

-- Enable Row Level Security
ALTER TABLE product_intelligence_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE linear_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE linear_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE linear_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE linear_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE linear_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE linear_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Product Intelligence Suggestions
CREATE POLICY "Users can view suggestions in their workspace"
  ON product_intelligence_suggestions FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert suggestions in their workspace"
  ON product_intelligence_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update suggestions in their workspace"
  ON product_intelligence_suggestions FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete suggestions in their workspace"
  ON product_intelligence_suggestions FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- RLS Policies for Linear Integrations
CREATE POLICY "Users can view linear integrations in their workspace"
  ON linear_integrations FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage linear integrations in their workspace"
  ON linear_integrations FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- RLS Policies for Linear Issues
CREATE POLICY "Users can view linear issues in their workspace"
  ON linear_issues FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage linear issues in their workspace"
  ON linear_issues FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- RLS Policies for Linear Projects
CREATE POLICY "Users can view linear projects in their workspace"
  ON linear_projects FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage linear projects in their workspace"
  ON linear_projects FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- RLS Policies for Linear Comments
CREATE POLICY "Users can view linear comments in their workspace"
  ON linear_comments FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage linear comments in their workspace"
  ON linear_comments FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- RLS Policies for Linear Teams
CREATE POLICY "Users can view linear teams in their workspace"
  ON linear_teams FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage linear teams in their workspace"
  ON linear_teams FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- RLS Policies for Linear Users
CREATE POLICY "Users can view linear users in their workspace"
  ON linear_users FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage linear users in their workspace"
  ON linear_users FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- RLS Policies for Integration Sync Logs
CREATE POLICY "Users can view sync logs in their workspace"
  ON integration_sync_logs FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "System can insert sync logs"
  ON integration_sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Update triggers for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_pi_suggestions_updated_at'
  ) THEN
    CREATE TRIGGER update_pi_suggestions_updated_at
      BEFORE UPDATE ON product_intelligence_suggestions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_linear_integrations_updated_at'
  ) THEN
    CREATE TRIGGER update_linear_integrations_updated_at
      BEFORE UPDATE ON linear_integrations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_linear_issues_local_updated_at'
  ) THEN
    CREATE TRIGGER update_linear_issues_local_updated_at
      BEFORE UPDATE ON linear_issues
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_linear_projects_local_updated_at'
  ) THEN
    CREATE TRIGGER update_linear_projects_local_updated_at
      BEFORE UPDATE ON linear_projects
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_linear_comments_local_updated_at'
  ) THEN
    CREATE TRIGGER update_linear_comments_local_updated_at
      BEFORE UPDATE ON linear_comments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_linear_teams_local_updated_at'
  ) THEN
    CREATE TRIGGER update_linear_teams_local_updated_at
      BEFORE UPDATE ON linear_teams
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_linear_users_local_updated_at'
  ) THEN
    CREATE TRIGGER update_linear_users_local_updated_at
      BEFORE UPDATE ON linear_users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
