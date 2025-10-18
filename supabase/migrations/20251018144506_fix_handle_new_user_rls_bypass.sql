/*
  # Fix handle_new_user Function to Bypass RLS

  The issue is that when the trigger runs, auth.uid() might not be set yet,
  causing RLS policies to block the insert. We need to use SECURITY DEFINER
  and set the search path properly to bypass RLS.

  1. Changes
    - Set proper SECURITY DEFINER context
    - Use SET clause to ensure function runs with correct privileges
    - This allows the function to insert into tables even when RLS is enabled
*/

-- Drop and recreate the function with proper security settings
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_workspace_id uuid;
  workspace_name text;
  workspace_slug text;
BEGIN
  -- Get company name from metadata or use email domain
  workspace_name := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    split_part(NEW.email, '@', 1) || '''s Workspace'
  );
  
  -- Create URL-friendly slug
  workspace_slug := lower(regexp_replace(workspace_name, '[^a-zA-Z0-9]+', '-', 'g'));
  workspace_slug := trim(both '-' from workspace_slug);
  workspace_slug := workspace_slug || '-' || substr(NEW.id::text, 1, 8);

  -- Insert a new profile for the user (RLS will be bypassed due to SECURITY DEFINER)
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    company,
    notifications_enabled,
    onboarding_completed,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    true,
    false,
    NOW(),
    NOW()
  );

  -- Create a workspace for the user
  INSERT INTO public.workspaces (
    id,
    name,
    slug,
    plan,
    owner_id,
    trial_ends_at,
    trial_started_at,
    subscription_status,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    workspace_name,
    workspace_slug,
    'standard',
    NEW.id,
    NOW() + INTERVAL '14 days',
    NOW(),
    'trialing',
    NOW(),
    NOW()
  )
  RETURNING id INTO new_workspace_id;

  -- Add user as workspace owner
  INSERT INTO public.workspace_members (
    id,
    workspace_id,
    user_id,
    role,
    joined_at,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    new_workspace_id,
    NEW.id,
    'owner',
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Error creating profile/workspace for user %: %', NEW.id, SQLERRM;
    RAISE EXCEPTION 'Database error saving new user';
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
