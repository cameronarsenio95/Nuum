/*
  # Fix User Creation - Remove Trigger and Update RLS

  1. Problem
    - Users getting "Database error saving new user" during signup
    - Automatic trigger is causing issues with profile/workspace creation
    - Frontend handles creation, trigger should not exist
  
  2. Changes
    - Completely remove the on_auth_user_created trigger
    - Replace handle_new_user function with empty stub
    - Ensure RLS policies allow authenticated users to insert their own profiles
    - Ensure RLS policies allow authenticated users to create workspaces
  
  3. Security
    - Policies ensure users can only insert their own profile (id = auth.uid())
    - Policies ensure users can only create workspaces they own
*/

-- Drop the trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Replace function with empty stub that does nothing
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function is intentionally empty
  -- Profile and workspace creation is handled entirely by the frontend
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Empty stub - profile and workspace creation handled entirely by frontend';

-- Ensure RLS policies allow users to insert their own profile
DO $$
BEGIN
  -- Drop existing insert policy if it exists
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
  
  -- Create new insert policy
  CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);
    
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Policy already exists, ignore
END $$;

-- Ensure RLS policies allow users to create workspaces they own
DO $$
BEGIN
  -- Drop existing insert policy if it exists
  DROP POLICY IF EXISTS "Users can create own workspace" ON public.workspaces;
  
  -- Create new insert policy for workspace creation
  CREATE POLICY "Users can create own workspace"
    ON public.workspaces
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);
    
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Policy already exists, ignore
END $$;

-- Ensure RLS policies allow users to add themselves to workspaces
DO $$
BEGIN
  -- Drop existing insert policy if it exists
  DROP POLICY IF EXISTS "Users can add themselves to workspace" ON public.workspace_members;
  
  -- Create new insert policy
  CREATE POLICY "Users can add themselves to workspace"
    ON public.workspace_members
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
    
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Policy already exists, ignore
END $$;
