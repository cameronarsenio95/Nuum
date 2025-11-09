/*
  # Add Extended Fields to Ad Sets Table

  This migration adds new fields to support enhanced ad set management:
  
  1. New Columns
    - `creative_url` (text, nullable) - URL to the creative/content used in the ad
    - `spark_code` (text, nullable) - Spark ad code or similar platform identifier
    - `ad_start_date` (date, nullable) - When the ad campaign starts
    - `ad_end_date` (date, nullable) - When the ad campaign ends
    - `deal_type` (text, nullable) - Type of deal: 'spark', 'barter', or 'gifting'
    
  2. Notes
    - All new fields are optional (nullable) to maintain backwards compatibility
    - Existing ad sets will continue to work without these fields
    - Default value for deal_type can be set at the application level
*/

-- Add new columns to ad_sets table if they don't exist
DO $$
BEGIN
  -- Creative URL
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_sets' AND column_name = 'creative_url'
  ) THEN
    ALTER TABLE ad_sets ADD COLUMN creative_url text;
  END IF;

  -- Spark Code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_sets' AND column_name = 'spark_code'
  ) THEN
    ALTER TABLE ad_sets ADD COLUMN spark_code text;
  END IF;

  -- Ad Start Date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_sets' AND column_name = 'ad_start_date'
  ) THEN
    ALTER TABLE ad_sets ADD COLUMN ad_start_date date;
  END IF;

  -- Ad End Date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_sets' AND column_name = 'ad_end_date'
  ) THEN
    ALTER TABLE ad_sets ADD COLUMN ad_end_date date;
  END IF;

  -- Deal Type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_sets' AND column_name = 'deal_type'
  ) THEN
    ALTER TABLE ad_sets ADD COLUMN deal_type text CHECK (deal_type IN ('spark', 'barter', 'gifting'));
  END IF;
END $$;

-- Add index for date range queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_ad_sets_date_range ON ad_sets(ad_start_date, ad_end_date);

-- Add comment to document the deal_type column
COMMENT ON COLUMN ad_sets.deal_type IS 'Type of collaboration deal: spark (paid spark ads), barter (product exchange), or gifting (free product)';
