/*
  # Support Tickets System

  ## Overview
  Creates a support ticket system that connects customer inquiries from the Contact page
  to the Support Portal dashboard for support staff to manage and respond.

  ## New Tables

  ### support_tickets
  Stores customer support tickets with messages, status tracking, and priority levels:
  - Customers can submit tickets from Contact page
  - Support staff can view, respond, and manage tickets
  - Automatic linking to users and workspaces
  - Full status tracking (open, in_progress, resolved, closed)
  - Priority levels (low, medium, high, urgent)

  ### support_ticket_messages
  Stores messages/replies within tickets:
  - Support staff responses
  - Customer follow-ups
  - Internal notes
  - Message timestamps and metadata

  ## Security
  - Customers can only view/create their own tickets
  - Support staff can view and manage all tickets
  - RLS policies enforce proper access control
  - All ticket actions are auditable
*/

-- ============================================================================
-- Create support_tickets table
-- ============================================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  subject text NOT NULL,
  message text NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to uuid REFERENCES support_staff(id) ON DELETE SET NULL,
  user_email text NOT NULL,
  user_name text NOT NULL,
  category text DEFAULT 'general' CHECK (category IN ('general', 'billing', 'technical', 'feature_request', 'bug_report')),
  tags text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Generate ticket numbers automatically
CREATE SEQUENCE IF NOT EXISTS support_ticket_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
BEGIN
  RETURN 'TICKET-' || LPAD(nextval('support_ticket_number_seq')::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number = generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_ticket_number ON support_tickets;
CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_workspace ON support_tickets(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON support_tickets(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON support_tickets(ticket_number);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Customers can view their own tickets
CREATE POLICY "Users view own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Customers can create tickets
CREATE POLICY "Users create own tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Support staff can view all tickets
CREATE POLICY "Support staff view all tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_staff ss
      WHERE ss.id = auth.uid() AND ss.is_active = true
    )
  );

-- Support staff can update tickets
CREATE POLICY "Support staff update tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_staff ss
      WHERE ss.id = auth.uid() AND ss.is_active = true
    )
  );

-- ============================================================================
-- Create support_ticket_messages table
-- ============================================================================

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  author_email text NOT NULL,
  author_type text NOT NULL CHECK (author_type IN ('customer', 'support', 'system')),
  message text NOT NULL,
  is_internal boolean DEFAULT false,
  attachments jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_ticket ON support_ticket_messages(ticket_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_author ON support_ticket_messages(author_id);

-- Enable RLS
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Customers can view non-internal messages on their tickets
CREATE POLICY "Users view own ticket messages"
  ON support_ticket_messages FOR SELECT
  TO authenticated
  USING (
    is_internal = false AND
    EXISTS (
      SELECT 1 FROM support_tickets st
      WHERE st.id = ticket_id AND st.user_id = auth.uid()
    )
  );

-- Customers can create messages on their tickets
CREATE POLICY "Users create messages on own tickets"
  ON support_ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets st
      WHERE st.id = ticket_id AND st.user_id = auth.uid()
    )
  );

-- Support staff can view all messages including internal
CREATE POLICY "Support staff view all messages"
  ON support_ticket_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_staff ss
      WHERE ss.id = auth.uid() AND ss.is_active = true
    )
  );

-- Support staff can create messages
CREATE POLICY "Support staff create messages"
  ON support_ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_staff ss
      WHERE ss.id = auth.uid() AND ss.is_active = true
    )
  );

-- ============================================================================
-- Create triggers and functions
-- ============================================================================

-- Update ticket updated_at timestamp
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ticket_timestamp ON support_tickets;
CREATE TRIGGER trigger_update_ticket_timestamp
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_timestamp();

-- Update ticket status timestamps
CREATE OR REPLACE FUNCTION update_ticket_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = now();
  END IF;

  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_status_timestamps ON support_tickets;
CREATE TRIGGER trigger_update_status_timestamps
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_status_timestamps();

-- Update ticket timestamp when messages are added
CREATE OR REPLACE FUNCTION update_ticket_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE support_tickets
  SET updated_at = now()
  WHERE id = NEW.ticket_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ticket_on_message ON support_ticket_messages;
CREATE TRIGGER trigger_update_ticket_on_message
  AFTER INSERT ON support_ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_on_message();
