/*
  # Add discount_code column to creators table

  1. Changes
    - Add `discount_code` (text) column to creators table
    - This will store the creator's unique discount code for tracking and revenue attribution

  2. Notes
    - Column is nullable to allow for creators without discount codes
    - No default value needed as not all creators may have discount codes
*/

-- Add discount_code column to creators table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'creators' AND column_name = 'discount_code'
  ) THEN
    ALTER TABLE creators ADD COLUMN discount_code text;
  END IF;
END $$;