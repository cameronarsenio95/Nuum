/*
  # Add Period Management to Ad Sets

  ## Overview
  Adds period management functionality to ad sets with automatic start/end date calculation
  and status management. Ad sets can have predefined periods (7, 14, 30 days) or run indefinitely (All Time).

  ## Changes to Existing Tables

  1. **ad_sets table** - Add period columns:
     - `start_date` (timestamptz, nullable) - Set when ad set becomes active
     - `end_date` (timestamptz, nullable) - Calculated from start_date + duration_days
     - `duration_days` (integer, nullable) - Period length: 7, 14, 30, or NULL for "All Time"

  ## New Database Functions

  1. **calculate_ad_set_dates()** - Trigger function that:
     - Sets start_date to NOW() when status changes to 'active'
     - Calculates end_date based on start_date + duration_days
     - Handles NULL duration_days for "All Time" ad sets

  2. **complete_expired_ad_sets()** - Function that:
     - Finds all active ad sets where end_date has passed
     - Updates their status to 'completed'
     - Returns count of completed ad sets

  ## Indexes
  - Index on (status, end_date) for efficient expired ad set queries
  - Index on start_date for date range filtering

  ## Important Notes
  1. Existing ad sets will have NULL values for the new columns (backwards compatible)
  2. Period starts only when ad set status changes to 'active'
  3. Ad sets are automatically marked 'completed' when end_date is reached
  4. NULL duration_days means "All Time" (no end date)
  5. Changing duration_days on an active ad set recalculates end_date from current time
*/

-- =====================================================
-- ADD PERIOD COLUMNS TO AD_SETS TABLE
-- =====================================================

DO $$
BEGIN
  -- Add start_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_sets' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE ad_sets ADD COLUMN start_date timestamptz;
  END IF;

  -- Add end_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_sets' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE ad_sets ADD COLUMN end_date timestamptz;
  END IF;

  -- Add duration_days column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_sets' AND column_name = 'duration_days'
  ) THEN
    ALTER TABLE ad_sets ADD COLUMN duration_days integer CHECK (duration_days IN (7, 14, 30) OR duration_days IS NULL);
  END IF;
END $$;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ad_sets_start_date ON ad_sets(start_date);
CREATE INDEX IF NOT EXISTS idx_ad_sets_end_date ON ad_sets(end_date);
CREATE INDEX IF NOT EXISTS idx_ad_sets_status_end_date ON ad_sets(status, end_date);

-- =====================================================
-- TRIGGER FUNCTION: CALCULATE AD SET DATES
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_ad_set_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- When status changes to 'active', set start_date and calculate end_date
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    -- Set start date to current timestamp
    NEW.start_date := NOW();
    
    -- Calculate end date based on duration_days
    IF NEW.duration_days IS NOT NULL THEN
      NEW.end_date := NEW.start_date + (NEW.duration_days || ' days')::interval;
    ELSE
      -- NULL duration_days means "All Time" - no end date
      NEW.end_date := NULL;
    END IF;
  END IF;

  -- If duration_days changes on an active ad set, recalculate end_date
  IF NEW.status = 'active' AND OLD.status = 'active' AND 
     (NEW.duration_days IS DISTINCT FROM OLD.duration_days) THEN
    IF NEW.duration_days IS NOT NULL THEN
      -- Recalculate from current time (not original start_date)
      NEW.end_date := NOW() + (NEW.duration_days || ' days')::interval;
    ELSE
      NEW.end_date := NULL;
    END IF;
  END IF;

  -- Update the updated_at timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$;

-- Create trigger on ad_sets table
DROP TRIGGER IF EXISTS trigger_calculate_ad_set_dates ON ad_sets;
CREATE TRIGGER trigger_calculate_ad_set_dates
  BEFORE INSERT OR UPDATE ON ad_sets
  FOR EACH ROW
  EXECUTE FUNCTION calculate_ad_set_dates();

-- =====================================================
-- FUNCTION: COMPLETE EXPIRED AD SETS
-- =====================================================

CREATE OR REPLACE FUNCTION complete_expired_ad_sets()
RETURNS TABLE(
  completed_count integer,
  completed_ad_set_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_ids uuid[];
  update_count integer;
BEGIN
  -- Update all active ad sets that have passed their end_date
  WITH updated AS (
    UPDATE ad_sets
    SET 
      status = 'completed',
      updated_at = NOW()
    WHERE 
      status = 'active'
      AND end_date IS NOT NULL
      AND end_date <= NOW()
    RETURNING id
  )
  SELECT array_agg(id), COUNT(*)
  INTO updated_ids, update_count
  FROM updated;

  -- Return results
  RETURN QUERY SELECT 
    COALESCE(update_count, 0)::integer,
    COALESCE(updated_ids, ARRAY[]::uuid[]);
END;
$$;

-- =====================================================
-- FUNCTION: GET ACTIVE AD SETS WITH TIME REMAINING
-- =====================================================

CREATE OR REPLACE FUNCTION get_ad_sets_with_time_remaining(p_workspace_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  status text,
  start_date timestamptz,
  end_date timestamptz,
  duration_days integer,
  days_remaining integer,
  is_expiring_soon boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ads.id,
    ads.name,
    ads.status,
    ads.start_date,
    ads.end_date,
    ads.duration_days,
    CASE 
      WHEN ads.end_date IS NOT NULL THEN 
        GREATEST(0, EXTRACT(DAY FROM (ads.end_date - NOW()))::integer)
      ELSE NULL
    END AS days_remaining,
    CASE 
      WHEN ads.end_date IS NOT NULL THEN 
        (ads.end_date - NOW()) <= interval '2 days'
      ELSE false
    END AS is_expiring_soon
  FROM ad_sets ads
  JOIN campaigns c ON c.id = ads.campaign_id
  WHERE c.workspace_id = p_workspace_id
    AND ads.status IN ('active', 'draft')
  ORDER BY ads.end_date ASC NULLS LAST;
END;
$$;

-- =====================================================
-- ADD COMMENT FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN ad_sets.start_date IS 'Set automatically when ad set status changes to active';
COMMENT ON COLUMN ad_sets.end_date IS 'Calculated automatically from start_date + duration_days';
COMMENT ON COLUMN ad_sets.duration_days IS 'Period length: 7, 14, 30 days, or NULL for unlimited (All Time)';
COMMENT ON FUNCTION calculate_ad_set_dates() IS 'Trigger function that automatically calculates start_date and end_date when ad set becomes active';
COMMENT ON FUNCTION complete_expired_ad_sets() IS 'Marks all active ad sets as completed when their end_date has passed. Should be run daily via cron job';
COMMENT ON FUNCTION get_ad_sets_with_time_remaining(uuid) IS 'Returns ad sets with calculated days remaining and expiring soon flag';
