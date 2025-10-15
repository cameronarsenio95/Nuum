/*
  # Fix Notes RLS Policies for Workspace Owners

  1. Changes
    - Update INSERT policy to allow workspace owners to create notes
    - Update SELECT policy to allow workspace owners to view notes
    - Keep existing workspace_members check for team members

  2. Security
    - Workspace owners can always create/view notes in their workspace
    - Team members can create/view notes if they're in workspace_members
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create notes in workspace" ON notes;
DROP POLICY IF EXISTS "Users can view workspace notes" ON notes;

-- Recreate INSERT policy: workspace owners OR workspace members can create notes
CREATE POLICY "Users can create notes in workspace"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      -- Workspace owner can create notes
      workspace_id IN (
        SELECT id FROM workspaces
        WHERE owner_id = auth.uid()
      )
      OR
      -- Workspace member can create notes
      workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
    AND created_by = auth.uid()
  );

-- Recreate SELECT policy: workspace owners OR workspace members can view notes
CREATE POLICY "Users can view workspace notes"
  ON notes FOR SELECT
  TO authenticated
  USING (
    -- Workspace owner can view notes
    workspace_id IN (
      SELECT id FROM workspaces
      WHERE owner_id = auth.uid()
    )
    OR
    -- Workspace member can view notes
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );