/*
  # FINAL DEFINITIVE FIX: User Signup Database Error

  ## Problem
  Users encounter "Database error saving new user" during signup due to:
  - Multiple conflicting INSERT policies from previous migration attempts
  - Duplicate policies with different names
  - Possible remaining auth trigger interference

  ## Solution
  Complete cleanup of ALL existing INSERT policies and creation of exactly 3 new policies.
  This migration is idempotent and can be run multiple times safely.

  ## Changes
  1. Remove ALL existing INSERT policies for profiles, workspaces, workspace_members
  2. Remove auth trigger completely (if it still exists)
  3. Create exactly 3 new INSERT policies with unique names
  4. Verify configuration is correct

  ## Security
  - Users can ONLY insert their own profile (id = auth.uid())
  - Users can ONLY create workspaces they own (owner_id = auth.uid())
  - Users can ONLY add themselves to workspaces (user_id = auth.uid())
  - All operations require authentication
*/

-- ============================================================================
-- STEP 1: COMPLETE CLEANUP - Remove ALL existing INSERT policies
-- ============================================================================

-- Profiles table - remove all possible policy names
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "TEMPORARY: Allow profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Users can create profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to create profile" ON public.profiles;

-- Workspaces table - remove all possible policy names
DROP POLICY IF EXISTS "Users can create own workspace" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create workspace" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace creation" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_insert_policy" ON public.workspaces;
DROP POLICY IF EXISTS "Allow workspace creation" ON public.workspaces;
DROP POLICY IF EXISTS "Authenticated users can create workspace" ON public.workspaces;

-- Workspace_members table - remove all possible policy names
DROP POLICY IF EXISTS "Users can add themselves to workspace" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can join workspace" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace member addition" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace owners can add members" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert_policy" ON public.workspace_members;
DROP POLICY IF EXISTS "Allow workspace member addition" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can add workspace members" ON public.workspace_members;

-- ============================================================================
-- STEP 2: Remove auth trigger completely
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================================================
-- STEP 3: Create exactly 3 new INSERT policies with unique names
-- ============================================================================

-- Policy 1: Profiles INSERT
-- Allows authenticated users to insert their own profile only
CREATE POLICY "signup_profiles_insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

COMMENT ON POLICY "signup_profiles_insert" ON public.profiles IS
  'Allows authenticated users to create their own profile during signup (id must equal auth.uid())';

-- Policy 2: Workspaces INSERT
-- Allows authenticated users to create workspaces they own
CREATE POLICY "signup_workspaces_insert"
  ON public.workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

COMMENT ON POLICY "signup_workspaces_insert" ON public.workspaces IS
  'Allows authenticated users to create workspaces where they are the owner (owner_id must equal auth.uid())';

-- Policy 3: Workspace Members INSERT
-- Allows authenticated users to add themselves as workspace members
CREATE POLICY "signup_workspace_members_insert"
  ON public.workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "signup_workspace_members_insert" ON public.workspace_members IS
  'Allows authenticated users to add themselves as workspace members (user_id must equal auth.uid())';

-- ============================================================================
-- STEP 4: Ensure RLS is enabled on all tables
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Verification - Check that exactly 1 INSERT policy exists per table
-- ============================================================================

DO $$
DECLARE
  profiles_insert_count INTEGER;
  workspaces_insert_count INTEGER;
  members_insert_count INTEGER;
  profiles_policy_name TEXT;
  workspaces_policy_name TEXT;
  members_policy_name TEXT;
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

  -- Get policy names
  SELECT policyname INTO profiles_policy_name
  FROM pg_policies
  WHERE tablename = 'profiles' AND cmd = 'INSERT' AND schemaname = 'public'
  LIMIT 1;

  SELECT policyname INTO workspaces_policy_name
  FROM pg_policies
  WHERE tablename = 'workspaces' AND cmd = 'INSERT' AND schemaname = 'public'
  LIMIT 1;

  SELECT policyname INTO members_policy_name
  FROM pg_policies
  WHERE tablename = 'workspace_members' AND cmd = 'INSERT' AND schemaname = 'public'
  LIMIT 1;

  -- Check if configuration is correct
  IF profiles_insert_count = 1 AND workspaces_insert_count = 1 AND members_insert_count = 1 THEN
    RAISE NOTICE '✓ SUCCESS: Database signup configuration is correct!';
    RAISE NOTICE '  - Profiles INSERT policy: %', profiles_policy_name;
    RAISE NOTICE '  - Workspaces INSERT policy: %', workspaces_policy_name;
    RAISE NOTICE '  - Workspace Members INSERT policy: %', members_policy_name;
    RAISE NOTICE '✓ User signup should now work without database errors!';
  ELSE
    RAISE EXCEPTION 'VERIFICATION FAILED: Incorrect policy counts - Profiles: %, Workspaces: %, Members: %',
      profiles_insert_count, workspaces_insert_count, members_insert_count;
  END IF;
END $$;
