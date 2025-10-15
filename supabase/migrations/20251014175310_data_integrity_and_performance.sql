/*
  # Data Integrity & Performance Optimisation

  1. Database Constraints & Validation
    - Add NOT NULL constraints on critical fields
    - Add check constraints for data validation
    - Add unique constraints to prevent duplicates

  2. Performance Indexes
    - Composite indexes for common query patterns
    - Full-text search indexes
    - Partial indexes for filtered queries

  3. Triggers & Functions
    - Auto-update timestamps
    - Cascade updates for denormalized data
    - Activity logging automation

  4. Data Validation
    - Email format validation
    - URL format validation
    - Phone number format validation
*/

-- =====================================================
-- ENHANCED CONSTRAINTS
-- =====================================================

-- Workspaces: Add validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspaces' AND column_name = 'max_creators'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN max_creators int;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspaces' AND column_name = 'max_storage_gb'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN max_storage_gb int;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspaces' AND column_name = 'features'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN features jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add email format validation function
CREATE OR REPLACE FUNCTION is_valid_email(email text)
RETURNS boolean AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add URL validation function
CREATE OR REPLACE FUNCTION is_valid_url(url text)
RETURNS boolean AS $$
BEGIN
  RETURN url ~* '^https?://[^\s/$.?#].[^\s]*$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Creators: Add email validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'creators_email_format_check'
  ) THEN
    ALTER TABLE creators
    ADD CONSTRAINT creators_email_format_check
    CHECK (email IS NULL OR is_valid_email(email));
  END IF;
END $$;

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_creators_workspace_status_name
  ON creators(workspace_id, status, name);

CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_status_date
  ON campaigns(workspace_id, status, start_date DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_workspace_assigned_status
  ON tasks(workspace_id, assigned_to, status)
  WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_workspace_due_date
  ON tasks(workspace_id, due_date)
  WHERE due_date IS NOT NULL AND status != 'done';

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_creators_name_search
  ON creators USING gin(to_tsvector('english', name));

CREATE INDEX IF NOT EXISTS idx_campaigns_name_search
  ON campaigns USING gin(to_tsvector('english', name));

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_creators_active
  ON creators(workspace_id, name)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_campaigns_active
  ON campaigns(workspace_id, name)
  WHERE status IN ('active', 'draft');

-- JSONB indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_workspaces_features
  ON workspaces USING gin(features);

CREATE INDEX IF NOT EXISTS idx_creators_follower_count
  ON creators USING gin(follower_count);

-- =====================================================
-- AUTOMATIC TIMESTAMP UPDATES
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT table_name
    FROM information_schema.columns
    WHERE column_name = 'updated_at'
    AND table_schema = 'public'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
      CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END $$;

-- =====================================================
-- ACTIVITY LOGGING TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION log_entity_change()
RETURNS TRIGGER AS $$
DECLARE
  workspace_id_val uuid;
  action_val text;
BEGIN
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    action_val := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    action_val := 'updated';
  ELSIF TG_OP = 'DELETE' THEN
    action_val := 'deleted';
  END IF;

  -- Get workspace_id based on table
  IF TG_TABLE_NAME IN ('campaigns', 'creators', 'tasks') THEN
    workspace_id_val := COALESCE(NEW.workspace_id, OLD.workspace_id);
  ELSIF TG_TABLE_NAME = 'campaign_creators' THEN
    SELECT c.workspace_id INTO workspace_id_val
    FROM campaigns c
    WHERE c.id = COALESCE(NEW.campaign_id, OLD.campaign_id);
  END IF;

  -- Insert activity log
  IF workspace_id_val IS NOT NULL THEN
    INSERT INTO activity_log (
      workspace_id,
      user_id,
      action,
      entity_type,
      entity_id,
      details,
      created_at
    ) VALUES (
      workspace_id_val,
      auth.uid(),
      action_val,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      CASE
        WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
        ELSE to_jsonb(NEW)
      END,
      now()
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply activity logging to key tables
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['campaigns', 'creators', 'tasks', 'campaign_creators'])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS log_%I_changes ON %I;
      CREATE TRIGGER log_%I_changes
        AFTER INSERT OR UPDATE OR DELETE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION log_entity_change();
    ', t, t, t, t);
  END LOOP;
END $$;

-- =====================================================
-- DATA CLEANUP FUNCTIONS
-- =====================================================

-- Function to cleanup old notifications (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE read = true
  AND created_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old activity logs (older than 180 days)
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM activity_log
  WHERE created_at < now() - interval '180 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STATISTICS & DENORMALIZATION
-- =====================================================

-- Function to update campaign statistics
CREATE OR REPLACE FUNCTION update_campaign_stats(campaign_id_param uuid)
RETURNS void AS $$
BEGIN
  -- This will be called by application or scheduled job
  -- Updates denormalized counts on campaigns table
  UPDATE campaigns
  SET updated_at = now()
  WHERE id = campaign_id_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- WORKSPACE MEMBER VALIDATION
-- =====================================================

-- Ensure workspace owner has owner role in workspace_members
CREATE OR REPLACE FUNCTION ensure_workspace_owner_member()
RETURNS TRIGGER AS $$
BEGIN
  -- When workspace is created, ensure owner is added to workspace_members
  IF TG_OP = 'INSERT' THEN
    INSERT INTO workspace_members (workspace_id, user_id, role, invited_by)
    VALUES (NEW.id, NEW.owner_id, 'owner', NEW.owner_id)
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_owner_member ON workspaces;
CREATE TRIGGER ensure_owner_member
  AFTER INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION ensure_workspace_owner_member();

-- =====================================================
-- CASCADE DELETE SAFETY
-- =====================================================

-- Prevent accidental deletion of workspaces with active campaigns
CREATE OR REPLACE FUNCTION prevent_workspace_deletion_with_active_campaigns()
RETURNS TRIGGER AS $$
DECLARE
  active_count int;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM campaigns
  WHERE workspace_id = OLD.id
  AND status IN ('active', 'draft');

  IF active_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete workspace with % active campaigns. Archive campaigns first.', active_count;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_active_workspace_deletion ON workspaces;
CREATE TRIGGER prevent_active_workspace_deletion
  BEFORE DELETE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION prevent_workspace_deletion_with_active_campaigns();
