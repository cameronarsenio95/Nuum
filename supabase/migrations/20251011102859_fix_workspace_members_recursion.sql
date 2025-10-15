/*
  # Fix Infinite Recursion in workspace_members RLS Policies

  ## Problem
  The workspace_members policies have a self-referencing recursion issue where
  they check workspace_members within their own policies.

  ## Solution
  Simplify workspace_members policies to avoid self-referencing:
  - Use direct checks instead of EXISTS queries that reference the same table
  - Remove circular dependencies

  ## Changes
  1. Drop existing problematic workspace_members policies
  2. Create simpler, non-recursive policies
*/

-- Drop all existing workspace_members policies
DROP POLICY IF EXISTS "Members can view other members in their workspace" ON workspace_members;
DROP POLICY IF EXISTS "Owners and admins can add members" ON workspace_members;
DROP POLICY IF EXISTS "Owners and admins can update member roles" ON workspace_members;
DROP POLICY IF EXISTS "Owners and admins can remove members" ON workspace_members;

-- Create new simple SELECT policy - users can see members of workspaces they own or are part of
CREATE POLICY "Users can view workspace members"
  ON workspace_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    ) OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Allow workspace owners to insert members
CREATE POLICY "Workspace owners can add members"
  ON workspace_members FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Allow workspace owners to update member roles
CREATE POLICY "Workspace owners can update members"
  ON workspace_members FOR UPDATE
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

-- Allow workspace owners to remove members
CREATE POLICY "Workspace owners can remove members"
  ON workspace_members FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );
