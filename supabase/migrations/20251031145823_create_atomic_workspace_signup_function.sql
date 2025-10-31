/*
  # Create Atomic Workspace Signup Function

  1. New Function
    - `create_workspace_with_owner` - Atomically creates workspace and membership
    - Parameters:
      * p_owner_id uuid - The user ID who will own the workspace
      * p_name text - Workspace name
      * p_slug text - Workspace slug (must be unique)
      * p_plan text - Plan type (default 'standard')
    - Returns: JSON with workspace_id and membership_id
    - Security: SECURITY INVOKER (relies on RLS policies)

  2. RLS Policies
    - Ensure workspaces INSERT policy exists for authenticated users
    - Ensure workspace_members INSERT policy exists for authenticated users

  3. Important Notes
    - Function runs in a single transaction (atomic)
    - ON CONFLICT DO NOTHING prevents duplicate membership errors
    - Uses SECURITY INVOKER so RLS policies are enforced
    - Returns both IDs for verification by frontend
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.create_workspace_with_owner(uuid, text, text, text);

-- Create the atomic workspace creation function
CREATE OR REPLACE FUNCTION public.create_workspace_with_owner(
  p_owner_id uuid,
  p_name text,
  p_slug text,
  p_plan text DEFAULT 'standard'
)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ws_id uuid;
  v_membership_id uuid;
  v_result json;
BEGIN
  -- Insert workspace and return the new ID
  INSERT INTO public.workspaces (
    name,
    slug,
    plan,
    owner_id,
    subscription_status,
    trial_started_at,
    trial_ends_at
  )
  VALUES (
    p_name,
    p_slug,
    p_plan,
    p_owner_id,
    'trialing',
    now(),
    now() + interval '14 days'
  )
  RETURNING id INTO v_ws_id;

  -- Insert workspace membership with ON CONFLICT to handle race conditions
  INSERT INTO public.workspace_members (
    workspace_id,
    user_id,
    role,
    invited_by
  )
  VALUES (
    v_ws_id,
    p_owner_id,
    'owner',
    p_owner_id
  )
  ON CONFLICT (workspace_id, user_id) DO NOTHING
  RETURNING id INTO v_membership_id;

  -- Build result JSON
  v_result := json_build_object(
    'workspace_id', v_ws_id,
    'membership_id', v_membership_id,
    'success', true
  );

  RETURN v_result;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.create_workspace_with_owner(uuid, text, text, text) IS
'Atomically creates a workspace and adds the owner as a member. Uses SECURITY INVOKER to respect RLS policies. Returns JSON with workspace_id and membership_id.';

-- Ensure RLS policies exist for INSERT operations
-- Policy 1: Allow authenticated users to insert workspaces they own
DO $$
BEGIN
  -- Check if policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workspaces'
      AND policyname = 'signup_workspaces_insert'
      AND cmd = 'INSERT'
  ) THEN
    -- Create the policy
    CREATE POLICY "signup_workspaces_insert"
      ON public.workspaces
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = owner_id);

    RAISE NOTICE 'Created policy: signup_workspaces_insert';
  ELSE
    RAISE NOTICE 'Policy already exists: signup_workspaces_insert';
  END IF;
END $$;

-- Policy 2: Allow authenticated users to insert workspace_members for themselves
DO $$
BEGIN
  -- Check if policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workspace_members'
      AND policyname = 'signup_workspace_members_insert'
      AND cmd = 'INSERT'
  ) THEN
    -- Create the policy
    CREATE POLICY "signup_workspace_members_insert"
      ON public.workspace_members
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    RAISE NOTICE 'Created policy: signup_workspace_members_insert';
  ELSE
    RAISE NOTICE 'Policy already exists: signup_workspace_members_insert';
  END IF;
END $$;

-- Verify the policies are active
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('workspaces', 'workspace_members')
  AND cmd = 'INSERT'
  AND policyname IN ('signup_workspaces_insert', 'signup_workspace_members_insert')
ORDER BY tablename, policyname;
