/*
  # Fix RLS Policies for All Tables to Prevent Recursion

  ## Problem
  Multiple tables (campaigns, creators, tasks, etc.) have RLS policies that may
  reference workspace_members, causing infinite recursion issues.

  ## Solution
  Simplify all RLS policies to only check workspace ownership directly through
  the workspaces table, avoiding workspace_members entirely.

  ## Changes
  1. Update campaigns policies to only check workspace owner
  2. Update creators policies to only check workspace owner
  3. Update tasks policies to only check workspace owner
  4. Update other workspace-related tables similarly
*/

-- Campaigns policies
DROP POLICY IF EXISTS "Users can view campaigns in their workspaces" ON campaigns;
DROP POLICY IF EXISTS "Users can create campaigns in their workspaces" ON campaigns;
DROP POLICY IF EXISTS "Users can update campaigns in their workspaces" ON campaigns;
DROP POLICY IF EXISTS "Users can delete campaigns in their workspaces" ON campaigns;

CREATE POLICY "Users can view campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Creators policies
DROP POLICY IF EXISTS "Users can view creators in their workspaces" ON creators;
DROP POLICY IF EXISTS "Users can create creators in their workspaces" ON creators;
DROP POLICY IF EXISTS "Users can update creators in their workspaces" ON creators;
DROP POLICY IF EXISTS "Users can delete creators in their workspaces" ON creators;

CREATE POLICY "Users can view creators"
  ON creators FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create creators"
  ON creators FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update creators"
  ON creators FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete creators"
  ON creators FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Tasks policies
DROP POLICY IF EXISTS "Users can view tasks in their workspaces" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in their workspaces" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks in their workspaces" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their workspaces" ON tasks;

CREATE POLICY "Users can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Campaign creators policies
DROP POLICY IF EXISTS "Users can view campaign creators" ON campaign_creators;
DROP POLICY IF EXISTS "Users can create campaign creators" ON campaign_creators;
DROP POLICY IF EXISTS "Users can update campaign creators" ON campaign_creators;
DROP POLICY IF EXISTS "Users can delete campaign creators" ON campaign_creators;

CREATE POLICY "Users can view campaign creators"
  ON campaign_creators FOR SELECT
  TO authenticated
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create campaign creators"
  ON campaign_creators FOR INSERT
  TO authenticated
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update campaign creators"
  ON campaign_creators FOR UPDATE
  TO authenticated
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete campaign creators"
  ON campaign_creators FOR DELETE
  TO authenticated
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  );

-- Deliverables policies
DROP POLICY IF EXISTS "Users can view deliverables" ON deliverables;
DROP POLICY IF EXISTS "Users can create deliverables" ON deliverables;
DROP POLICY IF EXISTS "Users can update deliverables" ON deliverables;
DROP POLICY IF EXISTS "Users can delete deliverables" ON deliverables;

CREATE POLICY "Users can view deliverables"
  ON deliverables FOR SELECT
  TO authenticated
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create deliverables"
  ON deliverables FOR INSERT
  TO authenticated
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update deliverables"
  ON deliverables FOR UPDATE
  TO authenticated
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete deliverables"
  ON deliverables FOR DELETE
  TO authenticated
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  );

-- Comments policies
DROP POLICY IF EXISTS "Users can view comments" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update their comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their comments" ON comments;

CREATE POLICY "Users can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their comments"
  ON comments FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Activity log policies
DROP POLICY IF EXISTS "Users can view activity log" ON activity_log;
DROP POLICY IF EXISTS "Users can create activity log entries" ON activity_log;

CREATE POLICY "Users can view activity log"
  ON activity_log FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activity log entries"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );
