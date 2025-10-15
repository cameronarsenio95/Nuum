/*
  # Add Theme Preference to User Profiles

  ## Description
  Adds a theme_preference column to the profiles table to store user theme preferences.
  This column will be used in the future when theme switching becomes member-only.

  ## Changes
  1. New Columns
    - `theme_preference` (text) - Stores user's preferred theme ('light' or 'dark')
    - Defaults to 'dark' to match current default behavior
    - Optional column (nullable) for backward compatibility

  ## Notes
  - This column is prepared for future use when theme preferences will be synced via Supabase
  - Currently, the application uses localStorage for theme persistence
  - No RLS changes needed as profiles table already has appropriate policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'theme_preference'
  ) THEN
    ALTER TABLE profiles ADD COLUMN theme_preference text DEFAULT 'dark';
  END IF;
END $$;
