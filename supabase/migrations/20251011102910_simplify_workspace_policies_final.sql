/*
  # Simplify Workspace Policies to Remove All Recursion

  ## Problem
  Still experiencing recursion between workspaces and workspace_members

  ## Solution
  Use the most direct approach - only allow workspace owners to see their workspaces initially.
  Member access can be handled at application level or through a different approach.

  ## Changes
  1. Simplify workspace SELECT policy to only check owner_id
  2. Remove the policy that checks workspace_members to avoid recursion
*/

-- Drop existing workspace SELECT policies
DROP POLICY IF EXISTS "Users can view their own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can view workspaces where they are members" ON workspaces;

-- Create single, simple SELECT policy
CREATE POLICY "Users can view workspaces"
  ON workspaces FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
  );
