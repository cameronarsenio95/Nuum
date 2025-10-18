/*
  # Email Notification System

  ## Overview
  Complete email notification system for NUUM platform with Resend.com integration.
  Supports transactional emails, support tickets, campaigns, and marketing emails.

  ## New Tables

  ### email_templates
  Stores reusable email templates with HTML content and variables:
  - Template name, subject line, and description
  - HTML body with variable placeholders ({{variable_name}})
  - Plain text fallback
  - Template category for organization
  - Active status for enable/disable

  ### email_notifications
  Tracks all sent emails with delivery status:
  - Reference to template and recipient
  - Email content (rendered HTML and plain text)
  - Delivery status (queued, sent, delivered, failed, bounced)
  - Resend message ID for tracking
  - Open and click tracking
  - Error details for debugging

  ### email_preferences
  User preferences for email notifications:
  - Notification type preferences (marketing, transactional, digest)
  - Frequency settings (instant, daily, weekly)
  - Quiet hours configuration
  - Unsubscribe status per category

  ### email_queue
  Reliable email queue for batch processing:
  - Priority levels for urgent emails
  - Scheduled send time for delayed emails
  - Retry count and error tracking
  - Processing status

  ### email_logs
  Audit trail for all email activities:
  - Action type (sent, delivered, opened, clicked, bounced, failed)
  - Timestamp and metadata
  - Related entities (workspace, user, ticket)

  ## Security
  - Enable RLS on all tables
  - Users can only view their own email notifications
  - Support staff can view all emails for debugging
  - Email preferences are private to each user
*/

-- ============================================================================
-- email_templates table
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  category text NOT NULL CHECK (category IN ('authentication', 'billing', 'support', 'campaign', 'team', 'marketing', 'security')),
  subject text NOT NULL,
  description text,
  html_body text NOT NULL,
  plain_text_body text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_slug ON email_templates(slug);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- ============================================================================
-- email_notifications table
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  html_body text NOT NULL,
  plain_text_body text NOT NULL,
  status text DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),
  resend_message_id text,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  opened_at timestamptz,
  clicked_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_notifications_user ON email_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_notifications_workspace ON email_notifications(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_template ON email_notifications(template_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_resend ON email_notifications(resend_message_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_recipient ON email_notifications(recipient_email);

-- ============================================================================
-- email_preferences table
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Category preferences
  marketing_enabled boolean DEFAULT true,
  product_updates_enabled boolean DEFAULT true,
  transactional_enabled boolean DEFAULT true,
  security_alerts_enabled boolean DEFAULT true,
  
  -- Support preferences
  support_ticket_created boolean DEFAULT true,
  support_ticket_reply boolean DEFAULT true,
  support_ticket_status_change boolean DEFAULT true,
  
  -- Campaign preferences
  campaign_started boolean DEFAULT true,
  campaign_milestone boolean DEFAULT true,
  campaign_completed boolean DEFAULT true,
  
  -- Task preferences
  task_assigned boolean DEFAULT true,
  task_due_soon boolean DEFAULT true,
  task_completed boolean DEFAULT false,
  
  -- Team preferences
  team_invitation boolean DEFAULT true,
  team_member_added boolean DEFAULT true,
  team_member_removed boolean DEFAULT true,
  
  -- Billing preferences
  payment_success boolean DEFAULT true,
  payment_failed boolean DEFAULT true,
  subscription_changed boolean DEFAULT true,
  trial_expiring boolean DEFAULT true,
  
  -- Digest preferences
  daily_digest_enabled boolean DEFAULT false,
  weekly_digest_enabled boolean DEFAULT true,
  digest_day text DEFAULT 'monday' CHECK (digest_day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  
  -- Quiet hours
  quiet_hours_enabled boolean DEFAULT false,
  quiet_hours_start time DEFAULT '22:00',
  quiet_hours_end time DEFAULT '08:00',
  quiet_hours_timezone text DEFAULT 'UTC',
  
  -- General
  unsubscribed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_preferences_user ON email_preferences(user_id);

-- ============================================================================
-- email_queue table
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  html_body text NOT NULL,
  plain_text_body text NOT NULL,
  priority integer DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  scheduled_for timestamptz DEFAULT now(),
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_email_queue_user ON email_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_workspace ON email_queue(workspace_id);

-- ============================================================================
-- email_logs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_notification_id uuid REFERENCES email_notifications(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'complained', 'unsubscribed')),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_notification ON email_logs(email_notification_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_action ON email_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_user ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_workspace ON email_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);

-- ============================================================================
-- Enable RLS
-- ============================================================================

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies - email_templates
-- ============================================================================

-- Anyone can view active templates (for testing)
CREATE POLICY "Anyone can view active templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Support staff can manage templates
CREATE POLICY "Support staff can manage templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_staff
      WHERE support_staff.id = auth.uid()
      AND support_staff.is_active = true
    )
  );

-- ============================================================================
-- RLS Policies - email_notifications
-- ============================================================================

-- Users can view their own email notifications
CREATE POLICY "Users can view own email notifications"
  ON email_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Workspace members can view workspace email notifications
CREATE POLICY "Workspace members can view workspace emails"
  ON email_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = email_notifications.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

-- Support staff can view all notifications
CREATE POLICY "Support staff can view all notifications"
  ON email_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_staff
      WHERE support_staff.id = auth.uid()
      AND support_staff.is_active = true
    )
  );

-- ============================================================================
-- RLS Policies - email_preferences
-- ============================================================================

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON email_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON email_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON email_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- RLS Policies - email_queue
-- ============================================================================

-- Users can view their own queued emails
CREATE POLICY "Users can view own queued emails"
  ON email_queue FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Support staff can view all queued emails
CREATE POLICY "Support staff can view all queued emails"
  ON email_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_staff
      WHERE support_staff.id = auth.uid()
      AND support_staff.is_active = true
    )
  );

-- ============================================================================
-- RLS Policies - email_logs
-- ============================================================================

-- Users can view their own email logs
CREATE POLICY "Users can view own email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Workspace members can view workspace email logs
CREATE POLICY "Workspace members can view workspace email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = email_logs.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

-- Support staff can view all email logs
CREATE POLICY "Support staff can view all email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_staff
      WHERE support_staff.id = auth.uid()
      AND support_staff.is_active = true
    )
  );

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

-- Function to create default email preferences for new users
CREATE OR REPLACE FUNCTION create_default_email_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO email_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create preferences when user signs up
DROP TRIGGER IF EXISTS trigger_create_email_preferences ON auth.users;
CREATE TRIGGER trigger_create_email_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_email_preferences();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_updated_at();

DROP TRIGGER IF EXISTS update_email_notifications_updated_at ON email_notifications;
CREATE TRIGGER update_email_notifications_updated_at
  BEFORE UPDATE ON email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_email_updated_at();

DROP TRIGGER IF EXISTS update_email_preferences_updated_at ON email_preferences;
CREATE TRIGGER update_email_preferences_updated_at
  BEFORE UPDATE ON email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_email_updated_at();

-- Function to log email actions
CREATE OR REPLACE FUNCTION log_email_action()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO email_logs (
      email_notification_id,
      action,
      workspace_id,
      user_id,
      recipient_email,
      metadata
    ) VALUES (
      NEW.id,
      NEW.status,
      NEW.workspace_id,
      NEW.user_id,
      NEW.recipient_email,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'error_message', NEW.error_message
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log status changes
DROP TRIGGER IF EXISTS trigger_log_email_status ON email_notifications;
CREATE TRIGGER trigger_log_email_status
  AFTER UPDATE ON email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION log_email_action();
