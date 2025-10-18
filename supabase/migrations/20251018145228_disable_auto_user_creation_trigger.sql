/*
  # Disable Automatic User Creation Trigger

  The trigger is causing issues with user signup. We'll handle user profile
  and workspace creation entirely from the frontend for better error handling
  and debugging.

  1. Changes
    - Drop the trigger that automatically creates profiles and workspaces
    - Keep the function for reference but it won't be used
*/

-- Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Keep the function but document that it's not in use
COMMENT ON FUNCTION public.handle_new_user() IS 'Currently disabled - profile and workspace creation handled by frontend';
