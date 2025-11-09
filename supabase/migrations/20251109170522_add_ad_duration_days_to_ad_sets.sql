/*
  # Add Ad Duration Days Column

  This migration adds a new column to store ad duration as a number of days (7, 14, or 30).
  
  1. New Column
    - `ad_duration_days` (integer, nullable) - Duration of ad campaign in days (typically 7, 14, or 30)
    
  2. Notes
    - Existing ad_start_date and ad_end_date columns remain for backwards compatibility
    - Default value is set at application level (7 days)
    - This simplifies the UI by using preset durations instead of date pickers
*/

-- Add ad_duration_days column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_sets' AND column_name = 'ad_duration_days'
  ) THEN
    ALTER TABLE ad_sets ADD COLUMN ad_duration_days integer;
  END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN ad_sets.ad_duration_days IS 'Duration of ad campaign in days. Typical values: 7, 14, or 30 days';
