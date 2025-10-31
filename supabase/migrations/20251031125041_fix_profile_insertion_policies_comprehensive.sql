/*
  # Comprehensive Fix for Profile Insertion Policies

  ## Problem
  Users are experiencing "Database error saving new user" during signup due to:
  - Conflicting RLS policies on profiles table from multiple migrations
  - Temporary permissive policy that doesn't properly handle auth context
  - Multiple policies with different names trying to control the same operation

  ## Solution
  1. Clean up all existing INSERT policies on profiles, workspaces, and workspace_members
  2. Create single authoritative INSERT policies with proper auth checks
  3. Ensure policies are idempotent and won't conflict with future migrations

  ## Changes
  - Remove all existing INSERT policies for profiles table
  - Remove temporary permissive policy
  - Create new comprehensive INSERT policy for profiles with auth.uid() check
  - Create INSERT policy for workspaces allowing users to create their own workspace
  - Create INSERT policy for workspace_members allowing users to add themselves

  ## Security
  - Users can ONLY insert profiles where id = auth.uid() (must be authenticated)
  - Users can ONLY create workspaces where owner_id = auth.uid() (must be authenticated)
  - Users can ONLY add themselves as workspace members (user_id = auth.uid())
  - All policies require authentication (TO authenticated)
  - No anonymous access allowed
*/

-- ============================================================================
-- STEP 1: Clean up all existing INSERT policies
-- ============================================================================

-- Drop all existing INSERT policies on profiles table
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "TEMPORARY: Allow profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Users can create profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON public.profiles;

-- Drop all existing INSERT policies on workspaces table
DROP POLICY IF EXISTS "Users can create own workspace" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create workspace" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace creation" ON public.workspaces;

-- Drop all existing INSERT policies on workspace_members table
DROP POLICY IF EXISTS "Users can add themselves to workspace" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can join workspace" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace member addition" ON public.workspace_members;

-- ============================================================================
-- STEP 2: Create comprehensive INSERT policies
-- ============================================================================

-- Policy for profiles table INSERT
-- Users must be authenticated and can only insert their own profile
CREATE POLICY "profiles_insert_policy"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be authenticated and inserting their own profile
    auth.uid() IS NOT NULL AND
    auth.uid() = id
  );

COMMENT ON POLICY "profiles_insert_policy" ON public.profiles IS
  'Allows authenticated users to insert their own profile only (id must match auth.uid())';

-- Policy for workspaces table INSERT
-- Users must be authenticated and can only create workspaces they own
CREATE POLICY "workspaces_insert_policy"
  ON public.workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be authenticated and must be the owner
    auth.uid() IS NOT NULL AND
    auth.uid() = owner_id
  );

COMMENT ON POLICY "workspaces_insert_policy" ON public.workspaces IS
  'Allows authenticated users to create workspaces where they are the owner (owner_id must match auth.uid())';

-- Policy for workspace_members table INSERT
-- Users must be authenticated and can only add themselves to workspaces
CREATE POLICY "workspace_members_insert_policy"
  ON public.workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be authenticated and adding themselves as a member
    auth.uid() IS NOT NULL AND
    auth.uid() = user_id
  );

COMMENT ON POLICY "workspace_members_insert_policy" ON public.workspace_members IS
  'Allows authenticated users to add themselves as workspace members (user_id must match auth.uid())';

-- ============================================================================
-- STEP 3: Verify RLS is enabled on all tables
-- ============================================================================

-- Ensure RLS is enabled (should already be enabled, but verify)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Verify triggers are disabled (should be done in previous migrations)
-- ============================================================================

-- Ensure the automatic trigger is not active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Profile insertion policies have been successfully reset and configured.';
  RAISE NOTICE 'All users must be authenticated to create profiles, workspaces, and join workspaces.';
  RAISE NOTICE 'Temporary permissive policies have been removed.';
END $$;