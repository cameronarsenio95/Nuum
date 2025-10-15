/*
  # Fix Support Staff RLS - Remove Infinite Recursion
  
  The problem: The admin policy was checking support_staff table while 
  trying to access support_staff table, causing infinite recursion.
  
  Solution: Use a simpler approach - authenticated users can read their 
  own record, and we'll handle admin checks in the application layer.
  
  1. Changes
    - Drop all existing policies
    - Create simple non-recursive policies
    - Users can read their own record
    - Users can update their own last_login_at
  
  2. Security
    - Authenticated users can only access their own record
    - Admin functions will be handled via service role or edge functions
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Support admins manage staff" ON support_staff;
DROP POLICY IF EXISTS "Users can read own support staff record" ON support_staff;

-- Allow authenticated users to read their own support staff record
CREATE POLICY "Users read own record"
  ON support_staff
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow authenticated users to update their own last_login_at
CREATE POLICY "Users update own last_login"
  ON support_staff
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
