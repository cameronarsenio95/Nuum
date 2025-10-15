/*
  # Fix Remaining RLS Policies - Remove All Recursive Policies

  ## Problem
  Multiple tables still have workspace_members-based policies causing infinite recursion

  ## Solution
  Remove all workspace_members-based policies from activity_log, comments, and deliverables tables

  ## Changes
  1. Drop workspace_members-based policies from activity_log
  2. Drop workspace_members-based policies from comments
  3. Drop workspace_members-based policies from deliverables
*/

-- Activity log
DROP POLICY IF EXISTS "Workspace members can view activity log" ON activity_log;

-- Comments
DROP POLICY IF EXISTS "Workspace members can view comments" ON comments;
DROP POLICY IF EXISTS "Workspace members can create comments" ON comments;
DROP POLICY IF EXISTS "Comment authors and admins can delete comments" ON comments;

-- Deliverables
DROP POLICY IF EXISTS "Workspace members can view deliverables" ON deliverables;
DROP POLICY IF EXISTS "Members and above can manage deliverables" ON deliverables;
