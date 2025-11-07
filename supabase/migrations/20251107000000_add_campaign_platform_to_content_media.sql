/*
  # Add Campaign and Platform to Content Media

  1. Schema Changes
    - Add `campaign_id` to content_media (nullable - content can exist without campaign)
    - Add `platform` to content_media (TikTok, Instagram, Snapchat, etc)
    - Add `performance_views` for view count
    - Add `performance_revenue` for revenue tracking

  2. Indexes
    - Index on campaign_id for filtering
    - Index on platform for filtering

  3. Notes
    - campaign_id is nullable to support content without campaigns
    - All new columns are safe additions with defaults
*/

-- Add campaign_id column (nullable - content can exist without campaign)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_media' AND column_name = 'campaign_id'
  ) THEN
    ALTER TABLE content_media
      ADD COLUMN campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add platform column (nullable with default)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_media' AND column_name = 'platform'
  ) THEN
    ALTER TABLE content_media
      ADD COLUMN platform text CHECK (platform IN ('TikTok', 'Instagram', 'Snapchat', 'YouTube', 'Other'));
  END IF;
END $$;

-- Add performance metrics columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_media' AND column_name = 'performance_views'
  ) THEN
    ALTER TABLE content_media
      ADD COLUMN performance_views bigint DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_media' AND column_name = 'performance_revenue'
  ) THEN
    ALTER TABLE content_media
      ADD COLUMN performance_revenue numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS content_media_campaign_id_idx ON content_media(campaign_id);
CREATE INDEX IF NOT EXISTS content_media_platform_idx ON content_media(platform);
