/*
  # Create Content Media Table

  1. New Tables
    - `content_media`
      - `id` (uuid, primary key)
      - `workspace_id` (uuid, references workspaces) - Workspace this content belongs to
      - `creator_id` (uuid, references creators) - Creator this content belongs to
      - `file_name` (text) - Original file name
      - `file_type` (text) - MIME type (image/jpeg, video/mp4, etc)
      - `file_size` (bigint) - File size in bytes
      - `file_url` (text) - URL to the stored file
      - `thumbnail_url` (text) - URL to thumbnail (for videos)
      - `title` (text) - Optional title for the content
      - `description` (text) - Optional description
      - `tags` (text[]) - Tags for organization
      - `uploaded_by` (uuid, references auth.users) - User who uploaded
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `content_media` table
    - Add policy for workspace members to view content
    - Add policy for workspace members to upload content
    - Add policy for workspace members to update their uploaded content
    - Add policy for workspace members to delete their uploaded content

  3. Indexes
    - Index on workspace_id for faster queries
    - Index on creator_id for faster queries
*/

CREATE TABLE IF NOT EXISTS content_media (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  file_url text NOT NULL,
  thumbnail_url text,
  title text,
  description text,
  tags text[] DEFAULT ARRAY[]::text[],
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE content_media ENABLE ROW LEVEL SECURITY;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS content_media_workspace_id_idx ON content_media(workspace_id);
CREATE INDEX IF NOT EXISTS content_media_creator_id_idx ON content_media(creator_id);

-- Policy: Workspace members can view all content in their workspace
CREATE POLICY "Workspace members can view content"
  ON content_media FOR SELECT
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

-- Policy: Workspace members can upload content
CREATE POLICY "Workspace members can upload content"
  ON content_media FOR INSERT
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

-- Policy: Users can update content they uploaded
CREATE POLICY "Users can update their content"
  ON content_media FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

-- Policy: Users can delete content they uploaded
CREATE POLICY "Users can delete their content"
  ON content_media FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());