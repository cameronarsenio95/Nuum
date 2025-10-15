/*
  # Add Delete Policy for Support Tickets

  1. Changes
    - Add DELETE policy for support_tickets table
    - Allow support staff to delete tickets
    - Allow customers to delete their own tickets
  
  2. Security
    - Support staff can delete any ticket (authenticated support_staff members)
    - Customers can only delete their own tickets
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Support staff can delete tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can delete own tickets" ON support_tickets;

-- Support staff can delete any ticket
CREATE POLICY "Support staff can delete tickets"
  ON support_tickets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_staff
      WHERE support_staff.id = auth.uid()
      AND support_staff.is_active = true
    )
  );

-- Customers can delete their own tickets
CREATE POLICY "Users can delete own tickets"
  ON support_tickets
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());