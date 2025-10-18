/*
  # Create Workspace for New Users

  This migration extends the user signup process to automatically create
  a workspace and add the user as a workspace member.

  1. Functions
    - Updates `handle_new_user()` to also create workspace and membership
    - Creates default workspace with company name from metadata
    - Adds user as workspace owner

  2. Important Notes
    - Every new user gets their own workspace automatically
    - Workspace name is based on company_name from signup metadata
    - User is automatically added as 'owner' in workspace_members
    - Trial period starts automatically (14 days)
*/

-- Update the handle_new_user function to also create workspace
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    true,
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
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
