/*
  # Fix Content Media RLS Infinite Recursion

  1. Changes
    - Drop existing RLS policies that cause recursion via workspace_members
    - Create simplified policies that only check workspace ownership
    - Avoid any joins or subqueries that could cause infinite recursion

  2. Security
    - Workspace owners can manage all content in their workspace
    - Policies are simple and direct without recursive checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Workspace members can view content" ON content_media;
DROP POLICY IF EXISTS "Workspace members can upload content" ON content_media;
DROP POLICY IF EXISTS "Users can update their content" ON content_media;
DROP POLICY IF EXISTS "Users can delete their content" ON content_media;

-- Create simplified policies that avoid recursion

-- Policy: Workspace owners can view all content
CREATE POLICY "Workspace owners can view content"
  ON content_media FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = content_media.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- Policy: Workspace owners can upload content
CREATE POLICY "Workspace owners can upload content"
  ON content_media FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = content_media.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- Policy: Workspace owners can update content
CREATE POLICY "Workspace owners can update content"
  ON content_media FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = content_media.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = content_media.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- Policy: Workspace owners can delete content
CREATE POLICY "Workspace owners can delete content"
  ON content_media FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = content_media.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );