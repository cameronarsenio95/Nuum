/*
  # Enable Realtime for Support Ticket Messages

  1. Changes
    - Enable realtime publication for support_ticket_messages table
    - This allows real-time updates when new messages are inserted
    - No RLS changes needed (already configured)
*/

ALTER PUBLICATION supabase_realtime ADD TABLE support_ticket_messages;
