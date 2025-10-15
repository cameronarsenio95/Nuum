/*
  # Fix Creators RLS Policies - Remove Recursive Policies

  ## Problem
  There are duplicate policies on the creators table:
  - Old policies that reference workspace_members (causing infinite recursion)
  - New policies that only reference workspaces (working correctly)

  ## Solution
  Remove the old policies that cause recursion and keep only the simple ones

  ## Changes
  1. Drop old workspace_members-based policies
  2. Keep only the workspace owner-based policies
*/

-- Remove old policies that reference workspace_members (causing recursion)
DROP POLICY IF EXISTS "Workspace members can view creators" ON creators;
DROP POLICY IF EXISTS "Members and above can create creators" ON creators;
DROP POLICY IF EXISTS "Members and above can update creators" ON creators;
DROP POLICY IF EXISTS "Admins and owners can delete creators" ON creators;

-- The correct policies are already in place:
-- "Users can view creators"
-- "Users can create creators"
-- "Users can update creators"
-- "Users can delete creators"
