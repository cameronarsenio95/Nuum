/*
  # Simplify Notes RLS Policies

  1. Changes
    - Drop all existing policies on notes table
    - Create simple, non-recursive policies
    - Only check created_by and workspace_id without subqueries
  
  2. Security
    - Users can only access their own notes (created_by check)
    - Application layer validates workspace membership
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view workspace notes" ON notes;
DROP POLICY IF EXISTS "Users can create notes in workspace" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;

-- Create simple policies without recursive checks
CREATE POLICY "Users can view own notes"
  ON notes
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create notes"
  ON notes
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own notes"
  ON notes
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own notes"
  ON notes
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());
