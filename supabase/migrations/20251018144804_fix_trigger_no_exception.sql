/*
  # Fix Trigger to Not Block User Creation

  The current trigger throws an exception which blocks user signup.
  We should allow the user to be created even if profile/workspace creation fails,
  and handle this gracefully in the application.

  1. Changes
    - Remove RAISE EXCEPTION from error handler
    - Only log warnings, don't block user creation
    - Let the application handle missing profiles/workspaces
*/

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

  -- Insert a new profile for the user
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
    -- Log error but DON'T block user creation
    RAISE WARNING 'Error creating profile/workspace for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    -- Return NEW anyway to allow user creation
    RETURN NEW;
END;
$$;
