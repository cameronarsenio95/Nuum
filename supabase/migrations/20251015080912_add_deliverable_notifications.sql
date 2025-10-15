/*
  # Deliverable Notifications System

  ## Overview
  This migration adds automatic notification creation when deliverable statuses change.

  ## Changes

  1. **Notification Trigger Function**
    - Create function to generate notifications on deliverable status changes
    - Notify assigned users and campaign creators
    - Include relevant context in notification

  2. **Trigger Setup**
    - Add trigger to deliverables table for INSERT and UPDATE operations
    - Generate appropriate notifications based on status transitions
*/

-- Create function to handle deliverable notifications
CREATE OR REPLACE FUNCTION notify_deliverable_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_workspace_id uuid;
  v_campaign_name text;
  v_creator_name text;
  v_notification_type text;
  v_notification_title text;
  v_notification_message text;
BEGIN
  -- Get workspace_id and related data
  SELECT 
    c.workspace_id,
    c.name,
    cr.name
  INTO 
    v_workspace_id,
    v_campaign_name,
    v_creator_name
  FROM campaigns c
  JOIN creators cr ON cr.id = NEW.creator_id
  WHERE c.id = NEW.campaign_id;

  -- Determine notification type and message based on status
  IF (TG_OP = 'INSERT') THEN
    v_notification_type := 'deliverable_created';
    v_notification_title := 'New Deliverable Created';
    v_notification_message := 'New deliverable "' || NEW.title || '" created for ' || v_creator_name;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    CASE NEW.status
      WHEN 'in_review' THEN
        v_notification_type := 'deliverable_review';
        v_notification_title := 'Deliverable Ready for Review';
        v_notification_message := 'Deliverable "' || NEW.title || '" is ready for review';
      WHEN 'approved' THEN
        v_notification_type := 'deliverable_approved';
        v_notification_title := 'Deliverable Approved';
        v_notification_message := 'Deliverable "' || NEW.title || '" has been approved';
      WHEN 'posted' THEN
        v_notification_type := 'deliverable_posted';
        v_notification_title := 'Deliverable Posted';
        v_notification_message := 'Deliverable "' || NEW.title || '" has been posted';
      WHEN 'completed' THEN
        v_notification_type := 'deliverable_completed';
        v_notification_title := 'Deliverable Completed';
        v_notification_message := 'Deliverable "' || NEW.title || '" is completed';
      WHEN 'pending' THEN
        IF OLD.status = 'in_review' THEN
          v_notification_type := 'deliverable_changes_requested';
          v_notification_title := 'Changes Requested';
          v_notification_message := 'Changes requested for deliverable "' || NEW.title || '"';
        ELSE
          RETURN NEW;
        END IF;
      ELSE
        RETURN NEW;
    END CASE;
  ELSE
    RETURN NEW;
  END IF;

  -- Create notification for assigned user (if exists)
  IF NEW.assigned_to IS NOT NULL THEN
    INSERT INTO notifications (
      workspace_id,
      user_id,
      type,
      title,
      message,
      entity_type,
      entity_id,
      read
    ) VALUES (
      v_workspace_id,
      NEW.assigned_to,
      v_notification_type,
      v_notification_title,
      v_notification_message,
      'deliverable',
      NEW.id,
      false
    );
  END IF;

  -- Create notification for workspace owner
  INSERT INTO notifications (
    workspace_id,
    user_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    read
  )
  SELECT
    v_workspace_id,
    w.owner_id,
    v_notification_type,
    v_notification_title,
    v_notification_message,
    'deliverable',
    NEW.id,
    false
  FROM workspaces w
  WHERE w.id = v_workspace_id
    AND w.owner_id != COALESCE(NEW.assigned_to, '00000000-0000-0000-0000-000000000000'::uuid);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for deliverable notifications
DROP TRIGGER IF EXISTS deliverable_notification_trigger ON deliverables;
CREATE TRIGGER deliverable_notification_trigger
  AFTER INSERT OR UPDATE ON deliverables
  FOR EACH ROW
  EXECUTE FUNCTION notify_deliverable_status_change();
