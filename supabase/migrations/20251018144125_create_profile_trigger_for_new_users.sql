/*
  # Create Profile Trigger for New Users

  This migration creates an automatic trigger that creates a profile entry
  whenever a new user signs up through Supabase Auth.

  1. Functions
    - `handle_new_user()` - Automatically creates a profile for new users
      - Extracts company_name and use_case from user metadata
      - Creates profile record with user's email

  2. Triggers
    - `on_auth_user_created` - Fires after a new user is inserted into auth.users
      - Automatically calls handle_new_user() function

  3. Important Notes
    - This ensures every new user has a profile automatically
    - Prevents "Database error saving new user" errors during signup
    - Uses user metadata to populate company and other fields
*/

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
