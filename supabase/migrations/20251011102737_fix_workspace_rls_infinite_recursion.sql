/*
  # Fix Infinite Recursion in Workspace RLS Policies

  ## Problem
  The workspace SELECT policy has an infinite recursion because it checks workspace_members, 
  which in turn checks workspaces, creating a circular dependency.

  ## Solution
  Simplify the workspace policies to avoid the circular reference.
  - Allow users to view their own workspaces directly via owner_id
  - Create a separate view or handle member access differently

  ## Changes
  1. Drop existing problematic workspace policies
  2. Create simpler, non-recursive policies
*/

-- Drop the problematic workspace policies
DROP POLICY IF EXISTS "Users can view workspaces they own or are members of" ON workspaces;

-- Create new simple policies for workspaces
CREATE POLICY "Users can view their own workspaces"
  ON workspaces FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can view workspaces where they are members"
  ON workspaces FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Ensure the INSERT policy exists
DROP POLICY IF EXISTS "Users can create their own workspaces" ON workspaces;
CREATE POLICY "Users can create their own workspaces"
  ON workspaces FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Ensure UPDATE policy exists
DROP POLICY IF EXISTS "Workspace owners can update their workspaces" ON workspaces;
CREATE POLICY "Workspace owners can update their workspaces"
  ON workspaces FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Ensure DELETE policy exists
DROP POLICY IF EXISTS "Workspace owners can delete their workspaces" ON workspaces;
CREATE POLICY "Workspace owners can delete their workspaces"
  ON workspaces FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());
