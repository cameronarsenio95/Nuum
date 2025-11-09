/*
  # Add Ad Set Link to Content Media

  This migration adds the ability to directly link content to specific ad sets.
  
  1. New Column
    - `ad_set_id` (uuid, nullable) - Direct link to a specific ad set
    
  2. Foreign Key
    - References ad_sets(id) with ON DELETE SET NULL
    - Allows content to exist without an ad set link
    
  3. Index
    - Index on ad_set_id for fast lookups when displaying content in Ad Sets table
    
  4. Notes
    - This provides explicit linking between content and ad sets
    - Fallback logic can still use creator_id + campaign_id for older content
    - NULL value means content is not directly linked to an ad set
*/

-- Add ad_set_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_media' AND column_name = 'ad_set_id'
  ) THEN
    ALTER TABLE content_media
      ADD COLUMN ad_set_id uuid REFERENCES ad_sets(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for fast ad set lookups
CREATE INDEX IF NOT EXISTS idx_content_media_ad_set_id ON content_media(ad_set_id);

-- Add comment to document the column
COMMENT ON COLUMN content_media.ad_set_id IS 'Direct link to a specific ad set. NULL means content is not explicitly linked to an ad set.';
