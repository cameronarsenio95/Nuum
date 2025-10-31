/*
  # DEFINITIVE FIX: User Signup RLS Policies
  
  ## Problem
  Users getting "Database error saving new user" due to duplicate INSERT policies
  
  ## Solution
  Remove duplicate policies and keep only the comprehensive ones
  
  ## Changes
  - Remove "Users can create their own workspaces" (duplicate)
  - Remove "Workspace owners can add members" (conflicts with self-join)
  - Keep profiles_insert_policy, workspaces_insert_policy, workspace_members_insert_policy
*/

-- Remove duplicate workspace INSERT policy
DROP POLICY IF EXISTS "Users can create their own workspaces" ON public.workspaces;

-- Remove conflicting workspace_members INSERT policy
DROP POLICY IF EXISTS "Workspace owners can add members" ON public.workspace_members;

-- Validate policies
DO $$
DECLARE
  profile_count INTEGER;
  workspace_count INTEGER;
  member_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM pg_policies WHERE tablename = 'profiles' AND cmd = 'INSERT' AND permissive = 'PERMISSIVE';
  SELECT COUNT(*) INTO workspace_count FROM pg_policies WHERE tablename = 'workspaces' AND cmd = 'INSERT' AND permissive = 'PERMISSIVE';
  SELECT COUNT(*) INTO member_count FROM pg_policies WHERE tablename = 'workspace_members' AND cmd = 'INSERT' AND permissive = 'PERMISSIVE';
  
  IF profile_count = 1 AND workspace_count = 1 AND member_count = 1 THEN
    RAISE NOTICE 'SUCCESS: All policies correctly configured. Signup should work now.';
  ELSE
    RAISE WARNING 'Policy counts - Profiles: %, Workspaces: %, Members: %', profile_count, workspace_count, member_count;
  END IF;
END $$;
