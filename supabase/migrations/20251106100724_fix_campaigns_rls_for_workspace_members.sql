/*
  # Fix Campaigns RLS for Workspace Members
  
  1. Problem
    - Current RLS policies only allow workspace owners to update/delete campaigns
    - Workspace members cannot edit or delete campaigns
  
  2. Solution
    - Create helper function to check workspace access (owner OR member)
    - Update UPDATE and DELETE policies to use this helper function
  
  3. Changes
    - Create `user_has_workspace_access()` function
    - Drop and recreate UPDATE policy for campaigns
    - Drop and recreate DELETE policy for campaigns
*/

-- Create helper function to check if user has access to workspace (as owner or member)
CREATE OR REPLACE FUNCTION user_has_workspace_access(workspace_id_input uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspaces 
    WHERE id = workspace_id_input 
    AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = workspace_id_input
    AND user_id = auth.uid()
  );
END;
$$;

-- Drop old UPDATE policy for campaigns
DROP POLICY IF EXISTS "Users can update campaigns" ON campaigns;

-- Create new UPDATE policy that checks workspace access
CREATE POLICY "Users can update campaigns"
  ON campaigns
  FOR UPDATE
  TO authenticated
  USING (user_has_workspace_access(workspace_id))
  WITH CHECK (user_has_workspace_access(workspace_id));

-- Drop old DELETE policy for campaigns
DROP POLICY IF EXISTS "Users can delete campaigns" ON campaigns;

-- Create new DELETE policy that checks workspace access
CREATE POLICY "Users can delete campaigns"
  ON campaigns
  FOR DELETE
  TO authenticated
  USING (user_has_workspace_access(workspace_id));
