/*
  # Fix Tasks RLS Policies - Remove Recursive Policies

  ## Problem
  There are duplicate policies on the tasks table causing infinite recursion

  ## Solution
  Remove the old workspace_members-based policies and keep only the simple ones

  ## Changes
  1. Drop old workspace_members-based policies
  2. Keep only the workspace owner-based policies
*/

-- Remove old policies that reference workspace_members (causing recursion)
DROP POLICY IF EXISTS "Workspace members can view tasks" ON tasks;
DROP POLICY IF EXISTS "Members and above can create tasks" ON tasks;
DROP POLICY IF EXISTS "Members and above can update tasks" ON tasks;
DROP POLICY IF EXISTS "Members and above can delete tasks" ON tasks;
