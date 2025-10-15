/*
  # Create Webhook for Automatic Ticket Replies

  1. Changes
    - Create webhook configuration to trigger auto-reply edge function
    - Trigger on INSERT to support_tickets table
    - Calls auto-reply-ticket edge function automatically

  2. Notes
    - This enables automatic AI responses for all new support tickets
    - The edge function will generate and post AI replies
    - Members get instant responses when they submit tickets
*/

CREATE OR REPLACE FUNCTION trigger_auto_reply_ticket()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/auto-reply-ticket',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'support_tickets',
      'record', to_jsonb(NEW),
      'schema', 'public',
      'old_record', null
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_ticket_created ON support_tickets;

CREATE TRIGGER on_ticket_created
  AFTER INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_reply_ticket();
