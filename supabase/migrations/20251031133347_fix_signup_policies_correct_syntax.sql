/*
  # Fix Signup RLS Policies - Correct Syntax

  ## Problem Analysis
  The signup process fails with "Database error saving new user" because:
  1. Multiple INSERT policies exist on workspace_members table
  2. The "Frozen accounts cannot add members" policy checks for workspace existence
  3. During signup, the workspace is being inserted at the same time, causing issues
  4. Both policies must pass (AND logic by default)

  ## Solution
  1. Remove the frozen account check from INSERT policies on workspace_members
  2. Keep only the signup policy for INSERT operations
  3. Move frozen account check to UPDATE/DELETE operations where it makes sense
  4. Ensure clean signup flow without conflicts

  ## Changes
  1. Drop all INSERT policies on workspace_members
  2. Create single PERMISSIVE INSERT policy for signup
  3. Keep frozen account restriction for UPDATE/DELETE only
  4. Add verification

  ## Security
  - Users can ONLY insert their own profile (id = auth.uid())
  - Users can ONLY create workspaces they own (owner_id = auth.uid())
  - Users can ONLY add themselves to workspaces (user_id = auth.uid())
  - All operations require authentication
*/

-- ============================================================================
-- STEP 1: Clean up workspace_members INSERT policies
-- ============================================================================

-- Drop ALL existing INSERT policies on workspace_members
DROP POLICY IF EXISTS "signup_workspace_members_insert" ON public.workspace_members;
DROP POLICY IF EXISTS "Frozen accounts cannot add members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can add themselves to workspace" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can join workspace" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace member addition" ON public.workspace_members;
DROP POLICY IF EXISTS "prevent_frozen_account_member_insert" ON public.workspace_members;

-- Create SINGLE PERMISSIVE signup policy for workspace_members
CREATE POLICY "signup_workspace_members_insert"
  ON public.workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "signup_workspace_members_insert" ON public.workspace_members IS
  'Allows authenticated users to add themselves as workspace members during signup (user_id must equal auth.uid())';

-- ============================================================================
-- STEP 2: Re-add frozen account restriction for UPDATE/DELETE only
-- ============================================================================

-- Add frozen account check to UPDATE operations (not INSERT)
DROP POLICY IF EXISTS "Frozen accounts cannot update members" ON public.workspace_members;
CREATE POLICY "Frozen accounts cannot update members"
  ON public.workspace_members
  FOR UPDATE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 
      FROM workspaces w
      WHERE w.id = workspace_members.workspace_id 
      AND w.subscription_status = 'frozen'
    )
  )
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 
      FROM workspaces w
      WHERE w.id = workspace_members.workspace_id 
      AND w.subscription_status = 'frozen'
    )
  );

COMMENT ON POLICY "Frozen accounts cannot update members" ON public.workspace_members IS
  'Prevents updating members in frozen workspaces';

-- Add frozen account check to DELETE operations (not INSERT)
DROP POLICY IF EXISTS "Frozen accounts cannot delete members" ON public.workspace_members;
CREATE POLICY "Frozen accounts cannot delete members"
  ON public.workspace_members
  FOR DELETE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 
      FROM workspaces w
      WHERE w.id = workspace_members.workspace_id 
      AND w.subscription_status = 'frozen'
    )
  );

COMMENT ON POLICY "Frozen accounts cannot delete members" ON public.workspace_members IS
  'Prevents deleting members from frozen workspaces';

-- ============================================================================
-- STEP 3: Verify profiles policy is correct
-- ============================================================================

-- Ensure profiles INSERT policy exists and is correct
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'signup_profiles_insert'
    AND cmd = 'INSERT'
  ) THEN
    EXECUTE 'CREATE POLICY "signup_profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id)';
  END IF;
END $$;

COMMENT ON POLICY "signup_profiles_insert" ON public.profiles IS
  'Allows authenticated users to create their own profile during signup (id must equal auth.uid())';

-- ============================================================================
-- STEP 4: Verify workspaces policy is correct
-- ============================================================================

-- Ensure workspaces INSERT policy exists and is correct
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'workspaces' 
    AND policyname = 'signup_workspaces_insert'
    AND cmd = 'INSERT'
  ) THEN
    EXECUTE 'CREATE POLICY "signup_workspaces_insert" ON public.workspaces FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id)';
  END IF;
END $$;

COMMENT ON POLICY "signup_workspaces_insert" ON public.workspaces IS
  'Allows authenticated users to create workspaces where they are the owner (owner_id must equal auth.uid())';

-- ============================================================================
-- STEP 5: Ensure RLS is enabled on all tables
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: Verification - Display current policy configuration
-- ============================================================================

DO $$
DECLARE
  profiles_insert_count INTEGER;
  workspaces_insert_count INTEGER;
  members_insert_count INTEGER;
  members_update_count INTEGER;
  members_delete_count INTEGER;
BEGIN
  -- Count INSERT policies for each table
  SELECT COUNT(*) INTO profiles_insert_count
  FROM pg_policies
  WHERE tablename = 'profiles' AND cmd = 'INSERT' AND schemaname = 'public';

  SELECT COUNT(*) INTO workspaces_insert_count
  FROM pg_policies
  WHERE tablename = 'workspaces' AND cmd = 'INSERT' AND schemaname = 'public';

  SELECT COUNT(*) INTO members_insert_count
  FROM pg_policies
  WHERE tablename = 'workspace_members' AND cmd = 'INSERT' AND schemaname = 'public';

  SELECT COUNT(*) INTO members_update_count
  FROM pg_policies
  WHERE tablename = 'workspace_members' AND cmd = 'UPDATE' AND schemaname = 'public';

  SELECT COUNT(*) INTO members_delete_count
  FROM pg_policies
  WHERE tablename = 'workspace_members' AND cmd = 'DELETE' AND schemaname = 'public';

  RAISE NOTICE '============================================';
  RAISE NOTICE 'SIGNUP POLICY CONFIGURATION COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Profiles INSERT policies: %', profiles_insert_count;
  RAISE NOTICE 'Workspaces INSERT policies: %', workspaces_insert_count;
  RAISE NOTICE 'Workspace Members INSERT policies: %', members_insert_count;
  RAISE NOTICE 'Workspace Members UPDATE policies: %', members_update_count;
  RAISE NOTICE 'Workspace Members DELETE policies: %', members_delete_count;
  RAISE NOTICE '============================================';
  
  IF profiles_insert_count >= 1 AND workspaces_insert_count >= 1 AND members_insert_count = 1 THEN
    RAISE NOTICE 'SUCCESS: User signup should now work!';
    RAISE NOTICE '';
    RAISE NOTICE 'Signup Flow:';
    RAISE NOTICE '  1. User creates auth account';
    RAISE NOTICE '  2. User inserts own profile (id = auth.uid())';
    RAISE NOTICE '  3. User creates workspace (owner_id = auth.uid())';
    RAISE NOTICE '  4. User adds self to workspace (user_id = auth.uid())';
    RAISE NOTICE '';
    RAISE NOTICE 'Security:';
    RAISE NOTICE '  - Only authenticated users can perform these actions';
    RAISE NOTICE '  - Users can only create their own resources';
    RAISE NOTICE '  - Frozen account restrictions apply to UPDATE/DELETE only';
  ELSE
    RAISE WARNING 'Unexpected policy counts - Please verify manually';
  END IF;
  RAISE NOTICE '============================================';
END $$;
