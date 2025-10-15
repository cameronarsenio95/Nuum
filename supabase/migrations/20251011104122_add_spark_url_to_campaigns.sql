/*
  # Add Spark URL to Campaigns

  ## Changes
  1. Add `spark_url` column to campaigns table
     - Text field for storing Spark tracking URLs
     - Nullable field as not all campaigns may use Spark
  
  ## Notes
  - The spark_url field will store unique tracking URLs for campaign attribution
  - This enables tracking of campaign performance through Spark links
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'spark_url'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN spark_url text;
  END IF;
END $$;
