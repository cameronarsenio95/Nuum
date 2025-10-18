/*
  # Add Support Staff Policies for Workspaces

  1. Changes
    - Add support staff policies to view all workspaces
    - This allows the DNS Management view to load workspaces

  2. Security
    - Support staff can view all workspaces (read-only for DNS management)
*/

-- Support staff can view all workspaces
CREATE POLICY "Support staff can view all workspaces"
  ON workspaces FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_staff
      WHERE support_staff.id = auth.uid()
      AND support_staff.is_active = true
    )
  );
