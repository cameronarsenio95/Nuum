/*
  # Add Brand Column to Campaigns

  ## Overview
  Adds a brand column to the campaigns table to track which brand/client
  a campaign belongs to.

  ## Changes
  - Add `brand` column to campaigns table (text, nullable)
  - Update existing function that uses this column

  ## Important Notes
  - Existing campaigns will have NULL brand values initially
  - This is a non-breaking change
*/

-- Add brand column to campaigns table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'brand'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN brand text;
  END IF;
END $$;