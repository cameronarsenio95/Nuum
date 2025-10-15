/*
  # Fix Notes Insert Policy

  1. Changes
    - Remove recursive workspace check from INSERT policy
    - Simplify to only check created_by matches auth.uid()
    - Trust application layer to validate workspace access
  
  2. Security
    - Users can only create notes where created_by = their user ID
    - Application must validate workspace membership before allowing insert
*/

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can create notes in workspace" ON notes;

-- Create simplified insert policy
CREATE POLICY "Users can create notes in workspace"
  ON notes
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());
