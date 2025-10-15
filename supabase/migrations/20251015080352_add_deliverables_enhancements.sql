/*
  # Deliverables Management Enhancements

  ## Overview
  This migration enhances the deliverables system with additional features for better workflow management.

  ## Changes

  1. **New Tables**
    - `deliverable_comments` - Comments and feedback on deliverables
      - id (uuid, primary key)
      - deliverable_id (uuid, references deliverables)
      - user_id (uuid, references auth.users)
      - comment (text)
      - created_at (timestamptz)
    
    - `deliverable_revisions` - Revision history tracking
      - id (uuid, primary key)
      - deliverable_id (uuid, references deliverables)
      - version (integer)
      - status (text)
      - changed_by (uuid, references auth.users)
      - changes (jsonb)
      - created_at (timestamptz)

  2. **Deliverables Table Enhancements**
    - Add `file_url` column for uploaded content
    - Add `feedback` column for reviewer comments
    - Add `revision_count` column for tracking number of revisions

  3. **Indexes**
    - Add indexes for performance optimization on deliverable_comments
    - Add indexes for deliverable_revisions

  4. **RLS Policies**
    - Enable RLS on new tables
    - Create policies for workspace member access
*/

-- Add new columns to deliverables table
ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS feedback text;
ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS revision_count integer DEFAULT 0;

-- Create deliverable_comments table
CREATE TABLE IF NOT EXISTS deliverable_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id uuid REFERENCES deliverables(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliverable_comments_deliverable ON deliverable_comments(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_deliverable_comments_created ON deliverable_comments(created_at DESC);

ALTER TABLE deliverable_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on deliverables they can access"
  ON deliverable_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deliverables d
      JOIN campaigns c ON d.campaign_id = c.id
      JOIN workspaces w ON c.workspace_id = w.id
      WHERE d.id = deliverable_comments.deliverable_id
      AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments on deliverables"
  ON deliverable_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deliverables d
      JOIN campaigns c ON d.campaign_id = c.id
      JOIN workspaces w ON c.workspace_id = w.id
      WHERE d.id = deliverable_comments.deliverable_id
      AND w.owner_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can delete own comments"
  ON deliverable_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create deliverable_revisions table
CREATE TABLE IF NOT EXISTS deliverable_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id uuid REFERENCES deliverables(id) ON DELETE CASCADE NOT NULL,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id) NOT NULL,
  changes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliverable_revisions_deliverable ON deliverable_revisions(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_deliverable_revisions_created ON deliverable_revisions(created_at DESC);

ALTER TABLE deliverable_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view revision history"
  ON deliverable_revisions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deliverables d
      JOIN campaigns c ON d.campaign_id = c.id
      JOIN workspaces w ON c.workspace_id = w.id
      WHERE d.id = deliverable_revisions.deliverable_id
      AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can create revision records"
  ON deliverable_revisions FOR INSERT
  TO authenticated
  WITH CHECK (changed_by = auth.uid());

-- Create function to track deliverable status changes
CREATE OR REPLACE FUNCTION track_deliverable_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO deliverable_revisions (
      deliverable_id,
      version,
      status,
      changed_by,
      changes
    ) VALUES (
      NEW.id,
      NEW.revision_count + 1,
      NEW.status,
      auth.uid(),
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'timestamp', now()
      )
    );
    
    NEW.revision_count = NEW.revision_count + 1;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for deliverable updates
DROP TRIGGER IF EXISTS deliverable_status_change_trigger ON deliverables;
CREATE TRIGGER deliverable_status_change_trigger
  BEFORE UPDATE ON deliverables
  FOR EACH ROW
  EXECUTE FUNCTION track_deliverable_status_change();
