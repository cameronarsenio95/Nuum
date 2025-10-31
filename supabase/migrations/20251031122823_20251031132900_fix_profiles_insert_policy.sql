/*
  # Fix Profiles Insert Policy

  1. Changes
    - Add INSERT policy for profiles table to allow authenticated users to create their own profile
    - This fixes the "Database error saving new user" issue during signup

  2. Security
    - Users can only insert a profile for themselves (id = auth.uid())
    - Must be authenticated to insert
*/

-- Add INSERT policy for profiles
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
