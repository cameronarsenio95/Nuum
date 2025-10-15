/*
  # Create Content Storage Bucket

  1. Storage Setup
    - Creates a public 'content' bucket for storing media files
    - Allows public access for reading files
    - Restricts uploads to authenticated users only
  
  2. Security
    - INSERT: Only authenticated users can upload files
    - SELECT: Public read access for all files
    - UPDATE: Only file owners can update
    - DELETE: Only file owners can delete
*/

-- Create the content storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('content', 'content', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload content" ON storage.objects;
DROP POLICY IF EXISTS "Public can view content" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own content" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own content" ON storage.objects;

-- Set up storage policies
CREATE POLICY "Authenticated users can upload content"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'content');

CREATE POLICY "Public can view content"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'content');

CREATE POLICY "Users can update own content"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'content' AND owner::uuid = auth.uid())
  WITH CHECK (bucket_id = 'content' AND owner::uuid = auth.uid());

CREATE POLICY "Users can delete own content"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'content' AND owner::uuid = auth.uid());