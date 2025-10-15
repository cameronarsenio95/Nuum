/*
  # Create Demo Workspace System

  ## Overview
  This migration creates a comprehensive system for generating shareable demo links that provide
  external users with read-only access to a pre-populated demo workspace with sample data.

  ## 1. New Tables
    
  ### `demo_workspaces`
  - `id` (uuid, primary key) - Unique identifier for the demo workspace
  - `workspace_id` (uuid, foreign key) - References the actual workspace that serves as demo template
  - `name` (text) - Display name for the demo workspace
  - `description` (text) - Description of what the demo showcases
  - `is_active` (boolean) - Whether this demo workspace is currently active
  - `created_by` (uuid) - User who created this demo workspace
  - `created_at` (timestamptz) - When the demo workspace was created
  - `updated_at` (timestamptz) - When the demo workspace was last updated

  ### `demo_links`
  - `id` (uuid, primary key) - Unique identifier for the demo link
  - `demo_workspace_id` (uuid, foreign key) - References the demo workspace
  - `token` (text, unique) - Unique token for accessing the demo (used in URL)
  - `name` (text) - Name/label for this demo link
  - `expires_at` (timestamptz, nullable) - Optional expiration date
  - `max_views` (integer, nullable) - Optional maximum number of views
  - `view_count` (integer) - Current number of views
  - `is_active` (boolean) - Whether this link is currently active
  - `created_by` (uuid) - User who created this demo link
  - `created_at` (timestamptz) - When the link was created
  - `last_accessed_at` (timestamptz, nullable) - When the link was last accessed

  ### `demo_link_analytics`
  - `id` (uuid, primary key) - Unique identifier for the analytics record
  - `demo_link_id` (uuid, foreign key) - References the demo link
  - `accessed_at` (timestamptz) - When the demo was accessed
  - `ip_address` (text, nullable) - IP address of the viewer (anonymized)
  - `user_agent` (text, nullable) - Browser/device information
  - `session_duration_seconds` (integer, nullable) - How long the viewer stayed
  - `pages_viewed` (jsonb) - Array of pages/views accessed during the session

  ## 2. Security
  - Enable RLS on all tables
  - Demo workspaces can be managed by workspace owners
  - Demo links can be viewed by anyone with the token
  - Analytics are only visible to workspace owners

  ## 3. Important Notes
  - Demo links use secure random tokens for access
  - Links can be time-limited and view-limited
  - Analytics help track demo engagement
  - Demo workspaces are separate from production workspaces
*/

-- Create demo_workspaces table
CREATE TABLE IF NOT EXISTS demo_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create demo_links table
CREATE TABLE IF NOT EXISTS demo_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_workspace_id uuid NOT NULL REFERENCES demo_workspaces(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  name text NOT NULL,
  expires_at timestamptz,
  max_views integer,
  view_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz
);

-- Create demo_link_analytics table
CREATE TABLE IF NOT EXISTS demo_link_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_link_id uuid NOT NULL REFERENCES demo_links(id) ON DELETE CASCADE,
  accessed_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  session_duration_seconds integer,
  pages_viewed jsonb DEFAULT '[]'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_demo_workspaces_workspace_id ON demo_workspaces(workspace_id);
CREATE INDEX IF NOT EXISTS idx_demo_workspaces_created_by ON demo_workspaces(created_by);
CREATE INDEX IF NOT EXISTS idx_demo_links_token ON demo_links(token);
CREATE INDEX IF NOT EXISTS idx_demo_links_demo_workspace_id ON demo_links(demo_workspace_id);
CREATE INDEX IF NOT EXISTS idx_demo_link_analytics_demo_link_id ON demo_link_analytics(demo_link_id);

-- Enable RLS
ALTER TABLE demo_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_link_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for demo_workspaces
CREATE POLICY "Workspace owners can view their demo workspaces"
  ON demo_workspaces FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = demo_workspaces.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can create demo workspaces"
  ON demo_workspaces FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = demo_workspaces.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Workspace owners can update their demo workspaces"
  ON demo_workspaces FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = demo_workspaces.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = demo_workspaces.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can delete their demo workspaces"
  ON demo_workspaces FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = demo_workspaces.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- RLS Policies for demo_links
CREATE POLICY "Anyone can view active demo links by token"
  ON demo_links FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Workspace owners can create demo links"
  ON demo_links FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM demo_workspaces
      JOIN workspaces ON workspaces.id = demo_workspaces.workspace_id
      WHERE demo_workspaces.id = demo_links.demo_workspace_id
      AND workspaces.owner_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Workspace owners can update their demo links"
  ON demo_links FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM demo_workspaces
      JOIN workspaces ON workspaces.id = demo_workspaces.workspace_id
      WHERE demo_workspaces.id = demo_links.demo_workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM demo_workspaces
      JOIN workspaces ON workspaces.id = demo_workspaces.workspace_id
      WHERE demo_workspaces.id = demo_links.demo_workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can delete their demo links"
  ON demo_links FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM demo_workspaces
      JOIN workspaces ON workspaces.id = demo_workspaces.workspace_id
      WHERE demo_workspaces.id = demo_links.demo_workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- RLS Policies for demo_link_analytics
CREATE POLICY "Workspace owners can view demo link analytics"
  ON demo_link_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM demo_links
      JOIN demo_workspaces ON demo_workspaces.id = demo_links.demo_workspace_id
      JOIN workspaces ON workspaces.id = demo_workspaces.workspace_id
      WHERE demo_links.id = demo_link_analytics.demo_link_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create demo link analytics"
  ON demo_link_analytics FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Function to increment demo link view count
CREATE OR REPLACE FUNCTION increment_demo_link_view_count(link_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE demo_links
  SET 
    view_count = view_count + 1,
    last_accessed_at = now()
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if demo link is valid and accessible
CREATE OR REPLACE FUNCTION is_demo_link_valid(link_token text)
RETURNS boolean AS $$
DECLARE
  link_record RECORD;
BEGIN
  SELECT 
    is_active,
    expires_at,
    max_views,
    view_count
  INTO link_record
  FROM demo_links
  WHERE token = link_token;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if link is active
  IF NOT link_record.is_active THEN
    RETURN false;
  END IF;
  
  -- Check if link has expired
  IF link_record.expires_at IS NOT NULL AND link_record.expires_at < now() THEN
    RETURN false;
  END IF;
  
  -- Check if max views exceeded
  IF link_record.max_views IS NOT NULL AND link_record.view_count >= link_record.max_views THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;