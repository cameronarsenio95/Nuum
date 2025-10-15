/*
  # Add Revenue to Campaigns

  1. Changes
    - Add `revenue` column to campaigns table
    - Column type: numeric(10,2) for decimal precision
    - Default value: 0
    - Not nullable for data consistency

  2. Notes
    - Stores revenue generated from the campaign
    - Uses numeric type for precise financial calculations
    - Two decimal places for currency values
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'revenue'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN revenue numeric(10,2) DEFAULT 0 NOT NULL;
  END IF;
END $$;