/*
  # Replace YouTube with Snapchat

  1. Changes
    - Rename `youtube_handle` column to `snapchat_handle` in creators table
  
  2. Notes
    - Existing YouTube data will be preserved during the rename
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'creators' AND column_name = 'youtube_handle'
  ) THEN
    ALTER TABLE creators RENAME COLUMN youtube_handle TO snapchat_handle;
  END IF;
END $$;
