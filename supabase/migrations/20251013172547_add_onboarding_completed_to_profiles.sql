/*
  # Add onboarding completion tracking to profiles

  1. Changes
    - Add `onboarding_completed` boolean field to profiles table
    - Defaults to false for new users
    - Allows tracking whether user has completed the onboarding wizard

  2. Notes
    - Existing users will have onboarding_completed set to false
    - This enables the onboarding wizard to show on first login
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed boolean DEFAULT false NOT NULL;
  END IF;
END $$;
