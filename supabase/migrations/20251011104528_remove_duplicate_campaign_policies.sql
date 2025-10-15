/*
  # Remove Duplicate and Recursive Campaign Policies

  ## Problem
  There are duplicate policies on the campaigns table:
  - Old policies that reference workspace_members (causing infinite recursion)
  - New policies that only reference workspaces (working correctly)

  ## Solution
  Remove the old policies that cause recursion and keep only the simple ones

  ## Changes
  1. Drop old workspace_members-based policies
  2. Keep only the workspace owner-based policies
*/

-- Remove old policies that reference workspace_members (causing recursion)
DROP POLICY IF EXISTS "Workspace members can view campaigns" ON campaigns;
DROP POLICY IF EXISTS "Members and above can create campaigns" ON campaigns;
DROP POLICY IF EXISTS "Members and above can update campaigns" ON campaigns;
DROP POLICY IF EXISTS "Admins and owners can delete campaigns" ON campaigns;

-- The correct policies are already in place:
-- "Users can view campaigns"
-- "Users can create campaigns"
-- "Users can update campaigns"
-- "Users can delete campaigns"
