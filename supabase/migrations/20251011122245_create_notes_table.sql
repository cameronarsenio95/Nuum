/*
  # Create Notes Table

  1. New Tables
    - `notes`
      - `id` (uuid, primary key)
      - `workspace_id` (uuid, foreign key to workspaces)
      - `title` (text) - Title of the note
      - `content` (text) - Note content
      - `tags` (text array) - Tags for organizing notes
      - `created_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `is_archived` (boolean) - Soft delete functionality

  2. Security
    - Enable RLS on `notes` table
    - Add policies for workspace members to read their workspace notes
    - Add policies for authenticated users to create notes in their workspace
    - Add policies for note creators to update/delete their own notes
*/

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  tags text[] DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_archived boolean DEFAULT false
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view notes in their workspace
CREATE POLICY "Users can view workspace notes"
  ON notes FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create notes in their workspace
CREATE POLICY "Users can create notes in workspace"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Policy: Users can update their own notes
CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Policy: Users can delete their own notes
CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notes_workspace_id ON notes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);