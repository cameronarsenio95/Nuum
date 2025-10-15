/*
  # Add Spark Code field to Ad Sets

  1. Changes
    - Add `spark_code` column to `ad_sets` table
    - This field stores TikTok Spark Ad codes or similar platform-specific codes
  
  2. Notes
    - Field is optional (nullable)
    - Text type to support various code formats
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_sets' AND column_name = 'spark_code'
  ) THEN
    ALTER TABLE ad_sets ADD COLUMN spark_code text;
  END IF;
END $$;
