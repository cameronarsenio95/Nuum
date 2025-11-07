/*
  # Add Campaign and Platform to Content Media

  1. Changes
    - Add `campaign_id` column to link content to campaigns
    - Add `platform` column to track where content is published
    - Add `campaign_platform` enum type for supported platforms
    
  2. Security
    - No RLS changes needed (inherits from existing policies)
*/

-- Create enum for platforms if it doesn't exist
DO $$ BEGIN
  CREATE TYPE campaign_platform AS ENUM ('Instagram', 'TikTok', 'Snapchat', 'YouTube');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add campaign_id and platform columns to content_media
ALTER TABLE content_media
ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS platform campaign_platform;

-- Create index for faster campaign lookups
CREATE INDEX IF NOT EXISTS idx_content_media_campaign_id ON content_media(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_media_platform ON content_media(platform);