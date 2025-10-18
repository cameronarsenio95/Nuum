/*
  # Fix handle_new_user function to not throw exceptions

  The function was throwing "Database error saving new user" exception.
  Since we handle profile/workspace creation in the frontend, this function
  should just silently fail and log errors.

  1. Changes
    - Replace RAISE EXCEPTION with RAISE WARNING for better debugging
    - Function will no longer block user signup if it fails
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_workspace_id uuid;
  workspace_slug text;
BEGIN
  -- Function is currently disabled via trigger removal
  -- This is kept for reference only
  RAISE WARNING 'handle_new_user function called but is disabled - user: %', NEW.id;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Disabled function - profile and workspace creation handled by frontend. Kept for reference.';
