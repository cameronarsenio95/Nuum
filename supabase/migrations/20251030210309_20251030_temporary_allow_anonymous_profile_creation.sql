/*
  # Temporary Fix: Allow Anonymous Profile Creation
  
  This is a TEMPORARY fix to allow the old production code to work.
  This should be REMOVED once the new code is deployed to production.
  
  1. Changes
    - Add a temporary policy to allow anyone to insert profiles
    - This bypasses the auth.uid() check temporarily
  
  2. Security
    - WARNING: This is insecure and should only be temporary
    - Remove this migration after deploying new frontend code
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a temporary permissive policy
CREATE POLICY "TEMPORARY: Allow profile creation"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (true);
