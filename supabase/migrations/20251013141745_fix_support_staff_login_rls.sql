/*
  # Fix Support Staff Login RLS Policy
  
  Fixes the chicken-and-egg problem where support staff can't login because
  they can't read their own support_staff record during authentication.
  
  1. Changes
    - Add policy for authenticated users to read their own support_staff record
    - This allows the login flow to verify if a user is support staff
  
  2. Security
    - Users can only read their own record (auth.uid() = id)
    - Maintains security while allowing login verification
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Support staff can view other staff" ON support_staff;

-- Add policy for users to read their own support_staff record
CREATE POLICY "Users can read own support staff record"
  ON support_staff
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Keep the admin management policy
-- (already exists: "Support admins manage staff")
