/*
  # Enable Realtime for Notifications and Activity Log

  1. Changes
    - Enable realtime publications for notifications table
    - Enable realtime publications for activity_log table
    
  2. Purpose
    - Allow real-time updates for notifications
    - Allow real-time activity tracking across workspace
*/

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable realtime for activity_log
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;