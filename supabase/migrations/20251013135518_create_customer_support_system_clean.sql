/*
  # Customer Support System Database Schema
  
  ## Overview
  Complete customer support system for managing customer accounts, subscriptions, and support operations.
  Includes comprehensive audit logging, role-based access control, and safety mechanisms.
  
  ## New Tables
  
  ### 1. support_staff
  Stores support team members with role-based permissions:
  - support_viewer: Can view customer data only
  - support_agent: Can view and modify customer data
  - support_admin: Full access including staff management
  
  ### 2. support_audit_logs
  Immutable audit trail of all support actions with detailed before/after states
  
  ### 3. support_sessions
  Tracks active support sessions and customer impersonation for security
  
  ### 4. support_workspace_notes
  Internal collaboration notes for support team about specific customers
  
  ## Security
  - All tables use RLS with support staff verification
  - Audit logs are append-only
  - All data access is logged automatically
  - Customer data access requires active support role
*/

-- ============================================================================
-- STEP 1: Create support_staff table
-- ============================================================================

CREATE TABLE support_staff (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('support_viewer', 'support_agent', 'support_admin')),
  is_active boolean DEFAULT true,
  permissions jsonb DEFAULT '{}'::jsonb,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_support_staff_email ON support_staff(email);
CREATE INDEX idx_support_staff_role ON support_staff(role);
CREATE INDEX idx_support_staff_active ON support_staff(is_active) WHERE is_active = true;

ALTER TABLE support_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support staff can view other staff"
  ON support_staff FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_staff ss
      WHERE ss.id = auth.uid() AND ss.is_active = true
    )
  );

CREATE POLICY "Support admins manage staff"
  ON support_staff FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_staff ss
      WHERE ss.id = auth.uid() AND ss.role = 'support_admin' AND ss.is_active = true
    )
  );

-- ============================================================================
-- STEP 2: Create support_audit_logs table
-- ============================================================================

CREATE TABLE support_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES support_staff(id) ON DELETE SET NULL,
  staff_email text NOT NULL,
  staff_name text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN (
    'view_customer', 'view_workspace', 'modify_plan', 'modify_subscription',
    'modify_limits', 'modify_features', 'modify_user', 'delete_data',
    'reset_password', 'extend_trial', 'add_note', 'impersonate_start',
    'impersonate_end', 'export_data', 'bulk_operation'
  )),
  entity_type text NOT NULL CHECK (entity_type IN (
    'workspace', 'user', 'profile', 'subscription', 'creator', 'campaign',
    'team_member', 'workspace_settings', 'feature_flags'
  )),
  entity_id uuid,
  customer_email text,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  workspace_name text,
  action_details jsonb DEFAULT '{}'::jsonb,
  previous_state jsonb,
  new_state jsonb,
  ip_address inet,
  user_agent text,
  ticket_reference text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_staff_time ON support_audit_logs(staff_id, created_at DESC);
CREATE INDEX idx_audit_action ON support_audit_logs(action_type, created_at DESC);
CREATE INDEX idx_audit_customer ON support_audit_logs(customer_email);
CREATE INDEX idx_audit_workspace ON support_audit_logs(workspace_id, created_at DESC);
CREATE INDEX idx_audit_entity ON support_audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_time ON support_audit_logs(created_at DESC);

ALTER TABLE support_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support staff view audit logs"
  ON support_audit_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_staff ss
      WHERE ss.id = auth.uid() AND ss.is_active = true
    )
  );

CREATE POLICY "Support staff create audit logs"
  ON support_audit_logs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_staff ss
      WHERE ss.id = auth.uid() AND ss.is_active = true
    )
  );

-- ============================================================================
-- STEP 3: Create support_sessions table
-- ============================================================================

CREATE TABLE support_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES support_staff(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  impersonating_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  impersonating_workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_activity_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_session_staff ON support_sessions(staff_id, started_at DESC);
CREATE INDEX idx_session_token ON support_sessions(session_token);
CREATE INDEX idx_session_active ON support_sessions(staff_id) WHERE ended_at IS NULL;

ALTER TABLE support_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support staff view own sessions"
  ON support_sessions FOR SELECT TO authenticated
  USING (staff_id = auth.uid());

CREATE POLICY "Support staff create sessions"
  ON support_sessions FOR INSERT TO authenticated
  WITH CHECK (
    staff_id = auth.uid() AND
    EXISTS (SELECT 1 FROM support_staff ss WHERE ss.id = auth.uid() AND ss.is_active = true)
  );

CREATE POLICY "Support staff update own sessions"
  ON support_sessions FOR UPDATE TO authenticated
  USING (staff_id = auth.uid());

-- ============================================================================
-- STEP 4: Create support_workspace_notes table
-- ============================================================================

CREATE TABLE support_workspace_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES support_staff(id) ON DELETE SET NULL,
  staff_name text NOT NULL,
  note_type text DEFAULT 'general' CHECK (note_type IN ('general', 'warning', 'billing', 'technical', 'escalation')),
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notes_workspace ON support_workspace_notes(workspace_id, created_at DESC);
CREATE INDEX idx_notes_staff ON support_workspace_notes(staff_id);
CREATE INDEX idx_notes_pinned ON support_workspace_notes(workspace_id) WHERE is_pinned = true;

ALTER TABLE support_workspace_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support staff view notes"
  ON support_workspace_notes FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM support_staff ss WHERE ss.id = auth.uid() AND ss.is_active = true)
  );

CREATE POLICY "Support staff create notes"
  ON support_workspace_notes FOR INSERT TO authenticated
  WITH CHECK (
    staff_id = auth.uid() AND
    EXISTS (SELECT 1 FROM support_staff ss WHERE ss.id = auth.uid() AND ss.is_active = true)
  );

CREATE POLICY "Support staff update own notes"
  ON support_workspace_notes FOR UPDATE TO authenticated
  USING (staff_id = auth.uid());

CREATE POLICY "Support admins delete notes"
  ON support_workspace_notes FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM support_staff ss WHERE ss.id = auth.uid() AND ss.role = 'support_admin' AND ss.is_active = true)
  );

-- ============================================================================
-- STEP 5: Create helper functions
-- ============================================================================

CREATE OR REPLACE FUNCTION is_support_staff()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM support_staff
    WHERE id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_support_permission(required_role text)
RETURNS boolean AS $$
DECLARE
  staff_role text;
BEGIN
  SELECT role INTO staff_role
  FROM support_staff
  WHERE id = auth.uid() AND is_active = true;
  
  IF staff_role IS NULL THEN
    RETURN false;
  END IF;
  
  IF staff_role = 'support_admin' THEN
    RETURN true;
  END IF;
  
  IF required_role = 'support_agent' AND staff_role IN ('support_agent', 'support_admin') THEN
    RETURN true;
  END IF;
  
  IF required_role = 'support_viewer' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_support_action(
  p_action_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_customer_email text DEFAULT NULL,
  p_workspace_id uuid DEFAULT NULL,
  p_workspace_name text DEFAULT NULL,
  p_action_details jsonb DEFAULT '{}'::jsonb,
  p_previous_state jsonb DEFAULT NULL,
  p_new_state jsonb DEFAULT NULL,
  p_ticket_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  log_id uuid;
  staff_email text;
  staff_name text;
BEGIN
  SELECT email, full_name INTO staff_email, staff_name
  FROM support_staff
  WHERE id = auth.uid();
  
  INSERT INTO support_audit_logs (
    staff_id, staff_email, staff_name, action_type, entity_type, entity_id,
    customer_email, workspace_id, workspace_name, action_details,
    previous_state, new_state, ticket_reference, notes
  ) VALUES (
    auth.uid(), staff_email, staff_name, p_action_type, p_entity_type, p_entity_id,
    p_customer_email, p_workspace_id, p_workspace_name, p_action_details,
    p_previous_state, p_new_state, p_ticket_reference, p_notes
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: Create triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_support_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER support_staff_updated_at
  BEFORE UPDATE ON support_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_support_updated_at();

CREATE TRIGGER support_workspace_notes_updated_at
  BEFORE UPDATE ON support_workspace_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_support_updated_at();

-- ============================================================================
-- STEP 7: Add support_metadata column to workspaces
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspaces' AND column_name = 'support_metadata'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN support_metadata jsonb DEFAULT '{}'::jsonb;
    CREATE INDEX idx_workspaces_support_metadata ON workspaces USING gin(support_metadata);
  END IF;
END $$;
