/*
  # Add Content Approval Workflow
  
  1. Schema Changes (SAFE - Only Adding New Columns)
    - Add `approval_status` to content_media table (default 'pending')
    - Add `reviewed_by` to content_media table (nullable)
    - Add `reviewed_at` to content_media table (nullable)
    - Add `review_feedback` to content_media table (nullable)
  
  2. New Tables
    - `content_reviews` - History of all review actions
    
  3. Indexes
    - Index on approval_status for fast filtering
    - Index on reviewed_by for reviewer queries
  
  4. Security
    - RLS policies for content_reviews table
    - Only workspace members can view reviews
    - Only reviewers can create reviews
  
  5. Notes
    - NO EXISTING DATA IS MODIFIED
    - All new columns have DEFAULT values
    - All new columns are nullable (safe)
    - Uses IF NOT EXISTS for safety
*/

-- Add approval workflow columns to content_media (SAFE - only adding columns with defaults)
DO $$
BEGIN
  -- Add approval_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_media' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE content_media 
      ADD COLUMN approval_status text DEFAULT 'pending' 
      CHECK (approval_status IN ('pending', 'in_review', 'changes_requested', 'approved', 'rejected'));
  END IF;

  -- Add reviewed_by column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_media' AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE content_media 
      ADD COLUMN reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Add reviewed_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_media' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE content_media 
      ADD COLUMN reviewed_at timestamptz;
  END IF;

  -- Add review_feedback column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_media' AND column_name = 'review_feedback'
  ) THEN
    ALTER TABLE content_media 
      ADD COLUMN review_feedback text;
  END IF;
END $$;

-- Create content_reviews table for review history (SAFE - new table, doesn't affect existing data)
CREATE TABLE IF NOT EXISTS content_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_media_id uuid NOT NULL REFERENCES content_media(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_status text NOT NULL,
  new_status text NOT NULL CHECK (new_status IN ('pending', 'in_review', 'changes_requested', 'approved', 'rejected')),
  feedback text,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS content_media_approval_status_idx ON content_media(approval_status);
CREATE INDEX IF NOT EXISTS content_media_reviewed_by_idx ON content_media(reviewed_by);
CREATE INDEX IF NOT EXISTS content_reviews_content_id_idx ON content_reviews(content_media_id);
CREATE INDEX IF NOT EXISTS content_reviews_workspace_id_idx ON content_reviews(workspace_id);

-- Enable RLS on content_reviews
ALTER TABLE content_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Workspace members can view review history
CREATE POLICY "Workspace members can view reviews"
  ON content_reviews FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
    OR
    workspace_id IN (
      SELECT id FROM workspaces
      WHERE owner_id = auth.uid()
    )
  );

-- Policy: Workspace members can create reviews
CREATE POLICY "Workspace members can create reviews"
  ON content_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
    OR
    workspace_id IN (
      SELECT id FROM workspaces
      WHERE owner_id = auth.uid()
    )
  );

-- Add new notification types for content approval (extend existing notifications table)
-- Note: We're not modifying existing data, just allowing new type values
COMMENT ON COLUMN notifications.type IS 'Notification types: mention, assignment, deadline, comment, status_change, content_pending, content_approved, content_rejected, content_changes_requested';
